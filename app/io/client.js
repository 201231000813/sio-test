const _ = require('lodash');
const cluster = require('cluster');
const basename = require('path').basename;
const EventEmitter = require('events').EventEmitter;

module.exports = class Client extends EventEmitter{
  constructor(options) {
    super(options);
    this.dest = options._[0];
    this.nWorkers = options.w || 1;
    this.nRequests = options.n || 1;
    this.nConcurrency = options.c || 1;
    this.nClientsPerWorker = options.ioc || 1;

    this.cluster = cluster;
    this.nConnected = 0;
    this.nSendRequests = 0;
    this.nCompleteWorkers = 0;

    this.init(this.dest);
    this.nRecvPong = 0;
    this.nIntervalTime = options.t || 20000;
    this.max = 0;
    this.avg = 0;
  }

  getData() {
    let data = { nConnected: this.nConnected, nSendRequests: this.nSendRequests, nCompleteWorkers: this.nCompleteWorkers };
    console.log('sum all ', data);
  }

  init() {
    cluster.setupMaster({exec: './app/io/worker.js'});
  }

  run() {
    console.log('run benchmark ......', this.dest);

    let nMsgPerWorker = Math.round(this.nRequests/this.nConcurrency);
    for(let i=0; i<this.nConcurrency; i++) {
      this.cluster.fork();
    }

    _.forEach(this.cluster.workers, worker => {
      worker.on('message', this.handleWorkerMessage.bind(this, worker));
    });

    this.cluster.on('exit', worker => {
      console.error(`worker: ${worker.id} died`);
    });

    this.send('run', { nMsgs: nMsgPerWorker, nClients: this.nClientsPerWorker, uri: this.dest });
  }

  handleWorkerMessage(worker, msg) {
    //console.log('handleWorkerMessage worker: %s recv msg: %j', worker.id, msg);

    let func = `on${msg.cmd.toLowerCase()}`;
    if(!this[func]) {
      console.error(`${basename(__dirname)} has no method called ${func}`);
      return;
    }
    let args = Array.prototype.slice.call(arguments, 0);
    this[func](...args);
  }

  broadcast(msg, cb) {
    this.send('send', msg);
    cb && cb();
  }

  stop() {
    console.log('stop benchmark ....');
    _.forEach(this.cluster.workers, worker => {
      console.log('killing worker ', worker.id);
      worker.kill();
    });
    this.emit('exit');
  }

  subEvent(event, cb) {
    this.send('subEvent', { event });
  }

  pubEvent(event, message) {
    this.send('pubEvent', { event, message });
  }

  emitping() {
    console.log('Start Emitting ask evnet ...');
    this.send('emitping', { msg: 'pingtest', intervalTime: this.nIntervalTime });
  }

  onanswer(worker, msg) {
    this.nRecvPong++;
    let delta = Date.now() - msg.data.startl
    this.min = this.max == 0 ? delta : this.min;
    this.max = Math.max(this.max, delta);
    this.min = Math.min(this.min, delta);
    this.avg = (delta - this.avg)/this.nRecvPong + this.avg;
    console.log('[conn] %d, [nAns] %d [delta] %d, [deltaMax] %d [deltaMin] %d, [avg] %d', this.nConnected, this.nRecvPong, delta, this.max, this.min, Math.round(this.avg));
  }

  send(cmd, data) {
    _.forEach(this.cluster.workers, worker => {
      worker.send({ cmd, data });
    });
  }

  onconnect(worker, data) {
    console.log('-------------=========== onconnect', data, this.nConnected, this.nClientsPerWorker, this.nConcurrency, this.nClientsPerWorker * this.nConcurrency);
    this.nConnected++;
    if(this.nConnected == this.nClientsPerWorker * this.nConcurrency) {
      console.log('-------------- all connected', this.getData());
      this.emit('all connected', this.nConnected);
    }
  }

  ondisconnect() {
    //console.log('-------------=========== ondisconnect');
    this.nConnected--;
    console.log(`a client disconnected, only ${this.nConnected} left.`);
  }

  oncomplete(worker, msg) {
    console.log('---------- oncomplete', msg);
    this.nCompleteWorkers++;
    this.nSendRequests += +msg.data;
    console.log('a worker complete job.')
    if(this.nCompleteWorkers == this.nConcurrency) {
      console.log('all complete');
      this.emit('all complete', this.nSendRequests);
    }
  }

  onerror(worker, msg) {
    this.emit('error', msg);
  }

  onsubevent(worker, msg) {
    this.emit('sub', msg.data);
  }
}
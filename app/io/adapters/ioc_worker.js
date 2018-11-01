const _ = require('lodash');
const { URL } = require('url');
const ioc = require('socket.io-client');
const EventEmitter = require('events').EventEmitter;


module .exports = class Base extends EventEmitter {
  constructor() {
    super();
    this.clients = [];
    this.nSendMsg = 0;
    this.nRecvMsg = 0;
    this.nRequests = 0;
    this.nConnected = 0;
    this.nRecvPong = 0;
    this.nDisconnected = 0;
  }

  run(data) {
    this.nRequests = data.nMsgs || 1;
    let nClients = data.nClients || 1;

    for(let i=0; i<nClients; i++) {
      let client = this.createClient(data.uri);
      this.clients.push(client)
    }

    //// todo
    //const round = Math.ceil(this.nRequests/nClients);
    //for(let i=0; i<round; i++) {
    //  this.send('-------  test ----------');
    //}
    //
    //function checkComplete() {
    //  if(this.nSendMsg < this.nRequests) {
    //    console.log('worker %s already send %d messages...', process.pid, this.nSendMsg);
    //    return setTimeout(checkComplete, 200);
    //  }
    //  console.log('worker %s totally send %d messages.', process.pid, this.nSendMsg);
    //  this.emit('complete', this.nSendMsg);
    //}
    //checkComplete.call(this);
  }

  createClient(uri) {
    //console.log('create client, connect to ', uri);
    const { origin, pathname } = new URL(uri);
    var manager = ioc.Manager(origin, { transports: [ 'websocket' ], multiplex: false});
    var client = manager.socket(pathname);
    //let client = ioc(uri);

    // init socket listeners
    client.on('connect', this.handleConnect.bind(this, client));
    client.on('disconnect', this.handleDisconnect.bind(this));
    client.on('error', this.handleError.bind(this));
    return client;
  }

  terminate() {
    _.forEach(this.clients, socket => {
      this.disconnect(socket);
    });
  }

  send(msg) {
    _.forEach(this.clients, socket => {
      this.sendMessage(socket, msg)
    });
  }

  disconnect(socket) {
    socket.io.engine.close();
    this.nConnected --;
    this.emit('disconnect');
  }

  sendMessage(socket, msg) {
    socket.send(msg);
    this.nSendMsg ++;
  }

  handleConnect(client){
    this.emit('connect');
    this.nConnected++;

    //this.send('hello');

    client.on('message', msg => {
      console.log('client recv msg: %s', msg);
      this.nRecvMsg++;
    });

    //client.on('answer', msg => {
    //  this.nRecvPong++;
    //  this.emit('answer', msg);
    //});

    client.emit('/room/enter', { rid: 'room1' }, data => {
    });

  };

  handleDisconnect(reason){
    //this.nConnected --;
    //console.log('handle disconnected...', this.nDisconnected, reason);


    this.emit('disconnect');
  };

  handleError(err){
    console.log('handle error %s', err);
    this.emit('error', err);
  };
}
const path = require('path');

let adapter = {};
const AdapterExportedEvents = ['connect', 'disconnect', 'complete', 'error', 'subevent', 'answer'];

function createWorker() {
  let workerPath = require(path.join(__dirname, 'adapters/ioc_worker.js'));
  adapter = new workerPath();

  AdapterExportedEvents.forEach(ev => {
    adapter.on(ev, data => {
      //console.log('1. AdapterExportedEvents register listeners', ev, data);
      process.send({ cmd: ev, data });
    });
  });

  process.on('message', ctrlData => {
    //console.log('2. worker %d receive message %j', process.pid, ctrlData);

    let func = ctrlData.cmd || 'run';
    if(!adapter[func]) {
      return console.error('3. no method called ', func);
    }

    adapter[func].call(adapter, ctrlData.data);
  });

  process.on('SIGINT', _ => {
    console.error('orker %d catch SIGINT signal!', process.pid);
    adapter.terminate();
  });
}

createWorker();
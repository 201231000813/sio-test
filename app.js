const Koa = require('koa');
const parseArgs = require('minimist');
const Client = require('./app/io/client');

const args = parseArgs(process.argv.slice(2));
if(!args._[0]) {
  console.error('缺少服务器参数');
  process.exit(1);
}


const app = new Koa();
app.listen(3000);

let nb = new Client(args);
nb.on('all complete', function(nClients){
  console.log('all complete: ', nClients);
  nb.stop();
  setTimeout(function(){
    console.log('nb.nConnected', nb.nConnected);
  }, 500);
});
nb.on('error', data => console.log('error', data));
nb.run();

//setTimeout(_ => {
//  console.log('setTimeout ...');
//  nb.getData();
//}, 100000);
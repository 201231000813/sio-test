const Koa = require('koa');
const http = require('http');
const socket = require('socket.io');

const redis = require('./redis');
const redisKeys = require('./config').redis.keys;

let app = new Koa();
let server = http.Server(app.callback());
let io = socket(server);

redis.createClient();
server.listen(8000, _ => console.log('listen on port 8000'));

let rooms = {};

let live = io.of('/live');

live.on('connection', socket => {

  socket.on('error', err => console.error('socket链接出错', err));

  socket.on('/clear', _ => {
    (async () => {
      await redis.clearCache();
    })();
  });

  socket.on('/room/enter', (data, cb) => {
    (async () => {
      let { rid } = data;

      let key = redisKeys.getOnlineCountKey(rid);
      let onlineCount = await redis.incr(key);
      cb({rid, onlineCount});
    })();
  });

  socket.on('/chat', (data, cb) => {
    (async () => {
      let { rid } = data;

      let key = redisKeys.getChatCountKey(rid);
      let chatCount = await redis.incr(key);
      cb({rid, chatCount});
    })();
  });
});
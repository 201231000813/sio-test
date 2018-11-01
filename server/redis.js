const redis = require('redis');
const bluebird = require('bluebird');
const configs = require('./config');

bluebird.promisifyAll(redis);
let client = null;

module.exports = {
  createClient() {
    let { host, port } = configs.redis;
    client = redis.createClient({ host, port });
  },

  getSync(key) {
    return client.getAsync(key);
  },

  incr(key) {
    return client.incrAsync(key);
  },

  clearCache(rid) {
    let keys = [
      configs.redis.keys.getChatCountKey(rid),
      configs.redis.keys.getOnlineCountKey(rid),
    ];
    return client.del.apply(client, keys);
    //yield resources.redis.live.del.apply(resources.redis.live, keys);
  },
};
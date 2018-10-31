module.exports = {
  redis: {
    host: '127.0.0.1',
    port: 6379,
    keys: {
      getChatCountKey: (rid) => `/room/${rid}/chat/count`,
      getOnlineCountKey: (rid) => `/room/${rid}/online/count`,
    },
  },
};
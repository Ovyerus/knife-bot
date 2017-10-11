module.exports = bot => {
    bot.redis.on('connect', () => bot.logger.custom('redis-client', 'Connected to Redis.'));
    bot.redis.on('ready', () => bot.logger.custom('redis-client', 'Redis client is ready.'));
    bot.redis.on('error', err => bot.logger.customError('redis-client', `Redis error.\n${err.stack}`));
    bot.redis.on('warning', msg => bot.logger.warn(`Redis warning.\n${msg}`));
};
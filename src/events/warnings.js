module.exports = bot => {
    bot.on('error', (err, id) => {
        bot.logger.error(`Shard ${id} experienced error.\n${err.stack}`);
    });

    bot.on('warn', (msg, id) => {
        bot.logger.warn(`Shard ${id} warned.\n${msg}`);
    });

    bot.on('disconnect', () => {
        bot.logger.warn('Disconnected from Discord.');
    });
};
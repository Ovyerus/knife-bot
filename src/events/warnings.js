module.exports = bot => {
    bot.on('error', (err, id) => {
        logger.error(`Shard ${id} experienced error.\n${err.stack}`);
    });

    bot.on('warn', (msg, id) => {
        logger.warn(`Shard ${id} warned.\n${msg}`);
    });

    bot.on('unknown', (pkt, id) => {
        logger.warn(`Shard ${id} encountered unknown packet.\n${pkt}`);
    });

    bot.on('disconnect', () => {
        logger.warn('Disconnected from Discord.');
    });
};
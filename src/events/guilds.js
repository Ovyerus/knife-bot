module.exports = bot => {
    bot.on('guildCreate', g => {
        if (g.members.filter(m => m.bot).length >= Math.ceil(g.memberCount / 2)) {
            logger.info(`Leaving bot collection guild, '${g.name}' (${g.id})`);
            g.leave();
        } else {
            bot.editStatus('online', {name: `${bot.currentGame} | ${bot.guilds.size} servers`});
            bot.postGuildCount();
        }
    });

    bot.on('guildDelete', g => {
        if (g.members.filter(m => m.bot).length >= Math.ceil(g.memberCount / 2)) {
            return;
        } else {
            bot.editStatus('online', {name: `${bot.currentGame} | ${bot.guilds.size} servers`});
            bot.postGuildCount();
        }
    });
};
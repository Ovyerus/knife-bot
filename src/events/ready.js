module.exports = bot => {
    bot.on('ready', () => {
        if (bot.loadCommands) {
            bot.config.prefixes.forEach((prefix, i) => {
                if (~prefix.indexOf('{{id}}')) bot.config.prefixes[i] = prefix.replace(/\{\{id\}\}/g, bot.user.id);
            });

            let outer;
            require(`${__baseDir}/modules/commandLoader`).init(bot).then(() => {
                logger.info(`Loaded ${bot.commands.length} ${bot.commands.length === 1 ? 'command' : 'commands'}.`);
                return bot.db.tableList().run();
            }).then(res => {
                outer = res;
                if (!~res.indexOf('guild_settings')) {
                    logger.info('Setting up "guild_settings" table in database.');
                    return bot.db.tableCreate('guild_settings').run();
                }

                return null;
            }).then(() => {
                if (!~outer.indexOf('strikes')) {
                    logger.info('Setting up "strikes" table in database.');
                    return bot.db.tableCreate('strikes').run();
                }

                return null;
            }).then(() => {
                bot.loadCommands = false;
                bot.useCommands = true;

                logger.info(`${bot.user.username} is online and ready to cut shit I guess.`);
                logger.info(`-- ${bot.guilds.size} guilds, ${Object.keys(bot.channelGuildMap).length} channels, ${bot.users.size} users --`);
                logger.info(`-- ${bot.shards.size} shards`);
            });
        } else {
            logger.info('Reconnected from Discord');
        }

        bot.setGame();
        if (!bot.gameLoop) bot.gameLoop = setInterval(bot.setGame, bot.config.gameInterval);
    });
};
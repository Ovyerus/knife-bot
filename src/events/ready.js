module.exports = bot => {
    bot.on('ready', async () => {
        if (bot.loadCommands) {
            bot.config.prefixes.forEach((prefix, i) => {
                if (~prefix.indexOf('{{id}}')) bot.config.prefixes[i] = prefix.replace(/\{\{id\}\}/g, bot.user.id);
            });

            await require(`${__baseDir}/modules/commandLoader`).init(bot);
            logger.info(`Loaded ${bot.commands.length} ${bot.commands.length === 1 ? 'command' : 'commands'}.`);

            let tableList = await  bot.db.tableList().run();

            if (!tableList.includes('guild_settings')) {
                logger.info('Setting up "guild_settings" table in database.');
                await bot.db.tableCreate('guild_settings').run();
            }

            if (!tableList.includes('strikes')) {
                logger.info('Setting up "strikes" table in database.');
                await bot.db.tableCreate('strikes').run();
            }

            bot.loadCommands = false;
            bot.useCommands = true;

            logger.info(`${bot.user.username} is online and ready to cut shit I guess.`);
            logger.info(`-- ${bot.guilds.size} guilds, ${Object.keys(bot.channelGuildMap).length} channels, ${bot.users.size} users --`);
            logger.info(`-- ${bot.shards.size} shards`);
        } else {
            logger.info('Reconnected to Discord');
        }

        bot.setGame();
        if (!bot.gameLoop) bot.gameLoop = setInterval(bot.setGame, bot.config.gameInterval);
    });
};
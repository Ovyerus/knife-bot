module.exports = bot => {
    bot.on('ready', async () => {
        if (bot.loadCommands) {
            bot.config.prefixes.forEach((prefix, i) => {
                if (prefix.includes('{{id}}')) bot.config.prefixes[i] = prefix.replace(/\{\{id\}\}/g, bot.user.id);
            });

            await (require(`${__baseDir}/modules/commandLoader`)).init(bot);
            bot.logger.info(`Loaded ${bot.commands.length} ${bot.commands.length === 1 ? 'command' : 'commands'}.`);

            if (!await bot.db.guild_settings._promise) {
                bot.logger.info('Setting up "guild_settings" table in database.');
                await bot.db.guild_settings.set({});
            }

            if (!await bot.db.strikes._promise) {
                bot.logger.info('Setting up "strikes" table in database.');
                await bot.db.strikes.set({});
            }

            bot.loadCommands = false;
            bot.useCommands = true;

            bot.logger.info(`${bot.user.username} is online and ready to cut shit I guess.`);
            bot.logger.info(`-- ${bot.guilds.size} guilds, ${Object.keys(bot.channelGuildMap).length} channels, ${bot.users.size} users --`);
            bot.logger.info(`-- ${bot.shards.size} shards`);
        } else {
            bot.logger.info('Reconnected to Discord');
        }

        bot.setGame();
        if (!bot.gameLoop) bot.gameLoop = setInterval(() => bot.setGame(), bot.gameInterval);
    });
};
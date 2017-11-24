module.exports = bot => {
    bot.on('ready', async () => {
        if (bot.loadCommands) {
            await bot.reloadSettings();

            bot.prefixes.map(v => v.includes('{{id}}') ? v.replace('{{id}}', bot.user.id) : v);

            await (require(`${__baseDir}/modules/loader`))(bot);
            bot.logger.info(`Loaded ${bot.commands.length} ${bot.commands.length === 1 ? 'command' : 'commands'}.`);

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
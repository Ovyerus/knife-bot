const {parsePrefix, parseTulpa} = require(`${__baseDir}/modules/messageParser`);
const {Context} = require(`${__baseDir}/modules/CommandHolder`);
const {URLRegex} = require(`${__baseDir}/modules/helpers`);

module.exports = bot => {
    // Main command handler.
    bot.on('messageCreate', async msg => {
        if (!bot.useCommands || msg.author.id === bot.user.id || bot._currentlyAwaiting[msg.channel.id + msg.author.id]) return;

        if (URLRegex.test(msg.content)) bot.emit('invites', msg);
        if (msg.mentions.filter(u => u.id !== msg.author.id && !u.bot).length > 0) bot.emit('mentions', msg);
        if (msg.content.replace(/[\u{0300}-\u{036F}\u{0489}]/gu, '').length < msg.content.length) bot.emit('diacritics', msg);

        if (bot.isBlacklisted(msg.author.id) || msg.author.bot) return;

        msg.content = parseTulpa(msg.content);
        let cleaned = parsePrefix(msg.content, bot.prefixes);

        if (cleaned === msg.content) return;

        let cmd = cleaned.split(' ')[0];

        if (/^vs$/i.test(cmd)) cmd = 'vs';
        if (!bot.commands.getCommand(cmd)) return;

        let settings = msg.channel.guild ? await bot.getSettings(msg.channel.guild.id) : {};
        let ctx = new Context(msg, bot, settings);

        try {
            await bot.commands.runCommand(ctx);
        } catch(err) {
            msg.cmd = cmd;

            let discord = typeof err.response === 'string' && /^\{'code':\d+, 'message':.*\}$/.test(err.response) ? JSON.parse(err.response) : null;
            let opts = {
                msg,
                discord
            };

            await bot.handleError(err, opts);
        }
    });

    // Message await handler.
    bot.on('messageCreate', msg => {
        let awaiting = bot._currentlyAwaiting[msg.channel.id + msg.author.id];

        // Test if something is being awaited, if it does, try the filter and return if it doesnt return a truthy.
        if (!awaiting || !awaiting.filter(msg)) return;

        // Resolve and clean up.
        awaiting.p.resolve(msg);
        clearTimeout(awaiting.timer);
        delete bot._currentlyAwaiting[msg.channel.id + msg.author.id];
    });

    bot.on('messageUpdate', async (msg, old) => {
        // Handle uncached messages
        if (!old) msg = await bot.getMessage(msg.channel.id, msg.id);

        if (msg.author.id === bot.user.id) return;

        if (URLRegex.test(msg.content)) bot.emit('invites', msg);
        if (msg.content.replace(/[\u{0300}-\u{036F}\u{0489}]/gu, '').length < msg.content.length) bot.emit('diacritics', msg);
    });
};
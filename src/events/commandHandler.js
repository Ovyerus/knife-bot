const {parsePrefix, parseTulpa} = require(`${__baseDir}/modules/messageParser`);
const {Context} = require(`${__baseDir}/modules/CommandHolder`);

module.exports = bot => {
    bot.on('messageCreate', async msg => {
        if (!msg.author) console.log(msg);
        if (!bot.useCommands || !msg.author || msg.author.id === bot.user.id || !msg.channel.guild) return;

        if (/(?:https?:\/\/)?(?:discord\.gg|discordapp\.com\/invite)\/\s*?((?:[A-Za-z0-9]|-)+)/i.test(msg.content)) bot.emit('invites', msg);
        if (msg.mentions.filter(u => u.id !== msg.author.id && !u.bot).length > 0) bot.emit('mentions', msg);
        if (msg.content.replace(/[\u{0300}-\u{036F}\u{0489}]/gu, '').length < msg.content.length) bot.emit('diacritics', msg);

        if (bot.isBlacklisted(msg.author.id) || msg.author.bot) return;

        msg.content = parseTulpa(msg.content);
        let cleaned = parsePrefix(msg.content, bot.prefixes);

        if (cleaned === msg.content) return;

        let cmd = cleaned.split(' ')[0];

        if (/^vs$/i.test(cmd)) cmd = 'vs';
        if (!bot.commands.getCommand(cmd)) return;

        let settings = await bot.getSettings(msg.channel.guild.id);
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
};
const {parsePrefix, parseTulpa} = require(`${__baseDir}/modules/messageParser`);
const {Context} = require(`${__baseDir}/modules/CommandHolder`);

module.exports = bot => {
    bot.on('messageCreate', async msg => {
        if (!msg.author) console.log(msg);

        if (!bot.useCommands || !msg.author || msg.author.id === bot.user.id) return;

        if (!msg.channel.guild) {
            logger.custom('cyan', 'dm', `${loggerPrefix(msg)}${msg.cleanContent}`);
            return;
        }

        if (/(?:https:\/\/)?(?:discord\.gg|discordapp\.com\/invite)\/((?:[A-Za-z0-9]|-)+)/i.test(msg.content)) bot.emit('invites', msg);

        if (msg.mentions.filter(u => u.id !== bot.user.id && u.id !== msg.author.id && !u.bot).length > 0) bot.emit('mentions', msg);

        if (bot.isBlacklisted(msg.author.id) || msg.author.bot) return;

        msg.content = parseTulpa(msg.content);

        let cleaned = parsePrefix(msg.content, bot.config.prefixes);

        if (cleaned === msg.content) return;

        let cmd = cleaned.split(' ')[0];

        if (/^vs$/i.test(cmd)) cmd = 'vs';
        if (!bot.commands.getCommand(cmd)) return;

        let settings = await bot.getSettings(msg.channel.guild.id);
        let ctx = new Context(msg, bot, settings);

        try {
            await bot.commands.runCommand(ctx);
        } catch(err) {
            await handleCmdErr(msg, cmd, err);
        }
    });

    function loggerPrefix(msg) {
        return msg.channel.guild ? `${msg.channel.guild.name} | ${msg.channel.name} > ${bot.formatUser(msg.author)} (${msg.author.id}): ` : `Direct Message > ${bot.formatUser(msg.author)} (${msg.author.id}): `;
    }

    /**
     * Handle errors from commands.
     *
     * @param {Eris.Message} msg Message to pass for sending messages.
     * @param {String} cmd Command name.
     * @param {Object} err The error object to analyse.
     */
    async function handleCmdErr(msg, cmd, err) {
        let resp = typeof err.response === 'string' && /^\{'code':\d+, 'message':.*\}$/.test(err.response) ? JSON.parse(err.response) : null;

        if (resp && resp.code === 50013 && !msg.channel.guild.members.get(bot.user.id).permissions.has('sendMessages')) {
            logger.warn(`Can't send message in '#${msg.channel.name}' (${msg.channel.id}), cmd from user '${bot.formatUser(msg.author)}' (${msg.author.id})`);

            let dm = await msg.author.getDMChannel();

            try {
                await dm.createMessage(`It appears I was unable to send a message in \`#${msg.channel.name}\` on the server \`${msg.channel.guild.name}\`.\nPlease give me the Send Messages permission or notify a mod or admin if you cannot do this.`);
            } catch(err) {
                logger.warn(`Couldn't get DM channel for/send DM to ${bot.formatUser(msg.author)} (${msg.author.id})`);
            }
        } else if (resp && resp.code !== 50013) {
            logger.warn(`${loggerPrefix(msg)}Discord error while running command "${cmd}":\n${err.stack}`);

            let embed = {
                title: 'Error',
                description: 'A Discord error occurred while trying to execute command `${ctx.cmd}`',
                color: 0xF44336,
                timestamp: new Date(),
                footer: {text: 'Powered by Knife Bot'},
                fields: [
                    {
                        name: '\u200b',
                        value: '```js\n'
                        + `Code: ${resp.code}\n`
                        + `Message: ${resp.message}\n`
                        + '```'
                        + 'This has been logged, but if you wish to report this now so it can get fixed faster, you can join my [**support server**](https://discord.gg/oneshot).'
                    }
                ]
            };

            if (!bot.hasPermission('embedLinks', msg.channel)) {
                let content = bot.flattenEmbed(embed);
                await msg.channel.createMessage(content);
            } else {
                await msg.channel.createMessage({embed});
            }
        } else {
            logger.error(`${loggerPrefix(msg)}Error running command "${cmd}":\n${err.stack}`);

            let embed = {
                title: 'Error',
                description: 'An error occurred while trying to execute command `${ctx.cmd}`',
                color: 0xF44336,
                timestamp: new Date(),
                footer: {text: 'Powered by Knife Bot'},
                fields: [
                    {
                        name: '\u200b',
                        value: '```js\n'
                        + `${err}\n`
                        + '```'
                        + 'This has been logged, but if you wish to report this now so it can get fixed faster, you can join my [**support server**](https://discord.gg/oneshot).'
                    }
                ]
            };

            if (!bot.hasPermission('embedLinks', msg.channel)) {
                let content = bot.flattenEmbed(embed);
                await msg.channel.createMessage(content);
            } else {
                await msg.channel.createMessage({embed});
            }
        }
    }
};
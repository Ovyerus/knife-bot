const Actions = ['kicked', 'banned'];
const Months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const InviteRegex = /(?:https:\/\/)?(?:discord\.gg|discordapp\.com\/invite)\/((?:[A-Za-z0-9-])+)/i;
const DiacriticRegex = /[\u{0300}-\u{036F}\u{0489}]/u;

module.exports = bot => {
    bot.on('invites', async msg => {
        if (!bot.hasWantedPerms(msg) || msg.author.id === msg.channel.guild.ownerID) return;

        let settings = await bot.getSettings(msg.channel.guild.id);

        if (!settings.invites.enabled) return;
        
        if (noExcepts(settings) || !userExcept(settings, msg.author.id) || !roleExcept(settings, msg) || !channelExcept(settings, msg.channel.id)) {
            let invCode = msg.content.match(InviteRegex)[1];

            try {
                let inv = await bot.getInvite(invCode);

                if (inv.guild.id === msg.channel.guild.id) return;
                
                await msg.delete();
                await punishChain(bot, msg, settings, 'invites');
            } catch(err) {
                if (err.response && typeof err.response === 'string' && JSON.parse(err.response).message === 'Unknown Invite') {
                    if (settings.invites.fake && noExcepts(settings)) {
                        try {
                            await msg.delete();
                            await punishChain(bot, msg, settings, 'invites');
                        } catch(err) {
                            logger.error(err.stack);
                        }
                    }
                } else {
                    logger.error(err.stack);
                }
            }
        }
    });

    bot.on('mentions', async msg => {
        if (!bot.hasWantedPerms(msg) || msg.author.id === msg.channel.guild.ownerID) return;

        let settings = await bot.getSettings(msg.channel.guild.id);

        if (!settings.mentions.enabled) return;

        let mentions = msg.mentions.filter(u => u.id !== msg.author.id && !u.bot);

        if (mentions.length >= settings.mentions.trigger && (noExcepts(settings) || !userExcept(settings, msg.author.id) || !roleExcept(settings, msg) || !channelExcept(settings, msg.channel.id))) {
            try {
                await msg.delete();
                await punishChain(bot, msg, settings, 'mentions', `(${mentions.length} mentions)`);
            } catch(err) {
                logger.error(err.stack);
            }
        }
    });

    bot.on('log', e => {
        if (!e.settings.logChannel || !e.guild.channels.get(e.settings.logChannel) || !bot.hasPermission('sendMessages', e.guild.channels.get(e.settings.logChannel))) return;

        let now = new Date();
        let timestamp = `${now.getUTCDate()} ${Months[now.getUTCMonth()]} ${now.getUTCFullYear()} ${now.getUTCHours()}:${now.getUTCMinutes()}:${now.getUTCSeconds()} UTC`;
        let msg = [
            Actions[e.action][0].toUpperCase() + Actions[e.action].slice(1),
            bot.formatUser(e.user),
            '\n**Timestamp:**',
            timestamp
        ];

        if (e.reason) msg.splice(2, 0, 'for', e.reason);
        if (e.extra) msg.splice(4, 0, e.extra);

        bot.createMessage(e.settings.logChannel, msg.join(' '));
    });
};

function noExcepts(res) {
    return res.exceptions.channels.length === 0 && res.exceptions.roles.length === 0 && res.exceptions.users.length === 0;
}

function channelExcept(res, channel) {
    return res.exceptions.channels.includes(channel);
}

function roleExcept(res, msg) {
    for (let role of msg.member.roles) {
        if (res.exceptions.roles.includes(role)) return true;
    }

    return false;
}

function userExcept(res, user) {
    return res.exceptions.users.includes(user);
}

async function punishChain(bot, msg, settings, type, extra) {
    await bot.incrementStrikes(msg.channel.guild.id, msg.author.id);
    let strikes = await bot.getStrikes(msg.channel.guild.id, msg.author.id);

    if (settings.actions[type].kick > 0 && strikes === settings.actions[type].kick) {
        await msg.member.kick(type);
        
        bot.emit('log', {user: msg.author, action: 0, reason: type, settings, guild: msg.channel.guild, extra});
    } else if (settings.actions[type].ban > 0 && settings.actions[type].ban > settings.actions[type].kick && strikes === settings.actions[type].ban) {
        await Promise.all([msg.member.ban(1, type), bot.resetStrikes(msg.channel.guild.id, msg.author.id)]);

        bot.emit('log', {user: msg.author, action: 1, reason: type, settings, guild: msg.channel.guild, extra});
    } else {
        let m = settings.messages[type].replace(/\{\{mention\}\}/gi, msg.author.mention);

        await msg.channel.createMessage(m);
    }
}
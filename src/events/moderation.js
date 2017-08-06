const Actions = ['kicked', 'banned', 'softbanned'];
const Months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const InviteRegex = /(?:https:\/\/)?(?:discord\.gg|discordapp\.com\/invite)\/((?:[A-Za-z0-9-])+)/i;
const DiacriticRegex = /[\u{0300}-\u{036F}\u{0489}]/gu; // eslint-disable-line

module.exports = bot => {
    bot.on('invites', async msg => {
        if (!bot.hasWantedPerms(msg) || msg.author.id === msg.channel.guild.ownerID) return;

        let settings = await bot.getSettings(msg.channel.guild.id);

        if (!settings.invites.enabled) return;
        if (userExcept(settings, msg.author.id) || roleExcept(settings, msg) || channelExcept(settings, msg.channel.id)) return;

        try {
            let invCode = msg.content.match(InviteRegex)[1];
            let inv = await bot.getInvite(invCode);
            
            if (inv.guild.id === msg.channel.guild.id) return;

            await msg.delete();
            await punishChain(bot, msg, settings, 'invites');
        } catch(err) {
            if (err.response && typeof err.response === 'string' && JSON.parse(err.response).message === 'Unknown Invite') {
                if (settings.invites.fake) {
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
    });

    bot.on('mentions', async msg => {
        if (!bot.hasWantedPerms(msg) || msg.author.id === msg.channel.guild.ownerID) return;

        let settings = await bot.getSettings(msg.channel.guild.id);

        if (!settings.mentions.enabled) return;
        if (userExcept(settings, msg.author.id) || roleExcept(settings, msg) || channelExcept(settings, msg.channel.id)) return;

        let mentions = msg.mentions.filter(u => u.id !== msg.author.id && !u.bot);

        if (mentions.length >= settings.mentions.trigger) {
            try {
                await msg.delete();
                await punishChain(bot, msg, settings, 'mentions', `(${mentions.length} mentions)`);
            } catch(err) {
                logger.error(err.stack);
            }
        }
    });

    bot.on('diacritics', async msg => {
        if (!bot.hasWantedPerms(msg) || msg.author.id === msg.channel.guild.ownerID) return;

        let settings = await bot.getSettings(msg.channel.guild.id);

        if (!settings.diacritics.enabled) return;
        if (userExcept(settings, msg.author.id) || roleExcept(settings, msg) || channelExcept(settings, msg.channel.id)) return;

        let diacritics = msg.content.replace(DiacriticRegex, '');

        if (msg.content.length === diacritics.length) return;
        if (msg.content.length - diacritics.length >= settings.diacritics.trigger) {
            try {
                await msg.delete();
                await punishChain(bot, msg, settings, 'diacritics', `(${msg.content.length - diacritics.length} diacritics)`);
            } catch(err) {
                logger.error(err.stack);
            }
        }
    });

    bot.on('log', e => {
        if (!e.settings.logChannel || !e.guild.channels.get(e.settings.logChannel) || !e.guild.channels.get(e.settings.logChannel).permissionsOf(bot.user.id).has('sendMessages')) return;

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
        if (e.blame) {
            msg.splice(0, 0, bot.formatUser(e.blame.user));
            msg[1] = Actions[e.action];
        }

        bot.createMessage(e.settings.logChannel, msg.join(' '));
    });
};

function userExcept(res, user) {
    return res.exceptions.users.includes(user);
}

function roleExcept(res, msg) {
    for (let role of msg.member.roles) if (res.exceptions.roles.includes(role)) return true;
    return false;
}

function channelExcept(res, channel) {
    return res.exceptions.channels.includes(channel);
}

async function punishChain(bot, msg, settings, type, extra) {
    await bot.incrementStrikes(msg.channel.guild.id, msg.author.id);
    let strikes = await bot.getStrikes(msg.channel.guild.id, msg.author.id);

    if (settings.actions[type].kick > 0 && strikes === settings.actions[type].kick) {
        await msg.member.kick(type);
        
        bot.emit('log', {
            user: msg.author,
            action: 0,
            reason: type,
            settings,
            guild: msg.channel.guild,
            extra
        });
    } else if (settings.actions[type].ban > 0 && settings.actions[type].ban > settings.actions[type].kick && strikes === settings.actions[type].ban) {
        await Promise.all([msg.member.ban(1, type), bot.resetStrikes(msg.channel.guild.id, msg.author.id)]);

        bot.emit('log', {
            user: msg.author,
            action: 1,
            reason: type,
            settings,
            guild: msg.channel.guild,
            extra
        });
    } else {
        let m = settings.messages[type].replace(/\{\{mention\}\}/gi, msg.author.mention);

        await msg.channel.createMessage(m);
    }
}
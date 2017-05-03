const Actions = ['kicked', 'banned'];
const Months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const InviteRegex = /(?:https:\/\/)?(?:discord\.gg|discordapp\.com\/invite)\/((?:[A-Za-z0-9-])+)/i;

module.exports = bot => {
    bot.on('invites', msg => {
        if (!bot.hasWantedPerms(msg) || msg.author.id === msg.channel.guild.ownerID) return;

        let outside;
        bot.getSettings(msg.channel.guild.id).then(res => {
            if (!res.invites.enabled) return null;

            if (noExcepts(res) || !userExcept(res, msg.user.id) || !roleExcept(res, msg) || !channelExcept(res, msg.channel.id)) {
                outside = res;
                let invCode = msg.content.match(InviteRegex)[1];
                return bot.getInvite(invCode);
            }
            
            return null;
        }).then(res => {
            if (!res) return null;
            if (res.guild.id === msg.channel.guild.id) return 'same guild';
            return Promise.all([msg.delete(), 'deleted']);
        }).then(res => {
            if (!res || res[1] !== 'deleted') return null;
            return punishChain(bot, msg, outside, 'invites');
        }).catch(err => {
            if (typeof err.response === 'string' && JSON.parse(err.response).message === 'Unknown Invite') {
                if (outside.invites.fake && noExcepts(outside, 'invites')) {
                    return Promise.all([msg.delete(), 'deleted']);
                }
            } else {
                logger.error(err.stack);
            }
        }).then(res => {
            if (!res || res[1] !== 'deleted') return null;
            return punishChain(bot, msg, outside, 'invites');
        }).catch(err => logger.error(err));
    });

    bot.on('mentions', msg => {
        if (!bot.hasWantedPerms(msg) || msg.author.id === msg.channel.guild.ownerID) return;

        let outside;
        bot.getSettings(msg.channel.guild.id).then(res => {
            if (!res.mentions.enabled) return null;

            let mentions = msg.mentions.filter(u => u.id !== msg.author.id && !u.bot);

            if (mentions.length >= res.mentions.trigger && (noExcepts(res) || !userExcept(res, msg.user.id) || !roleExcept(res, msg) || !channelExcept(res, msg.channel.id))) {
                outside = res;
                return Promise.all([msg.delete(), 'deleted']);
            }

            return null;
        }).then(res => {
            if (!res || res[1] !== 'deleted') return null;
            return punishChain(bot, msg, outside, 'mentions', `(${msg.mentions.filter(u => u.id !== msg.author.id).length} mentions)`);
        }).catch(err => logger.error(err.stack));
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

function punishChain(bot, msg, outside, type, extra) {
    return new Promise((resolve, reject) => {
        bot.incrementStrikes(msg.channel.guild.id, msg.author.id).then(() => {
            return bot.getStrikes(msg.channel.guild.id, msg.author.id);
        }).then(res => {
            if (outside.actions[type].kick > 0 && res === outside.actions[type].kick) {
                return Promise.all([msg.member.kick(), 'kicked']);
            } else if (outside.actions[type].ban > 0 && outside.actions[type].ban > outside.actions[type].kick && res === outside.actions[type].ban) {
                return Promise.all([msg.member.ban(1), 'banned', bot.resetStrikes(msg.channel.guild.id, msg.member.id)]);
            } else {
                let m = outside.messages[type].replace(/\{\{mention\}\}/gi, msg.author.mention);
                return Promise.all([msg.channel.createMessage(m), 'warned']);
            }
        }).then(res => {
            if (!res || res[1] === 'warned') return null;
            bot.emit('log', {user: msg.author, action: Actions.indexOf(res[1]), reason: type, settings: outside, guild: msg.channel.guild, extra});
            return null;
        }).then(resolve).catch(reject);
    });
}
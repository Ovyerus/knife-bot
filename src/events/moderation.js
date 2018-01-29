const {formatUTC, inviteRegex, URLRegex, getLinkRedirects} = require(`${__baseDir}/modules/helpers`);

const ACTIONS = [
    'kicked',
    'banned',
    'softbanned',
    'rolebanned',
    'muted'
];

const DIACRITIC_REGEX = /[\u{0300}-\u{036F}\u{0489}]/gu; // eslint-disable-line

module.exports = bot => {
    bot.on('invites', async msg => {
        if (!bot.hasWantedPerms(msg) || msg.author.id === msg.channel.guild.ownerID) return;

        let settings = await bot.getSettings(msg.channel.guild.id);

        if (!settings.invites.enabled) return;
        if (userExcept(settings, msg.author.id) || roleExcept(settings, msg) || channelExcept(settings, msg.channel.id)) return;

        let invite;

        if (!inviteRegex.test(msg.content)) {
            // Check if an invite is hidden behind a possibly shortened link.
            for (let url of msg.content.match(URLRegex)) {
                let redirects;

                try {
                    redirects = (await getLinkRedirects(url)).map(v => v.match(inviteRegex)).filter(v => v);
                } catch(err) {
                    continue;
                }

                if (redirects[0]) {
                    invite = redirects[0];
                    break;
                }
            }
        } else invite = msg.content.match(inviteRegex);

        if (!invite) return;

        if (!settings.invites.fake) {
            try {
                let inv = await bot.getInvite(invite[1]);

                if (inv.guild.id === msg.channel.guild.id) return;
            } catch(err) {
                if (!(err.response && typeof err.response === 'string' && JSON.parse(err.response).message === 'Unknown Invite')) {
                    return await bot.handleError(err, {event: 'invites'});
                }
            }
        }

        await msg.delete();
        await punishChain(bot, msg, settings, 'invites');
    });

    let mentionTracker = {};

    bot.on('mentions', async msg => {
        if (!bot.hasWantedPerms(msg) || msg.author.id === msg.channel.guild.ownerID) return;

        let settings = await bot.getSettings(msg.channel.guild.id);

        if (!settings.mentions.enabled) return;
        if (userExcept(settings, msg.author.id) || roleExcept(settings, msg) || channelExcept(settings, msg.channel.id)) return;

        let mentions = msg.mentions.filter(u => u.id !== msg.author.id && !u.bot);

        let trackerKey = msg.channel.guild.id + ':' + msg.author.id;

        if (mentionTracker[trackerKey]) {
            mentionTracker[trackerKey] += mentions.length;
        } else {
            mentionTracker[trackerKey] = mentions.length;
        }

        setTimeout(() => {
            if (mentionTracker[trackerKey] <= mentions.length) {
                delete mentionTracker[trackerKey];
            } else {
                mentionTracker[trackerKey] -= mentions.length;
            }
        }, settings.mentions.timelimit || 5000);

        if (mentionTracker[trackerKey] >= settings.mentions.trigger) {
            try {
                await msg.delete();
                await punishChain(bot, msg, settings, 'mentions', `(${mentions.length} mentions)`);
            } catch(err) {
                await bot.handleError(err, {
                    event: 'moderation'
                });
            }
        }
    });

    bot.on('diacritics', async msg => {
        if (!bot.hasWantedPerms(msg) || msg.author.id === msg.channel.guild.ownerID) return;

        let settings = await bot.getSettings(msg.channel.guild.id);

        if (!settings.diacritics.enabled) return;
        if (userExcept(settings, msg.author.id) || roleExcept(settings, msg) || channelExcept(settings, msg.channel.id)) return;

        let diacritics = msg.content.replace(DIACRITIC_REGEX, '');

        if (msg.content.length === diacritics.length) return;
        if (msg.content.length - diacritics.length >= settings.diacritics.trigger) {
            try {
                await msg.delete();
                await punishChain(bot, msg, settings, 'diacritics', `(${msg.content.length - diacritics.length} diacritics)`);
            } catch(err) {
                await bot.handleError(err, {
                    event: 'moderation'
                });
            }
        }
    });

    bot.on('log', e => {
        if (!e.settings.logChannel || !e.guild.channels.get(e.settings.logChannel) || !e.guild.channels.get(e.settings.logChannel).permissionsOf(bot.user.id).has('sendMessages')) return;

        let timestamp = formatUTC(new Date());
        let msg = [
            ACTIONS[e.action][0].toUpperCase() + ACTIONS[e.action].slice(1),
            bot.formatUser(e.user),
            '\n**Timestamp:**',
            timestamp
        ];

        if (e.reason) msg.splice(2, 0, 'for', e.reason);
        if (e.extra) msg.splice(4, 0, e.extra);
        if (e.blame) {
            msg.splice(0, 0, bot.formatUser(e.blame.user));
            msg[1] = ACTIONS[e.action];
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
    await bot.editStrikes(msg.channel.guild.id, msg.author.id, '+');

    let strikes = settings.strikes[msg.author.id];
    strikes = strikes ? strikes + 1 : 1;

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
        await msg.member.ban(1, type);
        await bot.editStrikes(msg.channel.guild.id, msg.author.id, 'reset');

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
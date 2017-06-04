const got = require('got');
const Eris = require('eris');
const fs = require('fs');

const games = [
    '🔪 help',
    '🔪 invite',
    'OH GOD EVERYTHING IS MELTING',
    '🔪 info',
    'HOLY SHIT WHY AM I ON FIRE',
    'IT BUUURNNNNS'
];

module.exports = bot => {
    bot.useCommands = false;
    bot.loadCommands = true;
    bot.gameLoop;
    bot.currentGame;

    /**
     * Easily format a username.
     * 
     * @param {(Eris.Member|Eris.User)} user The user to format. If a member is passed, will use their nickname if possible.
     * @returns {?String} The formatted string. Null if proper user isnt passed.
     */
    bot.formatUser = user => {
        return user instanceof Eris.Member ? `${user.nick ? user.nick : user.user.username}#${user.user.discriminator}` : user instanceof Eris.User ? `${user.username}#${user.discriminator}` : null;
    };

    /**
     * Wait for a message in a channel from a user.
     * 
     * @param {String} channelID The ID of the channel
     * @param {Sting} userID The ID of the user
     * @param {Function} [filter] Optional filter function that returns a boolean when passed a Message object
     * @param {Number} [timeout=15000] How long in milliseconds to wait before the wait expires
     * @returns {Eris.Message} Awaited message.
     */
    bot.awaitMessage = (channelID, userID, filter=function() {return true;}, timeout=15000) => {
        return new Promise((resolve, reject) => {
            if (typeof channelID !== 'string') throw new TypeError('channelID is not a string.');
            if (typeof userID !== 'string') throw new TypeError('userID is not a string');
            var responded, rmvTimeout;

            var onCrt = msg => {
                if (msg.channel.id === channelID && msg.author.id === userID && filter(msg)) {
                    responded = true;
                    return msg;
                }
            };

            var onCrtWrap = msg => {
                var res = onCrt(msg);
                if (responded) {
                    bot.removeListener('messageCreate', onCrtWrap);
                    clearInterval(rmvTimeout);
                    resolve(res);
                } 
            };

            bot.on('messageCreate', onCrtWrap);

            rmvTimeout = setTimeout(() => {
                if (!responded) {
                    bot.removeListener('messageCreate', onCrtWrap);
                    reject(new Error('Message await expired.'));
                }
            }, timeout);
        });
    };

    /**
     * POSTs server count to bot lists.
     */
    bot.postGuildCount = () => {
        if (bot.config.dbotsKey) {
            got(`https://bots.discord.pw/api/bots/${bot.user.id}/stats`, {
                method: 'POST',
                headers: {Authorization: bot.config.dbotsKey},
                json: true,
                body: {server_count: bot.guilds.size}
            }).then(() => {
                logger.info('Successfully POSTed server count to DBots.');
            }).catch(err => logger.error(`Unable to POST server count to DBots: ${err}`));
        }
    };

    /**
     * Returns a random game from the games array
     * 
     * @returns {String} The game.
     */
    bot.pickGame = () => {
        let game = games[Math.floor(Math.random() * games.length)];
        if (game !== bot.currentGame) {
            bot.currentGame = game;
            return game;
        } else {
            bot.pickGame();
        }
    };

    /**
     * Sets the bot's current playing status.
     */
    bot.setGame = () => {
        let game = bot.pickGame();
        if (game) {
            bot.editStatus('online', {name: `${game} | ${bot.guilds.size} servers`});
        } else {
            bot.setGame();
        }
    };

    /**
     * Initialises settings for a guild in the database.
     * 
     * @param {String} guildID The ID of the guild
     * @returns {Promise<Object>} Settings for the guild.
     */
    bot.initSettings = guildID => {
        return new Promise((resolve, reject) => {
            if (typeof guildID !== 'string') throw new TypeError('guildID is not a string.');

            let settings = {
                id: guildID,
                actions: {mentions: {kick: 2, ban: 3}, copypasta: {kick: 2, ban: 3}, invites: {kick: 2, ban: 3}},
                mentions: {trigger: 5, enabled: false},
                copypasta: {triggers: [], cooldog: false, enabled: false},
                invites: {enabled: false, fake: false},
                logChannel: null,
                exceptions: {
                    users: [],
                    channels: [],
                    roles: []
                },
                messages: {
                    invites: '{{mention}} please do not advertise here. Your message has been deleted and future offenses will be dealt with accordingly.',
                    mentions: '{{mention}} do not mass-mention users. Future offences will be dealt with accordingly.',
                    copypasta: '{{mention}} please do not post copypastas here. Future offences will be dealt with accordingly.',
                    diacritics: '{{mention}} please do not post characters or messages that abuse the use of diacritics. Future offences will be dealt with accordingly.'
                }
            };

            bot.settings.add(settings);
            bot.db.table('guild_settings').get(guildID).run().then(res => {
                if (res) return res;
                return bot.db.table('guild_settings').insert(settings).run();
            }).then(resolve).catch(reject);
        });
    };

    /**
     * Gets settings for a guild.
     * 
     * @param {String} guildID The ID of the guild
     * @returns {Promise<Object>} Settings for the guild.
     */
    bot.getSettings = guildID => {
        return new Promise((resolve, reject) => {
            if (typeof guildID !== 'string') throw new TypeError('guildID is not a string.');

            if (bot.settings.get(guildID)) {
                resolve(bot.settings.get(guildID));
            } else {
                bot.db.table('guild_settings').get(guildID).run().then(res => {
                    if (!res) return bot.initSettings(guildID);

                    bot.settings.add(res);
                    resolve(res);
                    return null;
                }).then(res => {
                    if (!res) return null;

                    resolve(res);
                    return null;
                }).catch(reject);
            }
        });
    };

    /**
     * Edits settings for a guild.
     * 
     * @param {String} guildID The ID of the guild
     * @param {Object} settings The settings to edit
     * @returns {Promise<Object>} Settings for the guild.
     */
    bot.editSettings = (guildID, settings={}) => {
        return new Promise((resolve, reject) => {
            if (typeof guildID !== 'string') throw new TypeError('guildID is not a string.');
            if (!settings || typeof settings !== 'object') throw new TypeError('settings is not an object.');
            if (Object.keys(settings).length === 0) throw new Error('settings is empty.');

            bot.db.table('guild_settings').get(guildID).update(settings).run().then(() => {
                return bot.db.table('guild_settings').get(guildID);
            }).then(res => {
                if (!bot.settings.get(guildID)) {
                    bot.settings.add(res);
                } else {
                    bot.settings.remove(res);
                    bot.settings.add(res);
                }
                
                return res;
            }).then(resolve).catch(reject);
        });
    };

    /**
     * Get strikes for a user or guild.
     * 
     * @param {String} guildID ID of the guild to find strikes for.
     * @param {String} [userID] ID of the user to get strikes for.
     * @returns {Promise<(Number|Object[])>} Strikes for the guild or user.
     */
    bot.getStrikes = (guildID, userID) => {
        return new Promise((resolve, reject) => {
            bot.db.table('strikes').get(guildID).run().then(res => {
                if (!res) return Promise.all([
                    bot.db.table('strikes').insert({id: guildID, users: []}),
                    'adding'
                ]);

                if (typeof userID === 'string') {
                    return res.users.find(u => u.id === userID) ? res.users.find(u => u.id === userID).strikes : 0;
                } else {
                    return res.users;
                }
            }).then(res => {
                if (res[1] === 'adding') {
                    if (typeof userID === 'string') {
                        return res.users.find(u => u.id === userID) ? res.users.find(u => u.id === userID).strikes : 0;
                    } else {
                        return res.users;
                    }  
                } else return res;
            }).then(resolve).catch(reject);
        });
    };

    /**
     * Increment someones strike count.
     * 
     * @param {String} guildID ID of the guild.
     * @param {String} userID ID of the user.
     * @returns {Promise} .
     */
    bot.incrementStrikes = (guildID, userID) => {
        return new Promise((resolve, reject) => {
            if (typeof guildID !== 'string') throw new TypeError('guildId is not a string.');
            if (typeof userID !== 'string') throw new TypeError('userID is not a string.');

            bot.db.table('strikes').get(guildID).run().then(res => {
                if (!res) return Promise.all([
                    bot.db.table('strikes').insert({id: guildID, users: [{id: userID, strikes: 1}]}).run(),
                    'adding'
                ]);

                let i = res.users.indexOf(res.users.find(u => u.id === userID));

                if (i > -1) {
                    let newNum = ++res.users[i].strikes;
                    return Promise.all([
                        bot.db.table('strikes').get(guildID).update(row => {
                            return {users: row('users').changeAt(i, row('users')(i).merge({strikes: newNum}))};
                        }).run(),
                        'updating'
                    ]);
                } else {
                    return Promise.all([
                        bot.db.table('strikes').get(guildID).update(row => {
                            return {users: row('users').append({id: userID, strikes: 1})};
                        }),
                        'appending'
                    ]);
                }
            }).then(res => {
                if (res[1] === 'adding') {
                    return Promise.all([
                        bot.db.table('strikes').get(guildID).run(),
                        'updating'
                    ]);
                } else return null;
            }).then(() => resolve()).catch(reject);
        });
    };

    /**
     * Decrement someones strike count.
     * 
     * @param {String} guildID ID of the guild.
     * @param {String} userID ID of the user.
     * @returns {Promise} .
     */
    bot.decrementStrikes = (guildID, userID) => {
        return new Promise((resolve, reject) => {
            if (typeof guildID !== 'string') throw new TypeError('guildId is not a string.');
            if (typeof userID !== 'string') throw new TypeError('userID is not a string.');

            bot.db.table('strikes').get(guildID).run().then(res => {
                if (!res) return Promise.all([
                    bot.db.table('strikes').insert({id: guildID, users: [{id: userID, strikes: 0}]}).run(),
                    'adding'
                ]);

                let i = res.users.indexOf(res.users.find(u => u.id === userID));

                if (i > -1) {
                    let newNum = --res.users[i].strikes;
                    return Promise.all([
                        bot.db.table('strikes').get(guildID).update(row => {
                            return {users: row('users').changeAt(i, row('users')(i).merge({strikes: newNum}))};
                        }).run(),
                        'updating'
                    ]);
                } else {
                    return Promise.all([
                        bot.db.table('strikes').get(guildID).update(row => {
                            return {users: row('users').append({id: userID, strikes: 0})};
                        }),
                        'appending'
                    ]);
                }
            }).then(res => {
                if (res[1] === 'adding') {
                    return Promise.all([
                        bot.db.table('strikes').get(guildID).run(),
                        'updating'
                    ]);
                } else return null;
            }).then(() => resolve()).catch(reject);
        });
    };

    /**
     * Reset someones strike count.
     * 
     * @param {String} guildID ID of the guild.
     * @param {String} userID ID of the user.
     * @returns {Promise} .
     */
    bot.resetStrikes = (guildID, userID) => {
        return new Promise((resolve, reject) => {
            if (typeof guildID !== 'string') throw new TypeError('guildId is not a string.');
            if (typeof userID !== 'string') throw new TypeError('userID is not a string.');

            bot.db.table('strikes').get(guildID).run().then(res => {
                if (!res) return Promise.all([
                    bot.db.table('strikes').insert({id: guildID, users: [{id: userID, strikes: 0}]}).run(),
                    'adding'
                ]);

                let i = res.users.indexOf(res.users.find(u => u.id === userID));

                if (i > -1) {
                    return Promise.all([
                        bot.db.table('strikes').get(guildID).update(row => {
                            return {users: row('users').changeAt(i, row('users')(i).merge({strikes: 0}))};
                        }).run(),
                        'updating'
                    ]);
                } else {
                    return Promise.all([
                        bot.db.table('strikes').get(guildID).update(row => {
                            return {users: row('users').append({id: userID, strikes: 0})};
                        }),
                        'appending'
                    ]);
                }
            }).then(res => {
                if (res[1] === 'adding') {
                    return Promise.all([
                        bot.db.table('strikes').get(guildID).run(),
                        'updating'
                    ]);
                } else return null;
            }).then(() => resolve()).catch(reject);
        });
    };

    /**
     * POST something to Hastebin.
     * 
     * @param {String} str Content to POST.
     * @returns {Promise<String>} Returned key.
     */
    bot.hastePost = str => {
        return new Promise((resolve, reject) => {
            if (typeof str !== 'string') throw new TypeError('str is not a string.');

            got('https://hastebin.com/documents', {
                method: 'POST',
                body: str
            }).then(res => resolve(JSON.parse(res.body).key)).catch(reject);
        });
    };

    /**
     * Check if a user is blacklisted.
     * 
     * @param {String} userID ID of the user to check.
     * @returns {Boolean} .
     */
    bot.isBlacklisted = userID => {
        return JSON.parse(fs.readFileSync(`${__baseDir}/blacklist.json`)).includes(userID);
    };

    /**
     * Check if a user is the bot owner.
     * 
     * @param {String} userID ID of the user to check.
     * @returns {Boolean} .
     */
    bot.isOwner = userID => {
        return userID === bot.config.owner;
    };

    /**
     * Check if the bot has the perms wanted to work properly.
     * 
     * @param {Eris.Message} msg Message to use.
     * @returns {Boolean} .
    */
    bot.hasWantedPerms = msg => {
        let perms = msg.channel.guild.members.get(bot.user.id).permission;
        return perms.has('manageMessages') && perms.has('banMembers') && perms.has('kickMembers');
    };

    bot.hasPermission = (permission, channel) => {
        // Check if permission actually exists
        if (!Object.keys(Eris.Constants.Permissions).includes(permission)) return false;

        let allowed = false;
        let guildBot = channel.guild.members.get(bot.user.id);

        if (guildBot.permission.has(permission)) allowed = true;
            
        // Channel overwrites
        if (!guildBot.permission.has('administrator')) {
            let everyone = channel.guild.roles.find(r => r.name === '@everyone');
            let chanPerms = channel.permissionOverwrites.filter(v => {
                return (v.type === 'member' && v.id === guildBot.id) || (v.type === 'role' && (guildBot.roles.includes(v.id) || v.id === everyone.id));
            });

            chanPerms = chanPerms.map(p => p.json);

            for (let permGroup of chanPerms) {
                if (permGroup[permission] === true) {
                    allowed = true;
                } else if (permGroup[permission] === false) {
                    allowed = false;
                }
            }
        }

        return allowed;
    };

    /**
     * Flattens an embed into plain text to use when the bot can't use embeds.
     * 
     * @param {Object} embed The embed to flatten. Must be a valid Discord embed object.
     * @returns {String} The flattened embed.
     * @see https://discordapp.com/developers/docs/resources/channel#embed-object
     */
    bot.flattenEmbed = embed => {
        let flattened = '';

        if (embed.author) {
            flattened += `**${embed.author.name}`;
            flattened += embed.author.url ? ` <${embed.author.url}>**\n` : '**\n';
        }

        if (embed.title) {
            flattened += `**${embed.title}`;
            flattened += embed.url ? ` <${embed.url}>**\n\n` : '**\n\n';
        }

        if (embed.description) flattened += `${embed.description}\n`;
        if (embed.fields) embed.fields.forEach(f => {
            flattened += !f.name.match(/^`.*`$/) ? `**${f.name}**\n` : `${f.name}\n`;
            flattened += `${f.value}\n`
        });
    
        if (embed.footer && !embed.timestamp) {
            flattened += `${embed.footer.text}\n`;
        } else if (!embed.footer && embed.timestamp) {
            flattened += `${embed.timestamp}\n`;
        } else {
            flattened += `\n${embed.footer.text} | ${embed.timestamp}\n`;
        }

        if (embed.thumbnail) flattened += `${embed.thumbnail.url}\n`;
        if (embed.image) flattened += `${embed.image.url}\n`;

        return flattened;
    };
};

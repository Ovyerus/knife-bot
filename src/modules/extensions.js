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
            if (!channelID || typeof channelID !== 'string') {
                reject(new Error(`Unwanted type of channelID: got "${typeof channelID}" expected "string"`));
            } else if (!userID || typeof userID !== 'string') {
                reject(new Error(`Unwanted type of userID: got "${typeof userID}" expected "string"`));
            } else {
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
            }
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
            if (typeof guildID !== 'string') throw new Error('guildID is not a string.');

            let settings = {
                id: guildID,
                warnings: {mentions: 2, copypasta: 2, diacritics: 2, invites: 2},
                mentions: {trigger: 5, enabled: false},
                copypasta: {triggers: [], cooldog: false, enabled: false},
                diacritics: {trigger: 6, enabled: false},
                invites: {enabled: false},
                exceptions: {
                    mentions: {users: [], channels: [], roles: []},
                    copypasta: {users: [], channels: [], roles: []},
                    diacritics: {users: [], channels: [], roles: []},
                    invites: {users: [], channels: [], roles: []}
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
            if (typeof guildID !== 'string') throw new Error('guildID is not a string.');

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
            if (typeof guildID !== 'string') throw new Error('guildID is not a string.');
            if (!settings || typeof settings !== 'object') throw new Error('settings is not an object.');
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


    bot.isBlacklisted = userID => {
        return JSON.parse(fs.readFileSync(`${__baseDir}/blacklist.json`)).indexOf(userID) !== -1;
    };

    bot.isOwner = userID => {
        return userID === bot.config.owner;
    };
};

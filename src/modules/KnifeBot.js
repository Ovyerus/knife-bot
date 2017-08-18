/**
 * @file Class file for Knife Bot, extending the Eris client.
 * @author Ovyerus
 */

const Eris = require('eris');
const got = require('got');
const Lookups = require('./Lookups');
const Logger = require('./Logger');
const {CommandHolder} = require('./CommandHolder');
const {AwaitTimeout} = require('./helpers');
const fs = require('fs');

/**
 * Main class for Knife Bot.
 * 
 * @extends Eris.Client
 * 
 * @prop {Object} config Configuration object for the bot.
 * @prop {String} redHot Emoji string based off the name.
 * @prop {Number} embedColour Default colour to use for embeds.
 * @prop {String[]} games Array of games to select from.
 * @prop {String} blacklistPath Path to blacklist file.
 * @prop {String[]} blacklist Array of blacklisted users.
 * @prop {Eris.Collection<Object>} settings Settings cache.
 * @prop {CommandHolder} commands Command holder and runner.
 * @prop {Lookups} lookups Class for looking up various objects.
 * @prop {Logger} logger Internal logger.
 * @prop {RethinkDBDash} db Database manager.
 * @prop {Eris.Client} rest Bot in REST mode in order to access REST restricted stuff.
 */
class KnifeBot extends Eris.Client {
    /**
     * Create a new Knife Bot client.
     * 
     * @param {KnifeConfig} config Configuration for the bot.
     * @param {Objecvt} [options={}] Eris options.
     */
    constructor(config, options={}) {
        if (!config || typeof config !== 'object') throw new TypeError('config is not an object.');

        super(config.token, options);

        this.config = config;
        this.redHot = '🔥 1⃣0⃣0⃣0⃣ 🌡 🔪';
        this.embedColour = config.embedColour || 16665427;
        this.games = config.games || [
            '🔪 help',
            '🔪 invite',
            'OH GOD EVERYTHING IS MELTING',
            '🔪 info',
            'HOLY SHIT WHY AM I ON FIRE',
            'IT BUUURNNNNS'
        ];

        this.blacklistPath = config.blacklist || './blacklist.json';
        this.blacklist = fs.readFileSync(this.blacklistPath);

        this.settings = new Eris.Collection(Object);
        this.commands = new CommandHolder(this);
        this.lookups = new Lookups(this);
        this.logger = Logger;
        this.db = require('rethinkdbdash')(config.rethinkOptions);
        this.rest = new Eris(`Bot ${config.token}`, {
            restMode: true
        });

        this.useCommands = false;
        this.loadCommands = true;
    }

    /**
     * Easily format a user into a string.
     * If a member is passed, the nickname will be used if possible
     * 
     * @param {(Eris.Member|Eris.User)} user User to format.
     * @returns {?String} Formatted user string. Will be null if user isn't passed.
     */
    formatUser(user) {
        return (user instanceof Eris.Member || user instanceof Eris.User) ? `${user.nick ? user.nick : user.username}#${user.discriminator}` : null;
    }

    /**
     * Wait for a message from a user.
     * 
     * @param {String} channelID ID of the channel to wait in.
     * @param {String} userID ID of the user to wait for.
     * @param {Function} [filter] Filter to apply on messages.
     * @param {Number} [timeout] Time in milliseconds before the await expires.
     * @returns {Promise<Eris.Message>} Awaited message.
     */
    awaitMessage(channelID, userID, filter=function() {return true;}, timeout=15000) {
        return new Promise((resolve, reject) => {
            if (typeof channelID !== 'string') throw new TypeError('channelID is not a string.');
            if (typeof userID !== 'string') throw new TypeError('userID is not a string');
            if (!filter) filter = () => true;

            var responded, rmvTimeout;

            var onCrt = msg => {
                if (msg.channel.id === channelID && msg.author.id === userID && filter(msg)) responded = true;

                if (responded) {
                    this.removeListener('messageCreate', onCrt);
                    clearInterval(rmvTimeout);
                    resolve(msg);
                } 
            };

            this.on('messageCreate', onCrt);

            rmvTimeout = setTimeout(() => {
                if (!responded) {
                    this.removeListener('messageCreate', onCrt);
                    reject(new AwaitTimeout('Message await expired.'));
                }
            }, timeout);
        });
    }

    /**
     * Posts current guild count to bots.discord.pw.
     * 
     * @returns {Promise} .
     */
    async postGuildCount() {
        if (this.config.dbotsKey) {
            try {
                await got(`https://bots.discord.pw/api/bots/${this.user.id}/stats`, {
                    method: 'POST',
                    headers: {
                        Authorization: this.config.dbotsKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        server_count: this.guilds.size
                    })
                });
            } catch(err) {
                this.logger.error('Unable to POST guild count to DBots.');
                this.logger.error(err);
                return;
            }

            this.logger.info('Successfully POSTed guild count to DBots.');
        }
    }

    /**
     * Selects a random game that isn't the current one.
     * 
     * @returns {String} Random game.
     */
    pickGame() {
        let game = this.games[Math.floor(Math.random() * this.games.length)];

        if (game !== this.currentGame) {
            this.currentGame = game;
            return game;
        } else {
            this.pickGame();
        }
    }

    /**
     * Sets the bot's current game.
     */
    setGame() {
        let game = this.pickGame();

        // Some weird error happens sometimes, where game is undefined.
        if (game) {
            this.editStatus({
                name: `${game} | ${this.guilds.size} servers`,
                type: 0
            });
        } else {
            this.setGame();
        }
    }

    /**
     * Posts something to hastebin.com.
     * 
     * @param {String} str String to post.
     * @returns {Promise<String>} Key of the resulting paste.
     */
    async hastePost(str) {
        if (typeof str !== 'string') throw new TypeError('str is not a string.');

        let res = await got('https://hastebin.com/documents', {
            method: 'POST',
            body: str
        });

        return JSON.parse(res.body).key;
    }

    /**
     * Checks if a user is blacklisted.
     * 
     * @param {String} userID User to check.
     * @returns {Boolean} .
     */
    isBlacklisted(userID) {
        return this.blacklist.includes(userID);
    }

    /**
     * Reloads the blacklist.
     * 
     * @returns {Promise} .
     */
    async reloadBlacklist() {
        let list = await new Promise((resolve, reject) => {
            fs.readFile(this.blacklistPath, (err, res) => {
                if (err) reject(err);
                else resolve(JSON.parse(res));
            });
        });

        this.blacklist = list;
    }

    /**
     * Check if the user is the owner of the bot.
     * 
     * @param {String} userID User to check.
     * @returns {Boolean} .
     */
    isOwner(userID) {
        return userID === this.config.owner;
    }

    /**
     * Checks if the bot has the needed perms for auto-mod.
     * 
     * @param {Eris.Message} msg Message to use for check.
     * @returns {Boolean}.
     */
    hasWantedPerms(msg) {
        let perms = msg.channel.guild.members.get(this.user.id).permission;

        return perms.has('manageMessages') && perms.has('banMember') && perms.has('kickMembers');
    }

    /**
     * Checks if a user is a moderator, or has moderator powers.
     * 
     * @param {Eris.Member} member Member to check.
     * @returns {Boolean} .
     */
    isModerator(member) {
        let roles = member.roles.map(r => member.guild.roles.get(r));

        roles = roles.filter(r => {
            return /mod(erator)?s?|admin(istrator)?s?|staffs?/i.test(r.name.replace(/\u200b/g, '')) ||
            r.permissions.has('banMember') ||
            r.permissions.has('kickMembers') ||
            r.permissions.has('manageMessages') ||
            r.permissions.has('manageGuild') ||
            r.permissions.has('manageNicknames')
        });

        return roles.length > 0 || member.id === member.guild.ownerID;
    }

    /**
     * Sets up the settings for a guild the first time.
     * 
     * @param {String} guildID Guild to init settings for.
     * @returns {Promise<Object>} New settings.
     */
    async initSettings(guildID) {
        if (typeof guildID !== 'string') throw new TypeError('guildID is not a string.');

        let settings = {
            id: guildID,
            actions: {
                mentions: {
                    kick: 2,
                    ban: 3
                },
                invites: {
                    kick: 2,
                    ban: 3
                },
                diacritics: {
                    kick: 2,
                    ban: 3
                }
            },
            mentions: {trigger: 5, enabled: false},
            invites: {enabled: false, fake: false},
            diacritics: {trigger: 10, enabled: false},
            logChannel: null,
            exceptions: {
                users: [],
                channels: [],
                roles: []
            },
            messages: {
                invites: '{{mention}} please do not advertise here. Your message has been deleted and future offenses will be dealt with accordingly.',
                mentions: '{{mention}} do not mass-mention users. Future offences will be dealt with accordingly.',
                diacritics: '{{mention}} please do not post characters or messages that abuse the use of diacritics. Future offences will be dealt with accordingly.'
            },
            muteRoles: [],
            rolebanRole: null
        };

        this.settings.add(settings);
        
        let res = await this.db.table('guild_settings').get(guildID).run();

        if (res) return res;
        await this.db.table('guild_settings').insert(settings).run();

        return await this.db.table('guild_settings').get(guildID).run();
    }

    /**
     * Get the settings for a guild.
     * 
     * @param {String} guildID Guild to get settings for.
     * @returns {Promise<Object>} Guild settings.
     */
    async getSettings(guildID) {
        if (typeof guildID !== 'string') throw new TypeError('guildID is not a string.');

        if (this.settings.get(guildID)) {
            return this.settings.get(guildID);
        } else {
            let res = await this.db.table('guild_settings').get(guildID).run();

            if (!res) return await this.initSettings(guildID);
            this.settings.add(res);
            return res;
        }
    }

    /**
     * Edit the settings for a guild.
     * 
     * @param {String} guildID Guild to edit settings for.
     * @param {Object} settings New settings.
     * @returns {Promise<Object>} Edited settings.
     */
    async editSettings(guildID, settings={}) {
        if (typeof guildID !== 'string') throw new TypeError('guildID is not a string.');
        if (!settings || typeof settings !== 'object') throw new TypeError('settings is not an object.');
        if (Object.keys(settings).length === 0) throw new Error('settings is empty.');

        await this.db.table('guild_settings').get(guildID).update(settings).run();
        let res = await this.db.table('guild_settings').get(guildID);

        if (!this.settings.get(guildID)) {
            this.settings.add(res);
        } else {
            this.settings.remove(res);
            this.settings.add(res);
        }

        return res;
    }

    async getStrikes(guildID, userID) {
        if (typeof guildID !== 'string') throw new TypeError('guildID is not a string.');

        let res = await this.db.table('strikes').get(guildID).run();

        if (!res) {
            await this.db.table('strikes').insert({id: guildID, users: []});

            return [];
        } else {
            if (typeof userID === 'string') {
                return res.users.find(u => u.id === userID) ? res.users.find(u => u.id === userID).strikes : 0;
            } else {
                return res.users;
            }
        }
    }

    async incrementStrikes(guildID, userID) {
        if (typeof guildID !== 'string') throw new TypeError('guildID is not a string.');
        if (typeof userID !== 'string') throw new TypeError('userID is not a string.');

        let res = await this.db.table('strikes').get(guildID).run();

        if (!res) {
            await this.db.table('strikes').insert({id: guildID, users: [{id: userID, strikes: 1}]});
        } else {
            let i = res.users.indexOf(res.users.find(u => u.id === userID));

            if (i > -1) {
                let newNum = ++res.users[i].strikes;

                await this.db.table('strikes').get(guildID).update(row => {
                    return {users: row('users').changeAt(i, row('users')(i).merge({strikes: newNum}))};
                }).run();
            } else {
                await this.db.table('strikes').get(guildID).update(row => {
                    return {users: row('users').append({id: userID, strikes: 1})};
                });
            }
        }
    }

    async decrementStrikes(guildID, userID) {
        if (typeof guildID !== 'string') throw new TypeError('guildID is not a string.');
        if (typeof userID !== 'string') throw new TypeError('userID is not a string.');

        let res = await this.db.table('strikes').get(guildID).run();

        if (!res) {
            await this.db.table('strikes').insert({id: guildID, users: [{id: userID, strikes: 0}]}).run();
        } else {
            let i = res.users.indexOf(res.users.find(u => u.id === userID));

            if (i > -1) {
                let newNum = --res.users[i].strikes;

                await this.db.table('strikes').get(guildID).update(row => {
                    return {users: row('users').changeAt(i, row('users')(i).merge({strikes: newNum}))};
                }).run();
            } else {
                await this.db.table('strikes').get(guildID).update(row => {
                    return {users: row('users').append({id: userID, strikes: 0})};
                }).run();
            }
        }
    }

    async resetStrikes(guildID, userID) {
        if (typeof guildID !== 'string') throw new TypeError('guildID is not a string.');
        if (typeof userID !== 'string') throw new TypeError('userID is not a string.');

        let res = await this.db.table('strikes').get(guildID).run();

        if (!res) {
            await this.db.table('strikes').insert({id: guildID, users: [{id: userID, strikes: 0}]}).run();
        } else {
            let i = res.users.indexOf(res.users.find(u => u.id === userID));

            if (i > -1) {
                await this.db.table('strikes').get(guildID).update(row => {
                    return {users: row('users').changeAt(i, row('users')(i).merge({strikes: 0}))};
                }).run();
            } else {
                await this.db.table('strikes').get(guildID).update(row => {
                    return {users: row('users').append({id: userID, strikes: 0})};
                }).run();
            }
        }
    }
}

module.exports = KnifeBot;
/**
 * @file Class file for Knife Bot, extending the Eris client.
 * @author Ovyerus
 */

const crypto = require('crypto');
const Eris = require('eris');
const got = require('got');
const Redite = require('redite');
const Lookups = require('./Lookups');
const Logger = require('./Logger');
const {CommandHolder} = require('./CommandHolder');
const {AwaitTimeout} = require('./helpers');

/**
 * Main class for Knife Bot.
 * 
 * @extends Eris.Client
 * 
 * @prop {String[]} blacklist Array of blacklisted users.
 * @prop {String} blacklistPath Path to blacklist file.
 * @prop {CommandHolder} commands Command holder and runner.
 * @prop {Object} config Configuration object for the bot.
 * @prop {Redite} db Database wrapper.
 * @prop {Number} embedColour Default colour to use for embeds.
 * @prop {String[]} games Array of games to select from.
 * @prop {Logger} logger Fancy console logging.
 * @prop {Lookups} lookups Class for looking up various objects.
 * @prop {String} redHot Emoji string based off the name.
 * @prop {Eris.Client} rest Bot in REST mode in order to access REST restricted stuff.
 * @prop {String} userAgent User agent to send to external sites.
 */
class KnifeBot extends Eris.Client {
    /**
     * Create a new Knife Bot client.
     * 
     * @param {String} token Configuration for the bot
     * @param {Redite} db Redite wrapper for redis.
     * @param {Object} [options={}] Eris options.
     */
    constructor(token, db, options={}) {
        if (typeof token !== 'string') throw new TypeError('token is not a string.');

        super(token, options);

        this.redHot = '🔥 1⃣0⃣0⃣0⃣ 🌡 🔪';
        this.userAgent = 'Knife Bot/2.1';
        this.gameInterval = 300000;
        this.embedColour = 16665427;
        this.games = [
            '🔪 help',
            '🔪 invite',
            'OH GOD EVERYTHING IS MELTING',
            '🔪 info',
            'HOLY SHIT WHY AM I ON FIRE',
            'IT BUUURNNNNS',
            '🔪 support'
        ];

        this.db = db;
        this.commands = new CommandHolder(this);
        this.lookups = new Lookups(this);
        this.rest = new Eris(`Bot ${token}`, {
            restMode: true
        });

        this.logger = Logger;
        this.useCommands = false;
        this.loadCommands = true;
    }

    /**
     * Properly and easily sets up a Knife Bot instance.
     * 
     * @param {String} redisURL URL of the Redis server to connect to.
     * @param {Object} [options] Eris options.
     * @returns {Promise<KnifeBot>} Set up client.
     */
    static async setup(redisURL, options) {
        if (typeof redisURL !== 'string') throw new TypeError('redisURL is not a string.');

        let db = new Redite({url: redisURL});
        let token = await db.settings.token._promise;

        return new this(token, db, options);
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
     */
    async postGuildCount() {
        if (this.config.dbotsKey) {
            try {
                await got(`https://bots.discord.pw/api/bots/${this.user.id}/stats`, {
                    method: 'POST',
                    headers: {
                        Authorization: this.config.dbotsKey,
                        'Content-Type': 'application/json',
                        'User-Agent': this.userAgent
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
            return this.pickGame();
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
            headers: {
                'User-Agent': this.userAgent
            },
            body: str
        });

        return JSON.parse(res.body).key;
    }

    async reloadSettings() {
        let settings = await this.db.settings.get;

        this.blacklist = settings.blacklist;
        this.prefixes = settings.prefixes;
        this.errorChannel = settings.errorChannel;
        this.dbotsKey = settings.dbotsKey;
        this.owner = settings.owner;
        this.unloaded = settings.unloaded;
    }

    /**
     * Checks if a user is blacklisted.
     * 
     * @param {String} userID User to check.
     * @returns {Promise<Boolean>} .
     */
    isBlacklisted(userID) {
        return (this.blacklist || []).includes(userID);
    }

    /**
     * Check if the user is the owner of the bot.
     * 
     * @param {String} userID User to check.
     * @returns {Boolean} .
     */
    isOwner(userID) {
        return userID === this.owner;
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
            r.permissions.has('manageNicknames');
        });

        return roles.length > 0 || member.id === member.guild.ownerID;
    }

    // %% Settings Functions %% //

    /**
     * Sets up the settings for a guild the first time.
     * 
     * @param {String} guildID Guild to init settings for.
     * @returns {Promise<Object>} New settings.
     */
    async initSettings(guildID) {
        if (typeof guildID !== 'string') throw new TypeError('guildID is not a string.');
        if (await this.db.has(guildID)) return await this.db[guildID].get;

        let settings = {
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
                diacritics: '{{mention}} please do not post characters or messages that abuse the use of diacritics.'
                            + 'Future offences will be dealt with accordingly.'
            },
            muteRoles: [],
            rolebanRole: null,
            strikes: {}
        };

        await this.db[guildID].set(settings);
        return settings;
    }

    /**
     * Get the settings for a guild.
     * 
     * @param {String} guildID Guild to get settings for.
     * @returns {Promise<Object>} Guild settings.
     */
    async getSettings(guildID) {
        if (typeof guildID !== 'string') throw new TypeError('guildID is not a string.');
        if (!await this.db.has(guildID)) return await this.initSettings(guildID);

        return await this.db[guildID].get;
    }

    /**
     * Get the strikes for a guild. Optionally get it for a user as well.
     * 
     * @param {String} guildID Guild to get strikes for.
     * @param {String} [userID] User to get strikes for.
     * @returns {Promise<(Object[]|Number)>} Strikes for the guild or user.
     */
    async getStrikes(guildID, userID) {
        if (typeof guildID !== 'string') throw new TypeError('guildID is not a string.');

        let settings = await this.getSettings(guildID);

        if (!userID) return settings.strikes;
        else return settings.strikes[userID];
    }

    /**
     * Handles the various methods for error reporting.
     * 
     * @param {*} err Error to handle.
     * @param {Object} [opts] Options for handling.
     * @param {Eris.Message} [opts.msg] Possible message that triggered the error.
     * @param {String} [event] Possible event that triggered the error.
     * @param {Object} [discord] Possible Discord error.
     */
    async handleError(err, opts={}) {
        let errorCode = crypto.createHash('md5');

        if (!opts.msg) errorCode.update((Date.now() ** -1 + Date.now()).toString(2));
        else errorCode.update(opts.msg.author.id + opts.msg.channel.guild.id + Date.now());

        errorCode = errorCode.digest('hex').slice(0, 10);

        if (!opts.discord) this.logger.error(`Error code: "${errorCode}"\nError message: "${err.message}"${opts.event ? `\nEvent: ${opts.event}` : ''}`);

        if (opts.event && this.errorChannel) {
            await this.createMessage(this.errorChannel, '**New Error**\n\n'
            + `**Code:** \`${errorCode}\`\n`
            + `**Event:** \`${opts.event}\`\n`
            + '```js\n'
            + `${opts.discord ? `${opts.discord.code}: ${opts.discord.message}` : err.stack}\n`
            + '```');
        } else if (opts.msg && this.errorChannel) {
            await this.createMessage(this.errorChannel, '**New Error**\n\n'
            + `**Code:** \`${errorCode}\`\n`
            + `**Command:** \`${opts.msg.cmd}\`\n`
            + `**Guild:** \`${opts.msg.channel.guild.name}\` (${opts.msg.channel.guild.id})\n`
            + `**User:** \`${this.formatUser(opts.msg.author)}\` (${opts.msg.author.id})\n`
            + '```js\n'
            + `${opts.discord ? `${opts.discord.code}: ${opts.discord.message}` : err.stack}\n`
            + '```');

            await this.createMessage(opts.msg.channel.id, '**Woops, the blowtorches malfunctioned**\n\n'
            + "Something bad happened, and I wasn't able to complete your request.\n"
            + 'This event has been recorded, but if you would like to get help with it you can join my support server with `🔪 support`.\n'
            + `Make sure to quote with the code \`${errorCode}\``);
        } else if (opts.msg) {
            await this.createMessage(opts.msg.channel.id, '**Woops, the blowtorches malfunctioned**\n\n'
            + "Something bad happened, and I wasn't able to complete your request.\n"
            + 'This event has been recorded, but if you would like to get help with it you can join my support server with `🔪 support`.\n'
            + `Make sure to quote with the code \`${errorCode}\``);
        }
    }
}

module.exports = KnifeBot;
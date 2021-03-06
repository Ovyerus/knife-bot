const Eris = require('eris');
const logger = require(`${__dirname}/logger`);
const {parseArgs, parsePrefix, parseTulpa} = require(`${__dirname}/messageParser`);

const PermissionMsgs = {
    manageMessages: {
        author: "This chopping board doesn't belong to you.\n**(You require the Manage Messages permission)**",
        self: "I can't cleanup this chopping board.\n**(I require the Manage Messages permission)**"
    },
    banMembers: {
        author: 'You need heat-proof gloves to handle me.\n**(You require the Ban Members permission)**',
        self: "I'm not hot enough to cut.\n**(I require the Ban Members permission)**"
    },
    kickMembers: {
        author: 'The handle is too hot for you.\n**(You require the Kick Members permission)**',
        self: "I'm missing a handle.\n**(I require the Kick Members permissions)**"
    }
};

const PermissionsPrettyPrinted = {
    createInstantInvite: 'Create Instant Invite',
    kickMembers: 'Kick Members',
    banMembers: 'Ban Members',
    administrator: 'Administrator',
    manageChannels: 'Manage Channels',
    manageGuild: 'Manage Server',
    addReactions: 'Add Reactions',
    readMessages: 'Read Messages',
    sendMessages: 'Send Messages',
    sendTTSMessages: 'Send TTS Messages',
    manageMessages: 'Manage Messages',
    embedLinks: 'Embed Links',
    attachFiles: 'Attach Files',
    readMessageHistory: 'Read Message History',
    mentionEveryone: 'Mention Everyone',
    externalEmojis: 'Use External Emojis',
    voiceConnect: 'Connect',
    voiceSpeak: 'Speak',
    voiceMuteMembers: 'Mute Members',
    voiceDeafenMembers: 'Deafen Members',
    voiceMoveMembers: 'Move Members',
    voiceUseVAD: 'Use Voice Activity',
    changeNickname: 'Change Nickname',
    manageNicknames: 'Manage Nicknames',
    manageRoles: 'Manage Roles',
    manageWebhooks: 'Manage Webhooks',
    manageEmojis: 'Manage Emojis',
    all: 'All',
    allGuild: 'All Server',
    allText: 'All Text',
    allVoice: 'All Voice'
};

let _bot = Symbol();
let _handlePermissions = Symbol();

/**
 * Holds lots of commands and other shit.
 * 
 * @prop {Object} aliases Object mapping aliases to the name of their command.
 * @prop {Number} aliasesLength Amount of aliases currently registered.
 * @prop {String[]} allAliases Sorted list of all names of aliases.
 * @prop {String[]} allCommands Sorted list of all names of commands.
 * @prop {String[]} allModules Sorted list of all names of modules.
 * @prop {Object} commands Object mapping command objects to their name.
 * @prop {Number} length Amount of commands currently loaded.
 * @prop {Object} modules Object mapping module names to and array of their commands.
 * @prop {String[]} usedCommandOptions Array of options used by the command handler and loader.
 */

class CommandHolder {

    /**
     * Create a command holder.
     * 
     * @param {Eris.Client} bot An instance of an Eris client to use in module handling.
     * @throws {TypeError} Argument must be correct type.
     */
    constructor(bot) {
        if (!(bot instanceof Eris.Client)) throw new TypeError('bot is not an Eris client.');

        this.commands = {};
        this.aliases = {};
        this.modules = {};
        this[_bot] = bot;
    }

    /**
     * Loads a module.
     * 
     * @param {String} moduleName Name of the module.
     * @throws {TypeError} Argument must be correct type
     * @throws {Error} Module must not be loaded already.
     */
    loadModule(moduleName) {
        if (typeof moduleName !== 'string') throw new TypeError('moduleName is not a string.');

        let name = moduleName.split(/\\|\//).slice(-1)[0].slice(0, -3);

        if (this.modules[name]) throw new Error(`Module '${name}' is already loaded.`);

        let module = require(moduleName);

        if (!module.commands) {
            delete require.cache[moduleName];
            throw new Error(`Module '${name}' does not have a commands array.`);
        } else if (!Array.isArray(module.commands)) {
            delete require.cache[moduleName];
            throw new Error(`Command array for '${name}' is not an array.`);
        }

        if (typeof module.init === 'function') module.init(this[_bot]);
        let loadedCommands = [];
        let loadedAliases = [];

        if (module.loadAsSubcommands) {
            let command = Object.assign({owner: false, fixed: false}, module.main, {subcommands: {}});

            for (let cmd of module.commands) {
                if (typeof module[cmd] === 'object') {
                    module[cmd].permissions = command.permissions;
                    command.subcommands[cmd] = module[cmd];
                }
            }

            if (!module.main.main) {
                command.main = async (bot, ctx) => {
                    let collect = [];
                    let embed = {title: name};

                    for (let name in command.subcommands) {
                        let cmd = command.subcommands[name];
                        if ((cmd.owner || cmd.hidden) && !bot.isOwner(ctx.author.id)) continue;
                        collect.push(`${name} ${name}${cmd.usage ? ` ${cmd.usage}` : ''}\n\u200b - ${cmd.desc}`);
                    }

                    embed.description = `\`${collect.join('\n\n')}\``;

                    await ctx.createMessage({embed});
                };
            }

            this.commands[name] = command;
            this.modules[name] = [name];
        } else {
            for (let command of module.commands) {
                let cmd = module[command];

                if (!cmd) logger.warn(`Command '${command}' doesn't exist. Skipping...`);
                else if (!cmd.desc) logger.warn(`Command '${command}' does not have a description. Skipping...`);
                else if (typeof cmd.main !== 'function') logger.warn(`Command '${command}' does not have main as a function. Skipping...`);
                else {
                    this.commands[command] = cmd;

                    if (Array.isArray(cmd.aliases)) {
                        for (let alias of cmd.aliases) {
                            this.aliases[alias] = this.commands[command];
                            loadedAliases.push(alias);
                        }
                    }

                    loadedCommands.push(command);
                }
            }

            this.modules[name] = loadedCommands.concat(loadedAliases);
        }

        // In case the module somehow is empty.
        if (!this.modules[name]) {
            delete this.modules[name];
            delete require.cache[name];
            return;
        }

        logger.custom('CommandHolder/loadModule', `Loaded module '${name}'`);
    }

    /**
     * Unloads a module.
     * 
     * @param {String} moduleName Name of the module to unload.
     * @throws {TypeError} Argument must be correct type.
     * @throws {Error} Module must be loaded already.
     */
    unloadModule(moduleName) {
        if (typeof moduleName !== 'string') throw new TypeError('moduleName is not a string.');

        let name = moduleName.split(/\\|\//).slice(-1)[0].slice(0, -3);

        if (!this.modules[name]) throw new Error(`Module '${name}' is not loaded.`);

        for (let cmd of this.modules[name]) {
            if (this.aliases[cmd]) {
                delete this.aliases[cmd];
            } else if (this.commands[cmd]) {
                delete this.commands[cmd];
            }
        }

        delete this.modules[name];
        delete require.cache[moduleName];
        logger.custom('CommandHolder/removeModule', `Removed module '${name}'`);
    }

    /**
     * Reload a module.
     * 
     * @param {String} moduleName Name of the module to reload.
     * @throws {TypeError} Argument must be correct type.
     * @throws {Error} Module must already be loaded.
     */
    reloadModule(moduleName) {
        if (typeof moduleName !== 'string') throw new TypeError('moduleName is not a string.');
        if (!this.modules[moduleName.split(/\/|\\/).slice(-1)[0].slice(0, -3)]) {
            this.loadModule(moduleName);
            return;
        }

        this.unloadModule(moduleName);
        this.loadModule(moduleName);
    }

    /**
     * Get a command from the command object.
     * 
     * @param {String} cmdName The name of the command to get.
     * @returns {Object|Null} Returns command object if it exists.
     */
    getCommand(cmdName) {
        return this.aliases[cmdName] || this.commands[cmdName] || null;
    }

    /**
     * Run a command from the command object.
     * 
     * @param {Context} ctx Context object to be passed to the command.
     * @returns {Undefined}
     */
    async runCommand(ctx) {
        if (!(ctx instanceof Context)) throw new TypeError('ctx is not a Context object.');

        let cmd = this.getCommand(ctx.cmd);

        if (!cmd) return;
        if (!ctx.guild && !cmd.allowDM) return await ctx.createMessage('This command can only be run in a server.');

        if (cmd.subcommands && cmd.subcommands[ctx.args[0]]) {
            let subcommand = ctx.args[0];
            cmd = cmd.subcommands[subcommand];
            ctx.args = ctx.args.slice(1);
            ctx.raw = ctx.raw.split(subcommand).slice(1).join(subcommand).trim();
            ctx.cleanRaw = ctx.cleanRaw.split(subcommand).slice(1).join(subcommand).trim();
        }

        if (cmd.owner && this[_bot].isOwner(ctx.author.id)) {
            await cmd.main(this[_bot], ctx);
            logger.cmd(`${loggerPrefix(this[_bot], ctx)}Ran owner command '${ctx.cmd}'`);
        } else if (cmd.owner && !this[_bot].isOwner(ctx.author.id)) {
            logger.cmd(`${loggerPrefix(this[_bot], ctx)}Tried to run owner command '${ctx.cmd}'`);
            return; // eslint-disable-line
        } else {
            if (!cmd.permissions || typeof cmd.permissions !== 'object') {
                await cmd.main(this[_bot], ctx);
                logger.cmd(`${loggerPrefix(this[_bot], ctx)}Ran command '${ctx.cmd}'`);
            } else {
                await this[_handlePermissions](cmd, ctx);
            }
        }
    }

    /**
     * Runs a supplied callback for each command.
     * 
     * @param {Function} callback Function to run on each iteration. Gets two arguments: command object and command name.
     */
    forEach(callback) {
        if (typeof callback !== 'function') throw new TypeError('callback is not a function');

        for (let cmd in this.commands) {
            callback(this.commands[cmd], cmd);
        }
    }

    /**
     * Returns all the commands which meet the conditions in the callback.
     * 
     * @param {Function} callback Function to use to filter. Gets two arguments: command object and command name.
     * @returns {Command[]} Filtered commands.
     */
    filter(callback) {
        if (typeof callback !== 'function') throw new TypeError('callback is not a function');

        let filtered = [];

        this.forEach((cmd, name) => {
            if (callback(cmd, name)) filtered.push(Object.assign({}, cmd, {name}));
        });

        return filtered;
    }

    map(callback) {
        if (typeof callback !== 'function') throw new TypeError('callback is not a function.');

        let mapped = [];

        this.forEach((cmd, name) => mapped.push(callback(cmd, name)));

        return mapped;
    }

    /**
     * Check if a module exists in the modules object.
     * 
     * @param {String} modName Name of the module to check.
     * @returns {Boolean} True if module exists.
     */
    checkModule(modName) {
        return this.modules[modName] ? true : false;
    }

    /**
     * Handle permissions for commands.
     * 
     * @access private
     * @param {Command} cmd The command to check permissions for.
     * @param {Context} ctx Context object to use.
     * @returns {Undefined}
     */
    async [_handlePermissions](cmd, ctx) {
        // Permission checking
        let permChecks = {both: [], author: [], self: []};

        // Permissions for both
        if (Array.isArray(cmd.permissions.both)) permChecks.both = cmd.permissions.both.filter(perm => ctx.hasPermission(perm, 'both'));
        else if (typeof cmd.permissions.both === 'string' && ctx.hasPermission(cmd.permissions.both, 'both')) permChecks.both.push(cmd.permissions.both);

        // Permissions for author
        if (Array.isArray(cmd.permissions.author)) permChecks.author = cmd.permissions.author.filter(perm => ctx.hasPermission(perm, 'author'));
        else if (typeof cmd.permissions.author === 'string' && ctx.hasPermission(cmd.permissions.author, 'author')) permChecks.author.push(cmd.permissions.author);

        // Permissions for self
        if (Array.isArray(cmd.permissions.self)) permChecks.self = cmd.permissions.self.filter(perm => ctx.hasPermission(perm));
        else if (typeof cmd.permissions.self === 'string' && ctx.hasPermission(cmd.permissions.self)) permChecks.self.push(cmd.permissions.self);

        // See if all permissions are met
        let haveAmt = permChecks.both.length + permChecks.author.length + permChecks.self.length;
        let permAmt = 0;

        for (let key in cmd.permissions) {
            if (Array.isArray(cmd.permissions[key])) permAmt += cmd.permissions[key].length;
            else if (typeof cmd.permissions[key] === 'string') permAmt += 1;
        }

        if (haveAmt === permAmt) {
            // Run command since all permissions are fulfilled
            return await cmd.main(this[_bot], ctx);
        }

        // Figure out which permission is missing.
        let foundPerm;

        for (let key in cmd.permissions) {
            if (Array.isArray(cmd.permissions[key])) {
                for (let perm of cmd.permissions[key]) {
                    if (!~permChecks[key].indexOf(perm)) {
                        foundPerm = {perm, who: key};
                        break;
                    }
                }
            } else if (typeof cmd.permissions[key] === 'string') {
                if (permChecks[key][0] !== cmd.permissions[key]) {
                    foundPerm = {perm: cmd.permissions[key], who: key};
                    break;
                }
            }

            if (foundPerm) break;
        }

        if (foundPerm) {
            let {perm, who} = foundPerm;

            if (who === 'author' && !PermissionMsgs[perm]) return await ctx.createMessage(`You require the **${PermissionsPrettyPrinted[perm]}** permission to use this command.`);
            else if (who === 'author') return await ctx.createMessage(PermissionMsgs[perm].author);
            else if (who === 'self' && !PermissionMsgs[perm]) return await ctx.createMessage(`I do not have the **${PermissionsPrettyPrinted[perm]}** permission.`);
            else if (who === 'self') return await ctx.createMessage(PermissionMsgs[perm].self);

            if (!ctx.hasPermission(perm, 'author') && !PermissionMsgs[perm]) await ctx.createMessage(`You require the **${PermissionsPrettyPrinted[perm]}** permission to use this command.`);
            else if (!ctx.hasPermission(perm, 'author')) await ctx.createMessage(PermissionMsgs[perm].author);
            else if (!ctx.hasPermission(perm) && !PermissionMsgs[perm]) await ctx.createMessage(`I do not have the **${PermissionsPrettyPrinted[perm]}** permission.`);
            else if (!ctx.hasPermission(perm)) await ctx.createMessage(PermissionMsgs[perm].self);
        }
    }

    get length() {
        return Object.keys(this.commands).length;
    }

    get aliasesLength() {
        return Object.keys(this.aliases).length;
    }

    get usedCommandOptions() {
        return ['desc', 'usage', 'owner', 'fixed', 'main', 'permissions'];
    }

    get allCommands() {
        return Object.keys(this.commands).sort();
    }

    get allAliases() {
        return Object.keys(this.aliases).sort();
    }

    get allModules() {
        return Object.keys(this.modules).sort();
    }

    /**
     * Array of options used by the command handler and loader.
     * @returns {String[]} .
     */
    static get usedCommandOptions() {
        return ['desc', 'usage', 'owner', 'fixed', 'main', 'permissions'];
    }
}

function loggerPrefix(bot, msg) {
    return `${msg.channel.guild ? msg.channel.guild.id : msg.channel.id} > ${msg.author.id}: `;
}

/**
 * A command.
 * 
 * @prop {String} desc Short description of what the command does.
 * @prop {Boolean} [fixed] Says if the command can be unloaded or not.
 * @prop {String} [longDesc] Full description of the command.
 * @prop {Function} main Function for when the command is run.
 * @prop {Boolean} [owner=false] Restricts the command to the bot admins.
 * @prop {Object} [permissions] Discord permissions required for users and the bot.
 * @prop {String} [usage] Arguments for the command.
 */
class Command { // eslint-disable-line
    constructor() {}
}

let _msg = Symbol();
/**
 * Context to pass to a command.
 * 
 * @extends {Eris.Message}
 * @prop {String[]} args Array of command arguments.
 * @prop {String} cleanRaw Suffix with resolved content.
 * @prop {Eris.Client} client The bot client, used when passing to external modules.
 * @prop {String} cmd Name of command run.
 * @prop {Eris.Guild} guild Quick way to get the guild
 * @prop {Eris.Member} guildBot The member object of the bot.
 * @prop {String[]} mentionStrings Raw IDs of all users mentioned. May contain non-existant users.
 * @prop {String} raw Arguments joined with spaces.
 * @prop {Object} settings Settings for the guild.
 * @see http://eris.tachibana.erendale.abal.moe/Eris/docs/Message
 */
class Context {
    /**
     * Create a context object.
     * 
     * @param {Eris.Message} msg Message to inherit from.
     * @param {Eris.Client} bot Bot instance to help with some parsing.
     * @param {Object} settings Settings to assign to context.
    */
    constructor(msg, bot, settings) {
        // Validate all objects are the types we want.
        if (!(msg instanceof Eris.Message)) throw new TypeError('msg is not a message.');
        if (!(bot instanceof Eris.Client)) throw new TypeError('bot is not a client.');
        if (!settings || typeof settings !== 'object') throw new TypeError('settings is not an object.');

        // Inherit properties from the message and assign it a private value.
        Object.assign(this, msg);
        this[_msg] = msg;

        let cleaned = parseTulpa(msg.content);
        cleaned = parsePrefix(cleaned, bot.prefixes);

        let tmp = parseArgs(cleaned);
        this.args = tmp.args;
        this.cmd = tmp.cmd;
        this.raw = tmp.raw;
        this.cleanRaw = msg.content.split(this.cmd).slice(1).join(this.cmd).trim();

        this.guildBot = msg.channel.guild ? msg.channel.guild.members.get(bot.user.id) : bot.user;
        this.settings = settings;

        // Get mention strings.
        this.mentionStrings = msg.content.match(/<@!?\d+>/g) || [];
        if (this.mentionStrings.length > 0) this.mentionStrings = this.mentionStrings.map(mntn => mntn.replace(/<@!?/, '').replace('>', ''));
        if (msg.content.startsWith(`<@${this._client.user.id}>`) || msg.content.startsWith(`<@!${this._client.user.id}>`)) this.mentionStrings.shift();

        // Rename _client.
        this.client = this._client;
        delete this._client;
    }

    // "Inheriting" methods from the message.
    addReaction(reaction, userID) {
        return this[_msg].addReaction(reaction, userID);
    }

    delete() {
        return this[_msg].delete();
    }

    edit(content) {
        return this[_msg].edit(content);
    }

    getReaction(reaction, limit) {
        return this[_msg].getReaction(reaction, limit);
    }

    pin() {
        return this[_msg].pin();
    }

    removeReaction(reaction, userID) {
        return this[_msg].removeReaction(reaction, userID);
    }

    removeReactions() {
        return this[_msg].removeReactions();
    }

    unpin() {
        return this[_msg].unpin();
    }

    // Helper methods

    /**
     * Sends a message.
     * 
     * @param {(String|Object)} content Content to send. If object, same as Eris options.
     * @param {Object} [file] File to send. Same as Eris file.
     * @param {String} [where=channel] Where to send the message. Either 'channel' or 'author'.
     * @returns {Eris.Message} The sent message.
     * @see http://eris.tachibana.erendale.abal.moe/Eris/docs/Channel#function-createMessage
     */
    async createMessage(content, file, where='channel') {
        if (typeof where !== 'string') throw new TypeError('where is not a string.');
        if (!['channel', 'author'].includes(where)) throw new Error('where is an invalid place. Must either by `channel` or `author`');
            
        if (content && content.embed && !content.embed.color) content.embed.color = this.client.embedColour;

        if (!this.hasPermission('embedLinks') && content && content.embed) content = Context.flattenEmbed(content.embed);

        if (where === 'channel') {
            return await this.channel.createMessage(content, file);
        } else if (where === 'author') {
            return await this.author.getDMChannel().then(dm => dm.createMessage(content, file));
        }
    }

    /**
     * Check if a user has permission to run a command. Obeys channel permission overwrites.
     * 
     * @param {String} permission The permission to check.
     * @param {String} [who=self] The user to check. Either 'self', 'author' or 'both'.
     * @returns {Boolean} If the user has the permission.
     */
    hasPermission(permission, who='self') {
        // If it is a DM, just return true.
        if (!this.guild) return true;

        // Check if permission actually exists.
        if (!Object.keys(Eris.Constants.Permissions).includes(permission)) return false;
        if (!['self', 'author', 'both'].includes(who)) return false;

        if (who === 'self') {
            return this.channel.permissionsOf(this.client.user.id).has(permission);
        } else if (who === 'author') {
            return this.channel.permissionsOf(this.author.id).has(permission);
        } else if (who === 'both') {
            return this.hasPermission(permission) && this.hasPermission(permission, 'author');
        }
    }

    // Message getter properties.
    get guild() {
        return this.channel.guild;
    }

    get member() {
        return this[_msg].member;
    }

    get cleanContent() {
        return this[_msg].cleanContent;
    }

    get channelMentions() {
        return this[_msg].channelMentions;
    }

    /**
     * Flattens an embed into plain text.
     * 
     * @static
     * @param {Object} embed Embed to flatten.
     * @returns {String} Flattened embed.
     */
    static flattenEmbed(embed) {
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
            flattened += `${f.value}\n`;
        });
    
        if (embed.footer && !embed.timestamp) {
            flattened += `${embed.footer.text}\n`;
        } else if (!embed.footer && embed.timestamp) {
            flattened += `${embed.timestamp}\n`;
        } else if (embed.footer && embed.timestamp) {
            flattened += `\n${embed.footer.text} | ${embed.timestamp}\n`;
        }

        if (embed.thumbnail) flattened += `${embed.thumbnail.url}\n`;
        if (embed.image) flattened += `${embed.image.url}\n`;

        return flattened;
    }
}

module.exports = {CommandHolder, Context};
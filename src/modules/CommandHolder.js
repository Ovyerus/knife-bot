/*
 * Clara - command holder file
 *
 * Contributed by Ovyerus
 */

const Eris = require('eris');
const decache = require('decache');
const logger = require(`${__dirname}/logger`);

const PermissionMsgs = {
    manageMessages: {
        author: "This chopping board doesn't belong to you.\n**(You require the Manage Messages permission)**",
        self: "I can't cleanup this chopping board.\n**(I require the Manage Messages permission)**"
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
 * @prop {Object} commands Object mapping command objects to their name.
 * @prop {Number} length Amount of commands currently loaded.
 * @prop {Object} modules Object mapping module names to and array of their commands.
 * @prop {String[]} usedArrayOptions Array of options used by the command handler and loader.
 */

class CommandHolder {

    /**
     * Create a command holder object.
     * 
     * @param {Eris.Client} bot An instance of an Eris client to use in module handling.
     */
    constructor(bot) {
        if (!(bot instanceof Eris.Client)) throw new Error('bot is not an Eris client.');

        this.commands = {};
        this.aliases = {};
        this.modules = {};
        this[_bot] = bot;
    }

    /**
     * Handle adding a module.
     * 
     * @param {String} moduleName Name to register as in the modules array
     * @param {Object} module Module to add.
     * @param {Boolean} [module.loadAsSubcommands] If true, loads all commands defined in module.commands as subcommands.
     * @param {String[]} module.commands Array of command names to load.
     * @param {Function} [module.init] Function to run when module is loaded and before commands are loaded. Gets passed the main bot object as the only arg.
     * @param {Command} [module.main] If `module.loadAsSubcommands` is true, this is required and is used to give information on the module. `module.main.main` is optional, and by default will list all subcommands, but you can override this.
     * @param {Command} module.* Commands for the module. If their name is in `module.commands`, the command with will loaded. If `module.loadAsSubcommands` is true, these will be loaded as subcommands.
     * @returns {Number} Number of commands loaded.
     */
    addModule(moduleName, module) {
        if (typeof moduleName !== 'string') throw new TypeError('moduleName is not a string.');
        if (!module || typeof module !== 'object') throw new TypeError('module is not an object.');
        if (!(module.commands instanceof Array)) throw new TypeError('module.commands is not an array');
        if (this.modules[moduleName]) throw new TypeError(`'${moduleName}' is already loaded.`);
        if (module.looadAsSubcommands && (typeof module.main !== 'object' || !Object.keys(module.main).length)) throw new TypeError('module.options and module.main are both not objects or are both empty.');

        this.modules[moduleName] = [];

        if (typeof module.init === 'function') module.init(this[_bot]);

        if (module.loadAsSubcommands) {
            let command = Object.assign({owner: false, fixed: false}, module.main, {subcommands: {}});

            for (let cmd of module.commands) {
                if (typeof module[cmd] === 'object') {
                    command.subcommands[cmd] = module[cmd];
                }
            }

            if (!module.main.main) {
                command.main = (bot, ctx) => {
                    return new Promise((resolve, reject) => {
                        let collect = [];
                        let embed = {title: moduleName};

                        for (let name in command.subcommands) {
                            let cmd = command.subcommands[name];
                            collect.push(`${moduleName} ${name}${cmd.usage ? ` ${cmd.usage}` : ''}\n\u200b - ${cmd.desc}`);
                        }

                        embed.description = `\`${collect.join('\n\n')}\``;

                        ctx.createMessage({embed}).then(resolve).catch(reject);
                    });
                };
            }

            try {
                this.addCommand(moduleName, command);
                this.modules[moduleName].push(moduleName);
                this.modules[`${moduleName}-fixed`] = command.fixed;
                logger.custom('blue', 'CommandHolder/addModule', `Successfully loaded module '${moduleName}'`);
            } catch(err) {
                logger.customError('CommandHolder/addMoule', `Error when attempting to load module '${moduleName}':\n${err}`);
            }
        } else {
            for (let cmd of module.commands) {
                if (typeof module[cmd] === 'object') {
                    try {
                        this.addCommand(cmd, module[cmd]);
                        this.modules[moduleName].push(cmd);
                        logger.custom('blue', 'CommandHolder/addModule', `Successfully loaded command '${cmd}'`);
                    } catch(err) {
                        logger.customError('CommandHolder/addMoule', `Error when attempting to load command '${cmd}':\n${err}`);
                    }
                }
            }
        }

        return this.commands[moduleName].subcommands ? Object.keys(this.commands[moduleName].subcommands).length : this.modules[moduleName].length;
    }

    /**
     * Unloads a module and all its commands
     * 
     * @param {String} moduleName Name of the module to remove.
     * @param {String} path Path of the module. Used to decache the required module.
     * @param {Boolean} reloading If true, bypasses the fixed error.
     * @returns {Number} Amount of commands unloaded.
     */
    removeModule(moduleName, path, reloading = false) {
        if (typeof moduleName !== 'string') throw new TypeError('moduleName is not a string.');
        if (typeof path !== 'string') throw new TypeError('path is not a string.');
        if (!this.modules[moduleName]) throw new TypeError(`'${moduleName}' is not loaded.`);
        if (!reloading && this.modules[`${moduleName}-fixed`]) throw new TypeError(`'${moduleName}' cannot be removed.`);

        let amt = 0;
        this.modules[moduleName].forEach(cmd => {
            try {
                this.removeCommand(cmd, true);
                logger.custom('blue', 'CommandHolder/addModule', `Successfully removed command '${cmd}'`);
                amt++;
            } catch(err) {
                logger.customError('CommandHolder/removeMoule', `Error when attempting to remove command '${cmd}':\n${err}`);
            }
        });

        decache(path);
        delete this.modules[moduleName];
        delete this.modules[`${moduleName}-fixed`];
        return amt;
    }

    /**
     * Reload a module and its commands.
     * 
     * @param {String} moduleName Name of the module to reload
     * @param {Object} module Module to replace the old one
     * @param {String} path Path of the module. Used to decache the required module.
     * @returns {Number} Amount of commands reloaded.
     */
    reloadModule(moduleName, module, path) {
        this.removeModule(moduleName, path, true);
        return this.addModule(moduleName, module);
    }

    /**
     * Register a command into the command object.
     * 
     * @param {String} cmdName Name to register the command under.
     * @param {Command} cmdObject Object of the command to register.
     */
    addCommand(cmdName, cmdObject) {
        if (typeof cmdName !== 'string') throw new TypeError('cmdName is not a string');
        if (typeof cmdObject !== 'object') new TypeError('cmdObject is not an object');
        if (this.commands[cmdName] == null && !(cmdObject.desc && cmdObject.main)) throw new TypeError(`Not loading '${cmdName}' due to missing one or both required properties, desc and main.`);
        if (this.commands[cmdName]) throw new TypeError(`'${cmdName}' already exists in the command holder.`);

        this.commands[cmdName] = cmdObject;
    }

    /**
     * Remove a command from the command object.
     * 
     * @param {String} cmdName The name of the command to remove.
     * @param {Boolean} reloading Internal variable used for reloading.
     */
    removeCommand(cmdName, reloading) {
        if (typeof cmdName !== 'string') throw new TypeError('cmdName is not a string.');
        if (!this.commands[cmdName]) throw new TypeError(`'${cmdName}' does not exist in the command holder.`);
        if (this.commands[cmdName].fixed && !reloading) throw new TypeError(`'${cmdName}' cannot be removed.`);

        delete this.commands[cmdName];
    }

    /**
     * Reload a command in the command object.
     * 
     * @param {String} cmdName The name of the command to reload.
     * @param {Command} cmdObject Object of the command to register.
     */
    reloadCommand(cmdName, cmdObject) {
        this.removeCommand(cmdName, true);
        this.addCommand(cmdName, cmdObject);
    }

    /**
     * Get a command from the command object.
     * 
     * @param {String} cmdName The name of the command to get.
     * @returns {Object|Null} Returns command object if it exists.
     */
    getCommand(cmdName) {
        return this.commands[cmdName] || null;
    }

    /**
     * Check if a command is in the command object.
     * 
     * @param {String} cmdName The name of the command to check.
     * @returns {Boolean} If the command exists.
     */
    checkCommand(cmdName) {
        return this.commands[cmdName] ? true : false;
    }

    /**
     * Run a command from the command object.
     * 
     * @param {String} cmdName The name of the command to run.
     * @param {Context} ctx Context object to be passed to the command.
     * @returns {Promise} Resolves if command is run successfully, or rejects if there is an error.
     */
    runCommand(cmdName, ctx) {
        return new Promise((resolve, reject) => {
            if (typeof cmdName !== 'string') throw new TypeError('cmdName is not a string.');
            if (!(ctx instanceof Context)) throw new TypeError('ctx is not an instanceof Context.');
            if (!this.checkCommand(cmdName)) throw new Error(`'${cmdName}' is not a valid command.`);

            let cmd = this.getCommand(cmdName);

            // Subcommand checking
            if (cmd.subcommands && cmd.subcommands[ctx.args[0]]) {
                // Remove subcommand from raw and args.
                let subcommand = ctx.args.shift();
                ctx.raw = ctx.raw.substring(subcommand.length).trim();
                ctx.cleanRaw = ctx.cleanRaw.substring(subcommand.length).trim();

                // Check if the subcommand is owner only
                if ((cmd.owner || cmd.subcommands[subcommand].owner) && this[_bot].isOwner(ctx.author.id)) {
                    cmd.subcommands[subcommand].main(this[_bot], ctx).then(resolve).catch(reject);
                } else if (cmd.subcommands[subcommand].owner) {
                    resolve('non-owner ran owner command');
                } else {
                    if (!cmd.permissions || typeof cmd.permissions !== 'object') {
                        // If permissions aren't defined, run the command
                        cmd.subcommands[subcommand].main(this[_bot], ctx).then(resolve).catch(reject);
                    } else {
                        // Handle permissions
                        this[_handlePermissions](cmd, ctx, subcommand).then(resolve).catch(reject);
                    }
                }
            } else {
                // Check if the command is owner only
                if (cmd.owner && this[_bot].isOwner(ctx.author.id)) {
                    cmd.main(this[_bot], ctx).then(resolve).catch(reject);
                } else if (cmd.owner) {
                    resolve('non-owner ran owner command');
                } else {
                    if (!cmd.permissions || typeof cmd.permissions !== 'object') {
                        // If permissions aren't defined, run the command
                        cmd.main(this[_bot], ctx).then(resolve).catch(reject);
                    } else {
                        // Handle permissions
                        this[_handlePermissions](cmd, ctx).then(resolve).catch(reject);
                    }
                }
            }
        });
    }

    /**
     * Loop through the commands.
     * @param {Function} callback Function to run on each iteration.
     */
    forEach(callback) {
        if (!callback || typeof callback !== 'function') throw new Error('callback is not a function');

        for (let cmd in this.commands) {
            callback(this.commands[cmd], cmd);
        }
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
     * @param {String} [subcommand] numa
     * @returns {Promise} Nuthing boi
     */
    [_handlePermissions](cmd, ctx, subcommand) {
        return new Promise((resolve, reject) => {
            // Permission checking
            let permChecks = {both: [], author: [], self: []};

            // Permissions for both
            if (Array.isArray(cmd.permissions.both)) {
                cmd.permissions.both.forEach(perm => {
                    if (ctx.hasPermission(perm, 'both')) permChecks.both.push(perm);
                });
            } else if (typeof cmd.permissions.both === 'string' && ctx.hasPermission(cmd.permissions.both, 'both')) {
                permChecks.both.push(cmd.permissions.both);
            }

            // Permissions for author
            if (Array.isArray(cmd.permissions.author)) {
                cmd.permissions.author.forEach(perm => {
                    if (ctx.hasPermission(perm, 'author')) permChecks.author.push(perm);
                });
            } else if (typeof cmd.permissions.author === 'string' && ctx.hasPermission(cmd.permissions.author, 'author')) {
                permChecks.author.push(cmd.permissions.author);
            }

            // Permissions for self
            if (Array.isArray(cmd.permissions.self)) {
                cmd.permissions.self.forEach(perm => {
                    if (ctx.hasPermission(perm)) permChecks.self.push(perm);
                });
            } else if (typeof cmd.permissions.self === 'string' && ctx.hasPermission(cmd.permissions.self)) {
                permChecks.self.push(cmd.permissions.self);
            }

            // See if all permissions are met
            let haveAmt = permChecks.both.length + permChecks.author.length + permChecks.self.length;
            let permAmt = 0;

            for (let key in cmd.permissions) {
                if (Array.isArray(cmd.permissions[key])) {
                    permAmt += cmd.permissions[key].length;
                } else if (typeof cmd.permissions[key] === 'string') {
                    permAmt += 1;
                }
            }

            if (haveAmt === permAmt) {
                // Run command since all permissions are fulfilled
                if (subcommand) {
                    cmd.subcommands[subcommand].main(this[_bot], ctx).then(resolve).catch(reject);
                } else {
                    cmd.main(this[_bot], ctx);
                }
            } else {
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
                    if (who === 'author' && !PermissionMsgs[perm]) {
                        ctx.createMessage(`You require the **${PermissionsPrettyPrinted[perm]}** permission to use this command.`).then(resolve).catch(reject);
                    } else if (who === 'author') {
                        ctx.createMessage(PermissionMsgs[perm].author).then(resolve).catch(reject);
                    } else if (who === 'self' && !PermissionMsgs[perm]) {
                        ctx.createMessage(`I do not have the **${PermissionsPrettyPrinted[perm]}** permission.`).then(resolve).catch(reject);
                    } else if (who === 'self') {
                        ctx.createMessage(PermissionMsgs[perm].self).then(resolve).catch(reject);
                    } else if (who === 'both') {
                        if (!ctx.hasPermission(perm, 'author') && !PermissionMsgs[perm]) {
                            ctx.createMessage(`You require the **${PermissionsPrettyPrinted[perm]}** permission to use this command.`).then(resolve).catch(reject);
                        } else if (!ctx.hasPermission(perm, 'author')) {
                            ctx.createMessage(PermissionMsgs[perm].author).then(resolve).catch(reject);
                        } else if (!ctx.hasPermission(perm) && !PermissionMsgs[perm]) {
                            ctx.createMessage(`I do not have the **${PermissionsPrettyPrinted[perm]}** permission.`).then(resolve).catch(reject);
                        } else if (!ctx.hasPermission(perm)) {
                            ctx.createMessage(PermissionMsgs[perm].self).then(resolve).catch(reject);
                        }
                    }
                }
            }
        });
    }

    get length() {
        return Object.keys(this.commands).length;
    }

    get aliasesLength() {
        return Object.keys(this.aliases).length;
    }

    get usedCommandOptions() {
        return ['desc', 'longDesc', 'usage', 'owner', 'fixed', 'main', 'permissions'];
    }
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
const USEDOPTIONS = ['args', 'cleanRaw', 'cmd', 'guildBot', 'raw', 'settings'];
/**
 * Context to pass to a command.
 * 
 * @extends {Eris.Message}
 * @prop {String[]} args Array of command arguments.
 * @prop {String} cleanRaw Suffix with resolved content.
 * @prop {Eris.Client} ctx.client The bot client, used when passing to external modules.
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
     * @param {Object} options Options for the context.
     * @param {String[]} options.args Array of arguments.
     * @param {String} options.cleanRaw All arguments joined together with resolved content.
     * @param {String} options.cmd The command name.
     * @param {Eris.Member} options.guildBot The member object of the bot.
     * @param {Eris.Message} options.msg Message to inherit from.
     * @param {String} options.raw All arguments joined together.
     * @param {Object} options.settings Settings for the guild or user.
    */
    constructor(options) {
        // Validate all objects are the types we want.
        if (typeof options !== 'object') throw new TypeError('options is not an object.');
        if (Object.keys(options).length === 0) throw new Error('options is empty.');
        if (!(options.msg instanceof Eris.Message)) throw new TypeError('options.msg is not an instance of Eris.Message.');
        if (!(options.guildBot instanceof Eris.Member)) throw new TypeError('options.guildBot is not an instance of Eris.Member.');
        if (!Array.isArray(options.args)) throw new TypeError('options.args is not an array.');
        if (typeof options.cmd !== 'string') throw new TypeError('options.cmd is not a string.');
        if (typeof options.raw !== 'string') throw new TypeError('options.raw is not a string.');
        if (typeof options.cleanRaw !== 'string') throw new TypeError('options.cleanRaw is not a string.');
        if (typeof options.settings !== 'object') throw new TypeError('options.settings is not an object.');

        // Inherit properties from the message and assign it a private value.
        Object.assign(this, options.msg);
        this[_msg] = options.msg;

        // Assign used options into this.
        Object.keys(options).filter(k => USEDOPTIONS.includes(k)).forEach(k => {
            this[k] = options[k];
        });

        // Get mention strings.
        this.mentionStrings = this[_msg].content.match(/<@!?\d+>/g) || [];
        if (this.mentionStrings.length > 0) this.mentionStrings = this.mentionStrings.map(mntn => mntn.replace(/<@!?/, '').replace('>', ''));
        if (this[_msg].content.startsWith(`<@${this._client.user.id}>`) || this[_msg].content.startsWith(`<@!${this._client.user.id}>`)) this.mentionStrings.shift();

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
     * @returns {Promise<Eris.Message>} The sent message.
     * @see http://eris.tachibana.erendale.abal.moe/Eris/docs/Channel#function-createMessage
     */
    createMessage(content, file, where='channel') {
        return new Promise((resolve, reject) => {
            if (typeof where !== 'string') throw new TypeError('where is not a string.');
            if (!['channel', 'author'].includes(where)) throw new Error('where is an invalid place. Must either by `channel` or `author`');
            
            if (content && content.embed && !content.embed.color) content.embed.color = 16665427;

            if (where === 'channel') {
                this.channel.createMessage(content, file).then(resolve).catch(reject);
            } else if (where === 'author') {
                this.author.getDMChannel().then(dm => dm.createMessage(content, file)).then(resolve).catch(reject);
            }
        });
    }

    /**
     * Check if a user has permission to run a command. Obeys channel permission overwrites for allowing.
     * 
     * @param {String} permission The permission to check.
     * @param {String} [who=self] The user to check. Either 'self', 'author' or 'both'.
     * @returns {Boolean} If the user has the permission.
     */
    hasPermission(permission, who='self') {
        // Check if permission actually exists.
        if (!Object.keys(Eris.Constants.Permissions).includes(permission)) return false;
        if (!['self', 'author', 'both'].includes(who)) return false;

        if (who === 'self') {
            if (this.guildBot.permission.has(permission)) return true;
            
            // Channel overwrites
            let everyone = this.guild.roles.find(r => r.name === '@everyone');
            let chanPerms = this.channel.permissionOverwrites.filter(v => {
                return (v.type === 'member' && v.id === this.guildBot.id) || (v.type === 'role' && (this.guildBot.roles.includes(v.id) || v.id === everyone.id));
            });

            for (let perm of chanPerms) if (perm.has(permission)) return true;
            return false;
        } else if (who === 'author') {
            if (this.member.permission.has(permission)) return true;

            // Channel overwrites
            let everyone = this.guild.roles.find(r => r.name === '@everyone');
            let chanPerms = this.channel.permissionOverwrites.filter(v => {
                return (v.type === 'member' && v.id === this.member.id) || (v.type === 'role' && (this.member.roles.includes(v.id) || v.id === everyone.id));
            });

            for (let perm of chanPerms) if (perm.has(permission)) return true;
            return false;
        } else if (who === 'both') {
            if (this.member.permission.has(permission) && this.guildBot.permission.has(permission)) return true;

            // Channel permissionOverwrites
            let everyone = this.guild.roles.find(r => r.name === '@everyone');
            let chanPerms = this.channel.permissionOverwrites.filter(v => {
                return (v.type === 'member' && (v.id === this.member.id || v.id === this.guildBot.id)) || (v.type === 'role' && ((this.member.roles.includes(v.id) && this.guildBot.roles.includes(v.id)) || v.id === everyone.id));
            });


            for (let perm of chanPerms) if (perm.has(permission)) return true;
            return false;
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
}

module.exports = {CommandHolder, Context};
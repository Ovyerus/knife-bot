const Eris = require('eris');
const Promise = require('bluebird');
const fs = require('fs');
const logger = require('./logger.js');
const prefixParse = require('./prefixParse.js');
const config = require('./config.json');
const knife = new Eris(config.token, {
    disableEvents: {
        PRESENCE_UPDATE: true,
        TYPING_START: true,
        VOICE_STATE_UPDATE: true
    }
});

knife.owner = config.owner;
knife.redHot = '🔥 1⃣0⃣0⃣0⃣ 🌡 🔪'; 
knife.commands = {};
knife.logger = logger;
const prefixes = ['\uD83D\uDD2A', '<@{{id}}> '];
var useCommands = false;
var loadCommands = true;

knife.formatUser = user => {
    return user instanceof Eris.Member ? `${user.nick ? user.nick : user.user.username}#${user.user.discriminator}` : `${user.username}#${user.discriminator}`;
}

knife.on('ready', () => {
    knife.editStatus('online', {name: `${prefixes[0]}help | ${knife.guilds.size} servers`});
    if (loadCommands) {
        logger.info(knife.user.username + ' is online and ready to cut shit I guess.');
        prefixes[prefixes.indexOf('<@{{id}}> ')] = '<@{{id}}> '.replace('{{id}}', knife.user.id);
        var files = fs.readdirSync(`${__dirname}/commands`);
        for (let file of files) {
            if (!file.endsWith('.js')) continue;
            let cmd = require(`${__dirname}/commands/${file}`).cmd;
            knife.commands[file.substring(0, file.indexOf('.js'))] = cmd;
        }
        logger.info(`Loaded ${Object.keys(knife.commands).length} commands.`);
        loadCommands = false;
        useCommands = true;
    } else {
        logger.info('Reconnected from Discord');
    }
});

knife.on('messageCreate', msg => {
    if (!useCommands || !msg.author || msg.author.bot) return;
    if (!msg.channel.guild) {
        logger.custom('cyan', 'dm', `Direct Message | ${knife.formatUser(msg.author)}: ${msg.cleanContent}`);
        return;
    }
    
    prefixParse(msg.content, prefixes).then(content => {
        if (!content) return;

        msg.mentionStrings = msg.content.match(/<@!?\d+>/g) || [];
        if (msg.mentions.length !== 0) msg.mentionStrings.forEach((mntn, indx) => {
            msg.mentionStrings[indx] = mntn.replace(/<@!?/, '').replace('>', '');
        });
        msg.content.startsWith(`<@${knife.user.id}> `) ? msg.mentionStrings.shift() : null;
        let args = content.split(' ');
        let cmd = args.shift();
        if (/^vs$/i.test(cmd)) cmd = cmd.toLowerCase();

        if (!knife.commands[cmd]) return;

        knife.commands[cmd].func(knife, msg, args).then(lul => {
            if (!lul) logger.cmd(`${msg.channel.guild.name} | ${msg.channel.name} + ${knife.formatUser(msg.author)}: ${msg.cleanContent}`);
        }).catch(err => {
            if (err.resp && err.resp.statusCode === 403) {
                logger.warn(`Can't send message in '#${msg.channel.name}' (${msg.channel.id}), cmd from user '${knife.formatUser(msg.author)}' (${msg.author.id})`);
                knife.getDMChannel(msg.author.id).then(dm => {
                    knife.createMessage(dm.id, `It appears I was unable to send a message in \`#${msg.channel.name}\` on the server \`${msg.channel.guild.name}\`. Please give me the Send Messages permission or notify a mod or admin if you cannot do this.`);
                }).catch(() => logger.warn(`Couldn't get DM channel for ${knife.formatUser(msg.author)} (${msg.author.id})`));
            } else {
                logger.error(`Error in command '${cmd}' from user ${knife.formatUser(msg.author)} in #${msg.channel.name} (${msg.channel.id})\n${err.stack}`);
                var errMsg = `Error with command \`${cmd}\`\n`;
                errMsg += '```js\n';
                errMsg += `${err}\n`;
                errMsg += '```';
                knife.createMessage(msg.channel.id, errMsg);
            }
        });
    });
});

knife.on('guildCreate', g => {
    knife.editStatus('online', {name: `${prefixes[0]}help | ${knife.guilds.size} servers`});
    if (g.members.filter(m => m.bot).length >= Math.ceil(g.memberCount / 2)) {
        logger.info(`Leaving bot collection guild, '${g.name}' (${g.id})`);
        g.leave();
    }
});

knife.on('guildDelete', g => {
    knife.editStatus('online', {name: `${prefixes[0]}help | ${knife.guilds.size} servers`});
});

knife.on('disconnect', () => {
    logger.warn('Disconnected from Discord.');
});

knife.connect();
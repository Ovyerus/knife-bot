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

knife.formatUser = user => {
    return user instanceof Eris.Member ? `${user.nick ? user.nick : user.user.username}#${user.user.discriminator}` : `${user.username}#${user.discriminator}`;
}

knife.on('ready', () => {
    logger.info(knife.user.username + ' is online and ready to cut shit I guess.');
    prefixes[1] = prefixes[1].replace('{{id}}', knife.user.id);
    var files = fs.readdirSync(`${__dirname}/commands`);
    for (let file of files) {
        if (!file.endsWith('.js')) continue;
        let cmd = require(`${__dirname}/commands/${file}`).cmd;
        knife.commands[file.substring(0, file.indexOf('.js'))] = cmd;
    }
    logger.info(`Loaded ${Object.keys(knife.commands).length} commands.`);
});

knife.on('messageCreate', msg => {
    if (msg.author.bot) return;
    if (!msg.channel.guild) {
        logger.custom('cyan', 'dm', `Direct Message | ${knife.formatUser(msg.author)}: ${msg.cleanContent}`);
        return;
    }
    
    prefixParse(msg.content, prefixes).then(content => {
        if (!content) return;

        let args = content.split(' ');
        let cmd = args.shift();

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
                logger.error(`Error in command '${cmd}' from user ${knife.formatUser(msg.author)} in #${msg.channel.name} (${msg.channel.id})\n${err}\n${err.stack}`);
                var errMsg = `Error with command \`${cmd}\`\n`;
                errMsg += '```js\n';
                errMsg += `${err}\n`;
                errMsg += '```';
                knife.createMessage(msg.channel.id, errMsg);
            }
        });
    });
});


knife.connect();
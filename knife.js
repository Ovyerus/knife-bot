const Eris = require('eris');
const Promise = require('bluebird');
const fs = require('fs');
const logger = require('./logger.js');
const prefixParse = require('./prefixParse.js');
const config = require('./config.json');
const knife = new Eris(config.token, {
    disableEvents: {
        TYPING_START: true,
        VOICE_STATE_UPDATE: true
    }
});

knife.owner = config.owner;
knife.redHot = '🔥 1⃣0⃣0⃣0⃣ 🌡 🔪'; 
knife.commands = {};
knife.logger = logger;
knife.db = require('rethinkdbdash')(config.rethinkOptions);

const prefixes = [/\uD83D\uDD2A ?/, '<@{{id}}> '];
const games = ['🔪 help', '🔪 invite', 'OH GOD EVERYTHING IS MELTING', '🔪 info', 'HOLY SHIT WHY AM I ON FIRE', 'IT BUUURNNNNS'];
const noDM = ['purge', 'vs', 'info'];
const gameInterval = 600000;
var useCommands = false;
var loadCommands = true;
var currentGame;
var gameLoop;

knife.formatUser = user => {
    return user instanceof Eris.Member ? `${user.nick ? user.nick : user.user.username}#${user.user.discriminator}` : `${user.username}#${user.discriminator}`;
}

knife.awaitMessage = (channelID, userID, filter=function(){return true}, timeout=15000) => {
    return new Promise((resolve, reject) => {
        if (!channelID || typeof channelID !== 'string') {
            reject(new Error(`Unwanted type of channelID: got "${typeof channelID}" expected "string"`));
        } else if (!userID || typeof userID !== 'string') {
            reject(new Error(`Unwanted type of userID: got "${typeof userID}" expected "string"`));
        } else {
            var responded, rmvTimeout;

            var onCrt = (msg) => {
                if (msg.channel.id === channelID && msg.author.id === userID && filter(msg)) {
                    responded = true;
                    return msg;
                }
            }

            var onCrtWrap = (msg) => {
                var res = onCrt(msg);
                if (responded) {
                    knife.removeListener('messageCreate', onCrtWrap);
                    clearInterval(rmvTimeout);
                    resolve(res);
                } 
            }

            knife.on('messageCreate', onCrtWrap);

            rmvTimeout = setTimeout(() => {
                if (!responded) {
                    knife.removeListener('messageCreate', onCrtWrap);
                    reject(new Error('Message await expired.'))
                }
            }, timeout);
        }
    });
}

function pickGame() {
    let game = games[Math.floor(Math.random() * games.length)];
    if (game !== currentGame) {
        currentGame = game;
        return game;
    } else {
        pickGame();
    }
}

function setGame() {
    let game = pickGame();
    if (game) {
        knife.editStatus('online', {name: `${game} | ${knife.guilds.size} servers`});
    } else {
        setGame();
    }
}

knife.on('ready', () => {
    if (loadCommands) {
        logger.info(knife.user.username + ' is online and ready to cut shit I guess.');
        if (prefixes.indexOf('<@{{id}}> ') !== -1) prefixes[prefixes.indexOf('<@{{id}}> ')] = '<@{{id}}> '.replace('{{id}}', knife.user.id);
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

    setGame();
    if (!gameLoop) gameLoop = setInterval(setGame, gameInterval);
});

knife.on('messageCreate', msg => {
    if (!useCommands || !msg.author || msg.author.bot) return;
    if (!msg.channel.guild) {
        logger.custom('cyan', 'dm', `Direct Message | ${knife.formatUser(msg.author)}: ${msg.cleanContent}`);
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

        if (!knife.commands[cmd] || (!msg.channel.guild && noDM.indexOf(cmd) !== -1)) return;

        knife.commands[cmd].func(knife, msg, args).then(lul => {
            if (!lul) {
                if (msg.channel.guild) logger.cmd(`${msg.channel.guild.name} | ${msg.channel.name} + ${knife.formatUser(msg.author)}: ${msg.cleanContent}`);
            }
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
    if (g.members.filter(m => m.bot).length >= Math.ceil(g.memberCount / 2)) {
        logger.info(`Leaving bot collection guild, '${g.name}' (${g.id})`);
        g.leave();
    } else {
        knife.editStatus('online', {name: `${currentGame} | ${knife.guilds.size} servers`});
    }
});

knife.on('guildDelete', g => {
    knife.editStatus('online', {name: `${currentGame} | ${knife.guilds.size} servers`});
});

knife.on('disconnect', () => {
    logger.warn('Disconnected from Discord.');
});

knife.connect();
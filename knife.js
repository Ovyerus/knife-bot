const Eris = require('eris');
const Promise = require('bluebird');
const cp = require('child_process');
const util = require('util');
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
const prefixes = ['\uD83D\uDD2A', '<@{{id}}> '];
const commands = {};

knife.formatUser = user => {
    return user instanceof Eris.Member ? `${user.nick ? user.nick : user.user.username}#${user.user.discriminator}` : `${user.username}#${user.discriminator}`;
}

knife.on('ready', () => {
    logger.info(knife.user.username + ' is online and ready to cut shit I guess.');
    prefixes[1] = prefixes[1].replace('{{id}}', knife.user.id);
});

knife.on('messageCreate', msg => {
    if (msg.author.bot) return;
    if (!msg.guild) {
        logger.custom('cyan', 'dm', `Direct Message | ${knife.formatUser(msg.author)}: ${msg.cleanContent}`);
        return;
    }
    
    prefixParse(msg.content, prefixes).then(content => {
        if (!content) return;

        let args = content.split(' ');
        let cmd = args.shift();

        commands[cmd].func(msg, args).then(lul => {
            if (!lul) logger.cmd(`${msg.guild.name} | ${msg.channel.name} + ${knife.formatUser(msg.author)}: ${msg.cleanContent}`);
        }).catch(err => {
            if (err.resp && err.resp.statusCode === 403) {
                logger.warn(`Can't send message in '#${msg.channel.name}' (${msg.channel.id}), cmd from user '${knife.formatUser(msg.author)}' (${msg.author.id})`);
                knife.getDMChannel(msg.author.id).then(dm => {
                    knife.createMessage(dm.id, `It appears I was unable to send a message in \`#${msg.channel.name}\` on the server \`${msg.guild.name}\`. Please give me the Send Messages permission or notify a mod or admin if you cannot do this.`);
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

commands['help'] = {
    description: 'Help command.',
    func: msg => {
        return new Promise((resolve, reject) => {
            var helpMsg = '```\n';
            for (let command in commands) {
                let cmd = commands[command];
                helpMsg += command;
                cmd.usage ? helpMsg += ' ' + cmd.usage + ': ' : helpMsg += ': ';
                helpMsg += cmd.description + '\n';
            }
            helpMsg += '```';

            knife.createMessage(msg.channel.id, `${knife.redHot} Sending the help to your DMs.`).then(() => {
                knife.getDMChannel(msg.author.id).then(dm => {
                    knife.createMessage(dm.id, helpMsg).then(() => resolve()).catch(reject);
                }).catch(() => {
                    logger.warn(`Couldn't get DM channel for ${knife.formatUser(msg.author)} (${msg.author.id})`);
                    knife.createMessage(msg.channel.id, 'It appears that I am unable to DM you. Maybe you have me blocked?');
                });
            }).catch(err => {
                if (err.resp && err.resp.statusCode === 403) logger.warn(`Can't send message in '#${msg.channel.name}' (${msg.channel.id}), cmd from user '${knife.formatUser(msg.author)}' (${msg.author.id})`);
            });
        });
    }
}

commands['ping'] = {
    description: 'Ping!',
    func: msg => {
        return new Promise((resolve, reject) => {
            knife.createMessage(msg.channel.id, 'IT BURNS').then(m => {
                knife.editMessage(m.channel.id, m.id, `Cut through the message in \`${m.timestamp - msg.timestamp}ms\``).then(() => resolve ()).catch(reject);
            }).catch(reject);
        });
    }
}

commands['invite'] = {
    description: 'Invite me to your server.',
    func: msg => {
        return new Promise((resolve, reject) => {
            knife.createMessage(msg.channel.id, `https://discordapp.com/oauth2/authorize?client_id=${knife.user.id}&scope=bot&permissions=388167`).then(() => resolve()).catch(reject);
        });
    }
}

commands['vs'] = {
    description: 'Cuts through someone and bans them',
    usage: '<user mention>',
    func: (msg, args) => {
        return new Promise((resolve, reject) => {
            if (!msg.member.permission.has('banMembers')) {
                knife.createMessage(msg.channel.id, 'You need heat-proof gloves to handle me.\n**(You require the Ban Members permission)**').then(() => resolve()).catch(reject);
            } else {
                if (!msg.guild.members.get(knife.user.id).permission.has('banMembers')) {
                    knife.createMessage(msg.channel.id, "I'm not hot enough to cut.\n**(I require the Ban Members permission)**").then(() => resolve()).catch(reject);
                } else {
                    if (msg.mentions.length > 0) {
                        knife.banGuildMember(msg.guild.id, msg.mentions[0].id, 7).then(() => {
                            knife.createMessage(msg.channel.id, `Cut all the way through **${knife.formatUser(msg.mentions[0])}**!`)
                        }).catch(err => {
                            if (err.resp && err.resp.statusCode === 403) {
                        knife.createMessage(msg.channel.id, `**${knife.formatUser(msg.mentions[0])}** is too tough for me and I was unable to be cut through.`).then(() => resolve()).catch(reject);
                            } else {
                                reject(err);
                            }
                        });
                    } else {
                        knife.createMessage(msg.channel.id, 'Please mention someone for me to cut through.').then(() => resolve()).catch(reject);
                    }
                }
            }
        });
    }
}

commands['eval'] = {
    description: '👀',
    usage: '<👀>',
    func: (msg, args) => {
        return new Promise((resolve, reject) => {
            if (msg.author.id !== knife.owner) {
                resolve('fagit');
            } else {
                var evalArgs = args.join(' ');

                try {
                    var returned = eval(evalArgs);
                    var str = util.inspect(returned, {depth: 1});
                    str = str.replace(new RegExp(knife.token, 'gi'), '<TOKEN>');

                    if (str.length > 1900) {
                        str = str.substr(0, 1897);
                        str = str + '...';
                    }

                    var sentMessage = '```js\n';
                    sentMessage += `Input: ${evalArgs}\n\n`;
                    sentMessage += `Output: ${str}\n`;
                    sentMessage += '```';

                    knife.createMessage(msg.channel.id, sentMessage).then(() => resolve()).catch(reject);
                } catch(err) {
                    var errMessage = '```js\n';
                    errMessage += `Input: ${evalArgs}\n\n`;
                    errMessage += `${err}\n`;
                    errMessage += '```';

                    knife.createMessage(msg.channel.id, errMessage).then(() => resolve()).catch(reject);
                }
            }
        });
    }
}

commands['cooldown'] = {
    description:'Turns the blowtorches off.',
    func: msg => {
        return new Promise((resolve, reject) => {
            if (msg.author.id !== knife.owner) {
                resolve('fagit');
            } else {
                knife.createMessage(msg.channel.id, 'Turning off the blowtorches...').then(() => {
                    console.log('ayy lmao cya world');
                    process.exit()
                });
            }
        });
    }
}

commands['git'] = {
    description: 'Git command.',
    func: (msg, args) => {
        return new Promise((resolve, reject) => {
            if (args.length === 0) {
                cp.exec('git log', (err, stdout, stderr) => {
                    if (err) {
                        reject(err);
                    } else if (stderr) {
                        reject(stderr);
                    } else {
                        var commits = stdout.split('commit ');
                        console.log(commits);
                        var first = 'commit ' + commits[0];
                        var cmtMsg = 'Latest pulled commit: \n```\n';
                        cmtMsg += first + '\n';
                        cmtMsg += '```';
                        knife.createMessage(msg.channel.id, cmtMsg).then(() => resolve()).catch(reject);
                    }
                });
            }
        });
    }
}

knife.connect();
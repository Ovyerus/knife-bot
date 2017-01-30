const Promise = require('bluebird');

exports.cmd = {
    description: 'Help command.',
    func: (knife, msg) => {
        return new Promise((resolve, reject) => {
            var helpMsg = '```\n';
            for (let command in knife.commands) {
                let cmd = knife.commands[command];
                helpMsg += command;
                cmd.usage ? helpMsg += ' ' + cmd.usage + ': ' : helpMsg += ': ';
                helpMsg += cmd.description + '\n';
            }
            helpMsg += '```\nSupport server link: https://discord.gg/hD8xZMG';

            if (msg.channel.guild) {
                knife.createMessage(msg.channel.id, `${knife.redHot} Sending the help to your DMs.`).then(() => {
                    knife.getDMChannel(msg.author.id).then(dm => {
                        knife.createMessage(dm.id, helpMsg).then(() => resolve()).catch(() => {
                            knife.logger.warn(`Couldn't get DM channel for ${knife.formatUser(msg.author)} (${msg.author.id})`);
                            knife.createMessage(msg.channel.id, 'It appears that I am unable to DM you. Maybe you have me blocked?');
                            resolve();
                        });
                    }).catch(() => {
                        knife.logger.warn(`Couldn't get DM channel for ${knife.formatUser(msg.author)} (${msg.author.id})`);
                        knife.createMessage(msg.channel.id, 'It appears that I am unable to DM you. Maybe you have me blocked?');
                        resolve();
                    });
                }).catch(err => {
                    if (err.resp && err.resp.statusCode === 403) logger.warn(`Can't send message in '#${msg.channel.name}' (${msg.channel.id}), cmd from user '${knife.formatUser(msg.author)}' (${msg.author.id})`);
                });
            } else {
                knife.createMessage(msg.channel.id, helpMsg).then(() => resolve()).catch(reject);
            }
        });
    }
}
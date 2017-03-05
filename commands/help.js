const Promise = require('bluebird');

exports.cmd = {
    description: 'Help command.',
    func(knife, msg, args) {
        return new Promise((resolve, reject) => {
            if (args.length === 0) {
                let embedTemplate = {title: `${knife.user.username} Help`, color: 2201331};
                let cmdFields = [];

                for (let cmd in knife.commands) {
                    let cmnd = knife.commands[cmd];
                    cmdFields.push({name: cmd, value: `${cmnd.usage ? `${cmnd.usage} - ` : ''}${cmnd.description}`});
                }

                if (msg.channel.guild) {
                    knife.createMessage(msg.channel.id, 'Sending the help message to your DMs').then(() => {
                        return knife.getDMChannel(msg.author.id);
                    }).then(dm => {
                        let fieldCollect = [];
                        let msgs = [];
                        for (let i in cmdFields) {
                            fieldCollect.push(cmdFields[i]);
                            if ((Number(i) % 24 === 0 && Number(i) !== 0) || Number(i) === cmdFields.length - 1) {
                                let embed = embedTemplate;
                                embed.fields = fieldCollect;
                                fieldCollect = [];
                                msgs.push(knife.createMessage(dm.id, {embed}));
                            }
                        }

                        return Promise.all(msgs);
                    }).then(() => resolve()).catch(reject);
                } else {
                    let fieldCollect = [];
                    let msgs = [];
                    for (let i in cmdFields) {
                        fieldCollect.push(cmdFields[i]);
                        if ((Number(i) % 24 === 0 && Number(i) !== 0) || Number(i) === cmdFields.length - 1) {
                            let embed = embedTemplate;
                            embed.fields = fieldCollect;
                            fieldCollect = [];
                            msgs.push(knife.createMessage(msg.channel.id, {embed}));
                        }
                    }

                    Promise.all(msgs).then(() => resolve()).catch(reject);
                }
            } else {
                if (!knife.commands[args[0]]) {
                    knife.createMessage(msg.channel.id, 'That command does not exist. Make sure to check your spelling.').then(() => resolve()).catch(reject);
                } else {
                    let cmd = knife.commands[args[0]];
                    let embed = {title: args[0], description: `${cmd.usage ? `\`${cmd.usage}\` - `: ''}**${cmd.description}**`, color: 2201331};
                    knife.createMessage(msg.channel.id, {embed}).then(() => resolve()).catch(reject);
                }
            }
        });
    }
};
const Promise = require('bluebird');

exports.cmd = {
    description: 'Cuts through someone and bans them',
    usage: '<user mention>',
    func: (knife, msg, args) => {
        return new Promise((resolve, reject) => {
            if (!msg.member.permission.has('banMembers')) {
                knife.createMessage(msg.channel.id, 'You need heat-proof gloves to handle me.\n**(You require the Ban Members permission)**').then(() => resolve()).catch(reject);
            } else {
                if (!msg.channel.guild.members.get(knife.user.id).permission.has('banMembers')) {
                    knife.createMessage(msg.channel.id, "I'm not hot enough to cut.\n**(I require the Ban Members permission)**").then(() => resolve()).catch(reject);
                } else {
                    if (msg.mentions.length > 0) {
                        if (msg.mentions[0].id !== knife.user.id && msg.mentions[0].id !== msg.author.id) {
                            knife.banGuildMember(msg.channel.guild.id, msg.mentions[0].id, 7).then(() => {
                                knife.createMessage(msg.channel.id, `Cut all the way through **${knife.formatUser(msg.mentions[0])}**!`)
                            }).catch(err => {
                                if (err.resp && err.resp.statusCode === 403) {
                                    knife.createMessage(msg.channel.id, `**${knife.formatUser(msg.mentions[0])}** is too tough for me and I was unable to be cut through.`).then(() => resolve()).catch(reject);
                                } else {
                                    reject(err);
                                }
                            });
                        } else if (msg.mentions[0].id === msg.author.id) {
                            knife.createMessage(msg.channel.id, "You can't cut yourself.").then(() => resolve()).catch(reject);
                        } else if (msg.mentions[0].id === knife.user.id) {
                            knife.createMessage(msg.channel.id, "You can't cut the knife with itself.").then(() => resolve()).catch(reject);
                        }
                    } else {
                        knife.createMessage(msg.channel.id, 'Please mention someone for me to cut through.').then(() => resolve()).catch(reject);
                    }
                }
            }
        });
    }
}
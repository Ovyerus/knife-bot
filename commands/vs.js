const Promise = require('bluebird');

exports.cmd = {
    description: 'Cuts through someone and bans them',
    usage: '<user mention>',
    func(knife, msg, args) {
        return new Promise((resolve, reject) => {
            if (!msg.member.permission.has('banMembers')) {
                knife.createMessage(msg.channel.id, 'You need heat-proof gloves to handle me.\n**(You require the Ban Members permission)**').then(() => resolve()).catch(reject);
            } else {
                if (!msg.channel.guild.members.get(knife.user.id).permission.has('banMembers')) {
                    knife.createMessage(msg.channel.id, "I'm not hot enough to cut.\n**(I require the Ban Members permission)**").then(() => resolve()).catch(reject);
                } else {
                    if (msg.mentionStrings.length > 0) {
                        let mentionedUser = knife.users.get(msg.mentionStrings[0]);
                        if (msg.mentionStrings[0] !== knife.user.id && msg.mentionStrings[0] !== msg.author.id) {
                            var userTopRolePos = msg.channel.guild.roles.get(msg.member.roles.sort((a, b) => {
                                return msg.channel.guild.roles.get(b).position - msg.channel.guild.roles.get(a).position;
                            })[0]);
                            userTopRolePos = userTopRolePos ? userTopRolePos.position : 0;

                            var mentionMember = msg.channel.guild.members.get(msg.mentionStrings[0]);
                            var mentionTopRolePos = msg.channel.guild.roles.get(mentionMember.roles.sort((a, b) => {
                                return msg.channel.guild.roles.get(b).position - msg.channel.guild.roles.get(a).position;
                            })[0]);
                            mentionTopRolePos = mentionTopRolePos ? mentionTopRolePos.position : 0;

                            if (msg.author.id === msg.channel.guild.ownerID || (userTopRolePos > mentionTopRolePos && userTopRolePos !== mentionTopRolePos)) {
                                knife.banGuildMember(msg.channel.guild.id, msg.mentionStrings[0], 7).then(() => {
                                    knife.createMessage(msg.channel.id, `Cut all the way through **${knife.formatUser(mentionedUser)}**!`)
                                }).catch(err => {
                                    if (err.resp && err.resp.statusCode === 403) {
                                        knife.createMessage(msg.channel.id, `**${knife.formatUser(mentionedUser)}** is too tough for me and I was unable to be cut through.`).then(() => resolve()).catch(reject);
                                    } else {
                                        reject(err);
                                    }
                                });
                            } else {
                                msg.channel.createMessage(`**${knife.formatUser(mentionMember)}** was wearing an anti-1000-degree-knife vest and you were unable to cut throw them.\n**(You cannot ban people ${userTopRolePos === mentionTopRolePos ? 'with the same role as you.' : 'higher then you'})**`).then(() => resolve()).catch(reject);
                            }
                        } else if (msg.mentionStrings[0] === msg.author.id) {
                            knife.createMessage(msg.channel.id, "You can't cut yourself.").then(() => resolve()).catch(reject);
                        } else if (msg.mentionStrings[0] === knife.user.id) {
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
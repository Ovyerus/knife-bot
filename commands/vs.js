const Promise = require('bluebird');

function banMember(knife, msg) {
    return new Promise((resolve, reject) => {
        let mentionedUser = knife.users.get(msg.mentionStrings[0]);
        if (msg.mentionStrings[0] !== knife.user.id && msg.mentionStrings[0] !== msg.author.id) {
            var userTopRolePos = msg.channel.guild.roles.get(msg.member.roles.sort((a, b) => {
                return msg.channel.guild.roles.get(b).position - msg.channel.guild.roles.get(a).position;
            })[0]);
            userTopRolePos = userTopRolePos ? userTopRolePos.position : 0;

            var mentionMember = msg.channel.guild.members.get(msg.mentionStrings[0]);
            if (!mentionMember) {
                knife.createMessage(msg.channel.id, 'That user does not seem to exist.').then(() => resolve()).catch(reject);
                return;
            }
            
            var mentionTopRolePos = msg.channel.guild.roles.get(mentionMember.roles.sort((a, b) => {
                return msg.channel.guild.roles.get(b).position - msg.channel.guild.roles.get(a).position;
            })[0]);
            mentionTopRolePos = mentionTopRolePos ? mentionTopRolePos.position : 0;

            if (msg.author.id === msg.channel.guild.ownerID || (userTopRolePos > mentionTopRolePos && userTopRolePos !== mentionTopRolePos)) {
                knife.banGuildMember(msg.channel.guild.id, msg.mentionStrings[0], 7).then(() => {
                    return knife.createMessage(msg.channel.id, `Cut all the way through **${knife.formatUser(mentionedUser)}**!`);
                }).then(() => resolve()).catch(err => {
                    if (err.resp && err.resp.statusCode === 403) {
                        knife.createMessage(msg.channel.id, `**${knife.formatUser(mentionedUser)}** is too tough for me and I was unable to be cut through.`).then(() => resolve()).catch(reject);
                    } else {
                        reject(err);
                    }
                });
            } else {
                knife.createMessage(msg.channel.id, `**${knife.formatUser(mentionMember)}** was wearing an anti-1000-degree-knife vest and you were unable to cut through them.\n**(You cannot ban people ${userTopRolePos === mentionTopRolePos ? 'with the same role as you.' : 'higher then you'})**`).then(() => resolve()).catch(reject);
            }
        } else if (msg.mentionStrings[0] === msg.author.id) {
            knife.createMessage(msg.channel.id, "You can't cut yourself.").then(() => resolve()).catch(reject);
        } else if (msg.mentionStrings[0] === knife.user.id) {
            knife.createMessage(msg.channel.id, "You can't cut the knife with itself.").then(() => resolve()).catch(reject);
        }
    });
}

exports.cmd = {
    description: 'Cuts through someone and bans them',
    usage: '<user mention|user ID>',
    func(knife, msg, args) {
        return new Promise((resolve, reject) => {
            if (!msg.member.permission.has('banMembers')) {
                knife.createMessage(msg.channel.id, 'You need heat-proof gloves to handle me.\n**(You require the Ban Members permission)**').then(() => resolve()).catch(reject);
            } else {
                if (!msg.channel.guild.members.get(knife.user.id).permission.has('banMembers')) {
                    knife.createMessage(msg.channel.id, "I'm not hot enough to cut.\n**(I require the Ban Members permission)**").then(() => resolve()).catch(reject);
                } else {
                    if (msg.mentionStrings.length > 0) {
                        banMember(knife, msg).then(() => resolve()).catch(reject);
                    } else if (/\d+/.test(args[0])) {
                        if (msg.channel.guild.members.get(args[0])) {
                            msg.mentionStrings.push(args[0]);
                            banMember(knife, msg).then(() => resolve()).catch(reject);
                        } else {
                            let tmpUser;
                            knife.rest.getRESTUser(args[0]).then(u => {
                                tmpUser = u;
                                return knife.banGuildMember(msg.channel.guild.id, u.id);
                            }).then(() => {
                                return knife.createMessage(msg.channel.id, `Cut all the way through **${knife.formatUser(tmpUser)}** from behind!`);
                            }).then(() => resolve()).catch(reject);
                        }
                    } else {
                        knife.createMessage(msg.channel.id, 'Please mention someone or give me an ID for me to cut through.').then(() => resolve()).catch(reject);
                    }
                }
            }
        });
    }
};
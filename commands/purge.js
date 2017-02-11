const Promise = require('bluebird');

function deleteDelay(msg) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            knife.deleteMessage(msg.channel.id, msg.id).then(() => resolve()).catch(reject);
        }, 2500);
    });
}

exports.cmd = {
    description: 'Delete messages in the current channel.',
    usage: '<type> [amount]',
    func(knife, msg, args) {
        return new Promise((resolve, reject) => {
            if (!msg.member.permission.has('manageMessages')) {
                knife.createMessage(msg.channel.id, "You don't have permission to clean up this chopping board.\n**(You require the Manage Messages permission.)**").then(() => resolve()).catch(reject);
            } else {
                if (!msg.channel.guild.members.get(knife.user.id).permission.has('manageMessages')) {
                    knife.createMessage(msg.channel.id, "I can't cleanup this chopping board.\n**(I require the Manage Messages permission.)**").then(() => resolve()).catch(reject);
                } else {
                    if (args.length === 0) {
                        knife.createMessage(msg.channel.id, {embed: {
                            title: 'Incorrect Usage',
                            description: '**purge all [0-250]**\n**purge author <author> [0-250]**\n**purge bots [0-250]**\n**purge including <word> [0-250]**\n**purge embeds [0-250]**\n**purge attachments [0-250]**\n**purge images [0-250]**\n**purge regex <regex> [0-250]**',
                            color: 0xF21904
                        }}).then(() => resolve()).catch(err => {
                            if (err.resp && err.resp.statusCode === 400) {
                                var m = '**Incorrect Usage**\n';
                                m += '`purge all [0-250]`\n';
                                m += '`purge author <author ID|author mention> [0-250]`\n';
                                m += '`purge bots [0-250]`\n';
                                m += '`purge including <word> [0-250]`\n';
                                m += '`purge embeds [0-250]`\n';
                                m += '`purge attachments [0-250]`\n';
                                m += '`purge images [0-250]`\n';
                                m += '`purge regex <regex> [0-250]`';
                                knife.createMessage(msg.channel.id, m).then(() => resolve()).catch(reject);
                            } else {
                                reject(err);
                            }
                        });
                    } else if (args.length > 0) {
                        if (args[0] === 'all') {
                            if (!args[1] || !/^\d+$/.test(args[1])) {
                                knife.purgeChannel(msg.channel.id, 250).then(amt => {
                                    return knife.createMessage(msg.channel.id, `Purged **${amt}** ${amt === 1 ? 'message' : 'messages'}.`);
                                }).then(deleteDelay).then(() => resolve()).catch(reject);
                            } else if (/^\d+$/.test(args[1]) && Number(args[1]) <= 250 && Number(args[1]) >= 1) {
                                knife.purgeChannel(msg.channel.id, Number(args[1])).then(amt => {
                                    return knife.createMessage(msg.channel.id, `Purged **${amt}** ${amt === 1 ? 'message' : 'messages'}.`);
                                }).then(deleteDelay).then(() => resolve()).catch(reject);
                            } else {
                                knife.createMessage(msg.channel.id, 'Woah there, way too spicy. I only accept numbers between `1` and `250`').then(() => resolve()).catch(reject);
                            }
                        } else if (args[0] === 'author') {
                            if (!args[1] || !/^(?:\d+|<@!?\d+>)$/.test(args[1])) {
                                knife.createMessage(msg.channel.id, {embed: {
                                    title: 'Incorrect Usage',
                                    description: '**purge author <author ID|author mention> [0-250]**',
                                    color: 0xF21904
                                }}).then(() => resolve()).catch(err => {
                                    if (err.resp && err.resp.statusCode === 400) {
                                        var m = '**Incorrect Usage**\n';
                                        m += '`purge author <author ID|author mention> [0-250]`';
                                        knife.createMessage(msg.channel.id, m).then(() => resolve()).catch(reject);
                                    } else {
                                        reject(err);
                                    }
                                });
                            } else {
                                let user = args[1].match(/^(?:\d+|<@!?\d+>)$/)[0];
                                user = /<@!?\d+>/.test(user) ? user.replace(/<@!?/, '').replace('>', '') : user;
                                user = msg.channel.guild.members.get(user);
                                if (!user) {
                                    knife.createMessage(msg.channel.id, 'That user could not be found.').then(() => resolve()).catch(reject);
                                } else {
                                    if (!args[2] || !/^\d+$/.test(args[2])) {
                                        knife.purgeChannel(msg.channel.id, 250, m => m.author.id === user.id).then(amt => {
                                            return knife.createMessage(msg.channel.id, `Purged **${amt}** ${amt === 1 ? 'message' : 'messages'} from **${knife.formatUser(user)}**.`);
                                        }).then(deleteDelay).then(() => resolve()).catch(reject);
                                    } else if (/^\d+$/.test(args[2]) && Number(args[2]) <= 250 && Number(args[2]) >= 1) {
                                        let i = 0;
                                        knife.purgeChannel(msg.channel.id, 250, m => m.author.id === user.id && ++i <= Number(args[2])).then(amt => {
                                            return knife.createMessage(msg.channel.id, `Purged **${amt}** ${amt === 1 ? 'message' : 'messages'} from **${knife.formatUser(user)}**.`);
                                        }).then(deleteDelay).then(() => resolve()).catch(reject);
                                    } else {
                                        knife.createMessage(msg.channel.id, 'Woah there, way too spicy. I only accept numbers between `1` and `250`').then(() => resolve()).catch(reject);
                                    }
                                }
                            }
                        } else if (args[0] === 'bots') {
                            if (!args[1] || !/^\d+$/.test(args[1])) {
                                knife.purgeChannel(msg.channel.id, 250, m => m.author.bot).then(amt => {
                                    return knife.createMessage(msg.channel.id, `Purged **${amt}** bot ${amt === 1 ? 'message' : 'messages'}.`);
                                }).then(deleteDelay).then(() => resolve()).catch(reject);
                            } else if (/^\d+$/.test(args[1]) && Number(args[1]) <= 250 && Number(args[1]) >= 1) {
                                let i = 0;
                                knife.purgeChannel(msg.channel.id, 250, m => m.author.bot && ++i <= Number(args[1])).then(amt => {
                                    return knife.createMessage(msg.channel.id, `Purged **${amt}** bot ${amt === 1 ? 'message' : 'messages'}.`);
                                }).then(deleteDelay).then(() => resolve()).catch(reject);
                            } else {
                                knife.createMessage(msg.channel.id, 'Woah there, way too spicy. I only accept numbers between `1` and `250`').then(() => resolve()).catch(reject);
                            }
                        } else if (args[0] === 'including') {
                            if (!args[1]) {
                                knife.createMessage(msg.channel.id, {embed: {
                                    title: 'Incorrect Usage',
                                    description: '**purge including <word> [0-250]**',
                                    color: 0xF21904
                                }}).then(() => resolve()).catch(err => {
                                    if (err.resp && err.resp.statusCode === 400) {
                                        var m = '**Incorrect Usage**\n';
                                        m += '`purge including <content> [0-250]`';
                                        knife.createMessage(msg.channel.id, m).then(() => resolve()).catch(reject);
                                    } else {
                                        reject(err);
                                    }
                                });
                            } else {
                                if (!args[2] || !/^\d+$/.test(args[2])) {
                                    knife.purgeChannel(msg.channel.id, 250, m => m.content.includes(args[1])).then(amt => {
                                        return knife.createMessage(msg.channel.id, `Purged **${amt}** ${amt === 1 ? 'message' : 'messages'}.`);
                                    }).then(deleteDelay).then(() => resolve()).catch(reject);
                                } else if (/^\d+$/.test(args[2]) && Number(args[2]) <= 250 && Number(args[2]) >= 1) {
                                    let i = 0;
                                    knife.purgeChannel(msg.channel.id, 250, m => m.content.includes(args[1]) && ++i <= Number(args[2])).then(amt => {
                                        return knife.createMessage(msg.channel.id, `Purged **${amt}** ${amt === 1 ? 'message' : 'messages'}.`);
                                    }).then(deleteDelay).then(() => resolve()).catch(reject);
                                } else {
                                    knife.createMessage(msg.channel.id, 'Woah there, way too spicy. I only accept numbers between `1` and `250`').then(() => resolve()).catch(reject);
                                }
                            }
                        } else if (args[0] === 'embeds') {
                            if (!args[1] || !/^\d+$/.test(args[1])) {
                                knife.purgeChannel(msg.channel.id, 250, m => m.embeds.length > 0).then(amt => {
                                    return knife.createMessage(msg.channel.id, `Purged **${amt}** ${amt === 1 ? 'embed' : 'embeds'}.`);
                                }).then(deleteDelay).then(() => resolve()).catch(reject);
                            } else if (/^\d+$/.test(args[1]) && Number(args[1]) <= 250 && Number(args[1]) >= 1) {
                                let i = 0;
                                knife.purgeChannel(msg.channel.id, 250, m => m.embeds.length > 0 && ++i <= Number(args[1])).then(amt => {
                                    return knife.createMessage(msg.channel.id, `Purged **${amt}** ${amt === 1 ? 'embed' : 'embeds'}.`);
                                }).then(deleteDelay).then(() => resolve()).catch(reject);
                            } else {
                                knife.createMessage(msg.channel.id, 'Woah there, way too spicy. I only accept numbers between `1` and `250`').then(() => resolve()).catch(reject);
                            }
                        } else if (args[0] === 'attachments') {
                            if (!args[1] || !/^\d+$/.test(args[1])) {
                                knife.purgeChannel(msg.channel.id, 250, m => m.attachments.length > 0).then(amt => {
                                    return knife.createMessage(msg.channel.id, `Purged **${amt}** ${amt === 1 ? 'attachment' : 'attachments'}.`);
                                }).then(deleteDelay).then(() => resolve()).catch(reject);
                            } else if (/^\d+$/.test(args[1]) && Number(args[1]) <= 250 && Number(args[1]) >= 1) {
                                let i = 0;
                                knife.purgeChannel(msg.channel.id, 250, m => m.attachments.length > 0 && ++i <= Number(args[1])).then(amt => {
                                    return knife.createMessage(msg.channel.id, `Purged **${amt}** ${amt === 1 ? 'attachment' : 'attachments'}.`);
                                }).then(deleteDelay).then(() => resolve()).catch(reject);
                            } else {
                                knife.createMessage(msg.channel.id, 'Woah there, way too spicy. I only accept numbers between `1` and `250`').then(() => resolve()).catch(reject);
                            }
                        } else if (args[0] === 'images') {
                            if (!args[1] || !/^\d+$/.test(args[1])) {
                                knife.purgeChannel(msg.channel.id, 250, m => {
                                    if (m.attachments.length > 0) {
                                        return m.attachments.filter(atch => /(?:([^:/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:png|jpe?g|gifv?|webp|bmp|tiff|jfif))(?:\?([^#]*))?(?:#(.*))?/ig.test(atch.url)).length > 0;
                                    } else {
                                        return /(?:([^:/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:png|jpe?g|gifv?|webp|bmp|tiff|jfif))(?:\?([^#]*))?(?:#(.*))?/ig.test(m.content);
                                    }
                                }).then(amt => {
                                    return knife.createMessage(msg.channel.id, `Purged **${amt}** ${amt === 1 ? 'image' : 'images'}.`);
                                }).then(deleteDelay).then(() => resolve()).catch(reject);
                            } else if (/^\d+$/.test(args[1]) && Number(args[1]) <= 250 && Number(args[1]) >= 1) {
                                let i = 0;
                                knife.purgeChannel(msg.channel.id, 250, m => {
                                    if (m.attachments.length > 0) {
                                        return m.attachments.filter(atch => /(?:([^:/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:png|jpe?g|gifv?|webp|bmp|tiff|jfif))(?:\?([^#]*))?(?:#(.*))?/ig.test(atch.url)).length > 0 && ++i <= Number(args[1]);
                                    } else {
                                        return /(?:([^:/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:png|jpe?g|gifv?|webp|bmp|tiff|jfif))(?:\?([^#]*))?(?:#(.*))?/ig.test(m.content) && ++i <= Number(args[1]);
                                    }
                                }).then(amt => {
                                    return knife.createMessage(msg.channel.id, `Purged **${amt}** ${amt === 1 ? 'image' : 'images'}.`);
                                }).then(deleteDelay).then(() => resolve()).catch(reject);
                            } else {
                                knife.createMessage(msg.channel.id, 'Woah there, way too spicy. I only accept numbers between `1` and `250`').then(() => resolve()).catch(reject);
                            }
                        } else if (args[0] === 'regex') {
                            if (!args[1]) {
                                knife.createMessage(msg.channel.id, {embed: {
                                    title: 'Incorrect Usage',
                                    description: '**purge regex <regex> [0-250]**',
                                    color: 0xF21904
                                }}).then(() => resolve()).catch(err => {
                                    if (err.resp && err.resp.statusCode === 400) {
                                        var m = '**Incorrect Usage**\n';
                                        m += '`purge regex <regex> [0-250]`';
                                        knife.createMessage(msg.channel.id, m).then(() => resolve()).catch(reject);
                                    } else {
                                        reject(err);
                                    }
                                });
                            } else {
                                var purgeRegex;
                                try {
                                    purgeRegex = new RegExp(args[1]);
                                } catch(err) {
                                    var m = 'Invalid Regex\n```js\n';
                                    m += `${err}\n`;
                                    m += '```';
                                    knife.createMessage(msg.channel.id, m).then(() => resolve()).catch(reject);
                                }

                                if (purgeRegex) {
                                    if (!args[2] || !/^\d+$/.test(args[2])) {
                                        knife.purgeChannel(msg.channel.id, 250, m => purgeRegex.test(m.content)).then(amt => {
                                            return knife.createMessage(msg.channel.id, `Purged **${amt}** ${amt === 1 ? 'message' : 'messages'}.`);
                                        }).then(deleteDelay).then(() => resolve()).catch(reject);
                                    } else if (/^\d+$/.test(args[2]) && Number(args[2]) <= 250 && Number(args[2]) >= 1) {
                                        let i = 0;
                                        knife.purgeChannel(msg.channel.id, 250, m => purgeRegex.test(m.content) && ++i <= Number(args[2])).then(amt => {
                                            knife.createMessage(msg.channel.id, `Purged **${amt}** ${amt === 1 ? 'message' : 'messages'}.`);
                                        }).then(deleteDelay).then(() => resolve()).catch(reject);
                                    } else {
                                        knife.createMessage(msg.channel.id, 'Woah there, way too spicy. I only accept numbers between `1` and `250`').then(() => resolve()).catch(reject);
                                    }
                                }
                            }
                        } else {
                            knife.createMessage(msg.channel.id, {embed: {
                                title: 'Incorrect Usage',
                                description: '**purge all [0-250]**\n**purge author <author> [0-250]**\n**purge bots [0-250]**\n**purge including <word> [0-250]**\n**purge embeds [0-250]**\n**purge attachments [0-250]**\n**purge images [0-250]**\n**purge regex <regex> [0-250]**',
                                color: 0xF21904
                            }}).then(() => resolve()).catch(err => {
                                if (err.resp && err.resp.statusCode === 400) {
                                    var m = '**Incorrect Usage**\n';
                                    m += '`purge all [0-250]`\n';
                                    m += '`purge author <author ID|author mention> [0-250]`\n';
                                    m += '`purge bots [0-250]`\n';
                                    m += '`purge including <word> [0-250]`\n';
                                    m += '`purge embeds [0-250]`\n';
                                    m += '`purge attachments [0-250]`\n';
                                    m += '`purge images [0-250]`\n';
                                    m += '`purge regex <regex> [0-250]`';
                                    knife.createMessage(msg.channel.id, m).then(() => resolve()).catch(reject);
                                } else {
                                    reject(err);
                                }
                            });
                        }
                    }
                }
            }
        });
    }
}
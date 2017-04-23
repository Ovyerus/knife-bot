const safe = require('safe-regex');

const IncorrectUse = 0xF21904;
const ImageRegex = /(?:([^:/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:png|jpe?g|gifv?|webp|bmp|tiff|jfif))(?:\?([^#]*))?(?:#(.*))?/gi;

exports.loadAsSubcommands = true;
exports.commands = [
    'all',
    'author',
    'bots',
    'including',
    'embeds',
    'codeblocks',
    'attachments',
    'images',
    'regex'
];

exports.main = {
    desc: 'Purge messages in a channel.',
    usage: '<type> [amount]',
    permissions: {both: 'manageMessages'},
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            let num = Number(ctx.args[0]);

            if (!isNaN(num) && num <= 100 && num >= 1) {
                exports.all.main(bot, ctx).then(resolve).catch(reject);
            } else  {
                ctx.createMessage({embed: {
                    title: 'Incorrect Usage',
                    description: '**purge [1-100]\n'
                    + 'purge all [1-100]\n'
                    + 'purge author <author> [1-100]\n'
                    + 'purge bots [1-100]\n'
                    + 'purge including <word(s)> [1-100]\n'
                    + 'purge embeds [1-100]\n'
                    + 'purge codeblocks [1-100]\n'
                    + 'purge attachments [1-100]\n'
                    + 'purge images [1-100]\n'
                    + 'purge regex <regex> [1-100]**',
                    color: IncorrectUse
                }}).then(resolve).catch(reject);
            }
        });
    }
};

exports.all = {
    desc: 'Purges all types of messages.',
    usage: '[1-100]',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            let num = Number(ctx.args[0]);

            if (isNaN(num)) {
                ctx.channel.purge(100).then(amt => {
                    return ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'}.`);
                }).then(deleteDelay).then(resolve).catch(reject);
            } else if (num <= 100 && num >= 1) {
                ctx.channel.purge(num).then(amt => {
                    return ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'}.`);
                }).then(resolve).catch(reject);
            } else {
                tooSpicy(ctx).then(resolve).catch(reject);
            }
        });
    }
};

exports.author = {
    desc: 'Purges all messages from a specific user.',
    usage: '<author ID|author mention>',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            if (!ctx.args[0] || !/^(?:\d+|<@!?\d+>)$/.test(ctx.args[0])) {
                ctx.createMessage({embed: {
                    title: 'Incorrect Usage',
                    description: '**purge author <author ID|author mention> [1-100]**',
                    color: IncorrectUse
                }}).then(resolve).catch(reject);
            } else {
                let user = ctx.args[0].match(/^(?:\d+|<@!?\d+>)$/)[0];
                user = /<@!?\d+>/.test(user) ? user.replace(/<@!?/, '').replace('>', '') : user;
                user = ctx.guild.members.get(user);
                
                if (!user) {
                    ctx.createMessage('That user could not be found.').then(resolve).catch(reject);
                } else {
                    let num = Number(ctx.args[1]);

                    if (isNaN(num)) {
                        ctx.channel.purge(100, m => m.author.id === user.id).then(amt => {
                            return ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'} from **${bot.formatUser(user)}**.`);
                        }).then(deleteDelay).then(resolve).catch(reject);
                    } else if (num <= 100 && num >= 1) {
                        let i = 0;
                        ctx.channel.purge(100, m => m.author.id === user.id && ++i <= num).then(amt => {
                            return ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'} from **${bot.formatUser(user)}**.`);
                        }).then(deleteDelay).then(resolve).catch(reject);
                    } else {
                        tooSpicy(ctx).then(resolve).catch(reject);
                    }
                }
            }
        });
    }
};

exports.bots = {
    desc: 'Purges all messages from bots.',
    usage: '[1-100]',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            let num = Number(ctx.args[0]);

            if (isNaN(num)) {
                ctx.channel.purge(100, m => m.author.bot).then(amt => {
                    return ctx.createMessage(`Purged **${amt}** bot message${amt === 1 ? '' : 's'}.`);
                }).then(deleteDelay).then(resolve).catch(reject);
            } else if (num <= 100 && num >= 100) {
                let i = 0;
                ctx.channel.purge(100, m => m.author.bot && ++i <= num).then(amt => {
                    return ctx.createMessage(`Purged **${amt}** bot message${amt === 1 ? '' : 's'}.`);
                }).then(deleteDelay).then(resolve).catch(reject);
            } else {
                tooSpicy(ctx).then(resolve).catch(reject);
            }
        });
    }
};

exports.including = {
    desc: 'Purges all messages including a specific word or phrase.',
    usage: '<content> [1-100]',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            if (!ctx.args[0]) {
                ctx.createMessage({embed: {
                    title: 'Incorrect Usage',
                    description: '**purge including <word(s)> [1-100]**',
                    color: IncorrectUse
                }}).then(resolve).catch(reject);
            } else {
                let num = Number(ctx.args[1]);
                let inc = ctx.args[0];

                if (isNaN(num)) {
                    ctx.channel.purge(100, m => m.content.includes(inc)).then(amt => {
                        return ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'}.`);
                    }).then(deleteDelay).then(resolve).catch(reject);
                } else if (num <= 100 && num >= 1) {
                    let i = 0;
                    ctx.channel.purge(100, m => m.content.includes(inc) && ++i <= num).then(amt => {
                        return ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'}.`);
                    }).then(deleteDelay).then(resolve).catch(reject);
                } else {
                    tooSpicy(ctx).then(resolve).catch(reject);
                }
            }
        });
    }
};

exports.embeds = {
    desc: 'Purge all messages containing an embed.',
    usage: '[1-100]',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            let num = Number(ctx.args[0]);

            if (isNaN(num)) {
                ctx.channel.purge(100, m => m.embeds.length > 0).then(amt => {
                    return ctx.createMessage(`Purged **${amt}** embed${amt === 1 ? '' : 's'}.`);
                }).then(deleteDelay).then(resolve).catch(reject);
            } else if (num <= 100 && num >= 1) {
                let i = 0;
                ctx.channel.purge(100, m => m.embeds.length > 0 && ++i <= num).then(amt => {
                    return ctx.createMessage(`Purged **${amt}** embed${amt === 1 ? '' : 's'}.`);
                }).then(deleteDelay).then(resolve).catch(reject);
            } else {
                tooSpicy(ctx).then(resolve).catch(reject);
            }
        });
    }
};

exports.codeblocks = {
    desc: 'Purge messages containing a codeblock.',
    usage: '[1-100]',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            let num = Number(ctx.args[0]);

            if (isNaN(num)) {
                ctx.channel.purge(100, codeblockFilter).then(amt => {
                    return ctx.createMessage(`Purged **${amt}** codeblock${amt === 1 ? '' : 's'}.`);
                }).then(deleteDelay).then(resolve).catch(reject);
            } else if (num <= 100 && num >= 1) {
                let i = 0;
                ctx.channel.purge(100, m => codeblockFilter(m) && ++i <= num).then(amt => {
                    return ctx.createMessage(`Purged **${amt}** codeblock${amt === 1 ? '' : 's'}.`);
                }).then(deleteDelay).then(resolve).catch(reject);
            } else {
                tooSpicy(ctx).then(resolve).catch(reject);
            }
        });
    }
};

exports.attachments = {
    desc: 'Purge messages with attachments.',
    usage: '[1-100]',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            let num = Number(ctx.args[0]);

            if (isNaN(num)) {
                ctx.channel.purge(100, m => m.attachments.length > 0).then(amt => {
                    return ctx.createMessage(`Purged **${amt}** attachment${amt === 1 ? '' : 's'}.`);
                }).then(deleteDelay).then(resolve).catch(reject);
            } else if (num <= 100 && num >= 1) {
                let i = 0;
                ctx.channel.purge(100, m => m.attachments.length > 0 && ++i <= num).then(amt => {
                    return ctx.createMessage(`Purged **${amt}** attachment${amt === 1 ? '' : 's'}.`);
                }).then(deleteDelay).then(resolve).catch(reject);
            } else {
                tooSpicy(ctx).then(resolve).catch(reject);
            }
        });
    }
};

exports.images = {
    desc: 'Purge messages containing an image.',
    usage: '[1-100]',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            let num = Number(ctx.args[0]);

            if (isNaN(num)) {
                ctx.channel.purge(100, imageFilter).then(amt => {
                    return ctx.createMessage(`Purged **${amt}** image${amt === 1 ? '' : 's'}.`);
                }).then(deleteDelay).then(resolve).catch(reject);
            } else if (num <= 100 && num >= 1) {
                let i = 0;
                ctx.channel.purge(100, m => imageFilter(m) && ++i <= num).then(amt => {
                    return ctx.createMessage(`Purged **${amt}** image${amt === 1 ? '' : 's'}.`);
                }).then(deleteDelay).then(resolve).catch(reject);
            } else {
                tooSpicy(ctx).then(resolve).catch(reject);
            }
        });
    }
};

exports.regex = {
    desc: 'Purge messages that match a regex.',
    usage: '<regex> [1-100]',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            if (!ctx.args[0]) {
                ctx.createMessage({embed: {
                    title: 'Incorrect Usage',
                    description: '**purge regex <regex> [1-100]**'
                }}).then(resolve).catch(reject);
            } else {
                let purgeRegex;
                if (safe(ctx.args[0])) purgeRegex = new RegExp(ctx.args[0], 'i');
                else ctx.createMessage('Invalid or unsafe regex.').then(resolve).catch(reject);

                if (purgeRegex) {
                    let num = Number(ctx.args[1]);

                    if (isNaN(num)) {
                        ctx.channel.purge(100, m => purgeRegex.test(m.content)).then(amt => {
                            return ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'}.`);
                        }).then(deleteDelay).then(resolve).catch(reject);
                    } else if (num <= 100 && num >= 1) {
                        let i = 0;
                        ctx.channel.purge(100, m => purgeRegex.test(m.content) && ++i <= num).then(amt => {
                            return ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'}.`);
                        }).then(deleteDelay).then(resolve).catch(reject);
                    } else {
                        tooSpicy(ctx).then(resolve).catch(reject);
                    }
                }
            }
        });
    }
};

function deleteDelay(msg) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            msg.delete().then(resolve).catch(reject);
        }, 1000);
    });
}

function tooSpicy(ctx) {
    return new Promise((resolve, reject) => {
        ctx.createMessage('Woah there, way too spicy. I only accept numbers between `1` and `100`').then(resolve).catch(reject);
    });
}

function codeblockFilter(msg) {
    let split = msg.content.split('```');
    if (split.length >= 3) return true;
    return false;
}

function imageFilter(msg) {
    if (msg.attachments.length > 0) {
        return msg.attachments.filter(atch => ImageRegex.test(atch.url)).length > 0;
    } else {
        return ImageRegex.test(msg.content);
    }
}
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
    aliases: ['prune'],
    permissions: {both: 'manageMessages'},
    async main(bot, ctx) {
        let num = Number(ctx.args[0]);

        if (!isNaN(num) && num <= 100 && num >= 1) {
            await exports.all.main(bot, ctx);
        } else  {
            await ctx.createMessage({embed: {
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
            }});
        }
    }
};

exports.all = {
    desc: 'Purges all types of messages.',
    usage: '[1-100]',
    async main(bot, ctx) {
        let num = Number(ctx.args[0]);

        if (isNaN(num)) {
            let amt = await ctx.channel.purge(100);
            let m = await ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'}.`);
            await deleteDelay(m);
        } else if (num <= 100 && num >= 1) {
            let amt = await ctx.channel.purge(num);
            let m = await ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'}.`);
            await deleteDelay(m);
        } else {
            await tooSpicy(ctx);
        }
    }
};

exports.author = {
    desc: 'Purges all messages from a specific user.',
    usage: '<author ID|author mention> [1-100]',
    async main(bot, ctx) {
        if (!ctx.args[0]) {
            await ctx.createMessage({embed: {
                title: 'Incorrect Usage',
                description: '**purge author <author ID|author mention> [1-100]**',
                color: IncorrectUse
            }});
        } else {
            let user = await bot.lookups.memberLookup(ctx, ctx.args[0], false);
                
            if (!user) {
                await ctx.createMessage('That user could not be found.');
            } else {
                let num = Number(ctx.args[1]);

                if (isNaN(num)) {
                    let amt = await ctx.channel.purge(100, m => m.author.id === user.id);
                    let m = await  ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'} from **${bot.formatUser(user)}**.`);
                    await deleteDelay(m);
                } else if (num <= 100 && num >= 1) {
                    let i = 0;
                    let amt = await ctx.channel.purge(100, m => m.author.id === user.id && ++i <= num);
                    let m = await ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'} from **${bot.formatUser(user)}**.`);
                    await deleteDelay(m);
                } else {
                    await tooSpicy(ctx);
                }
            }
        }
    }
};

exports.bots = {
    desc: 'Purges all messages from bots.',
    usage: '[1-100]',
    async main(bot, ctx) {
        let num = Number(ctx.args[0]);

        if (isNaN(num)) {
            let amt = await ctx.channel.purge(100, m => m.author.bot);
            let m = await ctx.createMessage(`Purged **${amt}** bot message${amt === 1 ? '' : 's'}.`);
            await deleteDelay(m);
        } else if (num <= 100 && num >= 100) {
            let i = 0;
            let amt = await ctx.channel.purge(100, m => m.author.bot && ++i <= num);
            let m = await ctx.createMessage(`Purged **${amt}** bot message${amt === 1 ? '' : 's'}.`);
            await deleteDelay(m);
        } else {
            await tooSpicy(ctx);
        }
    }
};

exports.including = {
    desc: 'Purges all messages including a specific word or phrase.',
    usage: '<content> [1-100]',
    async main(bot, ctx) {
        if (!ctx.args[0]) {
            await ctx.createMessage({embed: {
                title: 'Incorrect Usage',
                description: '**purge including <word(s)> [1-100]**',
                color: IncorrectUse
            }});
        } else {
            let num = Number(ctx.args[1]);
            let inc = ctx.args[0];

            if (isNaN(num)) {
                let amt = await ctx.channel.purge(100, m => m.content.toLowerCase().includes(inc.toLowerCase()));
                let m = await ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'}.`);
                await deleteDelay(m);
            } else if (num <= 100 && num >= 1) {
                let i = 0;
                let amt = await ctx.channel.purge(100, m => m.content.toLowerCase().includes(inc.toLowerCase()) && ++i <= num);
                let m = await ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'}.`);
                await deleteDelay(m);
            } else {
                await tooSpicy(ctx);
            }
        }
    }
};

exports.embeds = {
    desc: 'Purge all messages containing an embed.',
    usage: '[1-100]',
    async main(bot, ctx) {
        let num = Number(ctx.args[0]);

        if (isNaN(num)) {
            let amt = await ctx.channel.purge(100, m => m.embeds.length > 0);
            let m = await ctx.createMessage(`Purged **${amt}** embed${amt === 1 ? '' : 's'}.`);
            await deleteDelay(m);
        } else if (num <= 100 && num >= 1) {
            let i = 0;
            let amt = await ctx.channel.purge(100, m => m.embeds.length > 0 && ++i <= num);
            let m = await ctx.createMessage(`Purged **${amt}** embed${amt === 1 ? '' : 's'}.`);
            await deleteDelay(m);
        } else {
            await tooSpicy(ctx);
        }
    }
};

exports.codeblocks = {
    desc: 'Purge messages containing a codeblock.',
    usage: '[1-100]',
    async main(bot, ctx) {
        let num = Number(ctx.args[0]);

        if (isNaN(num)) {
            let amt = await ctx.channel.purge(100, codeblockFilter);
            let m = await ctx.createMessage(`Purged **${amt}** codeblock${amt === 1 ? '' : 's'}.`);
            await deleteDelay(m);
        } else if (num <= 100 && num >= 1) {
            let i = 0;
            let amt = await ctx.channel.purge(100, m => codeblockFilter(m) && ++i <= num);
            let m = await ctx.createMessage(`Purged **${amt}** codeblock${amt === 1 ? '' : 's'}.`);
            await deleteDelay(m);
        } else {
            await tooSpicy(ctx);
        }
    }
};

exports.attachments = {
    desc: 'Purge messages with attachments.',
    usage: '[1-100]',
    async main(bot, ctx) {
        let num = Number(ctx.args[0]);

        if (isNaN(num)) {
            let amt = await ctx.channel.purge(100, m => m.attachments.length > 0);
            let m = await  ctx.createMessage(`Purged **${amt}** attachment${amt === 1 ? '' : 's'}.`);
            await deleteDelay(m);
        } else if (num <= 100 && num >= 1) {
            let i = 0;
            let amt = await ctx.channel.purge(100, m => m.attachments.length > 0 && ++i <= num);
            let m =  ctx.createMessage(`Purged **${amt}** attachment${amt === 1 ? '' : 's'}.`);
            await deleteDelay(m);
        } else {
            await tooSpicy(ctx);
        }
    }
};

exports.images = {
    desc: 'Purge messages containing an image.',
    usage: '[1-100]',
    async main(bot, ctx) {
        let num = Number(ctx.args[0]);

        if (isNaN(num)) {
            let amt = await ctx.channel.purge(100, imageFilter);
            let m = ctx.createMessage(`Purged **${amt}** image${amt === 1 ? '' : 's'}.`);
            await deleteDelay(m);
        } else if (num <= 100 && num >= 1) {
            let i = 0;
            let amt = await ctx.channel.purge(100, m => imageFilter(m) && ++i <= num);
            let m = await ctx.createMessage(`Purged **${amt}** image${amt === 1 ? '' : 's'}.`);
            await deleteDelay(m);
        } else {
            await tooSpicy(ctx);
        }
    }
};

exports.regex = {
    desc: 'Purge messages that match a regex.',
    usage: '<regex> [1-100]',
    async main(bot, ctx) {
        if (!ctx.args[0]) {
            await ctx.createMessage({embed: {
                title: 'Incorrect Usage',
                description: '**purge regex <regex> [1-100]**'
            }});
        } else {
            let purgeRegex;
            if (safe(ctx.args[0])) purgeRegex = new RegExp(ctx.args[0], 'mi');
            else return await ctx.createMessage('Invalid or unsafe regex.');

            if (purgeRegex) {
                let num = Number(ctx.args[1]);

                if (isNaN(num)) {
                    let amt = await ctx.channel.purge(100, m => purgeRegex.test(m.content));
                    let m = await ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'}.`);
                    await deleteDelay(m);
                } else if (num <= 100 && num >= 1) {
                    let i = 0;
                    let amt = await ctx.channel.purge(100, m => purgeRegex.test(m.content) && ++i <= num);
                    let m = await ctx.createMessage(`Purged **${amt}** message${amt === 1 ? '' : 's'}.`);
                    await deleteDelay(m);
                } else {
                    await tooSpicy(ctx);
                }
            }
        }
    }
};

function deleteDelay(msg) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            msg.delete().then(resolve).catch(reject);
        }, 1000);
    });
}

async function tooSpicy(ctx) {
    await ctx.createMessage('Woah there, way too spicy. I only accept numbers between `1` and `100`');
}

function codeblockFilter(msg) {
    let split = msg.content.split('```');
    if (split.length >= 3) return true;
    return false;
}

function imageFilter(msg) {
    if (msg.attachments.length > 0) {
        return msg.attachments.filter(atch => ImageRegex.test(atch.url)).length > 0;
    } else if (msg.embeds.length > 0) {
        return msg.embeds.filter(e => e.type === 'embed').length > 0;
    } else {
        return ImageRegex.test(msg.content);
    }
}
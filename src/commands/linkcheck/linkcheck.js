const {getLinkRedirects} = require(`${__baseDir}/modules/helpers`);

exports.commands = ['linkcheck'];

exports.linkcheck = {
    desc: 'Checks all the redirects for a link, if any.',
    usage: '<link>',
    aliases: ['checklink', 'check'],
    allowDM: true,
    async main(bot, ctx) {
        if (!ctx.raw) return await ctx.createMessage('Please give me a link to check.');

        let link = ctx.raw.replace(/^<(.*)>$/, '$1');
        let links;

        await ctx.channel.sendTyping();

        try {
            links = await getLinkRedirects(link);
        } catch(err) {
            return await ctx.createMessage(`Error checking link: \`${err.message}\``);
        }

        await ctx.createMessage(`\`\`\`Redirects for "${link}"\n\n${links.join('\n') || 'No redirects'}\`\`\``);
    }
};
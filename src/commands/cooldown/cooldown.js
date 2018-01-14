exports.commands = ['cooldown'];

exports.cooldown = {
    desc: 'Clean up  and shutdown the bot.',
    owner: true,
    async main(bot, ctx) {
        let msg;

        await ctx.createMessage('Are you sure you want to turn off the blowtorches? [y/N]');

        try {
            msg = await bot.awaitMessage(ctx.channel.id, ctx.author.id);
        } catch(err) {
            return await ctx.createMessage('Message await expired.');
        }

        if (/^y(?:es)?$/i.test(msg.content)) {
            await ctx.createMessage('Turning off the blowtorches...');
            bot.disconnect({reconnect: false});
            bot.logger.info('Restarting/exiting process...');
            process.exit(0);
        } else if (/^no?$/i.test(msg.content)) await ctx.createMessage('Keeping the blowtorches running.');
        else await ctx.createMessage('Invalid option. Keeping the blowtorches running.');
    }
};
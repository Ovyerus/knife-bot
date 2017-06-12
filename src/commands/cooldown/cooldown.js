const {AwaitTimeout} = require(`${__baseDir}/modules/helpers`);

exports.commands = ['cooldown'];

exports.cooldown = {
    desc: 'Clean up  and shutdown the bot.',
    owner: true,
    async main(bot, ctx) {
        await ctx.createMessage('Are you sure you want to turn off the blowtorches? [y/N]');

        try {
            let msg = await bot.awaitMessage(ctx.channel.id, ctx.author.id);

            if (/^y(?:es)?$/i.test(msg.content)) {
                await ctx.createMessage('Turning off the blowtorches...');
                bot.disconnect({reconnect: false});
                bot.db.getPoolMaster().drain();
                logger.info('Restarting/exiting process...');
                process.exit();
            } else if (/^no?$/i.test(msg.content)) {
                await ctx.createMessage('Keeping the blowtorches running.');
            } else {
                await ctx.createMessage('Invalid option. Keeping the blowtorches running.');
            }
        } catch(err) {
            if (err instanceof AwaitTimeout) {
                await ctx.createMessage('Message await expired.');
            } else {
                throw err;
            }
        }
    }
};
exports.commands = ['cooldown'];

exports.cooldown = {
    desc: 'Clean up  and shutdown the bot.',
    owner: true,
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            ctx.createMessage('Are you sure you want to turn off the blowtorches? [y/N]?').then(() => {
                return bot.awaitMessage(ctx.channel.id, ctx.author.id);
            }).then(m => {
                if (/^y(?:es)?$/i.test(m.content)) return ctx.createMessage('Turning off the blowtorches...');
                if (/^no?$/i.test(m.content)) return ctx.createMessage('Keeping the blowtorches running.');
                return ctx.createMessage('That is not a valid option. Keeping the blowtorches running.');
            }).then(res => {
                if (res.content === 'Turning off the blowtorches...') {
                    bot.db.getPoolMaster().drain();
                    logger.info('Restarting/exiting process...');
                    process.exit();
                }

                return null;
            }).then(resolve).catch(reject);
        });
    }
};
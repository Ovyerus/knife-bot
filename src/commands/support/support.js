exports.commands = ['support'];

exports.support = {
    desc: 'Sends a link to the official support server.',
    main(bot, ctx) {
        return ctx.createMessage('If you need help with anything relating to the bot, join the support server.\nhttps://discord.gg/G9nUSZt');
    }
};
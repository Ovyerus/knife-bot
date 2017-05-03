exports.commands = ['ping'];

exports.ping = {
    desc: 'Ping!',
    main(bot, ctx) {
        return ctx.createMessage('IT BURNS').then(m => {
            return m.edit(`Cut through the message in \`${m.timestamp - ctx.timestamp}ms\``);
        });
    }
};

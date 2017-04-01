exports.commands = [
    'ping'
];

exports.ping = {
    desc: 'Ping!',
    fullDesc: "Ping the bot and check it's latency.",
    permission: {node: 'general.ping'},
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            ctx.createMessage('IT BURNS').then(m => {
                return m.edit(`Cut through the message in \`${m.timestamp - ctx.timestamp}ms\``);
            }).then(resolve).catch(reject);
        });
    }
};
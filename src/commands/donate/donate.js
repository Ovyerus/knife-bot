exports.commands = ['donate'];

exports.donate = {
    desc: 'Sends links for donating to the bot author.',
    allowDM: true,
    main(bot, ctx) {
        return ctx.createMessage('If you wish to donate to Ovyerus to help support the bot, you can send a one-time payment via PayPal: https://paypal.me/ovyerus');
    }
};
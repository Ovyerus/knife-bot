exports.commands = ['invite'];

exports.invite = {
    desc: 'Invite me to your server.',
    allowDM: true,
    main(bot, ctx) {
        return ctx.createMessage(`**Invite me to your server**: https://knife.ovyerus.me/invite`);
    }
};

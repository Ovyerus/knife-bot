exports.commands = ['invite'];

exports.invite = {
    desc: 'Invite me to your server.',
    main(bot, ctx) {
        return ctx.createMessage(`**OAuth Invite URL (Recommended Permissions):** <https://discordapp.com/oauth2/authorize?client_id=${bot.user.id}&scope=bot&permissions=470150215>\n`
        + '**Support Server:** https://discord.gg/hD8xZMG');
    }
};

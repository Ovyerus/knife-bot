exports.commands = ['invite'];

exports.invite = {
    desc: 'Invite me to your server.',
    permission: {node: 'general.invite'},
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            ctx.createMessage(`**OAuth Invite URL (Recommended Permissions):** https://discordapp.com/oauth2/authorize?client_id=${bot.user.id}&scope=bot&permissions=201714790\n**Support Server:** https://discord.gg/hD8xZMG`).then(resolve).catch(reject);
        });
    }
};
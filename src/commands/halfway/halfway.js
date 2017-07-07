exports.commands = ['halfway'];

exports.halfway = {
    desc: 'Slice through someone halfway, allowing them to come back.',
    usage: '<user mention|user id>',
    aliases: ['softban'],
    permissions: {both: 'banMembers'},
    async main(bot, ctx) {
        if (!ctx.raw) return await ctx.createMessage('Please give me a user to cut through.');

        let user = await bot.lookups.memberLookup(ctx, ctx.raw, false);

        if (!user && !isNaN(ctx.raw)) {
            try {
                user = await bot.rest.getRESTUser(ctx.raw);
            } catch(e) {
                return await ctx.createMessage('User not found.');
            }
        }

        await softBanMember(user, ctx);
    }
};

async function softBanMember(user, ctx) {
    if (user.id !== ctx.client.user.id && user.id !== ctx.author.id) {
        let userTopRolePos = ctx.guild.roles.get(ctx.member.roles.sort((a, b) => {
            return ctx.guild.roles.get(b).position - ctx.guild.roles.get(a).position;
        })[0]);
        userTopRolePos = userTopRolePos ? userTopRolePos.position : 0;

        let mentionTopRolePos = ctx.guild.roles.get(user.roles.sort((a, b) => {
            return ctx.guild.roles.get(b).position - ctx.guild.roles.get(a).position;
        })[0]);
        mentionTopRolePos = mentionTopRolePos ? mentionTopRolePos.position : 0;

        if (ctx.author.id === ctx.guild.ownerID || (userTopRolePos > mentionTopRolePos && userTopRolePos !== mentionTopRolePos)) {
            try {
                await ctx.guild.banMember(user.id, 7, ctx.client.formatUser(ctx.author));
                await ctx.guild.unbanMember(user.id, ctx.client.formatUser(ctx.author));
                await ctx.createMessage(`Cut halfway through **${ctx.client.formatUser(user)}**!`);
            } catch(err) {
                if (err.resp && err.resp.statusCode === 403) {
                    return await ctx.createMessage(`**${ctx.client.formatUser(user)}** is too tough for me and I was unable to be cut through.`);
                } else {
                    throw err;
                }
            }
        } else {
            await ctx.createMessage(`**${ctx.client.formatUser(user)}** was wearing an anti-1000-degree-knife vest and you were unable to cut through them.\n`
            + `**(You cannot ban people ${userTopRolePos === mentionTopRolePos ? 'with the same role as you.' : 'higher then you'})**`);
        }
    } else if (user.id === ctx.author.id) {
        await ctx.createMessage("You can't cut yourself.");
    } else if (user.id === ctx.client.user.id) {
        await ctx.createMessage("You can't cut the knife with itself.");
    }
}

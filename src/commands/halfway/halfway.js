exports.commands = ['halfway'];

exports.halfway = {
    desc: 'Slice through someone halfway, allowing them to come back.',
    usage: '<user> [for <reason>]',
    aliases: ['softban'],
    permissions: {both: 'banMembers'},
    async main(bot, ctx) {
        if (!ctx.raw) return await ctx.createMessage('Please give me a user to cut through.');

        let user = await bot.lookups.memberLookup(ctx, ctx.raw.split(' for')[0], false);

        if (!user && !isNaN(ctx.raw)) {
            try {
                user = await bot.rest.getRESTUser(ctx.raw);
            } catch(e) {
                return await ctx.createMessage('User not found.');
            }
        } else if (!user) {
            return await ctx.createMessage('User not found.');
        }

        await softBanMember(user, ctx);

        if (ctx.raw.split(' for').length > 1 && !ctx.guild.members.map(m => m.id).includes(user.id)) {
            bot.emit('log', {
                user,
                action: 2,
                reason: ctx.raw.split(' for').slice(1).join(' for').trim(),
                settings: ctx.settings,
                guild: ctx.guild,
                blame: ctx.member
            });
        }
    }
};

async function softBanMember(user, ctx) {
    if (user.id !== ctx.client.user.id && user.id !== ctx.author.id) {
        let userTopRolePos = ctx.member.roles.map(r => ctx.guild.roles.get(r)).sort((a, b) => a.position - b.position)[0];
        userTopRolePos = userTopRolePos ? userTopRolePos.position : 0;

        let mentionTopRolePos = user.roles.map(r => ctx.guild.roles.get(r)).sort((a, b) => a.position - b.position)[0]
        mentionTopRolePos = mentionTopRolePos ? mentionTopRolePos.position : 0;

        if (ctx.author.id !== ctx.guild.ownerID && userTopRolePos <= mentionTopRolePos) {
            return await ctx.createMessage(`**${ctx.client.formatUser(user)}** was wearing an anti-1000-degree-knife vest and you were unable to cut through them.\n`
            + `**(You cannot ban people ${userTopRolePos === mentionTopRolePos ? 'with the same role as you.' : 'higher then you'})**`);
        }

        try {
            if (ctx.raw.split(' for').length === 1) {
                let m = encodeURIComponent(ctx.client.formatUser(ctx.author));

                await ctx.guild.banMember(user.id, 7, m);
                await ctx.guild.unbanMember(user.id, m);
            } else {
                let m = encodeURIComponent(`${ctx.client.formatUser(ctx.author)}: ${ctx.raw.split(' for').slice(1).join(' for').trim()}`);

                await ctx.guild.banMember(user.id, 7, m);
                await ctx.guild.unbanMember(user.id, m);
            }

            return await ctx.createMessage(`Cut halfway through **${ctx.client.formatUser(user)}**!`);
        } catch(err) {
            if (err.resp && err.resp.statusCode === 403) {
                return await ctx.createMessage(`**${ctx.client.formatUser(user)}** is too tough for me and I was unable to be cut through.`);
            } else throw err;
        }
    } else if (user.id === ctx.author.id) await ctx.createMessage("You can't cut yourself.");
    else await ctx.createMessage("You can't cut the knife with itself.");
}

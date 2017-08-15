exports.commands = ['butt'];

exports.butt = {
    desc: 'Hit someone with the butt of your knife, removing them from the server.',
    usage: '<user> [for <reason>]',
    aliases: ['kick'],
    permissions: {both: 'kickMembers'},
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

        await kickMember(user, ctx);

        if (ctx.raw.split(' for').length > 1 && !ctx.guild.members.map(m => m.id).includes(user.id)) {
            bot.emit('log', {
                user,
                action: 0,
                reason: ctx.raw.split(' for').slice(1).join(' for').trim(),
                settings: ctx.settings,
                guild: ctx.guild,
                blame: ctx.member
            });
        }
    }
};

async function kickMember(user, ctx) {
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
                if (ctx.raw.split(' for').length === 1) {
                    await ctx.guild.kickMember(user.id, encodeURIComponent(ctx.client.formatUser(ctx.author)));
                } else {
                    await ctx.guild.kickMember(user.id, encodeURIComponent(`${ctx.client.formatUser(ctx.author)}: ${ctx.raw.split(' for').slice(1).join(' for').trim()}`));
                }

                await ctx.createMessage(`Butted **${ctx.client.formatUser(user)}** out of the kitchen!`);
            } catch(err) {
                if (err.resp && err.resp.statusCode === 403) {
                    return await ctx.createMessage(`**${ctx.client.formatUser(user)}** is too tough for me and I was unable to be butt them.`);
                } else {
                    throw err;
                }
            }
        } else {
            await ctx.createMessage(`**${ctx.client.formatUser(user)}** is too strong and you weren't able to knock them over.\n`
            + `**(You cannot kick people ${userTopRolePos === mentionTopRolePos ? 'with the same role as you.' : 'higher then you'})**`);
        }
    } else if (user.id === ctx.author.id) {
        await ctx.createMessage("You can't hit yourself.");
    } else if (user.id === ctx.client.user.id) {
        await ctx.createMessage("You can't hit the knife with itself.");
    }
}
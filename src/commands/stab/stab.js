const DiscordHTTPError = require('eris/lib/errors/DiscordHTTPError');

exports.commands = ['stab'];

exports.stab = {
    desc: 'Stabs someone, removing them from the server.',
    usage: '<user> [for <reason>]',
    aliases: ['kick'],
    permissions: {both: 'kickMembers'},
    async main(bot, ctx) {
        if (!ctx.raw) return await ctx.createMessage('Please give me a user to stab.');

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
        let userTopRolePos = ctx.member.roles.map(r => ctx.guild.roles.get(r)).sort((a, b) => a.position - b.position)[0];
        userTopRolePos = userTopRolePos ? userTopRolePos.position : 0;

        let mentionTopRolePos = user.roles.map(r => ctx.guild.roles.get(r)).sort((a, b) => a.position - b.position)[0];
        mentionTopRolePos = mentionTopRolePos ? mentionTopRolePos.position : 0;

        if (ctx.author.id !== ctx.guild.ownerID && userTopRolePos <= mentionTopRolePos) {
            return await ctx.createMessage(`**${ctx.client.formatUser(user)}** was wearing an anti-1000-degree-knife vest and you were unable to stab them.\n`
            + `**(You cannot kick people ${userTopRolePos === mentionTopRolePos ? 'with the same role as you.' : 'higher then you'})**`);
        }

        try {
            if (ctx.raw.split(' for').length === 1) {
                await ctx.guild.kickMember(user.id, encodeURIComponent(ctx.client.formatUser(ctx.author)));
            } else {
                await ctx.guild.kickMember(user.id, encodeURIComponent(`${ctx.client.formatUser(ctx.author)}: ${ctx.raw.split(' for').slice(1).join(' for').trim()}`));
            }

            await ctx.createMessage(`Stabbed **${ctx.client.formatUser(user)}**.`);
        } catch(err) {
            if (err instanceof DiscordHTTPError) {
                return await ctx.createMessage(`**${ctx.client.formatUser(user)}** is too tough for me and I was unable to be stab them.`);
            } else throw err;
        }
    } else if (user.id === ctx.author.id) await ctx.createMessage("You can't stab yourself.");
    else await ctx.createMessage("You can't stab the knife with itself.");
}
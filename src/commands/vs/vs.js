exports.commands = ['vs'];

exports.vs = {
    desc: 'Cuts through someone and bans them.',
    usage: '<user mention|user id>',
    permissions: {both: 'banMembers'},
    async main(bot, ctx) {
        if (ctx.mentionStrings.length > 0) {
            await banMember(ctx);
        } else if (/^\d+$/.test(ctx.args[0])) {
            if (ctx.guild.members.get(ctx.args[0])) {
                ctx.mentionStrings.push(ctx.args[0]);
                await banMember(ctx);
            } else {
                let user = await bot.rest.getRESTUser(ctx.args[0]);
                await ctx.guild.banMember(user.id);
                await ctx.createMessage(`Cut all the way through **${bot.formatUser(user)}** from behind!`);
            }
        } else {
            await ctx.createMessage('Please mention someone or give me an ID for me to cut through.');
        }
    }
};

async function banMember(ctx) {
    let mentionedUser = ctx.client.users.get(ctx.mentionStrings[0]);

    if (ctx.mentionStrings[0] !== ctx.client.user.id && ctx.mentionStrings[0] !== ctx.author.id) {
        let mentionMember = ctx.guild.members.get(ctx.mentionStrings[0]);

        if (!mentionMember) {
            await ctx.createMessage('That user does not seem to exist.');
            return;
        }

        let userTopRolePos = ctx.guild.roles.get(ctx.member.roles.sort((a, b) => {
            return ctx.guild.roles.get(b).position - ctx.guild.roles.get(a).position;
        })[0]);
        userTopRolePos = userTopRolePos ? userTopRolePos.position : 0;

        let mentionTopRolePos = ctx.guild.roles.get(mentionMember.roles.sort((a, b) => {
            return ctx.guild.roles.get(b).position - ctx.guild.roles.get(a).position;
        })[0]);
        mentionTopRolePos = mentionTopRolePos ? mentionTopRolePos.position : 0;

        if (ctx.author.id === ctx.guild.ownerID || (userTopRolePos > mentionTopRolePos && userTopRolePos !== mentionTopRolePos)) {
            try {
                await ctx.guild.banMember(ctx.mentionStrings[0], 7, ctx.client.formatUser(ctx.author));
                await ctx.createMessage(`Cut all the way through **${ctx.client.formatUser(mentionedUser)}**!`);
            } catch(err) {
                if (err.resp && err.resp.statusCode === 403) {
                    return await ctx.createMessage(`**${ctx.client.formatUser(mentionedUser)}** is too tough for me and I was unable to be cut through.`);
                } else {
                    throw err;
                }
            }
        } else {
            await ctx.createMessage(`**${ctx.client.formatUser(mentionMember)}** was wearing an anti-1000-degree-knife vest and you were unable to cut through them.\n`
            + `**(You cannot ban people ${userTopRolePos === mentionTopRolePos ? 'with the same role as you.' : 'higher then you'})**`);
        }
    } else if (ctx.mentionStrings[0] === ctx.author.id) {
        await ctx.createMessage("You can't cut yourself.");
    } else if (ctx.mentionStrings[0] === ctx.client.user.id) {
        await ctx.createMessage("You can't cut the knife with itself.");
    }
}

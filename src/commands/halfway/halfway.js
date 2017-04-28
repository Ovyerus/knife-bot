exports.commands = ['halfway'];

exports.halfway = {
    desc: 'Slice through someone halfway, allowing them to come back.',
    usage: '<user mention|user id>',
    permissions: {both: 'banMembers'},
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            if (ctx.mentionStrings.length > 0) {
                softbanMember(ctx).then(resolve).catch(reject);
            } else if (/^\d+$/.test(ctx.args[0])) {
                if (ctx.guild.members.get(ctx.args[0])) {
                    ctx.mentionStrings.push(ctx.args[0]);
                    softbanMember(ctx).then(resolve).catch(reject);
                } else {
                    ctx.createMessage('That user does not exist in this server.').then(resolve).catch(reject);
                }
            } else {
                ctx.createMessage('Please mention someone or give me an ID for me to cut through.').then(resolve).catch(reject);
            }
        });
    }
};

function softbanMember(ctx) {
    return new Promise((resolve, reject) => {
        let mentionedUser = ctx.client.users.get(ctx.mentionStrings[0]);
        if (ctx.mentionStrings[0] !== ctx.client.user.id && ctx.mentionStrings[0] !== ctx.author.id) {
            let mentionMember = ctx.guild.members.get(ctx.mentionStrings[0]);

            if (!mentionMember) {
                ctx.createMessage('That user does not seem to exist.').then(resolve).catch(reject);
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
                ctx.guild.banMember(ctx.mentionStrings[0], 7).then(() => {
                    return ctx.guild.unbanMember(ctx.mentionStrings[0]);
                }).then(() => {
                    return ctx.createMessage(`Cut halfway through **${ctx.client.formatUser(mentionedUser)}**!`);
                }).then(resolve).catch(err => {
                    if (err.resp && err.resp.statusCode === 403) {
                        return ctx.createMessage(`**${ctx.client.formatUser(mentionedUser)}** is too tough for me and I was unable to be cut through.`);
                    } else {
                        reject(err);
                        return null;
                    }
                }).then(res => {if (res) resolve(res);});
            } else {
                ctx.createMessage(`**${ctx.client.formatUser(mentionMember)}** was wearing an anti-1000-degree-knife vest and you were unable to cut through them.\n**(You cannot ban people ${userTopRolePos === mentionTopRolePos ? 'with the same role as you.' : 'higher then you'})**`).then(resolve).catch(reject);
            }
        } else if (ctx.mentionStrings[0] === ctx.author.id) {
            ctx.createMessage("You can't cut yourself.").then(resolve).catch(reject);
        } else if (ctx.mentionStrings[0] === ctx.client.user.id) {
            ctx.createMessage("You can't cut the knife with itself.").then(resolve).catch(reject);
        }
    });
}
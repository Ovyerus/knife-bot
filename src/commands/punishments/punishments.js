const {AwaitTimeout} = require(`${__baseDir}/modules/helpers`);

exports.commands = [
    'mute',
    'roleban'
];

exports.mute = {
    desc: 'Mutes a user.',
    usage: '<user> [for <reason>]',
    permissions: {author: 'kickMembers', self: 'manageRoles'},
    async main(bot, ctx) {
        if (!ctx.raw) return await ctx.createMessage('Please give me a user to mute.');
        if (ctx.settings.muteRoles.length === 0 || !ctx.settings.muteRoles.filter(r => ctx.guild.roles.get(r)).length) {
            return await ctx.createMessage("There aren't any mute roles.");
        }

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

        let roles = ctx.settings.muteRoles.map(r => ctx.guild.roles.get(r)).filter(r => r);
        let role;

        if (roles.length > 1) {
            let whatArr = roles.map(r => [r.name, r.id]);
            let tmp = whatArr.map(r => `${whatArr.indexOf(r) + 1}. ${r[0]}`).join('\n');

            let msg;
            let delet = await ctx.createMessage({embed: {
                title: 'Multiple mute roles found.',
                description: 'Select the mute role you want to apply by typing its corresponding number.\n\n'
                + '```py\n'
                + tmp
                + '\n```'
            }});

            try {
                msg = await bot.awaitMessage(ctx.channel.id, ctx.author.id);
            } catch(err) {
                if (err instanceof AwaitTimeout) {
                    await ctx.createMessage('Choice timed out. Selecting first role.');

                    role = roles[0];
                } else throw err;
            }

            await delet.delete();

            let choice = Number(msg ? msg.content : 0);

            if (isNaN(choice)) {
                await ctx.createMessage('Choice is not a number. Selecting first role.');
                role = roles[0];
            }

            if (choice > whatArr.length || choice < 0) {
                await ctx.createMessage('Choice is either too large or too small. Selecting first role.');
                role = roles[0];
            }

            if (!role) role = roles[choice - 1];
        } else role = roles[0];

        await muteMember(user, ctx, role);

        if (ctx.raw.split(' for').length > 1 && ctx.guild.members.get(user.id).roles.includes(ctx.settings.rolebanRole)) {
            bot.emit('log', {
                user,
                action: 3,
                reason: ctx.raw.split(' for').slice(1).join(' for').trim(),
                settings: ctx.settings,
                guild: ctx.guild,
                blame: ctx.member
            });
        }
    }
};

exports.roleban = {
    desc: 'Rolebans a user.',
    usage: '<user> [for <reason>]',
    permissions: {author: 'banMembers', self: 'manageRoles'},
    async main(bot, ctx) {
        if (!ctx.raw) return await ctx.createMessage('Please give me a user to roleban.');
        if (!ctx.settings.rolebanRole) return await ctx.createMessage("There isn't a roleban role set.");
        if (!ctx.guild.roles.get(ctx.settings.rolebanRole)) return await ctx.createMessage('Roleban role has been deleted.');

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

        await rolebanMember(user, ctx);

        if (ctx.raw.split(' for').length > 1 && ctx.guild.members.get(user.id).roles.includes(ctx.settings.rolebanRole)) {
            bot.emit('log', {
                user,
                action: 3,
                reason: ctx.raw.split(' for').slice(1).join(' for').trim(),
                settings: ctx.settings,
                guild: ctx.guild,
                blame: ctx.member
            });
        }
    }
};

async function rolebanMember(user, ctx) {
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
                    await user.addRole(ctx.settings.rolebanRole, encodeURIComponent(ctx.client.formatUser(ctx.author)));
                } else {
                    await user.addRole(ctx.settings.rolebanRole, encodeURIComponent(`${ctx.client.formatUser(ctx.author)}: ${ctx.raw.split(' for').slice(1).join(' for').trim()}`));
                }

                await ctx.createMessage(`Cut all the way through **${ctx.client.formatUser(user)}**!`);
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
        await ctx.createMessage("You can't roleban yourself.");
    } else if (user.id === ctx.client.user.id) {
        await ctx.createMessage("You can't roleban me.");
    }
}

async function muteMember(user, ctx, role) {
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
                    await user.addRole(role.id, encodeURIComponent(ctx.client.formatUser(ctx.author)));
                } else {
                    await user.addRole(role.id, encodeURIComponent(`${ctx.client.formatUser(ctx.author)}: ${ctx.raw.split(' for').slice(1).join(' for').trim()}`));
                }

                await ctx.createMessage(`Cut all the way through **${ctx.client.formatUser(user)}**!`);
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
        await ctx.createMessage("You can't roleban yourself.");
    } else if (user.id === ctx.client.user.id) {
        await ctx.createMessage("You can't roleban me.");
    }
}

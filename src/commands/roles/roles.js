const {AwaitTimeout} = require(`${__baseDir}/modules/helpers`);

exports.loadAsSubcommands = true;
exports.commands = [
    'mute',
    'roleban'
];

exports.main = {
    desc: 'Manages the special roles used by the bot.',
    usage: '<mute <options> | roleban <options>>'
};

exports.mute = {
    desc: 'Manages mute roles for the bot.',
    usage: '[list | add <role> | remove <role> | generate]',
    async main(bot, ctx) {
        if (!['list', 'add', 'remove', 'generate'].includes(ctx.args[0])) {
            let embed = {
                title: 'Server Settings - Muted Roles',
                description: `Showing current mute role options for **${ctx.guild.name}**`,
                fields: [
                    {
                        name: 'List Roles',
                        value: 'Run `settings roles mute list` to view all roles assigned for muting.',
                        inline: true
                    },
                    {
                        name: 'Add Role',
                        value: 'Run `settings roles mute add <role>` to assign a role for muting.',
                        inline: true
                    },
                    {
                        name: 'Remove Role',
                        value: 'Run `settings roles mute remove <role>` to remove a muted role.',
                        inline: true
                    },
                    {
                        name: 'Generate Role',
                        value: 'Run `settings roles mute generate` to automatically generate a muted role.',
                        inline: true
                    }
                ]
            };

            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'add') {
            if (!ctx.args[1]) return await ctx.createMessage('Please give me a role to add as a muted role.');

            let role = await bot.lookups.roleLookup(ctx, ctx.raw.split(' ').split(1).join(' '));

            if (ctx.settings.muteRoles.includes(role.id)) return await ctx.createMessage('That role is already a muted role.');

            let highRole = ctx.guildBot.roles.map(r => ctx.guild.roles.get(r)).sort((a, b) => {
                return b.position - a.position;
            })[0];
            highRole = highRole ? highRole.position : 0;

            if (role.position > highRole) return await ctx.createMessage(`**${bot.formatRole(role)}** is higher than my highest role, so I'm not able to set it as a muted role.`);
            else if (role.position === highRole) return await ctx.createMessage(`**${bot.formatRole(role)}** is the same as my highest role, so I'm not able to set it as a muted role.`);

            await bot.db[ctx.guild.id].muteRoles.push(role.id);
            await ctx.createMessage(`Assigned ${bot.formatRole(role)} as a muted role.`);
        } else if (ctx.args[0] === 'remove') {
            if (!ctx.args[1]) return await ctx.createMessage('Please give me a role to remove as a muted role.');
            if (ctx.settings.muteRoles.length === 0) return await ctx.createMessage('There are no muted roles.');

            let role = await bot.lookups.roleLookup(ctx, ctx.raw.split(' ').slice(1).join(' '), false);

            if (!role && !isNaN(ctx.raw) && ctx.settings.muteRoles.includes(ctx.raw)) {
                // Role is deleted, but the user used an ID that is added as a mute role.
                await bot.db[ctx.guild.id].muteRoles.remove(ctx.raw);
                return await ctx.createMessage('Removed **Deleted Role** from muted roles.');
            } else if (!role) return await ctx.createMessage('That role could not be found.');
            else if (role && !ctx.settings.muteRoles.includes(role.id)) return await ctx.createMessage('That role is not a muted role.');

            await bot.db[ctx.guild.id].muteRoles.remove(role.id);
            await ctx.createMessage(`Removed ${bot.formatRole(role)} from muted roles.`);
        } else if (ctx.args[0] === 'list') {
            let roles = ctx.settings.muteRoles.map(r => [ctx.guild.roles.get(r), r]).map(([r, id]) => r ? `**Deleted Role** (${id})` : `**${bot.formatRole(r)}** (${id})`).join('\n') || 'No muted roles.';

            let embed = {
                title: 'Server Settings - Muted Roles - List',
                description: roles
            };

            await ctx.createMessage({embed});
        } else {
            if (!ctx.hasPermission('manageRoles', 'author')) return await ctx.createMessage('You need the **Manage Roles** permission.');
            else if (!ctx.hasPermission('manageRoles')) return await ctx.createMessage('I need the **Manage Roles** permission.');
            else if (!ctx.hasPermission('manageChannels')) return await ctx.createMessage('I need the **Manage Channels** permission.');
            else if (ctx.settings.muteRoles[0]) return await ctx.createMessage('There is already a muted role.');

            await ctx.createMessage('Creating role and editing permissions for all channels. Please be patient...');

            let role = await ctx.guild.createRole({
                name: 'Muted',
                color: 0xF21904
            }, encodeURIComponent(`${bot.formatUser(ctx.author)}: Auto-generating muted role.`));

            await ctx.guild.channels.asyncForEach(async c => {
                await c.editPermission(role.id, 0, 2048, 'role', encodeURIComponent(`${bot.formatUser(ctx.author)}: Editing permission overwrites for auto-generated muted role.`));
            });

            await bot.db[ctx.guild.id].muteRoles.push(role.id);
            await ctx.createMessage(`Created muted role ${role.mention} and edited permissions for each channel.\n`
            + 'You are now free to edit its name, colour, settings and permissions for channels.');
        }
    }
};

exports.roleban = {
    desc: 'Manages the roleban role for the bot.',
    usage: '[set <role> | remove | generate]',
    async main(bot, ctx) {
        if (!['add', 'remove', 'generate'].includes(ctx.args[0])) {
            let embed = {
                title: 'Server Settings - Roleban Role',
                description: `Showing current roleban role options for **${ctx.guild.name}**`,
                fields: [
                    {
                        name: 'Role',
                        value: !ctx.settings.rolebanRole ? 'None' : ctx.guild.roles.get(ctx.settings.rolebanRole) ? `${ctx.guild.roles.get(ctx.settings.rolebanRole).name} (${ctx.settings.rolebanRole})` : `Deleted Role (${ctx.settings.rolebanRole})`,
                        inline: true
                    },
                    {
                        name: 'Set Role',
                        value: 'Run `roles roleban set <role>` to set the rolebanned role.',
                        inline: true
                    },
                    {
                        name: 'Remove Role',
                        value: 'Run `roles roleban remove` to remove the rolebanned role.',
                        inline: true
                    },
                    {
                        name: 'Generate Role',
                        value: 'Run `roles roleban generate` to automatically generate a rolebanned role.',
                        inline: true
                    }
                ]
            };

            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'set') {
            if (!ctx.args[1]) return await ctx.createMessage('Please give me a role to set for rolebanning.');

            let role = await bot.lookups.roleLookup(ctx, ctx.raw.split(' ').slice(1).join(' '));

            if (!role) return;

            let highRole = ctx.guildBot.roles.map(r => ctx.guild.roles.get(r)).sort((a, b) => {
                return b.position - a.position;
            })[0];
            highRole = highRole ? highRole.position : 0;

            if (role.position > highRole) return await ctx.createMessage(`**${bot.formatRole(role)}** is higher than my highest role, so I'm not able to set it for rolebanning.`);
            else if (role.position === highRole) return await ctx.createMessage(`**${bot.formatRole(role)}** is the same as my highest role, so I'm not able to set it for rolebanning.`);

            if (ctx.settings.rolebanRole && ctx.guild.roles.get(ctx.settings.rolebanRole)) {
                await ctx.createMessage(`There is already a role set for rolebanning (${bot.formatRole(ctx.settings.rolebanRole)} [${ctx.settings.rolebanRole}]). Would you like to replace it?`);

                let m;

                try {
                    m = await bot.awaitMessage(ctx.channel.id, ctx.author.id);
                } catch(err) {
                    if (err instanceof AwaitTimeout)  {
                        return await ctx.createMessage('Await timeout expired. Not replacing current roleban role.');
                    } else throw err;
                }

                if (/^no?$/i.test(m.content)) return await ctx.createMessage("Ok, I won't update the current role.");
                else if (!/^y(es)?$/i.test(m.content)) return await ctx.createMessage('Invalid response. Not replacing current roleban role.');
            }

            await bot.db[ctx.guild.id].rolebanRole.set(role.id);
            await ctx.createMessage(`Set ${bot.formatRole(role)} as the roleban role.\n`
            + 'Make sure to give it only one channel which it can see.');
        } else if (ctx.args[0] === 'remove') {
            if (!ctx.settings.rolebanRole) return await ctx.createMessage('There is no roleban role set.');

            await bot.db[ctx.guild.id].rolebanRole.set(null);
            await ctx.createMessage('Removed roleban role.');
        } else {
            if (!ctx.hasPermission('manageRoles', 'author')) return await ctx.createMessage('You need the **Manage Roles** permission.');
            else if (!ctx.hasPermission('manageRoles')) return await ctx.createMessage('I need the **Manage Roles** permission.');
            else if (!ctx.hasPermission('manageChannels')) return await ctx.createMessage('I need the **Manage Channels** permission.');
            else if (ctx.settings.rolebanRole && ctx.guild.roles.get(ctx.settings.rolebanRole)) return await ctx.createMessage('There is already a roleban role.');

            await ctx.createMessage('Creating role, channel and editing permissions for all channels. Please be patient...');

            let role = await ctx.guild.createRole({
                name: 'Rolebanned'
            }, encodeURIComponent(`${bot.formatUser(ctx.author)}: Auto-generating rolebanned role.`));
            let channel = await ctx.guild.createChannel('rolebanned', 0, encodeURIComponent(`${bot.formatUser(ctx.author)}: Generating channel for auto-generated rolebanned role.`));

            await ctx.guild.channels.filter(c => c.id !== channel.id).asyncForEach(async c => {
                await c.editPermission(role.id, 0, 1024, 'role', encodeURIComponent(`${bot.formatUser(ctx.author)}: Editing permission overwrites for auto-generated rolebanned role.`));
            });

            await channel.editPermission(ctx.guild.id, 0, 1024, 'role', encodeURIComponent(`${bot.formatUser(ctx.author)}: Editing generated channel permissions for auto-generated rolebanned role.`));
            await channel.editPermission(role.id, 1024, 0, 'role', encodeURIComponent(`${bot.formatUser(ctx.author)}: Editing generated channel permissions for auto-generated rolebanned role.`));

            await bot.db[ctx.guild.id].rolebanRole.set(role.id);
            await ctx.createMessage(`Created rolebanned role ${bot.formatRole(role)}, rolebanned channel <#${channel.id}> and edited permissions for each channel.\n`
            + 'You are now free to edit its name and colour.');
        }
    }
};
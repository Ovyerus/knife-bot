exports.loadAsSubcommands = true;
exports.commands = [
    'channels',
    'roles',
    'users'
];

exports.main = {
    desc: 'Edit settings for the filter exceptions.',
    usage: '[option [arguments]]',
    async main(bot, ctx) {
        let embed = {
            title: 'Server Settings - Exceptions',
            description: `Showing current exceptions for **${ctx.guild.name}**`,
            fields: [
                {
                    name: '`Channels`',
                    value: `**${ctx.settings.exceptions.channels.length}** exceptions\n`
                    + 'Run `settings exceptions channels` to view channel exceptions.',
                    inline: true
                },
                {
                    name: '`Roles`',
                    value: `**${ctx.settings.exceptions.roles.length}** exceptions\n`
                    + 'Run `settings exceptions roles` to view roles exceptions.',
                    inline: true
                },
                {
                    name: '`Users`',
                    value: `**${ctx.settings.exceptions.users.length}** exceptions\n`
                    + 'Run `settings exceptions users` to view user exceptions.',
                    inline: true
                }
            ]
        };

        await ctx.createMessage({embed});
    }
};

exports.channels = {
    desc: 'Manages the per-channel filter exceptions.',
    usage: '[add <channel> | remove <channel>]',
    async main(bot, ctx) {
        if (!['add', 'remove'].includes(ctx.args[0])) {
            let embed = {
                title: 'Server Settings - Exceptions',
                description: `Showing channel exceptions for **${ctx.guild.name}**`,
                fields: [
                    {
                        name: '\u200b',
                        value: [],
                        inline: true
                    }
                ]
            };

            ctx.settings.exceptions.channels.map(id => [ctx.guild.channels.get(id), id]).forEach(([chan, id]) => {
                if (chan) embed.fields[0].value.push(`**${chan.name}** (${id})`);
                else embed.fields[0].value.push(`**Deleted channel** (${id})`);
            });

            embed.fields[0].value = embed.fields[0].value.join('\n') || 'No exceptions.';

            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'add') {
            if (!ctx.args[1]) return await ctx.createMessage(`Please give me a channel to add an exception for.`);

            let channel = await bot.lookups.textChannelLookup(ctx, ctx.raw.split(' ').slice(1).join(' '));

            if (!channel) return;

            if (!ctx.settings.exceptions.channels.includes(channel.id)) {
                await bot.db[ctx.guild.id].exceptions.channels.push(channel.id);
                await ctx.createMessage(`Added exception for channel <#${channel.id}>.`);
            } else await ctx.createMessage('There is already an exception for that channel.');
        } else {
            if (!ctx.args[1]) return await ctx.createMessage(`Please give me a channel to remove an exception for.`);

            let channel = await bot.lookups.textChannelLookup(ctx, ctx.raw.split(' ').slice(1).join(' '));

            if (!channel) return; // TODO: detect if ded channel

            if (ctx.settings.exceptions.channels.includes(channel.id)) {
                await bot.db[ctx.guild.id].exceptions.channels.remove(channel.id);
                await ctx.createMessage(`Removed exception for channel <#${channel.id}>.`);
            } else await ctx.createMessage("There isn't an exception for that channel.");
        }
    }
};

exports.roles = {
    desc: 'Manages the per-role filter exceptions.',
    usage: '[add <role> | remove <role>]',
    async main(bot, ctx) {
        if (!['add', 'remove'].includes(ctx.args[0])) {
            let embed = {
                title: 'Server Settings - Exceptions',
                description: `Showing role exceptions for **${ctx.guild.name}**`,
                fields: [
                    {
                        name: '\u200b',
                        value: [],
                        inline: true
                    }
                ]
            };

            ctx.settings.exceptions.roles.map(id => [ctx.guild.roles.get(id), id]).forEach(([role, id]) => {
                if (role) embed.fields[0].value.push(`**${role.name}** (${id})`);
                else embed.fields[0].value.push(`**Deleted role** (${id})`);
            });

            embed.fields[0].value = embed.fields[0].value.join('\n') || 'No exceptions.';

            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'add') {
            if (!ctx.args[1]) return await ctx.createMessage(`Please give me a role to add an exception for.`);

            let role = await bot.lookups.roleLookup(ctx, ctx.raw.split(' ').slice(1).join(' '));

            if (!role) return;

            if (!ctx.settings.exceptions.roles.includes(role.id)) {
                await bot.db[ctx.guild.id].exceptions.roles.push(role.id);
                await ctx.createMessage(`Added exception for role **${role.name}**.`);
            } else await ctx.createMessage('There is already an exception for that role.');
        } else {
            if (!ctx.args[1]) return await ctx.createMessage(`Please give me a role to remove an exception for.`);

            let role = await bot.lookups.roleLookup(ctx, ctx.raw.split(' ').slice(1).join(' '));

            if (!role) return; // TODO: detect if ded role

            if (ctx.settings.exceptions.roles.includes(role.id)) {
                await bot.db[ctx.guild.id].exceptions.roles.remove(role.id);
                await ctx.createMessage(`Removed exception for role **${role.name}**.`);
            } else await ctx.createMessage("There isn't an exception for that role.");
        }
    }
};

exports.users = {
    desc: 'Manages the per-user filter exceptions.',
    usage: '[add <user> | remove <user>]',
    async main(bot, ctx) {
        if (!['add', 'remove'].includes(ctx.args[0])) {
            let embed = {
                title: 'Server Settings - Exceptions',
                description: `Showing user exceptions for **${ctx.guild.name}**`,
                fields: [
                    {
                        name: '\u200b',
                        value: [],
                        inline: true
                    }
                ]
            };

            ctx.settings.exceptions.user.map(id => [ctx.guild.members.get(id) || bot.users.get(id), id]).forEach(([user, id]) => {
                if (user) embed.fields[0].value.push(`**${bot.formatUsername(user)}** (${id})`);
                else embed.fields[0].value.push(`**Unknown user** (${id})`);
            });

            embed.fields[0].value = embed.fields[0].value.join('\n') || 'No exceptions.';

            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'add') {
            if (!ctx.args[1]) return await ctx.createMessage(`Please give me a user to add an exception for.`);

            let user = await bot.lookups.memberLookup(ctx, ctx.raw.split(' ').slice(1).join(' '));

            if (!user) return;

            if (!ctx.settings.exceptions.users.includes(user.id)) {
                await bot.db[ctx.guild.id].exceptions.users.push(user.id);
                await ctx.createMessage(`Added exception for user **${bot.fromatUsername(user)}**.`);
            } else await ctx.createMessage('There is already an exception for that user.');
        } else {
            if (!ctx.args[1]) return await ctx.createMessage(`Please give me a user to remove an exception for.`);

            let user = await bot.lookups.memberLookup(ctx, ctx.raw.split(' ').slice(1).join(' '));

            if (!user) return; // TODO: detect if ded user

            if (ctx.settings.exceptions.users.includes(user.id)) {
                await bot.db[ctx.guild.id].exceptions.users.remove(user.id);
                await ctx.createMessage(`Removed exception for user **${bot.formatUsername(user)}**.`);
            } else await ctx.createMessage("There isn't an exception for that user.");
        }
    }
};
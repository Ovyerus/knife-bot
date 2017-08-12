const {AwaitTimeout} = require(`${__baseDir}/modules/helpers`);

const States = {true: '<:check:314349398811475968> Enabled', false: '<:xmark:314349398824058880> Disabled'};

exports.loadAsSubcommands = true;
exports.commands = [
    'invites',
    'mentions',
    'diacritics',
    'exceptions',
    'channel',
    'messages',
    'roles'
];

exports.main = {
    desc: 'Edit settings for the bot.',
    usage: '[setting [option <arguments>] | page]',
    permissions: {author: 'manageGuild'},
    async main(bot, ctx) {
        let embed = {
            author: {name: 'Server Settings'},
            title: 'Page ',
            description: `Showing current settings for **${ctx.guild.name}**.`,
            thumbnail: {url: ctx.guild.iconURL}
        };

        if (ctx.args[0] !== '2') {
            embed.title += '1';
            embed.footer = {text: "Run 'settings 2' to view more settings."};
            embed.fields = [
                {
                    name: '`Invite Blocking`',
                    value: 'Block pesky buggers from advertising servers.\n'
                    + `Status: **${States[ctx.settings.invites.enabled]}**\n`
                    + 'Run `settings invites` to view settings.'
                },
                {
                    name: '`Mass Mentions`',
                    value: 'Prevent people from mass-mentioning/spam-mentioning roles and users.\n'
                    + `Status: **${States[ctx.settings.mentions.enabled]}**\n`
                    + 'Run `settings mentions` to view settings.'
                },
                {
                    name: '`Spammy Diacritics`',
                    value: 'Prevent people from using potentially spammy diacritics.\n'
                    + `Status: **${States[ctx.settings.diacritics.enabled]}**\n`
                    + 'Run `settings diacritics` to view settings.'
                }
            ];

            await ctx.createMessage({embed});
        } else {
            embed.title += '2';
            embed.fields = [
                {
                    name: '`Exceptions`',
                    value: 'Manage exceptions for users, roles, and channels.\n'
                    + 'Run `settings exceptions` to view settings.'
                },
                {
                    name: '`Log Channel`',
                    value: 'Manage the channel used for logging events.\n'
                    + 'Run `settings channel` to view settings.'
                },
                {
                    name: '`Messages`',
                    value: 'Manage messages for warnings for the various events.\n'
                    + 'Run `settings messages` to view settings.'
                },
                {
                    name: '`Special Roles`',
                    value: 'Manage the various roles used by the bot.\n'
                    + 'Run `settings roles` to view settings.'
                }
            ];

            await ctx.createMessage({embed});
        }
    }
};

exports.invites = {
    desc: 'Edit invite settings for the bot.',
    usage: '[enable | disable | fake <enable|disable> | kick <number> | ban <number>]',
    async main(bot, ctx) {
        if (!['fake', 'enable', 'disable', 'kick', 'ban'].includes(ctx.args[0])) {
            let embed = {
                title: 'Server Settings - Invites',
                description: `Showing current invite settings for **${ctx.guild.name}**.`,
                fields: [
                    {
                        name: '`Status`',
                        value: `**${States[ctx.settings.invites.enabled]}**\n`
                        + 'Key: `enable|disable`',
                        inline: true
                    },
                    {
                        name: '`Block Fake Invites?`',
                        value: `**${ctx.settings.invites.fake ? 'Yes' : 'No'}**\n`
                        + 'Key: `fake <enable|disable>`',
                        inline: true
                    },
                    {
                        name: '`Kick At`',
                        value: `**${ctx.settings.actions.invites.kick === 0 ? '0 (disabled)' : ctx.settings.actions.invites.kick}** offences.\n`
                        + 'Key `kick <number>`',
                        inline: true
                    },
                    {
                        name: '`Ban At`',
                        value: `**${ctx.settings.actions.invites.ban === 0 ? '0 (disabled)' : ctx.settings.actions.invites.ban}** offences.\n`
                        + 'Key `ban <number>`',
                        inline: true
                    }
                ]
            };

            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'enable') {
            if (!ctx.settings.invites.enabled) {
                await bot.editSettings(ctx.guild.id, {invites: {enabled: true, fake: ctx.settings.invites.fake}});
                await ctx.createMessage('I will now start cutting through invites.\nPlease make sure that I have the following permissions: **Ban Members**, **Kick Members** and **Manage Messages**.');
            } else {
                await ctx.createMessage('I am already cutting through invites.');
            }
        } else if (ctx.args[0] === 'disable') {
            if (ctx.settings.invites.enabled) {
                await bot.editSettings(ctx.guild.id, {invites: {enabled: false, fake: ctx.settings.invites.fake}});
                await ctx.createMessage('I will now stop cutting through invites.');
            } else {
                await ctx.createMessage("I wasn't cutting through invites to begin with.");
            }
        } else if (ctx.args[0] === 'fake') {
            if (ctx.args[1] === 'enable' && !ctx.settings.invites.fake) {
                await bot.editSettings(ctx.guild.id, {invites: {enabled: ctx.settings.invites.enabled, fake: true}});
                await ctx.createMessage('I will now cut through fake invites.');
            } else if (ctx.args[1] === 'enable' && ctx.settings.invites.fake) {
                await ctx.createMessage('I am already cutting through fake invites.');
            } else if (ctx.args[1] === 'disable' && ctx.settings.invites.fake) {
                await bot.editSettings(ctx.guild.id, {invites: {enabled: ctx.settings.invites.enabled, fake: false}});
                await ctx.createMessage('I will no longer cut through invites.');
            } else if (ctx.args[1] === 'disable' && !ctx.settings.invites.fake) {
                await ctx.createMessage("I wasn't cutting through fake invites.");
            } else {
                await ctx.createMessage('Invalid option for `fake`, must either be `enable` or `disable`.');
            }
        } else if (ctx.args[0] === 'kick') {
            let num = Number(Math.abs(ctx.args[1]).toFixed(0));

            if (isNaN(num)) {
                await ctx.createMessage('You can only set kick to a valid number.');
            } else if (num >= ctx.settings.actions.invites.ban) {
                await ctx.createMessage('You cannot set the kick limit to, or higher than the ban limit.');
            } else {
                let {invites, mentions, diacritics} = ctx.settings.actions;
                let settings = Object.assign({}, ctx.settings, {actions: {
                    invites: {kick: num, ban: invites.ban},
                    mentions,
                    diacritics
                }});

                await bot.editSettings(ctx.guild.id, settings);

                if (num === 0) {
                    await ctx.createMessage('Disabled kicking for invites.');
                } else {
                    await ctx.createMessage(`Set kick limit to **${num}**.`);
                }
            }
        } else if (ctx.args[0] === 'ban') {
            let num = Number(Math.abs(ctx.args[1]).toFixed(0));

            if (isNaN(num)) {
                await ctx.createMessage('You can only set ban to a valid number.');
            } else if (num <= ctx.settings.actions.invites.kick) {
                await ctx.createMessage('You cannot set the ban limit to, or lower than the kick limit.');
            } else if (num === 0) {
                await ctx.createMessage('You cannot disable banning for invites (You can however set it to a ridiculously high number. This is a result of the dev being lazy atm. Might change in the future.).');
            } else {
                let {invites, mentions, diacritics} = ctx.settings.actions;
                let settings = Object.assign({}, ctx.settings, {actions: {
                    invites: {kick: invites.kick, ban: num},
                    mentions,
                    diacritics
                }});

                await bot.editSettings(ctx.guild.id, settings);
                await ctx.createMessage(`Set ban limit to **${num}**.`);
            }
        }
    }
};

exports.mentions = {
    desc: 'Edit mass mention settings for the bot.',
    usage: '[enable | disable | trigger <number> | kick <number> | ban <number>]',
    async main(bot, ctx) {
        if (!['enable', 'disable', 'trigger', 'kick', 'ban'].includes(ctx.args[0])) {
            let embed = {
                title: 'Server Settings - Mentions',
                description: `Showing current mass-mention settings for **${ctx.guild.name}**.`,
                footer: {text: "'Amount to Trigger' is how many mentions in one message or done fast enough is needed for the bot to be triggered."},
                fields: [
                    {
                        name: '`Status`',
                        value: `**${States[ctx.settings.mentions.enabled]}**\n`
                        + 'Key: `enable|disable`',
                        inline: true
                    },
                    {
                        name: '`Amount to Trigger`',
                        value: `**${ctx.settings.mentions.trigger}**\n`
                        + 'Key: `trigger <number>`',
                        inline: true
                    },
                    {
                        name: '`Kick At`',
                        value: `**${ctx.settings.actions.mentions.kick === 0 ? '0 (disabled)' : ctx.settings.actions.mentions.kick}** offences.\n`
                        + 'Key `kick <number>`',
                        inline: true
                    },
                    {
                        name: '`Ban At`',
                        value: `**${ctx.settings.actions.mentions.ban === 0 ? '0 (disabled)' : ctx.settings.actions.mentions.ban}** offences.\n`
                        + 'Key `ban <number>`',
                        inline: true
                    }
                ]
            };

            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'enable') {
            if (!ctx.settings.mentions.enabled) {
                await bot.editSettings(ctx.guild.id, {mentions: {enabled: true, trigger: ctx.settings.mentions.trigger}});
                await ctx.createMessage('I will now start cutting through mass mentions.\nPlease make sure that I have the following permissions: **Ban Members**, **Kick Members** and **Manage Messages**.');
            } else {
                await ctx.createMessage('I am already cutting through mass mentions.');
            }
        } else if (ctx.args[0] === 'disable') {
            if (ctx.settings.mentions.enabled) {
                await bot.editSettings(ctx.guild.id, {mentions: {enabled: true, trigger: ctx.settings.mentions.trigger}});
                await ctx.createMessage('I will now stop cutting through mass mentions.');
            } else {
                await ctx.createMessage("I wasn't cutting through mass mentions to begin with.");
            }
        } else if (ctx.args[0] === 'trigger') {
            let num = Number(Math.abs(ctx.args[1]).toFixed(0));

            if (isNaN(num)) {
                await ctx.createMessage('You can only set trigger to a valid number.');
            } else if (num === 0) {
                await ctx.createMessage('You cannot set trigger to 0. If you wish to disable mass mention blocking, run `settings mentions disable`.');
            } else {
                await bot.editSettings(ctx.guild.id, {mentions: {enabled: ctx.settings.mentions.enabled, trigger: num}});
                await ctx.createMessage(`Set trigger limit to **${num}**.`);
            }
        } else if (ctx.args[0] === 'kick') {
            let num = Number(Math.abs(ctx.args[1]).toFixed(0));

            if (isNaN(num)) {
                await ctx.createMessage('You can only set kick to a valid number.');
            } else if (num >= ctx.settings.actions.mentions.ban) {
                await ctx.createMessage('You cannot set the kick limit to, or higher than the ban limit.');
            } else {
                let {invites, mentions, diacritics} = ctx.settings.actions;
                let settings = Object.assign({}, ctx.settings, {actions: {
                    invites,
                    mentions: {kick: num, ban: mentions.kick},
                    diacritics
                }});

                await bot.editSettings(ctx.guild.id, settings);

                if (num === 0) {
                    await ctx.createMessage('Disabled kicking for mentions.');
                } else {
                    await ctx.createMessage(`Set kick limit to **${num}**.`);
                }
            }
        } else if (ctx.args[0] === 'ban') {
            let num = Number(Math.abs(ctx.args[1]).toFixed(0));

            if (isNaN(num)) {
                await ctx.createMessage('You can only set ban to a valid number.');
            } else if (num <= ctx.settings.actions.mentions.kick) {
                await ctx.createMessage('You cannot set the ban limit to, or lower than the kick limit.');
            } else if (num === 0) {
                await ctx.createMessage('You cannot disable banning for mentions (You can however set it to a ridiculously high number).');
            } else {
                let {invites, mentions, diacritics} = ctx.settings.actions;
                let settings = Object.assign({}, ctx.settings, {actions: {
                    invites,
                    mentions: {kick: mentions.kick, ban: num},
                    diacritics
                }});

                await bot.editSettings(ctx.guild.id, settings);
                await  ctx.createMessage(`Set ban limit to **${num}**.`);
            }
        }
    }
};

exports.diacritics = {
    desc: 'Edit diacritics settings for the bot.',
    usage: '[enable | disable | trigger <amount> | kick <amount> | ban <amount>]',
    async main(bot, ctx) {
        if (!['enable', 'disable', 'trigger'].includes(ctx.args[0])) {
            let embed = {
                title: 'Server Settings - Diacritics',
                description: `Showing current diacritics settings for **${ctx.guild.name}**.`,
                footer: {text: "'Amount to Trigger' is how many diacritics are needed in one message in order to trigger."},
                fields: [
                    {
                        name: '`Status`',
                        value: `**${States[ctx.settings.diacritics.enabled]}**\n`
                        + 'Key: `enable|disable`',
                        inline: true
                    },
                    {
                        name: '`Amount to Trigger`',
                        value: `**${ctx.settings.diacritics.trigger}**\n`
                        + 'Key: `trigger <number>`',
                        inline: true
                    },
                    {
                        name: '`Kick At`',
                        value: `**${ctx.settings.actions.diacritics.kick === 0 ? '0 (disabled)' : ctx.settings.actions.diacritics.kick}** offences.\n`
                        + 'Key `kick <number>`',
                        inline: true
                    },
                    {
                        name: '`Ban At`',
                        value: `**${ctx.settings.actions.diacritics.ban === 0 ? '0 (disabled)' : ctx.settings.actions.diacritics.ban}** offences.\n`
                        + 'Key `ban <number>`',
                        inline: true
                    }
                ]
            };

            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'enable') {
            if (!ctx.settings.diacritics.enabled) {
                await bot.editSettings(ctx.guild.id, {diacritics: {enabled: true, trigger: ctx.settings.diacritics.trigger}});
                await ctx.createMessage('I will now start cutting through spammy diacritic usage.\nPlease make sure that I have the following permissions: **Ban Members**, **Kick Members** and **Manage Messages**.');
            } else {
                await ctx.createMessage('I am already cutting through spammy diacritics.');
            }
        } else if (ctx.args[0] === 'disable') {
            if (ctx.settings.diacritics.enabled) {
                await bot.editSettings(ctx.guild.id, {diacritics: {enabled: false, fake: ctx.settings.diacritics.fake}});
                await ctx.createMessage('I will now stop cutting through spammy diacritics.');
            } else {
                await ctx.createMessage("I wasn't cutting through spammy diacritics to begin with.");
            }
        } else if (ctx.args[0] === 'trigger') {
            let num = Number(Math.abs(ctx.args[1]).toFixed(0));

            if (isNaN(num)) {
                await ctx.createMessage('You can only set trigger to a valid number.');
            } else if (num === 0) {
                await ctx.createMessage('You cannot set trigger to 0. If you wish to disable spammy diacritics blocking, run `settings diacritics disable`.');
            } else {
                await bot.editSettings(ctx.guild.id, {diacritics: {enabled: ctx.settings.diacritics.enabled, trigger: num}});
                await ctx.createMessage(`Set trigger limit to **${num}**.`);
            }
        } else if (ctx.args[0] === 'kick') {
            let num = Number(Math.abs(ctx.args[1]).toFixed(0));

            if (isNaN(num)) {
                await ctx.createMessage('You can only set kick to a valid number.');
            } else if (num >= ctx.settings.actions.diacritics.ban) {
                await ctx.createMessage('You cannot set the kick limit to, or higher than the ban limit.');
            } else {
                let {invites, mentions, diacritics} = ctx.settings.actions;
                let settings = Object.assign({}, ctx.settings, {actions: {
                    invites,
                    mentions,
                    diacritics: {kick: num, ban: diacritics.kick}
                }});

                await bot.editSettings(ctx.guild.id, settings);

                if (num === 0) {
                    await ctx.createMessage('Disabled kicking for diacritics.');
                } else {
                    await ctx.createMessage(`Set kick limit to **${num}**.`);
                }
            }
        } else if (ctx.args[0] === 'ban') {
            let num = Number(Math.abs(ctx.args[1]).toFixed(0));

            if (isNaN(num)) {
                await ctx.createMessage('You can only set ban to a valid number.');
            } else if (num <= ctx.settings.actions.diacritics.kick) {
                await ctx.createMessage('You cannot set the ban limit to, or lower than the kick limit.');
            } else if (num === 0) {
                await ctx.createMessage('You cannot disable banning for diacritics (You can however set it to a ridiculously high number).');
            } else {
                let {invites, mentions, diacritics} = ctx.settings.actions;
                let settings = Object.assign({}, ctx.settings, {actions: {
                    invites,
                    mentions,
                    diacritics: {kick: diacritics.kick, ban: num}
                }});

                await bot.editSettings(ctx.guild.id, settings);
                await  ctx.createMessage(`Set ban limit to **${num}**.`);
            }
        }
    }
};

exports.exceptions = {
    desc: 'Edit exceptions for the bot.',
    usage: '[channels [add|remove <channel>] | roles [add|remove <role>] | users [add|remove <user>]]',
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

        if (!['channels', 'roles', 'users'].includes(ctx.args[0])) {
            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'channels' && !['add', 'remove'].includes(ctx.args[1])) {
            embed.description = embed.description.replace('current exceptions', 'channel exceptions');
            embed.fields = [
                {
                    name: '\u200b',
                    value: [],
                    inline: true
                }
            ];

            if (ctx.settings.exceptions.channels.length > 0) {
                ctx.settings.exceptions.channels.forEach(id => {
                    if (ctx.guild.channels.get(id)) {
                        embed.fields[0].value.push(`**${ctx.guild.channels.get(id).name}** (${id})`);
                    } else {
                        embed.fields[0].value.push(`**Unknown channel** (${id})`);
                    }
                });

                embed.fields[0].value = embed.fields[0].value.join('\n');
            } else {
                embed.fields[0].value = 'No exceptions.';
            }

            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'roles' && !['add', 'remove'].includes(ctx.args[1])) {
            embed.description = embed.description.replace('current exceptions', 'role exceptions');
            embed.fields = [
                {
                    name: '\u200b',
                    value: [],
                    inline: true
                }
            ];

            if (ctx.settings.exceptions.roles.length > 0) {
                ctx.settings.exceptions.roles.forEach(id => {
                    if (ctx.guild.roles.get(id)) {
                        embed.fields[0].value.push(`**${ctx.guild.roles.get(id).name}** (${id})`);
                    } else {
                        embed.fields[0].value.push(`**Unknown role** (${id})`);
                    }
                });

                embed.fields[0].value = embed.fields[0].value.join('\n');
            } else {
                embed.fields[0].value = 'No exceptions.';
            }

            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'users' && !['add', 'remove'].includes(ctx.args[1])) {
            embed.description = embed.description.replace('current exceptions', 'user exceptions');
            embed.fields = [
                {
                    name: '\u200b',
                    value: [],
                    inline: true
                }
            ];

            if (ctx.settings.exceptions.users.length > 0) {
                ctx.settings.exceptions.users.forEach(id => {
                    if (ctx.guild.members.get(id)) {
                        embed.fields[0].value.push(`**${ctx.guild.members.get(id).user.username}** (${id})`);
                    } else if (bot.users.get(id)) {
                        embed.fields[0].value.push(`**${bot.users.get(id).username}** (Not in server) (${id})`);
                    } else {
                        embed.fields[0].value.push(`**Unknown user** (${id})`);
                    }
                });

                embed.fields[0].value = embed.fields[0].value.join('\n');
            } else {
                embed.fields[0].value = 'No exceptions.';
            }

            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'users') {
            if (!ctx.raw.split(' ').slice(2).join(' ')) return await ctx.createMessage(`Please give me a user to ${ctx.args[1]} an exception for.`);

            let user = await bot.lookups.memberLookup(ctx, ctx.raw.split(' ').slice(2).join(' '), false);

            if (!user) {
                try {
                    user = await bot.rest.getRESTUser(ctx.raw.split(' ').slice(2).join(' '));
                } catch(_) {
                    return await ctx.createMessage('User not found.');
                }
            }

            let settings = ctx.settings;

            if (!settings.exceptions.users.includes(user.id) && ctx.args[1] === 'add') {
                settings.exceptions.users.push(user.id);

                await bot.editSettings(ctx.guild.id, settings);
                await ctx.createMessage(`Added exception for user **${bot.formatUser(user)}**.`);
            } else if (settings.exceptions.users.includes(user.id) && ctx.args[1] === 'add') {
                await ctx.createMessage('There is already an exception for that user.');
            } else if (settings.exceptions.users.includes(user.id) && ctx.args[1] === 'remove') {
                settings.exceptions.users.splice(settings.exceptions.users.indexOf(user.id), 1);

                await bot.editSettings(ctx.guild.id, settings);
                await ctx.createMessage(`Removed exception for user **${bot.formatUser(user)}**.`);
            } else {
                await ctx.createMessage("There isn't an exception for that user.");
            }
        } else if (ctx.args[0] === 'channels') {
            if (!ctx.raw.split(' ').slice(2).join(' ')) return await ctx.createMessage(`Please give me a channel to ${ctx.args[1]} an exception for.`);

            let channel = await bot.lookups.channelLookup(ctx, ctx.raw.split(' ').slice(2).join(' '));

            if (!channel) return;
            if (channel.type === 2) return await ctx.createMessage('I cannot add exceptions for voice channels.');

            let settings = ctx.settings;

            if (!settings.exceptions.channels.includes(channel.id) && ctx.args[1] === 'add') {
                settings.exceptions.channels.push(channel.id);

                await bot.editSettings(ctx.guild.id, settings);
                await ctx.createMessage(`Added exception for channel <#${channel.id}>.`);
            } else if (settings.exceptions.channels.includes(channel.id) && ctx.args[1] === 'add') {
                await ctx.createMessage('There is already an exception for that channel.');
            } else if (settings.exceptions.channels.includes(channel.id) && ctx.args[1] === 'remove') {
                settings.exceptions.channels.splice(settings.exceptions.channels.indexOf(channel.id), 1);

                await bot.editSettings(ctx.guild.id, settings);
                await ctx.createMessage(`Removed exception for channel <#${channel.id}>.`);
            } else {
                await ctx.createMessage("There isn't an exception for that channel.");
            }
        } else if (ctx.args[0] === 'roles') {
            if (!ctx.raw.split(' ').slice(2).join(' ')) return await ctx.createMessage('Please give me a role to add an exception for.');

            let role = await bot.lookups.roleLookup(ctx, ctx.raw.split(' ').slice(2).join(' '));

            if (!role) return;

            let settings = ctx.settings;

            if (!settings.exceptions.roles.includes(role.id) && ctx.args[1] === 'add') {
                settings.exceptions.roles.push(role.id);

                await bot.editSettings(ctx.guild.id, settings);
                await ctx.createMessage(`Added exception for role ${role.mentionable ? `**${role.name}**`: role.mention}.`);
            } else if (settings.exceptions.roles.includes(role.id) && ctx.args[1] === 'add') {
                await ctx.createMessage('There is already an exception for that role.');
            } else if (settings.exceptions.roles.includes(role.id) && ctx.args[1] === 'remove') {
                settings.exceptions.roles.splice(settings.exceptions.users.indexOf(role.id), 1);

                await bot.editSettings(ctx.guild.id, settings);
                await ctx.createMessage(`Removed exception for role ${role.mentionable ? `**${role.name}**`: role.mention}.`);
            } else {
                await ctx.createMessage("There isn't an exception for that role.");
            }
        }
    }
};

exports.channel = {
    desc: 'Edit the log channel for the bot.',
    usage: '[channel | disable]',
    async main(bot, ctx) {
        if (!ctx.args[0]) {
            let embed = {
                title: 'Server Settings - Log Channel',
                description: `Showing current log channel for **${ctx.guild.name}**`,
                footer: {text: "Run 'settings channel <channel>' to enable logging or change the channel, or run 'settings channel disable' to remove the log channel."},
                fields: [
                    {
                        name: '`Channel`', 
                        value: ctx.settings.logChannel ? `<#${ctx.settings.logChannel}>` : 'None',
                        inline: true
                    }
                ]
            };

            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'disable' && ctx.settings.logChannel) {
            await bot.editSettings(ctx.guild.id, {logChannel: null});
            await ctx.createMessage('Removed log channel.');
        } else if (ctx.args[0] === 'disable') {
            await ctx.createMessage("There isn't a log channel set.");
        } else {
            let channel = await bot.lookups.channelLookup(ctx, ctx.raw);

            if (!channel) return;

            await bot.editSettings(ctx.guild.id, {logChannel: channel.id});
            await ctx.createMessage(`Set log channel to <#${channel.id}>`);
        }
    }
};

exports.messages = {
    desc: 'Edit log messages for the different events.',
    usage: '[invites | mentions | diacritics]',
    async main(bot, ctx) {
        if (!['invites', 'mentions', 'diacritics'].includes(ctx.args[0])) {
            let embed = {
                title: 'Server Settings - Messages',
                description: `Showing current messages for **${ctx.guild.name}**\nNote: any occurances of \`{{mention}}\` will be replaced with an @mention of the user.`,
                footer: {text: "Run 'settings messages <type> <message>' to change the message for the particular type."},
                fields: [
                    {
                        name: 'Invites',
                        value: ctx.settings.messages.invites
                    },
                    {
                        name: 'Mentions',
                        value: ctx.settings.messages.mentions
                    },
                    {
                        name: 'Diacritics',
                        value: ctx.settings.messages.diacritics
                    }
                ]
            };

            await ctx.createMessage({embed});
        } else if (!ctx.args[1]) {
            await ctx.createMessage('Please give a something to set the message as.');
        } else if (ctx.args[0] === 'invites') {
            let msg = ctx.raw.split(' ').slice(1).join(' ');
            let {mentions, diacritics} = ctx.settings.mentions;
            let settings = Object.assign({}, ctx.settings, {messages: {
                invites: msg,
                mentions,
                diacritics
            }});

            await bot.editSettings(ctx.guild.id, settings);
            await ctx.createMessage('Successfully edited message for `invites`. Sending test message...');
            await ctx.createMessage(msg.replace(/{{mention}}/g, ctx.author.mention));
        } else if (ctx.args[0] === 'mentions') {
            let msg = ctx.raw.split(' ').slice(1).join(' ');
            let {invites, diacritics} = ctx.settings.mentions;
            let settings = Object.assign({}, ctx.settings, {messages: {
                invites,
                mentions: msg,
                diacritics
            }});

            await bot.editSettings(ctx.guild.id, settings);
            await ctx.createMessage('Successfully edited message for `mentions`. Sending test message...');
            await ctx.createMessage(msg.replace(/{{mention}}/g, ctx.author.mention)); 
        } else {
            let msg = ctx.raw.split(' ').slice(1).join(' ');
            let {invites, mentions} = ctx.settings.mentions;
            let settings = Object.assign({}, ctx.settings, {messages: {
                invites,
                mentions,
                diacritics: msg
            }});

            await bot.editSettings(ctx.guild.id, settings);
            await ctx.createMessage('Successfully edited message for `diacritics`. Sending test message...');
            await ctx.createMessage(msg.replace(/{{mention}}/g, ctx.author.mention));
        }
    }
};

exports.roles = {
    desc: 'Manage special roles used by the bot.',
    usage: '<mute <options>| roleban <options>>',
    async main(bot, ctx) {
        let embed = {
            title: 'Server Settings - Roles',
            description: `Showing current special roles for **${ctx.guild.name}**`,
            fields: [
                {
                    name: 'Muted',
                    value: 'Roles used to mute people.\n'
                    + 'Run `settings roles mute` for more options.',
                    inline: true
                },
                {
                    name: 'Rolebanned',
                    value: 'Role used for rolebanning.\n'
                    + 'Run `settings roles roleban` for more options.',
                    inline: true
                }
            ]
        };

        if (!['mute', 'roleban'].includes(ctx.args[0])) {
            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'mute' && !['add', 'remove', 'list', 'generate'].includes(ctx.args[1])) {
            embed.title = 'Server Settings - Muted Roles';
            embed.description = embed.description.replace('special roles', 'mute roles');
            embed.fields = [
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
            ];

            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'mute' && ctx.args[1] === 'add' && ctx.args[2]) {
            let role = await bot.lookups.roleLookup(ctx, ctx.raw.split(' ').slice(2).join(' '));

            if (ctx.settings.muteRoles.includes(role.id)) return await ctx.createMessage('That role is already a muted role.');

            ctx.settings.muteRoles.push(role.id);

            await bot.editSettings(ctx.guild.id, ctx.settings);
            await ctx.createMessage(`Assigned ${role.mentionable ? `**${role.name}**` : `<@&${role.id}>`} as a muted role.`);
        } else if (ctx.args[0] === 'mute' && ctx.args[1] === 'add') {
            await ctx.createMessage('Please give me a role to add as a muted role.');
        } else if (ctx.args[0] === 'mute' && ctx.args[1] === 'remove' && ctx.args[2]) {
            if (ctx.settings.muteRoles.length === 0) return await ctx.createMessage('There are no muted roles.');

            let role = await bot.lookups.roleLookup(ctx, ctx.raw.split(' ').slice(2).join(' '), false);

            if (!role && !isNaN(ctx.args[2]) && ctx.settings.muteRoles.includes(ctx.args[2])) {
                // Role is deleted, but user used ID that is added as mute role.
                ctx.settings.muteRoles = ctx.settings.muteRoles.filter(r => r !== ctx.args[2]);

                await bot.editSettings(ctx.guild.id, ctx.settings);

                await ctx.createMessage('Removed **deleted role** from muted roles.');
            } else if (!role) {
                await ctx.createMessage('That role could not be found.');
            } else if (role && !ctx.settings.muteRoles.includes(role.id)) {
                await ctx.createMessage('That role is not a muted role.');
            } else {
                // There is a role.
                ctx.settings.muteRoles = ctx.settings.muteRoles.filter(r => r !== role.id);

                await bot.editSettings(ctx.guild.id, ctx.settings);

                await ctx.createMessage(`Removed ${role.mentionable ? `**${role.name}**` : `<@&${role.id}>`} from muted roles.`);
            }
        } else if (ctx.args[0] === 'mute' && ctx.args[1] === 'remove') {
            await ctx.createMessage('Please give me a role to remove as a muted role.');
        } else if (ctx.args[0] === 'mute' && ctx.args[1] === 'list') {
            let roles = ctx.settings.muteRoles.map(r => ctx.guild.roles.get(r) ? `**${ctx.guild.roles.get(r).name} (${r})**` : `**Deleted Role (${r})**`);
            roles = roles.join('\n') || 'No muted roles.';

            embed.title = 'Server Settings - Muted Roles - List';
            embed.description = roles;
            embed.fields = [];

            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'mute' && ctx.args[1] === 'generate') {
            if (!ctx.hasPermission('manageRoles', 'author')) {
                return await ctx.createMessage('You need the **Manage Roles** permission.');
            } else if (!ctx.hasPermission('manageRoles')) {
                return await ctx.createMessage('I need the **Manage Roles** permission.');
            } else if (!ctx.hasPermission('manageChannels')) {
                return await ctx.createMessage('I need the **Manage Channels** permission.');
            } else if (ctx.settings.muteRoles[0]) {
                return await ctx.createMessage('There is already a muted role.');
            }

            await ctx.createMessage('Creating role and editing permissions for all channels. Please be patient...');

            let role = await ctx.guild.createRole({
                name: 'Muted',
                color: 0xF21904
            }, `${bot.formatUser(ctx.author)}: Auto-generating muted role.`);

            await ctx.guild.channels.asyncForEach(async c => {
                await c.editPermission(role.id, 0, 2048, 'role', `${bot.formatUser(ctx.author)}: Editing permission overwrites for auto-generated muted role.`);
            });

            ctx.settings.muteRoles.push(role.id);

            await bot.editSettings(ctx.guild.id, ctx.settings);
            await ctx.createMessage(`Created muted role <@&${role.id}> and edited permissions for each channel.\n`
            + 'You are now free to edit its name, colour, settings and permissions for channels.');
        } else if (ctx.args[0] === 'roleban' && !['set', 'remove', 'generate'].includes(ctx.args[1])) {
            embed.description = embed.description.replace('special roles', 'roleban role');
            embed.fields = [
                {
                    name: 'Role',
                    value: !ctx.settings.rolebanRole ? 'None' : ctx.guild.roles.get(ctx.settings.rolebanRole) ? `${ctx.guild.roles.get(ctx.settings.rolebanRole).name} (${ctx.settings.rolebanRole})` : `Deleted Role (${ctx.settings.rolebanRole})`,
                    inline: true
                },
                {
                    name: 'Set Role',
                    value: 'Run `settings roles roleban set <role>` to set the rolebanned role.',
                    inline: true
                },
                {
                    name: 'Remove Role',
                    value: 'Run `settings roles roleban remove` to remove the rolebanned role.',
                    inline: true
                },
                {
                    name: 'Generate Role',
                    value: 'Run `settings roles roleban generate` to automatically generate a rolebanned role.',
                    inline: true
                }
            ];

            await ctx.createMessage({embed});
        } else if (ctx.args[0] === 'roleban' && ctx.args[1] === 'set' && ctx.args[2]) {
            let role = await bot.lookups.roleLookup(ctx, ctx.raw.split(' ').slice(2).join(' '));

            if (!role) return;

            if (ctx.settings.rolebanRole) {
                await ctx.createMessage('There is already a role set for rolebanning. Would you like to replace it?');
                let m;

                try {
                    m = await bot.awaitMessage(ctx.channel.id, ctx.author.id);
                } catch(err) {
                    if (err instanceof AwaitTimeout) {
                        return await ctx.createMessage('Await timeout expired.');
                    } else {
                        throw err;
                    }
                }

                if (/^no?$/i.test(m.content)) {
                    return await ctx.createMessage("Ok, I won't update the role.");
                } else if (!/^y(es)?$/i.test(m.content)) {
                    return await ctx.createMessage('Invalid response.');
                }

                ctx.settings.rolebanRole = role.id;

                await bot.editSettings(ctx.guild.id, ctx.settings);
                await ctx.createMessage(`Set ${role.mentionable ? `**${role.name}**` : `<@&${role.id}>`} as the roleban role.\n`
                + 'Make sure to give it only one channel which it can see.');
            } else {
                ctx.settings.rolebanRole = role.id;

                await bot.editSettings(ctx.guild.id, ctx.settings);
                await ctx.createMessage(`Set ${role.mentionable ? `**${role.name}**` : `<@&${role.id}>`} as the roleban role.\n`
                + 'Make sure to give it only one channel which it can see.');
            }
        } else if (ctx.args[0] === 'roleban' && ctx.args[1] === 'add') {
            await ctx.createMessage('Please give me a role to set for rolebanning.');
        } else if (ctx.args[0] === 'roleban' && ctx.args[1] === 'remove') {
            if (!ctx.settings.rolebanRole) return await ctx.createMessage('No roleban role set.');

            ctx.settings.rolebanRole = null;

            await bot.editSettings(ctx.guild.id, ctx.settings);
            await ctx.createMessage('Removed roleban role.');
        } else if (ctx.args[0] === 'roleban' && ctx.args[1] === 'generate') {
            if (!ctx.hasPermission('manageRoles', 'author')) {
                return await ctx.createMessage('You need the **Manage Roles** permission.');
            } else if (!ctx.hasPermission('manageRoles')) {
                return await ctx.createMessage('I need the **Manage Roles** permission.');
            } else if (!ctx.hasPermission('manageChannels')) {
                return await ctx.createMessage('I need the **Manage Channels** permission.');
            } else if (ctx.settings.rolebanRole) {
                return await ctx.createMessage('There is already a role set for rolebanning.');
            }

            await ctx.createMessage('Creating role, channel and editing permissions for all channels. Please be patient...');

            let role = await ctx.guild.createRole({
                name: 'Rolebanned'
            }, `${bot.formatUser(ctx.author)}: Auto-generating rolebanned role.`);

            ctx.guild.channels.asyncForEach(async c => {
                await c.editPermission(role.id, 0, 1024, 'role', `${bot.formatUser(ctx.author)}: Editing permission overwrites for auto-generated rolebanned role.`);
            });

            let channel = await ctx.guild.createChannel('rolebanned', 0, `${bot.formatUser(ctx.author)}: Generating channel for auto-generated rolebanned role.`);

            await channel.editPermission(ctx.guild.id, 0, 1024, 'role', `${bot.formatUser(ctx.author)}: Editing generated channel permissions for auto-generated rolebanned role.`);
            await channel.editPermission(role.id, 1024, 0, 'role', `${bot.formatUser(ctx.author)}: Editing generated channel permissions for auto-generated rolebanned role.`);

            ctx.settings.rolebanRole = role.id;

            await bot.editSettings(ctx.guild.id, ctx.settings);
            await ctx.createMessage(`Created rolebanned role <@&${role.id}>, rolebanned channel and edited permissions for each channel.\n`
            + 'You are now free to edit its name and colour.');
        }
    }
};
const States = {true: 'Enabled', false: 'Disabled'};

exports.loadAsSubcommands = true;
exports.commands = [
    'invites',
    'mentions',
    'copypasta',
    'diacritics',
    'exceptions',
    'channel'
];

exports.main = {
    desc: 'Edit settings for the bot.',
    usage: '[setting [option <arguments>]]',
    permissions: {author: 'manageGuild'},
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
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
                        name: '`Copypastas`',
                        value: 'Prevent stupid copypastas like cooldog and set your own custom ones.\n'
                        + `Status: **${States[ctx.settings.copypasta.enabled]}**\n`
                        + 'Run `settings copypasta` to view settings.'
                    },
                    {
                        name: '`Diacritic Spam`',
                        value: 'Stop people from pasting messages or characters with an absurd amount of diacritics.\n'
                        + `Status: **${States[ctx.settings.diacritics.enabled]}**\n`
                        + 'Run `settings diacritics` to view settings.'
                    }
                ];

                ctx.createMessage({embed}).then(resolve).catch(reject);
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
                    }
                ];

                ctx.createMessage({embed}).then(resolve).catch(reject);
            }
        });
    }
};

exports.invites = {
    desc: 'uwu',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
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

                ctx.createMessage({embed}).then(resolve).catch(reject);
            } else if (ctx.args[0] === 'enable') {
                if (!ctx.settings.invites.enabled) {
                    bot.editSettings(ctx.guild.id, {invites: {enabled: true, fake: ctx.settings.invites.fake}}).then(() => {
                        return ctx.createMessage('I will now start cutting through invites.\nPlease make sure that I have the following permissions: **Ban Members**, **Kick Members** and **Manage Messages**.');
                    }).then(resolve).catch(reject);
                } else {
                    ctx.createMessage('I am already cutting through invites.').then(resolve).catch(reject);
                }
            } else if (ctx.args[0] === 'disable') {
                if (ctx.settings.invites.enabled) {
                    bot.editSettings(ctx.guild.id, {invites: {enabled: false, fake: ctx.settings.invites.fake}}).then(() => {
                        return ctx.createMessage('I will now stop cutting through invites.');
                    }).then(resolve).catch(reject);
                } else {
                    ctx.createMessage("I wasn't cutting through invites to begin with.").then(resolve).catch(reject);
                }
            } else if (ctx.args[0] === 'fake') {
                if (ctx.args[1] === 'enable' && !ctx.settings.invites.fake) {
                    bot.editSettings(ctx.guild.id, {invites: {enabled: ctx.settings.invites.enabled, fake: true}}).then(() => {
                        return ctx.createMessage('I will now cut through fake invites.');
                    }).then(resolve).catch(reject);
                } else if (ctx.args[1] === 'enable' && ctx.settings.invites.fake) {
                    ctx.createMessage('I am already cutting through fake invites.').then(resolve).catch(reject);
                } else if (ctx.args[1] === 'disable' && ctx.settings.invites.fake) {
                    bot.editSettings(ctx.guild.id, {invites: {enabled: ctx.settings.invites.enabled, fake: false}}).then(() => {
                        return ctx.createMessage('I will no longer cut through invites.');
                    }).then(resolve).catch(reject);
                } else if (ctx.args[1] === 'disable' && !ctx.settings.invites.fake) {
                    ctx.createMessage("I wasn't cutting through fake invites.").then(resolve).catch(reject);
                } else {
                    ctx.createMessage('Invalid option for `fake`, must either be `enable` or `disable`.').then(resolve).catch(reject);
                }
            } else if (ctx.args[0] === 'kick') {
                let num = Number(Math.abs(ctx.args[1]).toFixed(0));

                if (isNaN(num)) {
                    ctx.createMessage('You can only set kick to a valid number.').then(resolve).catch(reject);
                } else if (num >= ctx.settings.actions.invites.ban) {
                    ctx.createMessage('You cannot set the kick limit to, or higher than the ban limit.').then(resolve).catch(reject);
                } else {
                    let {invites, mentions, copypasta, diacritics} = ctx.settings.actions;
                    let settings = Object.assign({}, ctx.settings, {actions: {
                        invites: {kick: num, ban: invites.ban},
                        mentions,
                        copypasta,
                        diacritics
                    }});
                    bot.editSettings(ctx.guild.id, settings).then(() => {
                        if (num === 0) {
                            return ctx.createMessage('Disabled kicking for invites.');
                        } else {
                            return ctx.createMessage(`Set kick limit to **${num}**.`);
                        }
                    });
                }
            } else if (ctx.args[0] === 'ban') {
                let num = Number(Math.abs(ctx.args[1]).toFixed(0));

                if (isNaN(num)) {
                    ctx.createMessage('You can only set ban to a valid number.').then(resolve).catch(reject);
                } else if (num <= ctx.settings.actions.invites.kick) {
                    ctx.createMessage('You cannot set the ban limit to, or lower than the kick limit.').then(resolve).catch(reject);
                } else if (num === 0) {
                    ctx.createMessage('You cannot disable banning for invites (You can however set it to a ridiculously high number).').then(resolve).catch(reject);
                } else {
                    let {invites, mentions, copypasta, diacritics} = ctx.settings.actions;
                    let settings = Object.assign({}, ctx.settings, {actions: {
                        invites: {kick: invites.kick, ban: num},
                        mentions,
                        copypasta,
                        diacritics
                    }});
                    bot.editSettings(ctx.guild.id, settings).then(() => {
                        return ctx.createMessage(`Set ban limit to **${num}**.`);
                    });
                }
            }
        });
    }
};

exports.mentions = {
    desc: 'uwu',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
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

                ctx.createMessage({embed}).then(resolve).catch(reject);
            } else if (ctx.args[0] === 'enable') {
                if (!ctx.settings.mentions.enabled) {
                    bot.editSettings(ctx.guild.id, {mentions: {enabled: true, trigger: ctx.settings.mentions.trigger}}).then(() => {
                        return ctx.createMessage('I will now start cutting through mass mentions.\nPlease make sure that I have the following permissions: **Ban Members**, **Kick Members** and **Manage Messages**.');
                    }).then(resolve).catch(reject);
                } else {
                    ctx.createMessage('I am already cutting through mass mentions.').then(resolve).catch(reject);
                }
            } else if (ctx.args[0] === 'disable') {
                if (ctx.settings.mentions.enabled) {
                    bot.editSettings(ctx.guild.id, {invites: {enabled: false, fake: ctx.settings.invites.fake}}).then(() => {
                        return ctx.createMessage('I will now stop cutting through mass mentions.');
                    }).then(resolve).catch(reject);
                } else {
                    ctx.createMessage("I wasn't cutting through mass mentions to begin with.").then(resolve).catch(reject);
                }
            } else if (ctx.args[0] === 'trigger') {
                let num = Number(Math.abs(ctx.args[1]).toFixed(0));

                if (isNaN(num)) {
                    ctx.createMesage('You can only set trigger to a valid number.').then(resolve).catch(reject);
                } else if (num === 0) {
                    ctx.createMessage('You cannot set trigger to 0. If you wish to disable mass mention blocking, run `settings channel disable`.').then(resolve).catch(reject);
                } else {
                    bot.editSettings(ctx.guild.id, {mentions: {enabled: ctx.settings.mentions.enabled, trigger: num}}).then(() => {
                        return ctx.createMessage(`Set trigger limit to **${num}**.`);
                    }).then(resolve).catch(reject);
                }
            } else if (ctx.args[0] === 'kick') {
                let num = Number(Math.abs(ctx.args[1]).toFixed(0));

                if (isNaN(num)) {
                    ctx.createMessage('You can only set kick to a valid number.').then(resolve).catch(reject);
                } else if (num >= ctx.settings.actions.mentions.ban) {
                    ctx.createMessage('You cannot set the kick limit to, or higher than the ban limit.').then(resolve).catch(reject);
                } else {
                    let {invites, mentions, copypasta, diacritics} = ctx.settings.actions;
                    let settings = Object.assign({}, ctx.settings, {actions: {
                        invites,
                        mentions: {kick: num, ban: mentions.kick},
                        copypasta,
                        diacritics
                    }});
                    bot.editSettings(ctx.guild.id, settings).then(() => {
                        if (num === 0) {
                            return ctx.createMessage('Disabled kicking for mentions.');
                        } else {
                            return ctx.createMessage(`Set kick limit to **${num}**.`);
                        }
                    });
                }
            } else if (ctx.args[0] === 'ban') {
                let num = Number(Math.abs(ctx.args[1]).toFixed(0));

                if (isNaN(num)) {
                    ctx.createMessage('You can only set ban to a valid number.').then(resolve).catch(reject);
                } else if (num <= ctx.settings.actions.mentions.kick) {
                    ctx.createMessage('You cannot set the ban limit to, or lower than the kick limit.').then(resolve).catch(reject);
                } else if (num === 0) {
                    ctx.createMessage('You cannot disable banning for mentions (You can however set it to a ridiculously high number).').then(resolve).catch(reject);
                } else {
                    let {invites, mentions, copypasta, diacritics} = ctx.settings.actions;
                    let settings = Object.assign({}, ctx.settings, {actions: {
                        invites,
                        mentions: {kick: mentions.kick, ban: num},
                        copypasta,
                        diacritics
                    }});
                    bot.editSettings(ctx.guild.id, settings).then(() => {
                        return ctx.createMessage(`Set ban limit to **${num}**.`);
                    });
                }
            }
        });
    }
};

exports.copypasta = {
    desc: 'uwu',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            let embed = {
                title: 'Server Settings - Copypasta',
                description: `Showing current copypasta settings for **${ctx.guild.name}**.`,
                fields: [
                    {name: '`Status`', value: States[ctx.settings.copypasta.enabled], inline: true},
                    {name: '`Anti-Cooldog`', value: States[ctx.settings.copypasta.cooldog], inline: true},
                    {
                        name: '`Custom Triggerrs`',
                        value: `Amount: **${ctx.settings.copypasta.triggers.length}**\n`
                        + 'Run `settings copypasta triggers` to see current triggers.',
                        inline: true
                    }
                ]
            };

            ctx.createMessage({embed}).then(resolve).catch(reject);
        });
    }
};

exports.diacritics = {
    desc: 'uwu',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            let embed = {
                title: 'Server Settings - Diacritics',
                description: `Showing current diacritic settings for **${ctx.guild.name}**`,
                footer: {text: "'Amount to Trigger' is how many diacritics for a character is needed to trigger the bot."},
                fields: [
                    {name: '`Status`', value: States[ctx.settings.diacritics.enabled], inline: true},
                    {name: '`Amount to Trigger`', value: ctx.settings.diacritics.trigger, inline: true}
                ]
            };

            ctx.createMessage({embed}).then(resolve).catch(reject);
        });
    }
};

exports.exceptions = {
    desc: 'uwu',
    main(bot, ctx) {
        return ctx.createMessage('h');
    }
};

exports.channel = {
    desc: 'uwu',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            if (!ctx.args[0]) {
                let embed = {
                    title: 'Server Settings - Log Channel',
                    description: `Showing current log channel for **${ctx.guild.name}**`,
                    footer: {text: "Run 'settings channel <channel>' to enable logging or change the channel, or run 'settings channel disable' to remove the log channel."},
                    fields: [
                        {name: '`Channel`', value: ctx.settings.logChannel ? `<#${ctx.settings.logChannel}>` : 'None', inline: true}
                    ]
                };

                ctx.createMessage({embed}).then(resolve).catch(reject);
            } else if (ctx.args[0] === 'disable' && ctx.settings.logChannel) {
                bot.editSettings(ctx.guild.id, {logChannel: null}).then(() => {
                    return ctx.createMessage('Removed log channel.');
                }).then(resolve).catch(reject);
            } else if (ctx.args[0] === 'disable') {
                ctx.createMessage("There isn't a log channel set.").then(resolve).catch(reject);
            } else {
                if (/^\d+$/.test(ctx.args[0]) && ctx.args.length === 1) {
                    let chan = ctx.guild.channels.get(ctx.args[0]);
                    
                    if (chan) {
                        bot.editSettings(ctx.guild.id, {logChannel: chan.id}).then(() => {
                            return ctx.createMessage(`Set log channel to <#${chan.id}>`);
                        }).then(resolve).catch(reject);
                    } else {
                        ctx.createMessage('I cannot find that channel. Try mentioning it instead.').then(resolve).catch(reject);
                    }
                } else if (ctx.channelMentions[0] && ctx.guild.channels.get(ctx.channelMentions[0])) {
                    bot.editSettings(ctx.guild.id, {logChannel: ctx.channelMentions[0]}).then(() => {
                        return ctx.createMessage(`Set log channel to <#${ctx.channelMentions[0]}>`);
                    }).then(resolve).catch(reject);
                } else if (ctx.channelMentions[0]) {
                    ctx.createMessage('That channel does not appear to exist in the server.').then(resolve).catch(reject);
                } else {
                    let chan = ctx.guild.channels.find(c => c.name.toLowerCase().includes(ctx.raw.toLowerCase()));

                    if (chan) {
                        bot.editSettings(ctx.guild.id, {logChannel: chan.id}).then(() => {
                            return ctx.createMessage(`Set log channel to <#${chan.id}>`);
                        }).then(resolve).catch(reject);
                    } else {
                        ctx.createMessage('I cannot find that channel. Try mentioning it instead.').then(resolve).catch(reject);
                    }
                }
            }
        });
    }
};
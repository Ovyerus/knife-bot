const States = {true: 'Enabled', false: 'Disabled'};

exports.loadAsSubcommands = true;
exports.commands = [
    'invites',
    'mentions',
    'copypasta',
    'diacritics'
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
                color: bot.hotColour,
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
                        name: '`Actions`',
                        value: 'Change when to kick or ban people.\n'
                        + 'Run `settings actions` to view settings.'
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
                    color: bot.hotColour,
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
                            value: `**${ctx.settings.actions.mentions.kick === 0 ? '0 (disabled)' : ctx.settings.actions.invites.kick}** offences.\n`
                            + 'Key `kick <number>`',
                            inline: true
                        },
                        {
                            name: '`Ban At`',
                            value: `**${ctx.settings.actions.mentions.ban === 0 ? '0 (disabled)' : ctx.settings.actions.invites.ban}** offences.\n`
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
                    ctx.createMessage('You can only set `kick` to a valid number.').then(resolve).catch(reject);
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
                    ctx.createMessage('You can only set `ban` to a valid number.').then(resolve).catch(reject);
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
            let embed = {
                title: 'Server Settings - Mentions',
                description: `Showing current mass-mention settings for **${ctx.guild.name}**.`,
                color: bot.hotColour,
                footer: {text: "'Amount to Trigger' is how many mentions in one message or done fast enough is needed for the bot to be triggered."},
                fields: [
                    {name: '`Status`', value: States[ctx.settings.mentions.enabled], inline: true},
                    {name: '`Amount to Trigger`', value: ctx.settings.mentions.trigger, inline: true}
                ]
            };

            ctx.createMessage({embed}).then(resolve).catch(reject);
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
                color: bot.hotColour,
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
                color: bot.hotColour,
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
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
    permissions: {discord: 'manageGuild', node: 'moderation.settings'},
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            let embed = {
                title: 'Server Settings',
                description: `Showing current settings for **${ctx.guild.name}**.`,
                color: bot.hotColour,
                thumbnail: {url: ctx.guild.iconURL},
                fields: [
                    {
                        name: '`Invite Blocking`',
                        value: 'Block pesky buggers from advertising servers.\n'
                        + `Status: **${ctx.settings.invites.enabled ? 'Enabled' : 'Disabled'}**\n`
                        + 'Run `settings invites` to view settings.'
                    },
                    {
                        name: '`Mass Mentions`',
                        value: 'Prevent people from mass-mentioning/spam-mentioning roles and users.\n'
                        + `Status: **${ctx.settings.mentions.enabled ? 'Enabled' : 'Disabled'}**\n`
                        + 'Run `settings mentions` to view settings.'
                    },
                    {
                        name: '`Copypastas`',
                        value: 'Prevent stupid copypastas like cooldog and set your own custom ones.\n'
                        + `Status: **${ctx.settings.copypasta.enabled ? 'Enabled' : 'Disabled'}**\n`
                        + 'Run `settings copypasta` to view settings.'
                    },
                    {
                        name: '`Diacritic Spam`',
                        value: 'Stop people from pasting messages or characters with an absurd amount of diacritics.\n'
                        + `Status: **${ctx.settings.diacritics.enabled ? 'Enabled' : 'Disabled'}**\n`
                        + 'Run `settings diacritics` to view settings.'
                    }
                ]
            };

            ctx.createMessage({embed}).then(resolve).catch(reject);
        });
    }
};

exports.invites = {
    desc: 'uwu',
    main(bot, ctx) {
        return ctx.createMessage('not implemented yet.');
    }
};

exports.mentions = {
    desc: 'uwu',
    main(bot, ctx) {
        return ctx.createMessage('not implemented yet.');
    }
};

exports.copypasta = {
    desc: 'uwu',
    main(bot, ctx) {
        return ctx.createMessage('not implemented yet.');
    }
};

exports.diacritics = {
    desc: 'uwu',
    main(bot, ctx) {
        return ctx.createMessage('not implemented yet.');
    }
};
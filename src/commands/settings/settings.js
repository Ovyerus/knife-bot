exports.commands = [
    'settings'
];

exports.settings = {
    desc: '[Deprecated] Edit settings for the bot.',
    permissions: {author: 'manageGuild'},
    main(bot, ctx) {
        return ctx.createMessage('This command has been removed, and all the subcommands have been separated into their own commands for ease of use.\n'
        + 'All your old settings have not been touched.\n\n'
        + `**Anti-invites filter**: \`${bot.prefixes[0]}invites\`\n`
        + `**Anti-mass mentions filter**: \`${bot.prefixes[0]}mentions\`\n`
        + `**Anti-diacritics filter**: \`${bot.prefixes[0]}diacritics\`\n`
        + `**Managing exceptions**: \`${bot.prefixes[0]}exceptions\`\n`
        + `**Managing warnings for filters**: \`${bot.prefixes[0]}warnings\`\n`
        + `**Managing log channel**: \`${bot.prefixes[0]}channel\`\n`
        + `**Manging special roles**: \`${bot.prefixes[0]}roles\`\n`);
    }
};
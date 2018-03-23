exports.loadAsSubcommands = true;
exports.commands = [
    'disable'
];

exports.main = {
    desc: 'Manages the log channel for filter notifications.',
    usage: '[channel | disable]',
    permissions: {author: 'manageGuild'},
    async main(bot, ctx) {
        if (!ctx.args[0]) {
            let embed = {
                title: 'Server Settings - Log Channel',
                description: `Showing current log channel for **${ctx.guild.name}**`,
                footer: {text: "Run 'channel <channel>' to enable logging or change the channel, or run 'channel disable' to remove the log channel."},
                fields: [
                    {
                        name: '`Channel`', 
                        value: ctx.settings.logChannel ? `<#${ctx.settings.logChannel}>` : 'None',
                        inline: true
                    }
                ]
            };

            await ctx.createMessage({embed});
        } else {
            let channel = await bot.lookups.textChannelLookup(ctx, ctx.raw);

            if (!channel) return;

            await bot.db[ctx.guild.id].logChannel.set(channel.id);
            await ctx.createMessage(`Set log channel to <#${channel.id}>`);
        }
    }
};

exports.disable = {
    desc: 'Disables the log channel.',
    async main(bot, ctx) {
        if (!ctx.settings.logChannel) return await ctx.createMessage("There isn't a log channel set.");

        await bot.db[ctx.guild.id].logChannel.set(null);
        await ctx.createMessage('Removed log channel.');
    }
};
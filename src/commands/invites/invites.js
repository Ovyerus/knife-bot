const STATES = {true: '<:check:314349398811475968> Enabled', false: '<:xmark:314349398824058880> Disabled'};

exports.loadAsSubcommands = true;
exports.commands = [
    'enable',
    'disable',
    'fake',
    'kick',
    'ban'
];

exports.main = {
    desc: 'Edit invite settings for the bot.',
    usage: '[enabled | disable | fake <enable|disable> | kick <number> | ban <number>]',
    aliases: ['ads', 'antiads', 'antiinvites'],
    permissions: {author: 'manageGuild'},
    async main(bot, ctx) {
        let embed = {
            title: 'Server Settings - Invites',
            description: `Showing current invite settings for **${ctx.guild.name}**.`,
            fields: [
                {
                    name: '`Status`',
                    value: `**${STATES[ctx.settings.invites.enabled]}**\n`
                    + 'Key: `enable|disable`',
                    inline: true
                },
                {
                    name: '`Block Fake Invites?`',
                    value: `**${STATES[ctx.settings.invites.fake]}**\n`
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
    }
};

exports.enable = {
    desc: 'Enables the anti-invite filter.',
    async main(bot, ctx) {
        if (!ctx.settings.invites.enabled) {
            await bot.db[ctx.guild.id].invites.enabled.set(true);
            await ctx.createMessage('I will now start cutting through invites.\n'
            + 'Please make sure that I have the following permissions: **Ban Members**, **Kick Members** and **Manage Messages**.');
        } else await ctx.createMessage('I am already cutting through invites.');
    }
};

exports.disable = {
    desc: 'Disables the anti-invite filter.',
    async main(bot, ctx) {
        if (ctx.settings.invites.enabled) {
            await bot.db[ctx.guild.id].invites.enabled.set(false);
            await ctx.createMessage('I will now stop cutting through invites.');
        } else await ctx.createMessage("I wasn't cutting through invites to begin with.");
    }
};

exports.fake = {
    desc: 'Handles toggling of fake invite detection.',
    usage: '<enable|disable>',
    async main(bot, ctx) {
        if (!['enable', 'disable'].includes(ctx.args[0])) return await ctx.createMessage('Invalid option for `fake`, must either be `enable` or `disable`.');

        if (ctx.args[0] === 'enable' && !ctx.settings.invites.fake) {
            await bot.db[ctx.guild.id].invites.fake.set(true);
            await ctx.createMessage('I will now cut through fake invites.');
        } else if (ctx.args[0] === 'enable' && ctx.settings.invites.fake) {
            await ctx.createMessage('I am already cutting through fake invites.');
        } else if (ctx.args[1] === 'disable' && ctx.settings.invites.fake) {
            await bot.db[ctx.guild.id].invites.set(false);
            await ctx.createMessge('I will no longer cut through fake invites.');
        } else await ctx.createMessage("I wasn't cutting through fake invites.");
    }
};

exports.kick = {
    desc: 'Sets the limit for kicking users due to invites.',
    usage: '<limit>',
    async main(bot, ctx) {
        let num = Number(Math.abs(ctx.args[0]).toFixed(0));

        if (isNaN(num)) return await ctx.createMessage('You can only set the kick limit to a valid number.');
        else if (num >= ctx.settings.actions.invites.ban) return await ctx.createMessage('You cannot set the kick limit to, or higher than the ban limit.');

        await bot.db[ctx.guild.id].actions.invites.kick.set(num);

        if (!num) await ctx.createMessage('Disabled kicking for invites.');
        else await ctx.createMessage(`Set kick limit to **${num}**.`);
    }
};

exports.ban = {
    desc: 'Sets the limit for banning users due to invites.',
    usage: '<limit>',
    async main(bot, ctx) {
        let num = Number(Math.abs(ctx.args[0]).toFixed(0));

        if (isNaN(num)) return await ctx.createMessage('You can only set the ban limit to a valid number.');
        else if (num <= ctx.settings.actions.invites.kick) return await ctx.createMessage('You cannot set the ban limit to, or lower than the kick limit.');
        else if (num === 0) return await ctx.createMessage('You cannot disable the ban limit.');

        await bot.db[ctx.guild.id].actions.invites.ban.set(num);
        await ctx.createMessage(`Set ban limit to **${num}**.`);
    }
};
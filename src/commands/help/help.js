exports.commands = ['help'];

exports.help = {
    desc: 'Show bot help.',
    usage: '[command]',
    aliases: ['commands'],
    async main(bot, ctx) {
        if (!ctx.args[0]) {                
            let cmds = bot.commands.map((cmd, name) => {
                if ((cmd.owner || cmd.hidden) && bot.isOwner(ctx.author.id)) return `**🔪${name}${cmd.usage ? ` \`${cmd.usage}\`` : ''}** - ${cmd.desc}`;
                else if (!cmd.owner && !cmd.hidden) return `**🔪${name}${cmd.usage ? ` \`${cmd.usage}\`` : ''}** - ${cmd.desc}`;
            }).filter(c => c);

            await ctx.createMessage(`${bot.redHot} Slicing into your DMs!`);

            let cmdCollect = [];
            let fieldsPos = 0;
            let embed = {
                title: `${bot.user.username} Help : ${cmds.length} Commands`,
                description: 'Showing help for all commands.\nRun `🔪help <command>` to get more info on a particular command.\n\nA prettier view with notes is available on [**the official website**](https://knife.ovyerus.me).',
                footer: {
                    text: 'Options in <angle brackets> are required, and options in [square brackets] are optional. Do not include the brackets when passing options.'
                },
                fields: []
            };

            for (let cmd of cmds) {
                if (cmdCollect.concat([cmd]).join('\n').length > 1024) {
                    embed.fields[fieldsPos] = {
                        name: '\u200b',
                        value: cmdCollect.join('\n')
                    };
                    cmdCollect = [cmd];
                    fieldsPos++;
                } else cmdCollect.push(cmd);
            }

            if (cmdCollect.length) {
                embed.fields[fieldsPos] = {
                    name: '\u200b',
                    value: cmdCollect.join('\n')
                };
            }

            await ctx.createMessage({embed}, null, 'author');
        } else {
            if (!bot.commands.getCommand(ctx.args[0])) return await ctx.createMessage(`Command \`${ctx.args[0]}\` could not be found. Make sure to check your spelling.`);

            let cmd = bot.commands.getCommand(ctx.args[0]);
            let embed = {
                description: `\`🔪 ${ctx.args[0]}${cmd.usage ? ` ${cmd.usage}` : ''}\n\u200b - ${cmd.desc}\n\u200b\n\u200b - Aliases: ${cmd.aliases.map(a => `"${a}"`).join(', ')}\``
            };

            await ctx.createMessage({embed});
        }
    }
};
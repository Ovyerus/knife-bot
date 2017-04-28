exports.commands = ['help'];

exports.help = {
    desc: 'Show bot help.',
    usage: '[command]',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            if (!ctx.args[0]) {
                let cmds = [];
                
                bot.commands.forEach((cmd, name) => {
                    if (cmd.owner && bot.isOwner(ctx.author.id)) {
                        cmds.push(`🔪 ${name}${cmd.usage ? ` ${cmd.usage}` : ''}`);
                    } else if (cmd.owner) {
                        return;
                    } else {
                        cmds.push(`🔪 ${name}${cmd.usage ? ` ${cmd.usage}` : ''}`);
                    }
                });

                ctx.createMessage(`${bot.redHot} Slicing into your DMs!`).then(() => {
                    let cmdCollect = [];
                    let msgs = [];

                    for (let i in cmds) {
                        cmdCollect.push(cmds[i]);
                        if (i === '29' || Number(i) === cmds.length - 1) {
                            let embed = new embedTemplate(bot);
                            embed.title = bot.isOwner(ctx.author.id) ? `${bot.commands.length} Commands` : `${bot.commands.length - bot.commands.filter(cmd => cmd.owner).length} Commands`;

                            if (cmdCollect.length > 15) {
                                embed.fields[0].value = `\`${cmdCollect.slice(0, 15).join('\n')}\``;
                                embed.fields[1] = {
                                    name: '\u200b',
                                    value: `\`${cmdCollect.slice(15, 30).join('\n')}\``,
                                    inline: true
                                };
                            } else {
                                embed.fields[0].value = `\`${cmdCollect.join('\n')}\``;
                            }

                            cmdCollect = [];
                            msgs.push(ctx.createMessage({embed}, null, 'author'));
                        }
                    }

                    return Promise.all(msgs);
                }).then(resolve).catch(reject);
            } else {
                if (!bot.commands.getCommand(ctx.args[0])) {
                    ctx.createMessage(`Command \`${ctx.args[0]}\` could not be found. Make sure to check your spelling.`);
                } else {
                    let cmd = bot.commands.getCommand(ctx.args[0]);
                    let embed = {
                        description: `\`🔪 ${ctx.args[0]}${cmd.usage ? ` ${cmd.usage}` : ''}\n\u200b - ${cmd.desc}\``
                    };

                    ctx.createMessage({embed}).then(resolve).catch(reject);
                }
            }
        });
    }
};

// TFW cant force JS to gimme a new object when referring to others
function embedTemplate(bot) {
    this.author = {name: `${bot.user.username} Help`};
    this.description = 'Run `🔪 help command` to get more information on how to use the command and what it does.'
    this.fields = [
        {name: '\u200b', inline: true}
    ];
}
exports.commands = ['help'];

exports.help = {
    desc: 'Help command.',
    fullDesc: 'Displays help about all the commands, and optionally for a single command.', 
    usage: '[command]',
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            if (ctx.args.length === 0) {
                let embedTemplate = {title: `${bot.user.username} Help`, color: 0xCDDC39};
                let cmdFields = [];

                bot.commands.forEach((cmd, name) => {
                    if (ctx.author.id !== bot.config.owner && cmd.owner) { //

                    } else {
                        cmdFields.push({name: name, value: `${cmd.usage ? `${cmd.usage} - ` : ''}${cmd.desc}`, inline: true});
                    }
                });

                ctx.createMessage(`${bot.redHot} Slicing into your DMs!`).then(() => {
                    let fieldCollect = [];
                    let msgs = [];
                    
                    for (let i in cmdFields) {
                        fieldCollect.push(cmdFields[i]);
                        if ((Number(i) % 24 === 0 && Number(i) !== 0) || Number(i) === cmdFields.length - 1) {
                            let embed = embedTemplate;
                            embed.fields = fieldCollect;
                            fieldCollect = [];
                            console.log(embed);
                            msgs.push(ctx.createMessage({embed}, null, 'author'));
                        }
                    }

                    return Promise.all(msgs);
                }).then(resolve).catch(reject);
            } else {
                if (!bot.commands.checkCommand(ctx.args[0])) {
                    ctx.createMessage('That command does not exist. Make sure to check your spelling.').then(resolve).catch(reject);
                } else {
                    let cmd = bot.commands.getCommand(ctx.args[0]);
                    let embed = {
                        title: ctx.args[0],
                        description: `${cmd.usage ? `\`${cmd.usage}\` - `: ''}**${cmd.desc}**`,
                        color: 0xCDDC39
                    };

                    ctx.createMessage({embed}).then(resolve).catch(reject);
                }
            }
        });
    }
};
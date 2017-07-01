const fs = require('fs');
const path = require('path');

exports.loadAsSubcommands = true;

exports.commands = [
    'load',
    'unload',
    'reload'
];

exports.main = {
    desc: 'Command for managing modules.',
    longDesc: 'Manages command modules for the bots. If no arguments, lists currently loaded modules, else runs the specified subcommand if possible.',
    usage: '[load|unload|reload]',
    owner: true,
    async main(bot, ctx) {
        let cmdFolders = fs.readdirSync(path.join(__dirname, '../'));
        let unloadedMods = JSON.parse(fs.readFileSync(`${__baseDir}/unloadedCommands.json`));
        let embed = {
            title: 'Current Modules',
            description: `Showing **${cmdFolders.length}** command modules.`,
            fields: [
                {name: 'Loaded Modules', value: []},
                {name: 'Unloaded Modules', value: []}
            ]
        };

        Object.keys(bot.commands.modules).filter(m => !m.endsWith('-fixed')).forEach(mod => {
            embed.fields[0].value.push(`\`${mod}\``);
        });

        unloadedMods.forEach(mod =>  {
            embed.fields[1].value.push(`\`${mod}\``);
        });

        embed.fields[0].value = embed.fields[0].value.join(', ');
        embed.fields[1].value = embed.fields[1].value.join(', ');

        await ctx.createMessage({embed});
    }
};

exports.load = {
    desc: 'Load a module.',
    usage: '<module>',
    async main(bot, ctx) {
        if (!ctx.args[0]) {
            await ctx.createMessage('No module given to load.');
        } else if (bot.commands.checkModule(ctx.args[0])) {
            await ctx.createMessage(`Module **${ctx.args[0]}** already exist's in the command holder.`);
        } else {
            let folders = await readDir(`${__baseDir}/commands`);

            if (folders.indexOf(ctx.args[0]) === -1) {
                await ctx.channel.createMessage(`Module **${ctx.args[0]}** does not exist.`);
            } else {
                let pkg = require(path.join(__dirname,  '../', ctx.args[0], 'package.json'));
                let mod = path.join(__dirname, '../', ctx.args[0], pkg.main);
                bot.commands.loadModule(mod);

                let unloadedMods = JSON.parse(fs.readFileSync(`${__baseDir}/unloadedCommands.json`).toString());

                if (unloadedMods.indexOf(ctx.args[0]) !== -1) {
                    unloadedMods.splice(unloadedMods.indexOf(ctx.args[0]), 1);
                    fs.writeFileSync(`${__baseDir}/unloadedCommands.json`, JSON.stringify(unloadedMods));
                }

                await ctx.createMessage(`Loaded module **${ctx.args[0]}**`);
            }
        }
    }
};

exports.unload = {
    desc: 'Unload a module.',
    usage: '<module>',
    async main(bot, ctx) {
        if (!ctx.args[0]) {
            await ctx.createMessage('No module given to unload.');
        } else if (!bot.commands.checkModule(ctx.args[0])) {
            await ctx.createMessage(`Module **${ctx.args[0]}** is not loaded or does not exist.`);
        } else {
            let pkg = path.join(__dirname, '../', ctx.args[0], 'package.json');

            delete require.cache[require.resolve(pkg)];

            pkg = require(pkg);
            let mod = path.join(__dirname, '../', ctx.args[0], pkg.main);

            bot.commands.unloadModule(mod);
            delete require.cache[require.resolve(mod)];

            let unloadedMods = JSON.parse(fs.readFileSync(`${__baseDir}/unloadedCommands.json`).toString());
            unloadedMods.push(ctx.args[0]);
            fs.writeFileSync(`${__baseDir}/unloadedCommands.json`, JSON.stringify(unloadedMods));

            await ctx.channel.createMessage(`Unloaded module **${ctx.args[0]}**`);
        }
    }
};

exports.reload = {
    desc: 'Reload a module.',
    usage: '<module>',
    async main(bot, ctx) {
        if (!ctx.args[0]) {
            await ctx.createMessage('No module given to reload.');
        } else if (!bot.commands.checkModule(ctx.args[0])) {
            await ctx.createMessage(`Module **${ctx.args[0]}** is not loaded or does not exist.`);
        } else {
            let pkg = path.join(__dirname, '../', ctx.args[0], 'package.json');

            delete require.cache[require.resolve(pkg)];

            pkg = require(pkg);
            let mod = path.join(__dirname, '../', ctx.args[0], pkg.main);

            delete require.cache[require.resolve(mod)];

            bot.commands.reloadModule(mod);

            await ctx.createMessage(`Reloaded module **${ctx.args[0]}**`);
        }
    }
};

function readDir(dir) {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
}
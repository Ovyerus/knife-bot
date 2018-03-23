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
    allowDM: true,
    owner: true,
    async main(bot, ctx) {
        let cmdFolders = fs.readdirSync(path.join(__dirname, '../'));
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

        bot.unloaded.forEach(mod =>  {
            embed.fields[1].value.push(`\`${mod}\``);
        });

        embed.fields[0].value = embed.fields[0].value.join(', ') || 'None';
        embed.fields[1].value = embed.fields[1].value.join(', ') || 'None';

        await ctx.createMessage({embed});
    }
};

exports.load = {
    desc: 'Load a module.',
    usage: '<module>',
    async main(bot, ctx) {
        if (!ctx.args[0]) return await ctx.createMessage('No module given to load.');
        else if (bot.commands.checkModule(ctx.args[0])) return await ctx.createMessage(`Module **${ctx.args[0]}** already exist's in the command holder.`);

        let folders = await Promise.promisify(fs.readdir)(path.resolve(__dirname, '../'));

        if (folders.indexOf(ctx.args[0]) === -1) return await ctx.channel.createMessage(`Module **${ctx.args[0]}** does not exist.`);

        let pkg = JSON.parse(fs.readFileSync(path.join(__dirname,  '../', ctx.args[0], 'package.json')));
        let mod = path.join(__dirname, '../', ctx.args[0], pkg.main);

        bot.commands.loadModule(mod);
        await bot.db.settings.unloaded.remove(ctx.args[0]);
        await ctx.createMessage(`Loaded module **${ctx.args[0]}**`);
    }
};

exports.unload = {
    desc: 'Unload a module.',
    usage: '<module>',
    async main(bot, ctx) {
        if (!ctx.args[0]) return await ctx.createMessage('No module given to unload.');
        else if (!bot.commands.checkModule(ctx.args[0])) return await ctx.createMessage(`Module **${ctx.args[0]}** is not loaded or does not exist.`);

        let pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../', ctx.args[0], 'package.json')));
        let mod = path.join(__dirname, '../', ctx.args[0], pkg.main);

        bot.commands.unloadModule(mod);

        await bot.db.settings.unloaded.push(ctx.args[0]);
        await bot.reloadSettings();
        await ctx.channel.createMessage(`Unloaded module **${ctx.args[0]}**`);
    }
};

exports.reload = {
    desc: 'Reload a module.',
    usage: '<module>',
    async main(bot, ctx) {
        if (!ctx.args[0]) return await ctx.createMessage('No module given to reload.');
        else if (!bot.commands.checkModule(ctx.args[0])) return await exports.load.main(bot, ctx);

        let pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../', ctx.args[0], 'package.json')));
        let mod = path.join(__dirname, '../', ctx.args[0], pkg.main);

        bot.commands.reloadModule(mod);
        await ctx.createMessage(`Reloaded module **${ctx.args[0]}**`);
    }
};
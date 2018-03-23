const fs = require('fs');
const cp = require('child_process');

function exists(module) {
    try {
        require.resolve(module);
        return true;
    } catch(err) {
        return false;
    }
}

module.exports = async bot => {
    let commands = fs.readdirSync(`${__baseDir}/commands`).map(cmd => [`${__baseDir}/commands/${cmd}`, cmd]);
    let allDeps = [];
    let unloaded = await bot.db.settings.unloaded.get;

    bot.logger.custom('loader', 'Preloading commands...');

    for (let [path, name] of commands) {
        if (unloaded.includes(name)) continue;

        let files = fs.readdirSync(path);
        let pkg;

        if (!files.includes('package.json')) {
            bot.logger.customError('loader', `Will not load "${name}" due to missing package.json.`);
            unloaded.push(name);
            continue;
        }

        try {
            pkg = JSON.parse(fs.readFileSync(`${path}/package.json`));
        } catch(err) {
            bot.logger.customError('loader', `Malformed package file for "${name}".`);
            unloaded.push(name);
            continue;
        }

        if (!pkg.dependencies || !Object.keys(pkg.dependencies)[0]) continue;

        for (let [dep, version] of Object.entries(pkg.dependencies)) {
            if (!exists(dep) && !allDeps.includes(dep)) allDeps.push(`${dep}@${version}`);
        }
    }

    if (allDeps.length !== 0) {
        bot.logger.custom('loader', `Installing following dependencies for commands: \x1b[36m"${allDeps.join(', ')}"`);
        cp.execSync(`npm i ${allDeps.join(' ')} --no-save`);
    }

    bot.logger.custom('loader', 'Loading commands...');

    for (let [path, name] of commands) {
        if (unloaded.includes(name)) continue;

        let pkg = JSON.parse(fs.readFileSync(`${path}/package.json`));
        path = `${path}/${pkg.main}`;

        try {
            bot.commands.loadModule(path);
        } catch(err) {
            bot.logger.customError('loader', `Error while loading "${name}"\n${err}${err.stack ? `\n${err.stack.split('\n')[1]}` : ''}`);
            unloaded.push(name);
        }
    }

    await bot.db.settings.unloaded.set(unloaded);
    await bot.reloadSettings();
};
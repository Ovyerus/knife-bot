const moment = require('moment');
const cp = require('child_process');

exports.loadAsSubcommands = true;
exports.commands = ['pull'];

exports.main = {
    desc: 'Show information about latest pulled commit.',
    permission: {node: 'git'},
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            log().then(commits => {
                let [hash, commit] = commits.split('Author: ');
                hash = hash.substring(6).trim();
                let commitTime = moment(Date.parse(commit.split('\n\n')[0].split('\n')[1].replace(/Date:\s+/, '')));

                return ctx.createMessage({embed: {
                    color: 0x1CABB3,
                    title: 'Latest local commit',
                    description: '[GitHub Repo](https://github.com/Ovyerus/knife-bot)',
                    fields: [
                        {name: 'Commit Hash', value: hash},
                        {name: 'Author', value: commit.split('<')[0].trim()},
                        {name: 'Message', value: commit.split('\n\n')[1].trim()}
                    ],
                    footer: {text: `Commited on ${commitTime.format('dddd Do MMMM Y')} at ${commitTime.format('HH:mm:ss A')}`}
                }});
            }).then(resolve).catch(reject);
        });
    }
};

exports.pull = {
    desc: 'Pull the latest changes from GitHub',
    owner: true,
    main(bot, ctx) {
        pull().then(log).then(commits => {
            let [hash, commit] = commits.split('Author: ');
            hash = hash.substring(6).trim();
            let commitTime = moment(Date.parse(commit.split('\n\n')[0].split('\n')[1].replace(/Date:\s+/, '')));

            return ctx.createMessage({
                content: 'Pulled latest commit and ready to restart.',
                embed: {
                    color: 0x1CABB3,
                    title: 'Latest local commit',
                    description: '[GitHub Repo](https://github.com/Ovyerus/knife-bot)',
                    fields: [
                        {name: 'Commit Hash', value: hash},
                        {name: 'Author', value: commit.split('<')[0].trim()},
                        {name: 'Message', value: commit.split('\n\n')[1].trim()}
                    ],
                    footer: {text: `Commited on ${commitTime.format('dddd Do MMMM Y')} at ${commitTime.format('HH:mm:ss A')}`}
                }
            });
        }).then(resolve).catch(reject);
    }
};

function log() {
    return new Promise(resolve => {
        cp.exec('git log', (err, stdout, stderr) => {
            if (err) throw err;
            if (stderr) throw stderr;
            resolve(stdout.toString());
        });
    });
}

function pull() {
    return new Promise(resolve => {
        cp.exec('git pull origin master', (err, stdout, stderr) => {
            if (err) throw err;
            if (stderr) throw stderr;
            resolve();
        });
    });
}
const moment = require('moment');
const cp = require('child_process');
const got = require('got');

exports.loadAsSubcommands = true;
exports.commands = ['pull'];

exports.main = {
    desc: 'Show information about latest pulled commit.',
    permission: {node: 'git'},
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            let outer = {};
            log().then(commits => {
                let [hash, commit] = commits.split('Author: ');
                outer.commit = commit;
                outer.hash = hash.substring(6).trim().substring(0, 6);
                outer.commitTime = moment(Date.parse(commit.split('\n\n')[0].split('\n')[1].replace(/Date:\s+/, '')));
                outer.author = commit.split('<')[0].trim();

                return got(`https://api.github.com/users/${outer.author}`);
            }).then(res => {
                let user = JSON.parse(res.body);

                return ctx.createMessage({embed: {
                    color: 0x1CABB3,
                    title: 'GitHub Repository',
                    url: 'https://github.com/Ovyerus/knife-bot',
                    author: {
                        name: outer.author,
                        url: user.html_url,
                        icon_url: user.avatar_url
                    },

                    fields: [
                        {name: `\`${outer.hash}\``, value: outer.commit.split('\n\n')[1].trim()}
                    ],
                    footer: {text: `Commited on ${outer.commitTime.format('dddd Do MMMM Y')} at ${outer.commitTime.format('HH:mm:ss A')}`}
                }});
            }).then(resolve).catch(reject);
        });
    }
};

exports.pull = {
    desc: 'Pull the latest changes from GitHub',
    owner: true,
    main(bot, ctx) {
        let outer = {};
        pull().then(log).then(commits => {
            let [hash, commit] = commits.split('Author: ');
            outer.commit = commit;
            outer.hash = hash.substring(6).trim().substring(0, 6);
            outer.commitTime = moment(Date.parse(commit.split('\n\n')[0].split('\n')[1].replace(/Date:\s+/, '')));
            outer.author = commit.split('<')[0].trim();

            return got(`https://api.github.com/users/${outer.author}`);
        }).then(res => {
            let user = JSON.parse(res.body);

            return ctx.createMessage({embed: {
                color: 0x1CABB3,
                title: 'GitHub Repository',
                url: 'https://github.com/Ovyerus/knife-bot',
                author: {
                    name: outer.author,
                    url: user.html_url,
                    icon_url: user.avatar_url
                },
                fields: [
                    {name: `\`${outer.hash}\``, value: outer.commit.split('\n\n')[1].trim()}
                ],
                footer: {text: `Commited on ${outer.commitTime.format('dddd Do MMMM Y')} at ${outer.commitTime.format('HH:mm:ss A')}`}
            }});
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
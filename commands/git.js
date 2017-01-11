const Promise = require('bluebird');
const cp = require('child_process');
const fs = require('fs');

exports.cmd = {
    description: 'Git command.',
    func: (knife, msg, args) => {
        return new Promise((resolve, reject) => {
            if (args.length === 0 || args[0] !== 'pull') {
                let hash = fs.readFileSync('./.git/FETCH_HEAD').toString('utf8').split('\t')[0];
                let commit = fs.readFileSync('./.git/logs/HEAD').toString('utf8').split(hash)[1];
                knife.createMessage(msg.channel.id, {
                    embed: {
                        color: 0x1CABB3,
                        title: 'Latest local commit',
                        description:'[GitHub Repo](https://github.com/Ovyerus/knife-bot)',
                        fields: [
                            {name: 'Commit Hash', value: hash},
                            {name: 'Author', value: commit.split('<')[0]},
                            {name: 'Message', value: commit.split('\t')[1].substring(7).trim()}
                        ],
                        footer: {text: 'Commit Date'},
                        timestamp: new Date(Number(commit.split('>')[1].split('\t')[0].trim().split(' ')[0]) * 1000)
                    }
                }).then(() => resolve()).catch(reject);
            } else if (args[0] === 'pull') {
                if (msg.author.id !== knife.owner) {
                    let hash = fs.readFileSync('./.git/FETCH_HEAD').toString('utf8').split('\t')[0];
                    let commit = fs.readFileSync('./.git/logs/HEAD').toString('utf8').split(hash)[1];
                    knife.createMessage(msg.channel.id, {
                        embed: {
                            color: 0x1CABB3,
                            title: 'Latest local commit',
                            description:'[GitHub Repo](https://github.com/Ovyerus/knife-bot)',
                            fields: [
                                {name: 'Commit Hash', value: hash},
                                {name: 'Author', value: commit.split('<')[0]},
                                {name: 'Message', value: commit.split('\t')[1].substring(7).trim()}
                            ],
                            footer: {text: 'Commit Date'},
                            timestamp: new Date(Number(commit.split('>')[1].split('\t')[0].trim().split(' ')[0]) * 1000)
                        }
                    }).then(() => resolve()).catch(reject);
                } else {
                    cp.exec('git pull origin master', (err, stdout, stderr) => {
                        if (err) {
                            reject(err);
                        } else {
                            let hash = fs.readFileSync('./.git/FETCH_HEAD').toString('utf8').split('\t')[0];
                            let commit = fs.readFileSync('./.git/logs/HEAD').toString('utf8').split(hash)[1];
                            knife.createMessage(msg.channel.id, {
                                embed: {
                                    color: 0x1CABB3,
                                    title: 'Pulled latest commit from GitHub',
                                    description:'[GitHub Repo](https://github.com/Ovyerus/knife-bot)',
                                    fields: [
                                        {name: 'Commit Hash', value: hash},
                                        {name: 'Author', value: commit.split('<')[0]},
                                        {name: 'Message', value: commit.split('\t')[1].substring(7).trim()}
                                    ],
                                    footer: {text: 'Commit Date'},
                                    timestamp: new Date(Number(commit.split('>')[1].split('\t')[0].trim().split(' ')[0]) * 1000)
                                }
                            }).then(() => resolve()).catch(reject);
                        }
                    });
                }
            }
        });
    }
}
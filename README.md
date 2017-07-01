# knife-bot
[![Code Climate](https://codeclimate.com/github/Ovyerus/knife-bot/badges/gpa.svg)](https://codeclimate.com/github/Ovyerus/knife-bot) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Simple, open-source moderation bot for Discord.

## Features
- Configurable auto-moderation of mass mentions and server invites.
- Robust purge commands.
- Memes.

## Requirements
At least [Node.JS](https://nodejs.org/) v7.0.0 is required for the bot to run as it makes use of the async/await feature which is not in v6.X.X. [RethinkDB](https://www.rethinkdb.com/) is also required for storing settings for guilds and strikes for users.

The bot requires a `config.json` in the same directory as `bot.js` in order to function. This contains settings such as the bot's token and owner ID.
I will not be providing an example for this, so you will need to read the code in order to find out what you need.

# Contributing
If you wish to contribute to knife-bot, make sure to follow the guidelines. If it doesn't the PR will most likely not get merged.

## Code Style
Please make sure that any code submitted follows the code style of the rest of the project.  
You can get a good understanding of the code style by skimming over the project, however I suggest installing [ESLint](http://eslint.org) and using a code editor like [VSCode](https://code.visualstudio.com) with a plugin for ESLint that checks the code as you type it.

Another thing to keep in mind is to try and use features of ES6+, eg. arrow functions, template literals, etc. Remember that arrow functions do not change the scope of `this`, so if you need the scope of `this` changed for whatever reason, you'll need to use regular `function() {}`.

For async functions, we use the ES7 `async/await` syntax, as it makes it easier to control code flow, and is easier to read than Promises spewed around everywhere. If you need to Promisify a function (eg. one that uses callbacks), or have some other situation where you absolutely *have* to use Promises instead of async await, then that is fine, as they are awaitable.

#### Examples of using async/await and Promises
```js
exports.command = {
    // ...
    async main(bot, ctx) {
        // Do stuff
        await promisifiedFunction();
        // Do more stuff
    }
};

function promisifiedFunction() {
    return new Promise((resolve, reject) => {
        someFunctionWithACallBack((err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}
```

## Licensing
When you submit code in a PR, the code will be claimed under the current license of the repository. If you are submitting private code under a private, non OSS, license and you do not agree with this statement, then do not submit the code.

## Code Quality
Code styling and code quality are checked by [CodeClimate](https://codeclimate.com/github/Ovyerus/knife-bot).  
If the check does not pass, or is not an A, your PR will most likely not be merged until this is fixed.
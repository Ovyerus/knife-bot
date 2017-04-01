const {parseArgs, parsePrefix} = require(`${__dirname}/src/modules/messageParser`);

parsePrefix('! say hello world', ['!', '?']).then(res => {
    if (res !== ' say hello world') throw ['#1 Prefix parser', new Error(`Expected ' say hello world', instead got '${res}'`)];
    
    console.log('#1 Prefix parser test passed.');
    return parsePrefix('[] say hello world', [/^\[\] ?/]);
}).then(res => {
    if (res !== 'say hello world') throw ['#2 Prefix parser', new Error(`Expected 'say hello world', instead got '${res}'`)];

    console.log('#2 Prefix parser test passed.');
    return parsePrefix('()?>{}say hello world', ['{}']);
}).then(res => {
    if (res !== null) throw ['#3 Prefix parser', new Error(`Expected null value, instead got '${res}'`)];

    console.log('#3 Prefix parser test passed.');
    process.exit();
}).catch(err => {
    if (Array.isArray(err)) {
        console.error(`${err[0]} test failed. Reason: ${err[1]}`);
    } else {
        console.error(`Tests failed: ${err}`);
        process.exit(1);
    }
});
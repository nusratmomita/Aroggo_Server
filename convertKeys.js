const fs = require('fs');
const key = fs.readFileSync('./aroggo-e998e-firebase-adminsdk.json')
const base64 = Buffer.from(key).toString('base64');
// console.log(base64)
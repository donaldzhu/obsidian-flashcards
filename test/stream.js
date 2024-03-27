const fs = require('fs')
const path = require('path')
const json = require('big-json')


const readStream = fs.createReadStream('src/data/JMdict_map.json')
const parseStream = json.createParseStream()

parseStream.on('data', function (pojo) {
  console.log(typeof pojo)
})

readStream.pipe(parseStream)

const fs = require('fs')
const _ = require('lodash')

const dict = fs.readFileSync('src/data/JMdict.json', 'utf8')
const parsedDict = JSON.parse(dict)

const firstChars = Object.keys(parsedDict).map(key => key[0])

const occurrences = firstChars.reduce((prev, curr) => {
  prev[curr] ??= 0
  prev[curr]++
  return prev
}, {})

const MAX = 12113

const results = []

for (const char in occurrences) {
  const occurrence = occurrences[char]
  const lastGroup = _.last(results)

  if (lastGroup && lastGroup.total + occurrence <= MAX) {
    lastGroup.total += occurrence
    lastGroup.chars.push(char)
  } else {
    results.push({
      total: occurrence,
      chars: [char]
    })
  }
}
console.log(results.length)

//console.log(Math.max(...Object.values(occurrences)))
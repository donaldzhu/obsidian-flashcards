const fs = require('fs')
const xml2js = require('xml2js')
const _ = require('lodash')

const parser = new xml2js.Parser()

const xmlString = fs.readFileSync('src/data/JMdict.xml', 'utf8')


parser.parseString(
  xmlString.replaceAll(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;'),
  (err, result) => {
    if (err) throw err
    const entries = result.JMdict.entry
    const charMap = {}

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const kana = entry.r_ele[0].reb
      const kanji = (entry.k_ele ?? [])[0]?.keb
      const key = `${kana[0]}${kanji ? `|${kanji[0]}` : ''}`
      if (kana.length > 1 || kanji?.length > 1) console.log(key)

      const firstChar = key[0]
      const charOccurrence = charMap[firstChar] ??= {}
      const keyedEntries = charOccurrence[key] ??= []
      keyedEntries.push(entry)
    }

    for (const char in charMap) {
      const entries = charMap[char]
      fs.writeFileSync(`src/data/JMDict/${char}.json`, JSON.stringify(_.toPairs(entries)))
    }

    fs.writeFileSync('src/data/JMDictIndices.ts',
      `const jmDictIndices = [\n  ${Object.keys(charMap).map(char => `'${char}'`).join(',\n  ')}\n] as const\n\n` +
      `export default jmDictIndices`
    )
  }
)
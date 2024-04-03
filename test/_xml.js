const fs = require('fs')
const xml2js = require('xml2js')

const parser = new xml2js.Parser()

const xmlString = fs.readFileSync('src/data/JMdict.xml', 'utf8')

parser.parseString(xmlString.replaceAll(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;'), function (err, result) {
  if (err) throw err
  // const a = result.JMdict.entry.map(entry =>

  //   //  ...entry.r_ele.map(rele => rele.reb),
  //   entry.k_ele?.map(rele => rele.keb) || []

  // )

  const json = JSON.stringify(result.JMdict.entry)
  fs.writeFileSync('src/data/JMdict_Full.json', json)
})
// [entry.r_ele.map(rele => rele.reb), entry.k_ele?.map(rele => rele.keb)]

parser.parseString(xmlString.replaceAll(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;'), function (err, result) {
  if (err) throw err


  const entries = result.JMdict.entry
  const keyedEntries = {}
  const debugEntries = {}

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const kana = entry.r_ele[0].reb
    const kanji = (entry.k_ele ?? [])[0]?.keb
    const key = `${kana[0]}${kanji ? `|${kanji[0]}` : ''}`
    if (kana.length > 1 || kanji?.length > 1) console.log(key)

    const entryArray = keyedEntries[key] ??= []
    entryArray.push(entry)

    if (entryArray.length > 1) debugEntries[key] = entryArray
  }

  fs.writeFileSync('src/data/JMdict_debug.json', JSON.stringify(debugEntries))
  // fs.writeFileSync('src/data/JMdict_map.json', JSON.stringify(keyedEntries))
})
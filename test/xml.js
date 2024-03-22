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

  const json = JSON.stringify(result.JMdict.entry.slice(0,100))
  fs.writeFileSync('src/data/JMdict.json', json)
})
// [entry.r_ele.map(rele => rele.reb), entry.k_ele?.map(rele => rele.keb)]
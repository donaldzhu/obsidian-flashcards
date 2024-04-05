const axios = require('axios')

const search = async word => {
  const jotobaRes = (await axios.post('https://jotoba.de/api/search/words', {
    query: word,
    language: 'English'
  })).data
  const sentences = (await axios.post('https://jotoba.de/api/search/sentences', {
    query: word,
    language: 'English'
  })).data.sentences
    .slice(0, 5)
  // .map(sentence =>
  //   ({ content: sentence.content, translation: sentence.translation }))

  const jotobaWord = jotobaRes.words[0]

  const definitions = jotobaWord.senses.map(sense => sense.glosses.join(', '))
  const partsOfSpeech = jotobaWord.senses[0].pos
  const reading = jotobaWord.reading.furigana
  const pitch = jotobaWord.pitch?.reduce((prev, curr, i) => {
    return prev + (curr.high ? '↑' : i ? '↓' : '') + curr.part
  }, '')
  const audio = jotobaWord.audio ? 'https://jotoba.de' + jotobaWord.audio : undefined

  console.log({
    definitions,
    partsOfSpeech,
    reading,
    pitch,
    audio,
    sentences,
  })
}

const search1 = async word => {

  // jisho.searchForPhrase(word).then(result => {
  //   const { senses } = result.data[0]
  //   senses.map(sense => console.log(sense.tags))
  // })

  const jotobaRes = (await axios.post('https://jotoba.de/api/search/words', {
    query: word,
    language: 'English'
  })).data

  const { words } = jotobaRes
  const results = words.map(word => ({
    solution: word.reading.kanji,
    definition: word.senses[0].glosses.join(', ')
  }))
  // words[0].senses.map(sense => console.log(sense))


  // console.log(words.map(word => word.pitch))
  //console.log(words.map(word => word.senses).map(sense => JSON.stringify((sense[0].pos))))
  console.log(words.map(word => word.senses).map(sense => [sense[0].glosses, sense[0].misc]))
}


search1('臥す')



const pos = {
  'adj-f': [
    { Adjective: 'PreNounVerb' },
    'Pre-noun Adjetival Noun/Verb'
  ],
  'adj-i': [
    { Adjective: 'Keiyoushi' },
    'い-Adjective'
  ],
  'adj-ix': [
    { Adjective: 'KeiyoushiYoiIi' },
    'いい/よい-Adjective'
  ],
  'adj-ku': [
    { Adjective: 'Ku' },
    'く-Adjective (Arch.)'
  ],
  'adj-na': [
    { Adjective: 'Na' },
    'な-Adjedctive'
  ],
  'adj-nari': [
    { Adjective: 'Nari' },
    'な-Adjedctive (Arch.)'
  ],
  'adj-no': [
    { Adjective: 'No' },
    'Adjedctive (〜の)'
  ],
  'adj-pn': [
    { Adjective: 'PreNoun' },
    'Pre-noun Adjedctive'
  ],
  'adj-shiku': [
    { Adjective: 'Shiku' },
    'しく-Adjedctive'
  ],
  'adj-t': [
    { Adjective: 'Taru' },
    'たる-Adjedctive'
  ],
  'adv': [
    'Adverb',
    'Adverb'
  ],
  'adv-to': [
    'AdverbTo',
    'Adverb (〜と)'
  ],
  'aux-adj': [
    'AuxilaryAdj',
    'Auxilary Adjective'
  ],
  'aux-v': [
    'AuxilaryVerb',
    'Auxilary Verb'
  ],

  'n': [
    { Noun: 'Normal' },
    'Noun'
  ],
  'n-pref': [
    { Noun: 'Prefix' },
    'Noun (Prefix)'
  ],
  'n-suf': [
    { Noun: 'Suffix' },
    'Noun (Suffix)'
  ],
  'v-unspec': [
    { Verb: 'Unspecified' },
    'Verb (Unspecified)'
  ],
  'v1': [
    { Verb: 'Ichidan' },
    'る-Verb'
  ],
  'v1-s': [
    { Verb: 'IchidanKureru' },
    'る-Verb (くれる)'
  ],
  'v2*': [
    { Verb: { Nidan: '*' } },
    'Verb (二段)'
  ],
  'v4*': [
    { Verb: { Yodan: '*' } },
    'Verb (四段)'
  ],
  'v5aru': [
    { Verb: { Godan: 'Aru' } },
    'う-Verb (ある)'
  ],
  'v5b': [
    { Verb: { Godan: 'Bu' } },
    'う-Verb (ぶ)'
  ],
  'v5g': [
    { Verb: { Godan: 'Gu' } },
    'う-Verb (ぐ)'
  ],
  'v5k': [
    { Verb: { Godan: 'Ku' } },
    'う-Verb (く)'
  ],
  'v5k-s': [
    { Verb: { Godan: 'IkuYuku' } },
    'う-Verb (いく)'
  ],
  'v5m': [
    { Verb: { Godan: 'Mu' } },
    'う-Verb (む)'
  ],
  'v5n': [
    { Verb: { Godan: 'Nu' } },
    'う-Verb (ぬ)'
  ],
  'v5r': [
    { Verb: { Godan: 'Ru' } },
    'う-Verb (る)'
  ],
  'v5r-i': [
    { Verb: { Godan: 'RuIrreg' } },
    'う-Verb (る - Irregular)'
  ],
  'v5s': [
    { Verb: { Godan: 'Su' } },
    'う-Verb (す)'
  ],
  'v5t': [
    { Verb: { Godan: 'Tsu' } },
    'う-Verb (つ)'
  ],
  'v5u': [
    { Verb: { Godan: 'U' } },
    'う-Verb (う)'
  ],
  'v5u-s': [
    { Verb: { Godan: 'USpecial' } },
    'う-Verb (う - Special)'
  ],
  'vi': [
    { Verb: 'Intransitive' },
    'Verb (Intransitive)'
  ],
  'vk': [
    { Verb: { Godan: 'Kuru' } },
    'くる-Verb'
  ],
  'vn': [
    { Verb: { Irregular: 'Nu' } },
    'Irregular Verb (ぬ)'
  ],
  'vr': [
    { Verb: { Irregular: 'Ru' } },
    'Irregular Verb (る)'
  ],
  'vs': [
    { Verb: { Irregular: 'NounOrAuxSuru' } },
    'Noun/Auxilary する-Verb'
  ],
  'vs-c': [
    { Verb: { Irregular: 'Su' } },
    'す-Verb'
  ],
  'vs-i': [
    { Verb: { Irregular: 'Suru' } },
    'する-Verb'
  ],
  'vs-s': [
    { Verb: { Irregular: 'SuruSpecial' } },
    'する-Verb (Special)'
  ],
  'vt': [
    { Verb: 'Transitive' },
    'Verb (Transitive)'
  ],
  'vz': [
    { Verb: 'IchidanZuru' },
    'ずる-Verb'
  ]
}

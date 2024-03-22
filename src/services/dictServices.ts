import fs from 'fs'
import _ from 'lodash'
import xml2js from 'xml2js'

import { filterFalsy, mightInclude } from '../utils/util'
import httpServices from './httpServices'

import type { Falsey } from 'lodash'
import type { JishoResult } from 'unofficial-jisho-api'
import type { FuzzyResult, JotobaSentence, JotobaWordsRes, ParsedPos, ExampleSentence, PartsOfSpeech } from './dictTypes'

export const JOTOBA_URL = 'https://jotoba.de'
const JOTOBA_SEARCH_URL = JOTOBA_URL + '/api/search'
const JOTOBA_WORDS_URL = JOTOBA_SEARCH_URL + '/words'
const JOTOBA_SENTENCES_URL = JOTOBA_SEARCH_URL + '/sentences'
const JISHO_WORDS_URL = 'https://jisho.org/api/v1/search/words'


//@ts-ignore
const xmlString = fs.readFileSync(app.vault.adapter.basePath + '/.obsidian/plugins/view-test/src/data/JMdict.xml', 'utf8')
const xml = xml2js.parseStringPromise(xmlString.replaceAll(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;'))


const getConfig = (word: string) => ({
  query: word,
  language: 'English'
})

const search = async (word: string) => {
  const jotobaConfig = getConfig(word)
  const jotobaRes: JotobaWordsRes = (await httpServices.post(JOTOBA_WORDS_URL, jotobaConfig)).data
  const sentences = ((await httpServices.post(JOTOBA_SENTENCES_URL, jotobaConfig))
    .data.sentences as JotobaSentence[])
    .slice(0, 5)
    .map(sentence => _.pick(sentence, ['content', 'translation']))

  const jotobaWord = jotobaRes.words[0]

  const definitions = jotobaWord.senses.map(sense => sense.glosses.join(', '))
  const partsOfSpeech = jotobaWord.senses[0].pos
  const reading = jotobaWord.reading.furigana
  const pitch = jotobaWord.pitch?.reduce((prev, curr, i) => {
    return prev + (curr.high ? '↑' : i ? '↓' : '') + curr.part
  }, '')
  const audio = jotobaWord.audio ? JOTOBA_URL + jotobaWord.audio : undefined

  const result = {
    definitions,
    partsOfSpeech,
    reading,
    pitch,
    audio,
    sentences,
  }

  console.log(result)
  return result
}

const jishoSearch = (word: string) => {
  const uri = `${JISHO_WORDS_URL}?keyword=${encodeURIComponent(word)}`
  // @ts-expect-error
  return request(uri) as Promise<string>
}


const fuzzySearch = async (word: string) => {
  const jotobaConfig = getConfig(word)

  const jotobaRes = (await httpServices.post<JotobaWordsRes>(JOTOBA_WORDS_URL, jotobaConfig)).data
  // @ts-ignore
  const jishoRes = (JSON.parse(await jishoSearch(word))).data as JishoResult[]

  console.log(jishoRes)
  const xmlEntries = (await xml).JMdict.entry

  const results: FuzzyResult[] = jotobaRes.words.map(word => {
    const { furigana } = word.reading
    // console.log(word.reading.kanji, word.reading.kana)
    // @ts-expect-error
    const matched = xmlEntries.find(entry => {
      const matchKanji = entry.k_ele && word.reading.kanji ?
        entry.k_ele[0].keb[0] === word.reading.kanji : true
      const matchKana = word.reading.kana === entry.r_ele[0].reb[0]

      if (matchKanji && matchKana) console.log(((entry.k_ele || [])[0]?.keb), entry.r_ele[0].reb)
      return matchKanji && matchKana
    })

    // console.log('matched', matched)
    if (!matched) console.log(word.reading.kana)
    return {
      furigana,
      kanji: word.reading.kanji,
      kana: word.reading.kana,
      definitions: word.senses.map(sense => sense.glosses.join(', ')),
      partsOfSpeech: word.senses.map(sense => sense.pos),
      // miscs: word.senses.map(sense => jishoRes.find(jishoSense =>
      //   jishoSense.senses)),
      pitch: word.pitch?.reduce((prev, curr, i) => {
        return prev + (curr.high ? '↑' : i ? '↓' : '') + curr.part
      }, ''),
      audio: word.audio ? JOTOBA_URL + word.audio : undefined,
      isCommon: word.common
    }
  })

  results.sort((resultA, resultB) => {
    if (resultA.kana === word && resultB.kana !== word) return -1
    if (resultA.kana !== word && resultB.kana === word) return 1

    if (resultA.isCommon && !resultB.isCommon) return -1
    if (!resultA.isCommon && resultB.isCommon) return 1

    return -1
  })

  console.log('Fuzzy:', results)
  return results
}

const searchSentence = async (word: string): Promise<ExampleSentence[]> => {
  const jotobaConfig = getConfig(word)
  const sentences = ((await httpServices.post(JOTOBA_SENTENCES_URL, jotobaConfig))
    .data.sentences as JotobaSentence[])
    .slice(0, 10)
    .map(sentence => _.pick(sentence, ['content', 'furigana', 'translation']))
  return sentences
}

const furiganaToRuby = (furigana: string) => {
  return furigana.replaceAll(
    /\[[一-龠ぁ-ゔァ-ヴーa-zA-Z0-9ａ-ｚＡ-Ｚ０-９々〆〤ヶ|]*\]/gui,
    match => {
      const furiganaArray = match.slice(1, match.length - 1).split('|')
      const kanji = furiganaArray.shift()?.split('') || []
      const result = `<ruby>${furiganaArray.map((kana, i) => `${kanji[i]}<rt>${kana}</rt>`).join('')}</ruby>`
      return result
    }
  )
}

const parseDictPos = (pos: PartsOfSpeech): ParsedPos => {
  const result: ParsedPos = {
    type: undefined,
    tag: undefined,
    adjType: undefined,
    adjSpecialSuffix: undefined,
    verbType: undefined,
    verbSuffix: undefined,
    verbSpecialSuffix: undefined,
    isPrefix: false,
    isSuffix: false,
    isAuxilary: false,
    isPreNounVerb: false,
    isTransitiveVerb: false,
    isPreNounAdj: false
  };

  (() => {
    if (pos === 'Unclassified') return
    if (pos === undefined) return result.type = 'coupla'

    if (mightInclude([
      'Conjuction',
      'Counter',
      'Expression',
      'Interjection',
      'Numeric',
      'Pronoun',
      'Particle'
    ] as const, pos))
      return result.type = pos.toLocaleLowerCase() as Lowercase<typeof pos>

    if (pos === 'Adverb' || pos === 'AdverbTo') {
      if (pos === 'AdverbTo') result.tag = '〜と'
      result.type = 'adverb'
      return
    }

    if (pos === 'Auxilary' || pos === 'AuxilaryAdj' || pos === 'AuxilaryVerb') {
      result.isAuxilary = true
      result.type = pos === 'AuxilaryAdj' ? 'adjective' :
        pos === 'AuxilaryVerb' ? 'verb' : undefined
      return
    }

    if (pos === 'Prefix') return result.isPrefix = true
    if (pos === 'Suffix') return result.isSuffix = true

    if ('Noun' in pos) {
      const nounType = pos.Noun
      if (nounType === 'Prefix') result.isPrefix = true
      if (nounType === 'Suffix') result.isSuffix = true
      result.type = 'noun'
      return
    }

    if ('Verb' in pos) {
      result.type = 'verb'
      const verbType = pos.Verb
      if (verbType === 'Unspecified' || verbType === 'Intransitive') return
      if (verbType === 'Transitive') return result.isTransitiveVerb = true

      if (mightInclude(['Ichidan', 'IchidanKureru', 'IchidanZuru'] as const, verbType)) {
        result.verbType = 'る'
        result.verbSpecialSuffix = verbType === 'IchidanKureru' ? 'くれる' :
          verbType === 'IchidanZuru' ? 'ずる' : undefined
        return
      }

      if ('Nidan' in verbType) return result.tag = '二段'
      if ('Yodan' in verbType) return result.tag = '四段'
      if ('Godan' in verbType) {
        const godanType = verbType.Godan
        if (godanType === 'Kuru') return result.verbType = 'くる'

        result.verbSuffix =
          godanType === 'Bu' ? 'ぶ' :
            (godanType === 'Ku' || godanType === 'IkuYuku') ? 'く' :
              godanType === 'Gu' ? 'ぐ' :
                godanType === 'Mu' ? 'む' :
                  godanType === 'Nu' ? 'ぬ' :
                    godanType === 'Tsu' ? 'つ' :
                      godanType === 'Su' ? 'す' :
                        (godanType === 'Ru' || godanType === 'RuIrreg' || godanType === 'Aru') ? 'る' :
                          (godanType === 'U' || godanType === 'USpecial') ? 'う' : undefined

        result.verbType = 'う'
        result.verbSpecialSuffix = godanType === 'Aru' ? 'ある' :
          godanType === 'IkuYuku' ? 'いく' : undefined
        result.tag = godanType === 'RuIrreg' ? 'irregular' :
          godanType === 'USpecial' ? 'special' : undefined
        return
      }

      const irregularType = verbType.Irregular

      if (irregularType === 'Suru' || irregularType === 'SuruSpecial') {
        result.verbType = 'する'
        if (irregularType === 'SuruSpecial') result.tag = 'special'
      }
      else if (irregularType === 'NounOrAuxSuru') result.verbType = '~する'
      else {
        result.verbType = 'irregular'
        result.verbSuffix = irregularType === 'Nu' ? 'ぬ' :
          irregularType === 'Ru' ? 'る' : 'す'
      }
      return
    }

    result.type = 'adjective'
    const adjType = pos.Adjective
    if (adjType === 'PreNounVerb') return result.isPreNounVerb = true
    if (adjType === 'PreNoun') return result.isPreNounAdj = true

    if (adjType === 'Keiyoushi' || adjType === 'KeiyoushiYoiIi') {
      result.adjType = 'い'
      result.adjSpecialSuffix = adjType === 'KeiyoushiYoiIi' ? 'いい/よい' : undefined
      return
    }

    if (adjType === 'Na' || adjType === 'Nari') {
      result.adjType = 'な'
      if (adjType === 'Nari') result.adjSpecialSuffix = 'なり'
      return
    }

    if (adjType === 'No') return result.tag = '〜の'
    result.adjType = adjType === 'Ku' ? 'く' :
      adjType === 'Shiku' ? 'しく' :
        adjType === 'Taru' ? 'たる' : undefined
  })()

  return result
}

const posToText = (parsedPos: ParsedPos[]) => {
  type parsedPosTypes = Exclude<ParsedPos['type'], undefined>
  type extraType = 'auxilary' | 'prefix' | 'suffix'
  type displayPosTypes = parsedPosTypes | extraType

  const typeAcronymMap: Record<displayPosTypes, string> = {
    adjective: 'adj.',
    adverb: 'adv.',
    coupla: 'coupla',
    conjuction: 'conj.',
    counter: 'ctr.',
    expression: 'expr.',
    interjection: 'interj.',
    noun: 'n.',
    numeric: 'num.',
    pronoun: 'pron.',
    particle: 'part.',
    verb: 'v.',
    auxilary: 'aux.',
    prefix: 'prefix',
    suffix: 'suffix'
  }

  const result: Partial<Record<
    displayPosTypes,
    string[][]
  >> = {}

  const orderedTypes: displayPosTypes[] = []

  const shortenProp = (prop?: string) => {
    if (prop === 'irregular') return 'irreg.'
    if (prop === 'special') return 'spec.'
    else return prop
  }

  const displayExtraType = (condition: boolean, type: extraType) => {
    if (condition) {
      result[type] = []
      orderedTypes.push(type)
    }
  }

  const createPropSlots = () => Array(5).fill(0).map<string[]>(() => [])

  for (const {
    type,
    verbType,
    adjType,
    isTransitiveVerb,
    isAuxilary,
    isPrefix,
    isSuffix,
    isPreNounAdj,
    isPreNounVerb,
    tag
  } of parsedPos) {
    if (!type) {
      displayExtraType(isAuxilary, 'auxilary')
      displayExtraType(isPrefix, 'prefix')
      displayExtraType(isSuffix, 'suffix')
      continue
    }

    let props = result[type]
    if (!props) {
      props = result[type] = createPropSlots()
      orderedTypes.push(type)
    }

    const pushUniq = (index: number, ...toPush: (string | Falsey)[]) => {
      const propArray = props![index]
      propArray.push(...filterFalsy(toPush))
      props![index] = _.uniq(propArray)
    }

    if (type === 'verb') {
      pushUniq(0, shortenProp(verbType))
      pushUniq(1, isTransitiveVerb ? 'trans.' : 'intrans.')
    }

    if (type === 'adjective') {
      pushUniq(0, shortenProp(adjType))
      pushUniq(1, (isPreNounAdj || isPreNounVerb) && 'pre-noun')
    }

    pushUniq(2, isAuxilary && 'aux.')
    pushUniq(3, isPrefix ? 'prefix' :
      isSuffix ? 'suffix' : undefined)
    pushUniq(4, shortenProp(tag))
  }

  const orderedProps = orderedTypes.map(type => {
    const props = result[type]
    if (!props) return

    if (type === 'verb') {
      const transitivities = props[1]
      if (transitivities.includes('trans.') && transitivities.includes('intrans.'))
        props[1] = []
    }
    const propString = props.flat().join(', ')
    const shortenedType = typeAcronymMap[type]
    return [shortenedType, propString] satisfies [string, string]
  })

  return filterFalsy(orderedProps)
}

const dictServices = {
  search,
  fuzzySearch,
  searchSentence,
  furiganaToRuby,
  parseDictPos,
  posToText
}

export default dictServices
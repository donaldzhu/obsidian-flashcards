import _ from 'lodash'

import miscMap from '../data/miscMap'
import { extract, filterFalsy, mapObject, mightInclude, validateString } from '../utils/util'
import httpServices, { JOTOBA_URL } from './httpServices'

import type { Falsey } from 'lodash'
import type { JotobaFuzzyResult, JotobaSentence, JotobaWordsRes, JotobaPos, JMDictEntry } from '../types/dictTypes'
import type { ParsedPos, ParsedSentence } from '../types/cardTypes'


const getConfig = (word: string) => ({
  query: word,
  language: 'English'
})

const fuzzySearch = async (word: string): Promise<JotobaFuzzyResult[]> => {
  const jotobaConfig = getConfig(word)
  const jotobaRes = (await httpServices.post<JotobaWordsRes>('words', jotobaConfig)).data

  return jotobaRes.words
    .map(({ reading, senses, pitch, audio, common }) => ({
      ...reading,
      definitions: extract(senses, 'glosses'),
      partsOfSpeech: extract(senses, 'pos'),
      pitch: pitch?.reduce((prev, curr, i) =>
        `${prev}${curr.high ? '/' : i ? '\\' : ''}${curr.part}`, ''),
      audio: audio ? JOTOBA_URL + audio : undefined,
      isCommon: common
    }))
    .sort((a, b) => a.isCommon && !b.isCommon ? -1 : 1)
}

const furiganaToRuby = (furigana: string) => {
  return furigana.replaceAll(
    /\[[一-龠ぁ-ゔァ-ヴーa-zA-Z0-9ａ-ｚＡ-Ｚ０-９々〆〤ヶ|]*\]/gui,
    match => {
      const furiganaArray = match.slice(1, -1).split('|')
      const kanji = furiganaArray.shift()?.split('') ?? []
      return `<ruby>${furiganaArray.map((kana, i) =>
        `${kanji[i]}<rt>${kana}</rt>`).join('')}</ruby>`
    }
  )
}

const searchSentence = async (word: string): Promise<ParsedSentence[]> => {
  const jotobaConfig = getConfig(word)
  const sentences = ((await httpServices.post('sentences', jotobaConfig))
    .data.sentences as JotobaSentence[])
    .slice(0, 10)
    .map(sentence => _.pick(sentence, ['content', 'furigana', 'translation']))
  return sentences
}

const parseDictPos = (pos: JotobaPos): ParsedPos => {
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
    isTransitiveVerb: undefined,
    isPreNounAdj: false
  };

  (() => {
    if (pos === 'Unclassified') return
    if (pos === undefined) return result.type = 'coupla'
    if (pos === 'Expr') return result.type = 'expression'

    if (mightInclude([
      'Conjuction',
      'Counter',
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
      if (verbType === 'Unspecified') return
      if (verbType === 'Intransitive') return result.isTransitiveVerb = false
      if (verbType === 'Transitive') return result.isTransitiveVerb = true
      if (verbType === 'Kuru') {
        result.verbType = 'irregular'
        result.verbSpecialSuffix = 'くる'
        return
      }

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

const posToText = (parsedPos: ParsedPos[], shorten = false) => {
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
    suffix: 'suffix',
  }

  const typeMap = shorten ? typeAcronymMap :
    mapObject(typeAcronymMap, type => type)

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
      if (isTransitiveVerb !== undefined)
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
    const shortenedType = typeMap[type]
    return [shortenedType, propString] satisfies [string, string]
  })

  return filterFalsy(orderedProps)
}

const getMisc = (
  jmdict: Map<string, JMDictEntry[]>,
  kana: string,
  kanji: string | null | undefined,
  definitions: string[],
) => {
  const key = kana + validateString(kanji, `|${kanji}`)
  const entries = jmdict.get(key)
  if (!entries) return

  let senseIndex: number | undefined
  const entry = entries.find(entry => {
    const index = entry.sense.findIndex(sense =>
      _.isEqual(definitions, sense.gloss))

    if (index !== -1) {
      senseIndex = index
      return true
    }
  })

  if (!entry || !senseIndex) return
  const { misc } = entry.sense[senseIndex]
  return misc?.map(m => miscMap[m.slice(1, -1) as keyof typeof miscMap])
}

const dictServices = {
  fuzzySearch,
  furiganaToRuby,
  searchSentence,
  parseDictPos,
  posToText,
  getMisc
}

export default dictServices
import * as wanakana from 'wanakana'

import { validateString } from './util'

import type { PropOf } from '../types/utilTypes'
import type { ParsedPos, verbSpecialSuffix, verbSuffix, verbType } from '../types/cardTypes'

export type VerbPos = ParsedPos & {
  type: 'verb'
  verbType: verbType
  verbSuffix: verbSuffix
  verbSpecialSuffix: Exclude<verbSpecialSuffix, 'ずる' | '~する'>
}

interface ConjugationConfig {
  ru: string,
  u?: string,
  kuru?: string,
}

const specialEndings = {
  kureru: { kana: 'くれる', kanji: '呉れる' },
  aru: { kana: 'ある', kanji: '有る' },
  iku: { kana: 'いく', kanji: '行く' },
  kuru: { kana: 'くる', kanji: '来る' },
  suru: { kana: 'する', kanji: '為る' },
}

type specialEnding = PropOf<typeof specialEndings>


interface ConjugateProps {
  kana: string
  kanji?: string | null,
  kanaOnly: boolean,
  pos: VerbPos
}

// FUTURE TODO: furigana
const conjugate = ({ kana, kanji, kanaOnly, pos }: ConjugateProps) => {
  const { verbType, verbSpecialSuffix, verbSuffix } = pos

  const matchesSpecial = (endings: specialEnding, matchCompletely?: boolean) =>
    (!matchCompletely && verbSpecialSuffix === endings.kana) ||
    kanji === endings.kanji ||
    kana === endings.kana

  if (matchesSpecial(specialEndings.kuru)) kanaOnly = true
  const verb = kanji && !kanaOnly ? kanji : kana

  const replaceSpecialEnding = (
    specialEnding: specialEnding,
    replacement: string
  ) => verb.replace(
    new RegExp(`(${specialEnding.kana}|${specialEnding.kanji})$`),
    replacement
  )


  const verbRoot =
    matchesSpecial(specialEndings.suru) ?
      replaceSpecialEnding(specialEndings.suru, 'し') :
      matchesSpecial(specialEndings.kuru) ?
        replaceSpecialEnding(specialEndings.kuru, '') :
        verb.slice(0, verb.length - 1)

  const replaceGodanEnd = (newSuffix: string, replaceCompletely: boolean) =>
    wanakana.toHiragana(wanakana.toRomaji(verbSuffix)
      .replace(
        replaceCompletely ? wanakana.toRomaji(verbSuffix) : verbSuffix === 'つ' ? 'su' : 'u',
        wanakana.toRomaji(newSuffix)
      )
    )

  const conjugate = (endings: ConjugationConfig | string, replaceGodanSuffix = false) => {
    if (typeof endings === 'string') endings = { ru: endings }
    const { ru } = endings
    const { u = 'i' + ru, kuru = 'き' + ru } = endings
    return verbRoot + (
      verbType === 'う' ? replaceGodanEnd(u, replaceGodanSuffix) :
        verbType === 'る' || matchesSpecial(specialEndings.suru) ? ru : kuru
    )
  }

  const conjugatWithExp = (
    exception: specialEnding,
    endIfException: string,
    conjugationConfig: ConjugationConfig
  ) =>
    matchesSpecial(exception) ?
      replaceSpecialEnding(exception, endIfException) :
      conjugate(conjugationConfig)


  const conjugateUEnds = (ending: string) => validateString(verbSuffix === 'う', 'w') + ending
  const conjugateShortNeg = (ending: string, conjugationConfig?: ConjugationConfig) =>
    conjugatWithExp(specialEndings.aru, ending, conjugationConfig ?? {
      ru: ending,
      u: conjugateUEnds('a' + wanakana.toRomaji(ending)),
      kuru: 'こ' + ending
    })

  const addDakuten = (ending: string) => wanakana.toHiragana(wanakana.toRomaji(ending).replace(/^t/, 'd'))
  const conjugateTeLike = (ending = 'て') => {
    const romajiEnding = wanakana.toRomaji(ending)
    return conjugate({
      u: (['う', 'る', 'つ'].includes(verbSuffix) || matchesSpecial(specialEndings.iku)) ? romajiEnding[0] + romajiEnding :
        ['む', 'ぶ', 'ぬ'].includes(verbSuffix) ? 'n' + addDakuten(romajiEnding) :
          verbSuffix === 'く' ? 'i' + romajiEnding :
            verbSuffix === 'ぐ' ? 'i' + addDakuten(romajiEnding) :
              'shi' + romajiEnding,
      ru: ending,
      kuru: 'き' + ending
    }, true)
  }

  const ruConjugationPairs = (shortPositive: string) => {
    const ruRegex = /る$/
    return {
      formal: {
        positive: shortPositive.replace(ruRegex, 'ます'),
        negative: shortPositive.replace(ruRegex, 'ません'),
      },
      informal: {
        positive: shortPositive,
        negative: shortPositive.replace(ruRegex, 'ない')
      }
    }
  }

  const present = {
    name: 'present',
    formal: {
      positive: conjugate('ます'),
      negative: conjugate('ません')
    },
    informal: {
      positive: verb,
      negative: conjugateShortNeg('ない')
    },
  }

  const past = {
    name: 'past',
    formal: {
      positive: conjugate('ました'),
      negative: conjugate('ませんでした')
    },
    informal: {
      positive: conjugateTeLike('た'),
      negative: conjugateShortNeg('なっかた')
    },
  }

  const te = {
    name: 'て-form',
    formal: {
      positive: conjugateTeLike(),
      negative: conjugateShortNeg('なくて')
    },
    informal: null
  }

  const volitional = {
    name: 'volitional',
    formal: { positive: conjugate({ ru: 'よう', u: 'ou', kuru: 'こよう' }), negative: null },
    informal: { positive: conjugate('ましょう'), negative: null },
  }

  const potential = {
    name: 'potential',
    ...ruConjugationPairs(conjugatWithExp(
      specialEndings.suru, 'できる',
      { ru: 'られる', u: 'eru', kuru: 'こられる' }
    ))
  }

  const passive = {
    name: 'passive',
    ...ruConjugationPairs(conjugatWithExp(
      specialEndings.suru, 'される',
      { ru: 'られる', u: conjugateUEnds('areru'), kuru: 'こられる' }
    ))
  }

  const causative = {
    name: 'passive',
    ...ruConjugationPairs(conjugatWithExp(
      specialEndings.suru, 'させる',
      { ru: 'させる', u: conjugateUEnds('aseru'), kuru: 'こさせる' }
    ))
  }

  const imperative = {
    name: 'imperative',
    formal: null,
    informal: {
      positive: conjugatWithExp(
        specialEndings.kureru, 'くれ',
        { ru: 'ろ', u: 'e', kuru: 'こい' }
      ),
      negative: verb + 'な'
    }
  }

  const conditional = {
    name: 'conditional',
    formal: {
      positive: conjugatWithExp(specialEndings.suru, 'すれば', { ru: 'れば', u: 'eba', kuru: 'くれば' }),
      negative: conjugateShortNeg('なければ', { ru: 'なければ', u: 'enakereba', kuru: 'こなければ' }),
    },
    informal: null
  }

  const conditionalTara = {
    name: 'conditional (たら)',
    formal: null,
    informal: {
      positive: past.informal.positive + 'ら',
      negative: past.informal.negative + 'ら'
    }
  }

  return [
    present,
    past,
    te,
    volitional,
    potential,
    passive,
    causative,
    imperative,
    conditional,
    conditionalTara
  ]
}



export type ConjugationInterface = ReturnType<typeof conjugate>

export default conjugate


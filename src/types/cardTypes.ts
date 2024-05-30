import type miscMap from '../data/miscMap'
import type { PropOf } from './utilTypes'

export type MiscType = PropOf<typeof miscMap>[]

export interface ParsedDefinition {
  translations: string[],
  misc?: MiscType
  partsOfSpeech: ParsedPos[]
}

export interface ParsedSentence {
  furigana: string
  ruby: string
  translation: string
  audio?: string
}

export type verbType = 'る' | 'う' | 'irregular'
export type verbSuffix = 'ぶ' | 'ぐ' | 'く' | 'む' | 'ぬ' | 'る' | 'す' | 'つ' | 'う'
export type verbSpecialSuffix = 'くれる' | 'ある' | 'いく' | 'ずる' | 'くる' | 'する' | '~する'

export interface ParsedPos {
  type?:
  | 'adjective'
  | 'adverb'
  | 'coupla'
  | 'conjunction'
  | 'counter'
  | 'expression'
  | 'interjection'
  | 'noun'
  | 'numeric'
  | 'pronoun'
  | 'particle'
  | 'verb'
  tag?: 'irregular' | 'special' | '二段' | '四段' | '〜の' | '〜と'
  adjType?: 'い' | 'く' | 'な' | 'しく' | 'たる'
  adjSpecialSuffix?: 'いい/よい' | 'なり'
  verbType?: verbType
  verbSuffix?: verbSuffix
  verbSpecialSuffix?: verbSpecialSuffix
  isPrefix: boolean
  isSuffix: boolean
  isAuxilary: boolean
  isTransitiveVerb?: boolean
  isPreNounVerb: boolean
  isPreNounAdj: boolean
}
import type miscMap from '../data/miscMap'
import type { JotobaPitch } from './dictTypes'

export interface ParsedDefinition {
  translations: string[],
  misc?: typeof miscMap[keyof typeof miscMap][]
  partsOfSpeech: ParsedPos[]
}

export interface ParsedSentence {
  furigana: string
  translation: string
}

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
  verbType?: 'る' | 'う' | 'irregular'
  verbSuffix?: 'ぶ' | 'ぐ' | 'く' | 'む' | 'ぬ' | 'る' | 'す' | 'つ' | 'う'
  verbSpecialSuffix?: 'くれる' | 'ある' | 'いく' | 'ずる' | 'くる' | 'する' | '~する'
  isPrefix: boolean
  isSuffix: boolean
  isAuxilary: boolean
  isTransitiveVerb?: boolean
  isPreNounVerb: boolean
  isPreNounAdj: boolean
}

export interface CardInterface {
  solution: string
  definitions: ParsedDefinition[]
  pitch?: JotobaPitch[]
  audio?: string
  kanji?: string | null
  kana: string
  sentences?: ParsedSentence[]
  definitionAlias?: string,
  solutionAlias?: string,
  tags: string[],
  lesson?: string
}


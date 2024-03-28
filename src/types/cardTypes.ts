import type miscMap from '../data/miscMap'

export interface ParsedDefinition {
  translations: string[],
  misc?: typeof miscMap[keyof typeof miscMap][]
  partsOfSpeech: ParsedPos[]
}

export interface ParsedSentence {
  content: string
  furigana: string
  translation: string
}

export interface ParsedPos {
  type?:
  | 'adjective'
  | 'adverb'
  | 'coupla'
  | 'conjuction'
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
  verbType?: 'る' | 'う' | 'する' | '~する' | 'irregular'
  verbSuffix?: 'ぶ' | 'ぐ' | 'く' | 'む' | 'ぬ' | 'る' | 'す' | 'つ' | 'う'
  verbSpecialSuffix?: 'くれる' | 'ある' | 'いく' | 'ずる' | 'くる'
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
  pitch: string
  audio: string
  kanji: string | null
  kana: string
  sentences: ParsedSentence[]
  partsOfSpeech: ParsedPos[]
}


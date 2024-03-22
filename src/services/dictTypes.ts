
export interface JotobaKanji {
  literal: string,
  meanings: string[],
  grade: number,
  stroke_count: number,
  frequency: number,
  jlpt: number,
  onyomi: string[],
  kunyomi: string[],
  chinese: string[],
  korean_r: string[],
  korean_h: string[],
  parts: string[],
  radical: string
}

export type PartsOfSpeech =
  Record<'Adjective',
    'PreNounVerb' |
    'Keiyoushi' |
    'KeiyoushiYoiIi' |
    'Ku' |
    'Na' |
    'Nari' |
    'No' |
    'PreNoun' |
    'Shiku' |
    'Taru'
  > |
  'Adverb' |
  'AdverbTo' |
  'Auxilary' |
  'AuxilaryAdj' |
  'AuxilaryVerb' |
  'Conjuction' |
  undefined |
  'Counter' |
  'Expression' |
  'Interjection' |
  Record<'Noun',
    'Normal' |
    'Prefix' |
    'Suffix'
  > |
  'Numeric' |
  'Pronoun' |
  'Prefix' |
  'Particle' |
  'Suffix' |
  'Unclassified' |
  Record<'Verb',
    'Unspecified' |
    'Ichidan' |
    'IchidanKureru' |
    { Nidan: any } |
    { Yodan: any } |
    Record<'Godan',
      'Aru' |
      'Bu' |
      'Gu' |
      'Ku' |
      'IkuYuku' |
      'Mu' |
      'Nu' |
      'Ru' |
      'RuIrreg' |
      'Su' |
      'Tsu' |
      'U' |
      'USpecial' |
      'Kuru'
    > |
    'Intransitive' |
    Record<'Irregular',
      'Nu' |
      'Ru' |
      'NounOrAuxSuru' |
      'Su' |
      'Suru' |
      'SuruSpecial'
    > |
    'Transitive' |
    'IchidanZuru'
  >


export interface JotobaWords {
  reading: {
    kana: string,
    kanji?: string,
    furigana: string | null
  },
  common: boolean,
  senses: {
    glosses: string[],
    pos: PartsOfSpeech[],
    language: string
  }[],
  audio?: string,
  pitch?: {
    part: string
    high: boolean
  }[]
}

export interface JotobaWordsRes {
  kanji: JotobaKanji[]
  words: JotobaWords[]
}

export interface JotobaSentence {
  content: string
  furigana: string
  translation: string
  language: string
  eng: string
}

export interface ExampleSentence {
  content: string
  furigana: string
  translation: string
}

export interface FuzzyResult {
  furigana: string | null
  kanji?: string
  kana: string

  definitions: string[]
  partsOfSpeech: PartsOfSpeech[][]
  pitch?: string
  audio?: string

  isCommon: boolean
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
  verbType?: 'る' | 'う' | 'する' | '~する' | 'くる' | 'irregular' //
  verbSuffix?: 'ぶ' | 'ぐ' | 'く' | 'む' | 'ぬ' | 'る' | 'す' | 'つ' | 'う' //
  verbSpecialSuffix?: 'くれる' | 'ある' | 'いく' | 'ずる' //
  isPrefix: boolean
  isSuffix: boolean
  isAuxilary: boolean
  isTransitiveVerb: boolean
  isPreNounVerb: boolean
  isPreNounAdj: boolean
}
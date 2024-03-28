type JMDictProps<T extends string, K extends string> =
  Record<T, string[]> & Partial<Record<K, string[]>>


type JMDictPropsAttr<T extends string> = ({
  _: string
  $: Record<T, string>
} | string)[]

export interface JMDictEntry {
  ent_seq: string[]
  k_ele?: JMDictProps<'keb', 'ke_inf' | 'ke_pri'>[]
  r_ele: JMDictProps<'reb', 're_nokanji' | 're_restr' | 're_inf' | 're_pri'>[]
  sense: (JMDictProps<'pos',
    'stagk' |
    'stagr' |
    'xref' |
    'ant' |
    'field' |
    'misc' |
    's_inf' |
    'dial'
  > & {
    lsource?: JMDictPropsAttr<'xml:lang' | 'ls_type' | 'ls_wasei'>
    gloss: JMDictPropsAttr<'xml:lang' | 'g_gend' | 'g_type'>
  })[]
}

export interface JMDictData {
  data?: Map<string, JMDictEntry[]>
  promise: Promise<string>
}

interface JotobaKanji {
  literal: string
  meanings: string[]
  grade: number
  stroke_count: number
  frequency: number
  jlpt: number
  onyomi: string[]
  kunyomi: string[]
  chinese: string[]
  korean_r: string[]
  korean_h: string[]
  parts: string[]
  radical: string
}

export type JotobaPos =
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
  'Expr' |
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
      'USpecial'
    > |
    'Intransitive' |
    'Kuru' |
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


interface JotobaWords {
  reading: {
    kana: string,
    kanji?: string,
    furigana: string | null
  },
  common: boolean,
  senses: {
    glosses: string[],
    pos: JotobaPos[],
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

export interface JotobaFuzzyResult {
  furigana: string | null
  kanji?: string
  kana: string
  definitions: string[][]
  partsOfSpeech: JotobaPos[][]
  pitch?: string
  audio?: string
  isCommon: boolean
}



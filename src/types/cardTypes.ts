import type miscMap from '../data/miscMap'
import type { ExampleSentence, JMDictEntry, ParsedPos, PartsOfSpeech } from './dictTypes'

export enum WordType {
  Verb = 'verb',
  Noun = 'noun',
  Adjective = 'adjective',
  Adverb = 'adverb',
  Pronoun = 'pronoun',
  Preposition = 'preposition',
  Conjugation = 'conjugation'
}

export type miscTypes = typeof miscMap[keyof typeof miscMap]

export interface DictDefintion {
  translation: string,
  pos: PartsOfSpeech[],
  misc?: miscTypes[]
}

export interface Definition {
  translation: string,
  pos: ParsedPos[]
  misc?: miscTypes[]
}

export interface CardInterface {
  solution: string
  definitions: Definition[]
  pitch: string
  audio: string
  kanji: string | null
  kana: string
  sentences: ExampleSentence[]
  partsOfSpeech: ParsedPos[]

  // lesson: number
}

export interface JmdictData {
  data?: Map<string, JMDictEntry[]>
  promise: Promise<string>
}
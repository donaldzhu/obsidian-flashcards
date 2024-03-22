import type { ExampleSentence, ParsedPos, PartsOfSpeech } from '../services/dictTypes'

export enum WordType {
  Verb = 'verb',
  Noun = 'noun',
  Adjective = 'adjective',
  Adverb = 'adverb',
  Pronoun = 'pronoun',
  Preposition = 'preposition',
  Conjugation = 'conjugation'
}

export interface DictDefintion {
  translation: string,
  pos: PartsOfSpeech[]
}

interface Definition {
  translation: string,
  pos: ParsedPos[]
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
import { Notice } from 'obsidian'

import obsidianServices from './services/obsidianServices'
import { NOTICE_DURATION } from './settings/constants'

import type { TFile } from 'obsidian'
import type { ParsedDefinition, ParsedSentence } from './types/cardTypes'
import type { JotobaPitch } from './types/dictTypes'

class Card {
  solution?: string
  definitions?: ParsedDefinition[]
  pitch?: JotobaPitch[]
  audio?: string
  kanji?: string | null
  kana?: string
  sentences: ParsedSentence[]
  definitionAlias?: string
  solutionAlias?: string
  tags: string[]
  lesson?: string

  constructor() {
    this.solution = undefined
    this.definitions = undefined
    this.pitch = undefined
    this.audio = undefined
    this.kanji = undefined
    this.kana = undefined
    this.sentences = []
    this.definitionAlias = undefined
    this.solutionAlias = undefined
    this.tags = []
    this.lesson = undefined
  }

  isComplete() {
    if (
      !this.solution ||
      !this.definitions ||
      !this.kana
    ) throw this.onIncompleteError()
    return this as CardInterface
  }

  onIncompleteError(message?: string) {
    if (message) {
      new Notice(message, NOTICE_DURATION)
      console.error(message, this)
    }
    else console.error(this)
    return new Error('Incomplete card data.')
  }

  static async parseFromFile(file: TFile) {
    const frontmatter = obsidianServices.getFrontmatter(file)
    const body = await obsidianServices.getBody(file)
    const json = body.match(/```\n([\s\S]*)\n```/m)
    if (!json || !frontmatter) return
    const parsedJson = JSON.parse(json[1])
    const card = new Card()
    card.audio = frontmatter['flashcard audio'] || undefined
    card.definitionAlias = frontmatter['flashcard definitionAlias'] || undefined
    card.kana = frontmatter['flashcard kana']
    card.kanji = frontmatter['flashcard kanji'] || undefined
    card.lesson = frontmatter['flashcard lesson'] || undefined
    card.solution = frontmatter['flashcard solution']
    card.solutionAlias = frontmatter['flashcard solutionAlias'] || undefined
    card.tags = frontmatter['flashcard tags']
    card.definitions = parsedJson.definitions
    card.pitch = parsedJson.pitch
    card.sentences = parsedJson.sentences
    return card as CardInterface
  }
}

export type CardInterface = Card & {
  solution: string
  definitions: ParsedDefinition[]
  kana: string
  sentences: ParsedSentence[]
}


export default Card
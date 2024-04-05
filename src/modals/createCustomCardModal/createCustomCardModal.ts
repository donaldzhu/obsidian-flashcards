import type { CardInterface } from '../../types/cardTypes'
import { PageModal } from '../pageModal'
import createCustomPage from './pages/customPage'

import type CreateModalPage from '../createModalPage'
class CreateCustomCardModal extends PageModal {
  result: Partial<CardInterface>

  pages: CreateModalPage[]
  pageData: undefined

  constructor() {
    super()
    this.result = {
      solution: undefined,
      definitions: undefined,
      kanji: undefined,
      kana: undefined,
      solutionAlias: undefined,
      tags: [],
      lesson: undefined,

      definitionAlias: undefined,
      pitch: undefined,
      audio: undefined,
      sentences: [],
    }

    this.pages = [
      createCustomPage(this)
    ]
  }
}

export default CreateCustomCardModal
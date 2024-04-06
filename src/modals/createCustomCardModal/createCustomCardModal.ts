import { memoize } from '../../utils/modalUtils'
import { PageModal } from '../pageModal'
import createCustomPage from './pages/customPage'
import createReviewPage from './pages/reviewPage'

import type { Memoized } from '../../utils/modalUtils'
import type { CardInterface } from '../../types/cardTypes'
import type CreateModalPage from '../createModalPage'
import type { OnSubmitType } from '../modalType'
export enum CreateCustomModalPage {
  Custom,
  Review,
}

class CreateCustomCardModal extends PageModal {
  result: Partial<CardInterface>

  pages: CreateModalPage[]
  pageData: [
    undefined,
    {
      tags: Memoized<string[]>
    }
  ]

  constructor(
    public onSubmit: OnSubmitType,
  ) {
    super()
    this.result = {
      definitions: undefined,
      solution: undefined,
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
      createCustomPage(this),
      createReviewPage(this)
    ]

    this.pageData = [
      undefined,
      {
        tags: memoize([])
      }
    ]
  }
}

export default CreateCustomCardModal
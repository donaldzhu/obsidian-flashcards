import Card from '../../card'
import { CSS_CLASSES } from '../../settings/constants'
import { memoize } from '../../utils/modalUtils'
import { PageModal } from '../pageModal'
import createCustomPage from './pages/customPage'
import createReviewPage from './pages/reviewPage'

import type { Memoized } from '../../utils/modalUtils'
import type CreateModalPage from '../createModalPage'
import type { OnSubmitType } from '../modalType'

class CreateCustomCardModal extends PageModal {
  result: Card

  pages: CreateModalPage[]
  pageData: [
    undefined,
    { tags: Memoized<string[]> }
  ]

  constructor(
    public onSubmit: OnSubmitType,
    public lastCardLesson?: string
  ) {
    super(CSS_CLASSES.CREATE_CARD_SETTING_WRAPPER)
    this.result = new Card()

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
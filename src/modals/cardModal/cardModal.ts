import { PageModal } from '../pageModal'
import createReviewPage from './pages/reviewPage'

import type { CardInterface } from '../../card'
import type CreateModalPage from '../createModalPage'

export enum CardModalPage {
  Review
}

class CardModal extends PageModal {
  pages: CreateModalPage[]
  pageData: undefined

  constructor(
    public card: CardInterface,
    public lastCardLesson?: string
  ) {
    super()

    this.pages = [
      createReviewPage(this)
    ]
  }
}

export default CardModal
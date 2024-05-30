import { Setting } from 'obsidian'

import { DEFAULT_SETTINGS, MODAL_DESC } from '../../../settings/constants'
import TagSuggester from '../../../suggesters/tagSuggest'
import { createCardModalPage, renderModalTags } from '../../../utils/modalUtils'
import { getPropKey } from '../../../utils/obsidianUtil'
import CreateModalPage from '../../createModalPage'
import { CreateCustomModalPage } from '../createCustomCardModalType'

import type CreateCustomCardModal from '../createCustomCardModal'

const createReviewPage = (modal: CreateCustomCardModal) => new CreateModalPage(
  {
    header: 'Review Flashcard',
    btnText: 'Submit',
    render: templateElems => {
      const { pageWrapper } = templateElems
      createCardModalPage(modal.result, templateElems)

      const { tags } = modal.pageData[CreateCustomModalPage.Review]

      new Setting(pageWrapper)
        .setName('Tags')
        .setDesc(MODAL_DESC.TAGS)
        .addText(text => new TagSuggester(
          text.inputEl,
          getPropKey('TAGS'),
          tags.value,
          {
            subfolder: DEFAULT_SETTINGS.SUBFOLDER,
            onSelect: item => {
              tags.value.push(item)
              renderModalTags(modal.pageData[CreateCustomModalPage.Review].tags, templateElems)
            }
          }
        ))

      pageWrapper.querySelector('input')?.focus()
    },
    submit: () => {
      const card = modal.result.isComplete()
      card.tags = modal
        .pageData[CreateCustomModalPage.Review]
        .tags.value
      modal.onSubmit(card)
      modal.close()
    }
  }
)

export default createReviewPage
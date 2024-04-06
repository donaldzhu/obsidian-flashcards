import { Setting } from 'obsidian'

import { DEFAULT_SETTINGS } from '../../../settings/constants'
import TagSuggester from '../../../suggesters/tagSuggest'
import {
  createCardModalPage, onIncompleteCardError, renderModalTags
} from '../../../utils/modalUtils'
import { getPropKey } from '../../../utils/obsidianUtil'
import CreateModalPage from '../../createModalPage'
import { CreateCustomModalPage } from '../createCustomCardModal'

import type CreateCustomCardModal from '../createCustomCardModal'
import type { CardInterface } from '../../../types/cardTypes'

const createReviewPage = (modal: CreateCustomCardModal) => new CreateModalPage(
  'Review Flashcard',
  'Submit',
  templateElems => {
    const { pageWrapper } = templateElems
    createCardModalPage(modal.result, templateElems)

    const { tags } = modal.pageData[CreateCustomModalPage.Review]

    const tagsSetting = new Setting(pageWrapper)
      .setName('Tags')
      .setDesc('Additional Tags.')
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

    tagsSetting.controlEl.querySelector('input')?.focus()
  },
  () => {
    const { tags } =
      modal.pageData[CreateCustomModalPage.Review]
    const { result } = modal

    if (
      !result.solution ||
      !result.definitions ||
      !result.kana
    ) throw onIncompleteCardError(result)

    result.tags = tags.value

    modal.onSubmit(result as CardInterface)
    modal.close()
  }
)

export default createReviewPage
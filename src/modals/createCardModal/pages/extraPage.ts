import { Setting } from 'obsidian'

import { DEFAULT_SETTINGS } from '../../../settings/constants'
import GenericTextSuggester from '../../../suggesters/genericTextSuggest'
import TagSuggester from '../../../suggesters/tagSuggest'
import {
  createCardModalPage, onIncompleteCardError, renderModalTags
} from '../../../utils/modalUtils'
import { getPropKey } from '../../../utils/obsidianUtil'
import CreateModalPage from '../../createModalPage'
import { CreateCardModalPage } from '../createCardModal'

import type CreateCardModal from '../createCardModal'
import type { CardInterface } from '../../../types/cardTypes'


const createExtraPage = (modal: CreateCardModal) => new CreateModalPage(
  'Review Flashcard',
  'Submit',
  templateElems => {
    const { pageWrapper } = templateElems
    createCardModalPage(modal.result, templateElems)
    const { solution, definitions } = modal.result
    if (!definitions) return

    const { definitionAlias, solutionAlias, tags, lesson } =
      modal.pageData[CreateCardModalPage.Extra]
    const definitionAliasSetting = new Setting(pageWrapper)
      .setName('Definition Alias')
      .setDesc('How the flashcard’s English definition will be shown.')
      .addText(text => text
        .setPlaceholder(definitions[0].translations.join(', '))
        .onChange(value => definitionAlias.value = value))

    new Setting(pageWrapper)
      .setName('Solution Alias')
      .setDesc('How the flashcard’s Japanese solution will be shown.')
      .addText(text => text
        .setValue(solution ?? '')
        .onChange(value => solutionAlias.value = value))

    new Setting(pageWrapper)
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
            renderModalTags(modal.pageData[CreateCardModalPage.Extra].tags, templateElems)
          }
        }
      ))

    new Setting(pageWrapper)
      .setName('Lesson')
      .setDesc('The textbook lesson that the entry is from.')
      .addText(text => {
        const tags = TagSuggester.getTags(
          getPropKey('LESSON'),
          DEFAULT_SETTINGS.SUBFOLDER
        )
        text.onChange(value => lesson.value = value)
        new GenericTextSuggester(text.inputEl, tags)
      })

    definitionAliasSetting.controlEl.querySelector('input')?.focus()
  },
  () => {
    const { definitionAlias, solutionAlias, tags, lesson } =
      modal.pageData[CreateCardModalPage.Extra]
    const { result } = modal

    if (
      !result.solution ||
      !result.definitions ||
      !result.kana
    ) throw onIncompleteCardError(result)

    result.definitionAlias = definitionAlias.value || undefined
    result.solutionAlias = solutionAlias.value || undefined
    result.tags = tags.value
    result.lesson = lesson.value || undefined

    modal.onSubmit(result as CardInterface)
    modal.close()
  }
)

export default createExtraPage
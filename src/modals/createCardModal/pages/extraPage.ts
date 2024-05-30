import { Setting } from 'obsidian'

import { DEFAULT_SETTINGS, MODAL_DESC } from '../../../settings/constants'
import GenericTextSuggester from '../../../suggesters/genericTextSuggest'
import TagSuggester from '../../../suggesters/tagSuggest'
import { createCardModalPage, renderModalTags } from '../../../utils/modalUtils'
import { getPropKey } from '../../../utils/obsidianUtil'
import CreateModalPage from '../../createModalPage'
import { CreateCardModalPage } from '../createCardModalType'

import type CreateCardModal from '../createCardModal'

const createExtraPage = (modal: CreateCardModal) => new CreateModalPage(
  {
    header: 'Review Flashcard',
    btnText: 'Submit',
    render: templateElems => {
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
        .setDesc(MODAL_DESC.SOLUTION_ALIAS)
        .addText(text => text
          .setValue(solution ?? '')
          .onChange(value => solutionAlias.value = value))

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
              renderModalTags(modal.pageData[CreateCardModalPage.Extra].tags, templateElems)
            }
          }
        ))

      new Setting(pageWrapper)
        .setName('Lesson')
        .setDesc(MODAL_DESC.LESSON)
        .addText(text => {
          const tags = TagSuggester.getTags(
            getPropKey('LESSON'),
            DEFAULT_SETTINGS.SUBFOLDER
          )
          text
            .setValue(modal.lastCardLesson ?? '')
            .onChange(value => lesson.value = value)
          new GenericTextSuggester(text.inputEl, tags)
        })

      definitionAliasSetting.controlEl.querySelector('input')?.focus()
    },
    submit: () => {
      const { definitionAlias, solutionAlias, tags, lesson } =
        modal.pageData[CreateCardModalPage.Extra]
      const { result } = modal

      const card = result.isComplete()

      card.definitionAlias = definitionAlias.value || undefined
      card.solutionAlias = solutionAlias.value || undefined
      card.tags = tags.value
      card.lesson = lesson.value || undefined

      modal.onSubmit(card)
      modal.close()
    }
  }
)

export default createExtraPage
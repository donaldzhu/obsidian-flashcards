import _ from 'lodash'
import { Setting } from 'obsidian'

import customPosMap, { commonPos } from '../../../data/customPosMap'
import dictServices from '../../../services/dictServices'
import { DEFAULT_SETTINGS } from '../../../settings/constants'
import GenericTextSuggester from '../../../suggesters/genericTextSuggest'
import TagSuggester from '../../../suggesters/tagSuggest'
import { onIncompleteCardError } from '../../../utils/modalUtils'
import { getPropKey } from '../../../utils/obsidianUtil'
import { filterFalsy, typedKeys } from '../../../utils/util'
import CreateModalPage from '../../createModalPage'

import type { ParsedPos } from '../../../types/cardTypes'
import type { TextComponent } from 'obsidian'
import type CreateCustomCardModal from '../createCustomCardModal'

interface NestedSettingConfig {
  description?: string,
  textCallback?: (text: TextComponent, results: string[]) => any,
  onChange?: (results: string[]) => any
}

const createNestedSettings = (
  wrapper: HTMLDivElement,
  name: string,
  config?: NestedSettingConfig
) => {
  const {
    description,
    textCallback = _.noop,
    onChange = _.noop
  } = config ?? {}
  const results: string[] = ['']

  const settingsWrapper = wrapper.createDiv({
    cls: 'nested-setting-wrapper'
  })
  // TODO
  const createNewRow = (index: number) => {
    const setting = new Setting(settingsWrapper)
    if (!index) {
      setting
        .setName(name)
        .addExtraButton(button =>
          button
            .setIcon('plus-with-circle') // TODO
            .onClick(() => {
              results.push('')
              updateRows()
              onChange(results)
            })
        )

      if (description) setting.setDesc(description)
    }

    else setting.addExtraButton(button => {
      button
        .setIcon('cross')
        .onClick(() => {
          _.pullAt(results, index)
          updateRows()
          onChange(results)
        })
    })

    setting
      .addText(text => {
        text
          .setValue(results[index] ?? '')
          .onChange(value => {
            results[index] = value
            onChange(results)
          })
        textCallback(text, results)
      })
  }

  const updateRows = () => {
    settingsWrapper.empty()
    results.forEach((_, i) => createNewRow(i))
  }

  updateRows()
  return results
}

const createCustomPage = (modal: CreateCustomCardModal) => new CreateModalPage(
  'Create Custom Flashcard',
  'Create',
  ({ pageWrapper }) => {
    createNestedSettings(
      pageWrapper,
      'Definition(s)',
      {
        description: 'The flashcard’s definition(s).',
        onChange: translations => {
          translations = filterFalsy(translations)
          const { definitions } = modal.result
          if (!definitions?.length)
            return modal.result.definitions = [{
              translations,
              partsOfSpeech: []
            }]

          definitions[0].translations = translations
        }
      }
    )

    createNestedSettings(
      pageWrapper,
      'Part-of-Speech',
      {
        description: 'The flashcard’s grammatical part-of-speech.',
        textCallback: (text, results) => {
          const partsOfSpeech = _.without([
            ...commonPos,
            ..._.without(typedKeys(customPosMap), ...commonPos)
          ], ...results)
          new GenericTextSuggester(text.inputEl, partsOfSpeech)
        },
        onChange: results => {
          const partsOfSpeech: ParsedPos[] = filterFalsy(
            results.map(result =>
              result in customPosMap ?
                dictServices.parseDictPos(
                  customPosMap[result as keyof typeof customPosMap]
                ) : undefined
            )
          )

          const { definitions } = modal.result
          if (!definitions?.length)
            return modal.result.definitions = [{
              translations: [],
              partsOfSpeech
            }]

          definitions[0].partsOfSpeech = partsOfSpeech
        }
      }
    )

    new Setting(pageWrapper)
      .setName('Solution')
      .setDesc('The flashcard’s solution (in furigana).')
      .addText(text => text
        .setValue(modal.result.solution ?? '')
        .onChange(value => modal.result.solution = value))

    new Setting(pageWrapper)
      .setName('Solution Alias')
      .setDesc('How the flashcard’s Japanese solution will be shown.') // TODO
      .addText(text => text
        .setValue(modal.result.solutionAlias ?? '')
        .onChange(value => modal.result.solutionAlias = value))

    // TODO
    new Setting(pageWrapper)
      .setName('Lesson')
      .setDesc('The textbook lesson that the entry is from.')
      .addText(text => {
        const tags = TagSuggester.getTags(
          getPropKey('LESSON'),
          DEFAULT_SETTINGS.SUBFOLDER
        )
        text
          .setValue(modal.result.lesson ?? '')
          .onChange(value => modal.result.lesson = value)
        new GenericTextSuggester(text.inputEl, tags)
      })
  },
  () => {
    const { result } = modal
    if (!result.solution) {
      modal.pageNumber--
      return onIncompleteCardError(result, 'The flashcard must have a solution.')
    }

    Object.assign(result, dictServices.parseFurigana(result.solution))

    if (
      !result.definitions ||
      !result.kana
    ) {
      modal.pageNumber--
      return onIncompleteCardError(
        result,
        !result.definitions ?
          'The flashcard must have a definition.' :
          'Unable to parse kana from solution.'
      )
    }
    console.log('Result', result)
  },
)

export default createCustomPage
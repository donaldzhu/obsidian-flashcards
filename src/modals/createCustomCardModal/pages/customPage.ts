import _ from 'lodash'
import { Setting } from 'obsidian'

import customPosMap, { commonPos } from '../../../data/customPosMap'
import dictServices from '../../../services/dictServices'
import logServices from '../../../services/logServices'
import { CSS_CLASSES, DEFAULT_SETTINGS, ICON_NAMES, MODAL_DESC } from '../../../settings/constants'
import GenericTextSuggester from '../../../suggesters/genericTextSuggest'
import TagSuggester from '../../../suggesters/tagSuggest'
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
    cls: CSS_CLASSES.NESTED_SETTING_WRAPPER
  })
  const createNewRow = (index: number) => {
    const setting = new Setting(settingsWrapper)
    if (!index) {
      setting
        .setName(name)
        .addExtraButton(button =>
          button
            .setIcon(ICON_NAMES.ADD)
            .onClick(() => {
              results.push('')
              updateRows()
              _.last(settingsWrapper.getElementsByTagName('input'))?.focus()
              onChange(results)
            })
        )

      if (description) setting.setDesc(description)
    }

    else setting.addExtraButton(button => {
      button
        .setIcon(ICON_NAMES.CROSS)
        .onClick(() => {
          _.pullAt(results, index)
          updateRows()
          settingsWrapper.getElementsByTagName('input')[index - 1]?.focus()
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
  {
    header: 'Create Custom Flashcard',
    btnText: 'Create',
    render: ({ pageWrapper }) => {
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
        .setDesc(MODAL_DESC.SOLUTION_ALIAS)
        .addText(text => text
          .setValue(modal.result.solutionAlias ?? '')
          .onChange(value => modal.result.solutionAlias = value))

      new Setting(pageWrapper)
        .setName('Lesson')
        .setDesc(MODAL_DESC.LESSON)
        .addText(text => {
          const tags = TagSuggester.getTags(
            getPropKey('LESSON'),
            DEFAULT_SETTINGS.SUBFOLDER
          )
          text
            .setValue(modal.result.lesson ?? modal.lastCardLesson ?? '')
            .onChange(value => modal.result.lesson = value)
          new GenericTextSuggester(text.inputEl, tags)
        })

      pageWrapper.getElementsByTagName('input')[0]?.focus()
    },
    submit: () => {
      const { result } = modal
      if (!result.solution) {
        modal.pageNumber--
        result.onIncompleteError('The flashcard must have a solution.')
        return
      }

      Object.assign(result, dictServices.parseFurigana(result.solution))

      if (
        !result.definitions ||
        !result.kana
      ) {
        modal.pageNumber--
        result.onIncompleteError(
          !result.definitions ?
            'The flashcard must have a definition.' :
            'Unable to parse kana from solution.'
        )
        return
      }
      logServices.log('Result', result)
    },
  }
)

export default createCustomPage
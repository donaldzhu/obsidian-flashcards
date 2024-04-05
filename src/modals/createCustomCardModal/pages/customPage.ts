import _ from 'lodash'
import { Setting } from 'obsidian'

import customPosMap, { commonPos } from '../../../data/customPosMap'
import { DEFAULT_SETTINGS } from '../../../settings/constants'
import GenericTextSuggester from '../../../suggesters/genericTextSuggest'
import TagSuggester from '../../../suggesters/tagSuggest'
import { getPropKey } from '../../../utils/obsidianUtil'
import { typedKeys } from '../../../utils/util'
import CreateModalPage from '../../createModalPage'

import type CreateCustomCardModal from '../createCustomCardModal'
const pushToIndex = <T, K = undefined>(
  array: (T | K)[],
  newItem: T,
  index: number,
  filler: K
) => {
  while (array.length - 1 < index)
    array.push(filler)
  if (array.length === index) array.push(newItem)
  else array[index] = newItem
  return array
}

const createCustomPage = (modal: CreateCustomCardModal) => new CreateModalPage(
  'Create Custom Flashcard',
  'Create',
  ({ pageWrapper }) => {
    const definitions: string[] = ['']

    // TODO parts of speech
    const pos = new Setting(pageWrapper)
      .setName('Part-of-Speech')
      .setDesc('The flashcard’s grammatical part-of-speech.')
      .addText(text => {
        const partsOfSpeech = [
          ...commonPos,
          ..._.without(typedKeys(customPosMap), ...commonPos)
        ]

        // text
        // .setValue(modal.result.lesson ?? '')
        //.onChange(value => modal.result.lesson = value)
        new GenericTextSuggester(text.inputEl, partsOfSpeech)
      })

    const solution = new Setting(pageWrapper)
      .setName('Solution')
      .setDesc('The flashcard’s solution (in furigana).')
      .addText(text => text
        .setValue(modal.result.solution ?? '')
        .onChange(value => modal.result.solution = value))

    const solutionAlias = new Setting(pageWrapper)
      .setName('Solution Alias')
      .setDesc('How the flashcard’s Japanese solution will be shown.') // TODO
      .addText(text => text
        .setValue(modal.result.solutionAlias ?? '')
        .onChange(value => modal.result.solutionAlias = value))

    // TOOD
    const lesson = new Setting(pageWrapper)
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

    const otherSettings: Setting[] = [
      pos,
      solution,
      solutionAlias,
      lesson
    ]

    // TODO
    const getDefRows = () => Array.from(pageWrapper.getElementsByClassName('custom-definitions'))
    const createNewDefRow = (index: number) => {
      const setting = new Setting(pageWrapper)
      if (!index) setting
        .setName('Definition(s)')
        .setDesc('The flashcard’s definition(s).')
        .addExtraButton(button => {
          button
            .setIcon('plus-with-circle')
            .onClick(() => {
              definitions.push('')
              updateDefRows()
            })
        })

      else setting.addExtraButton(button => {
        button
          .setIcon('cross')
          .onClick(() => {
            _.pullAt(definitions, index)
            updateDefRows()
          })
      })

      setting
        .setClass('custom-definitions')
        .addText(text => text
          .setValue(definitions[index] ?? '')
          .onChange(value => {
            definitions[index] = value
          }))
    }

    const updateDefRows = () => {
      const defRows = getDefRows()
      console.log(definitions, defRows)
      defRows.forEach(div => div.detach())
      definitions.forEach((_, i) => createNewDefRow(i))
      otherSettings.forEach(({ settingEl }) => pageWrapper.appendChild(settingEl))
    }

    updateDefRows()

  },
  () => {

  },
)

export default createCustomPage
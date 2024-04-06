import _ from 'lodash'

import dictServices from '../../../services/dictServices'
import { CSS_CLASSES, NATIVE_CLASSES } from '../../../settings/constants'
import { truncateDefList } from '../../../utils/dictUtils'
import CreateModalPage from '../../createModalPage'
import { CreateCardModalPage } from '../createCardModal'

import type CreateCardModal from '../createCardModal'

const createDefinitionPage = (modal: CreateCardModal) => new CreateModalPage(
  () => {
    const furigana = modal.result.solution
    return `Select Primary Definition - ${furigana ?
      dictServices.furiganaToRuby(furigana) : modal.result.kana}`
  },
  'Create',
  () => {
    if (modal.dictDefinitions.length === 1)
      return modal.skipPage()

    modal.dictDefinitions.forEach(({ translations, partsOfSpeech }, index) => {
      const resultWrapper = modal.renderCard(index)

      const posStringArrays = dictServices.posToText(partsOfSpeech)
      const posHtmlArray = posStringArrays.map(([type, props]) =>
        `${type} ${props ? `<span class='${NATIVE_CLASSES.POS}'>(${props})</span>` : ''}`)

      const posElem = resultWrapper.createEl('p', {
        cls: CSS_CLASSES.POS
      })
      posElem.innerHTML = posHtmlArray.join(', ')

      const ulElem = resultWrapper.createEl('ul')

      truncateDefList(translations)
        .forEach(translation =>
          ulElem.createEl('li', {
            text: translation
          }))
    })
  },
  () => {
    const dictDefinitions = [...modal.dictDefinitions]
    const { index } = modal.pageData[CreateCardModalPage.Definition]
    modal.result.definitions = [
      ..._.pullAt(dictDefinitions, index.value),
      ...dictDefinitions
    ]
    console.log('Sorted Definitions:', modal.result.definitions)
  },
  NATIVE_CLASSES.SETTING_WRAPPER
)

export default createDefinitionPage
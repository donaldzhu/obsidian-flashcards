import _ from 'lodash'

import dictServices from '../../services/dictServices'
import { CSS_CLASSES, NATIVE_CLASSES } from '../../settings/constants'
import { truncateDefList } from '../../utils/dictUtils'
import CreateCardModalPage, { renderCard } from '../createCardModalPage'
import { ModalPage } from '../createCardModalTypes'

const createDefinitionPage = () => new CreateCardModalPage(
  modal => {
    const furigana = modal.result.solution
    return `Select Primary Definition - ${furigana ?
      dictServices.furiganaToRuby(furigana) : modal.result.kana}`
  },
  'Create',
  (modal, templateElems) => {
    if (modal.dictDefinitions.length === 1) {
      modal.skipPage()
      return
    }

    modal.dictDefinitions.forEach(({ translations, partsOfSpeech }, index) => {
      const resultWrapper = renderCard(modal, templateElems, index)

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
  modal => {
    const dictDefinitions = [...modal.dictDefinitions]
    const { index } = modal.getPageData(ModalPage.Definition)
    modal.result.definitions = [
      ..._.pullAt(dictDefinitions, index.value),
      ...dictDefinitions
    ]
    console.log('Sorted Definitions:', modal.result.definitions)
  },
  {
    data: { index: 0 },
    className: NATIVE_CLASSES.SETTING_WRAPPER
  }
)

export default createDefinitionPage
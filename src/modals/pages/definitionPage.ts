import _ from 'lodash'

import dictServices from '../../services/dictServices'
import { CSS_CLASSES, NATIVE_CLASSES } from '../../settings/constants'
import { truncateDefinition } from '../../utils/dictUtils'
import { memoize } from '../../utils/modalUtils'
import CreateCardModalPage, { renderCard } from '../createCardModalPage'
import { ModalPage } from '../createCardModalTypes'

const definitionPage = new CreateCardModalPage(
  modal => {
    const furigana = modal.result.solution
    return `Select Primary Definition - ${furigana ?
      dictServices.furiganaToRuby(furigana) : modal.result.kana}`
  },
  'Create',
  (modal, templateElems) => {
    if (modal.dictDefinitions.length === 1) return modal.skipPage()

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

      for (
        let i = 0, trans = translations.slice(0, 3), chars = 0;
        i < trans.length && chars <= 100;
        chars += trans[i++].length
      ) {
        ulElem.createEl('li', {
          text: truncateDefinition(trans[i], 80)
        })
      }
    })
  },
  modal => {
    const dictDefinitions = [...modal.dictDefinitions]
    // const { index } = (this as unknown as typeof definitionPage).data
    const { index } = modal.getPageData(ModalPage.Definition)
    modal.result.definitions = [
      ..._.pullAt(dictDefinitions, index.value),
      ...dictDefinitions
    ]
    console.log('Sorted Definitions:', modal.result.definitions)
  },
  {
    data: {
      index: memoize(0)
    },
    className: NATIVE_CLASSES.SETTING_WRAPPER
  }
)

export default definitionPage
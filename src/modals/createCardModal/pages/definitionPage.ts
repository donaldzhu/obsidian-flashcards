import _ from 'lodash'

import dictServices from '../../../services/dictServices'
import logServices from '../../../services/logServices'
import { CSS_CLASSES, NATIVE_CLASSES } from '../../../settings/constants'
import { truncateDefList } from '../../../utils/dictUtils'
import { createPos } from '../../../utils/modalUtils'
import CreateModalPage from '../../createModalPage'
import { CreateCardModalPage } from '../createCardModalType'

import type CreateCardModal from '../createCardModal'
const createDefinitionPage = (modal: CreateCardModal) => new CreateModalPage(
  {
    header: () => `Select Primary Definition - ${modal.result.solution ?
      dictServices.furiganaToRuby(modal.result.solution) : modal.result.kana}`,
    btnText: 'Create',
    render: () => {
      if (modal.dictDefinitions.length === 1)
        return modal.skipPage()

      modal.dictDefinitions.forEach(({ translations, partsOfSpeech }, index) => {
        const resultWrapper = modal.renderCard(index)
        const posElem = resultWrapper.createEl('p', {
          cls: CSS_CLASSES.POS
        })
        createPos(partsOfSpeech, { wrapper: posElem })


        const ulElem = resultWrapper.createEl('ul')

        truncateDefList(translations)
          .forEach(translation =>
            ulElem.createEl('li', {
              text: translation
            }))
      })
    },
    submit: () => {
      const dictDefinitions = [...modal.dictDefinitions]
      const { index } = modal.pageData[CreateCardModalPage.Definition]
      modal.result.definitions = [
        ..._.pullAt(dictDefinitions, index.value),
        ...dictDefinitions
      ]
      logServices.log('Sorted Definitions:', modal.result.definitions)
    },
    className: NATIVE_CLASSES.SEARCH_RESULTS_WRAPPER
  }
)

export default createDefinitionPage
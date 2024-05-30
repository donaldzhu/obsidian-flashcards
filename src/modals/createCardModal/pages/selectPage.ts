import _ from 'lodash'

import dictServices from '../../../services/dictServices'
import logServices from '../../../services/logServices'
import { CSS_CLASSES, NATIVE_CLASSES } from '../../../settings/constants'
import { isKanaOnly, truncateDef } from '../../../utils/dictUtils'
import CreateModalPage from '../../createModalPage'
import { CreateCardModalPage } from '../createCardModalType'

import type CreateCardModal from '../createCardModal'
import type jmDictIndices from '../../../data/JMdictIndices'
const createSelectPage = (modal: CreateCardModal) => new CreateModalPage(
  {
    header: 'Create new flashcard',
    btnText: 'Search',
    render: () => {
      if (modal.fuzzyResults.length === 1)
        return modal.skipPage()

      modal.fuzzyResults.forEach(({
        furigana,
        kana,
        definitions,
        isCommon
      }, index) => {
        const resultWrapper = modal.renderCard(
          index,
          [!!furigana && CSS_CLASSES.HAS_FURIGANA]
        )

        const header = resultWrapper.createEl('h1', { cls: NATIVE_CLASSES.SEARCH_RESULT_HEADER })
        header.innerHTML = dictServices.furiganaToRuby(furigana ?? kana)

        if (!isCommon) header.createSpan({
          cls: NATIVE_CLASSES.FLAIR,
          text: 'UNCOMMON'
        })

        resultWrapper.createEl('p', {
          text: truncateDef(definitions[0].join(', '))
        })
      })
    },
    submit: async () => {
      const { index } = modal.pageData[CreateCardModalPage.Result]
      const result = modal.fuzzyResults[index.value]
      const { furigana, kanji, kana } = result

      // const misc =dictServices.getMisc(
      //   data,
      //   kana,
      //   kanji,
      //   translations
      // )


      const firstChar = kana[0] as typeof jmDictIndices[number]
      const jmDict = modal.jmDictMap[firstChar]
      if (!jmDict.data) await jmDict.promise

      const { data } = jmDict
      if (!data) throw new Error('Jmdict data is unexpectedly undefined.')

      modal.dictDefinitions = result.definitions.map((translations, i) => ({
        translations,
        partsOfSpeech: result.partsOfSpeech[i].map(pos => dictServices.parseDictPos(pos)),
        misc: dictServices.getMisc(
          data,
          kana,
          kanji,
          translations
        )
      }))

      Object.assign(modal.result, {
        ..._.pick(result, ['pitch', 'audio', 'kanji', 'kana']),
        solution: furigana ?? kana,
        sentences: await dictServices.searchSentence(
          kana,
          !isKanaOnly(modal.dictDefinitions[0]) ? kanji : undefined
        )
      })

      logServices.log('Definitions: ', modal.dictDefinitions)
    },
    className: NATIVE_CLASSES.SEARCH_RESULTS_WRAPPER
  }
)

export default createSelectPage
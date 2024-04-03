import _ from 'lodash'

import dictServices from '../../services/dictServices'
import { CSS_CLASSES, NATIVE_CLASSES } from '../../settings/constants'
import { truncateDefinition } from '../../utils/dictUtils'
import { memoize } from '../../utils/modalUtils'
import CreateCardModalPage, { renderCard } from '../createCardModalPage'
import { ModalPage } from '../createCardModalTypes'

import type jmDictIndices from '../../data/JMdictIndices'
const selectPage = new CreateCardModalPage(
  'Create new flashcard',
  'Search',
  (modal, templateElems) => {
    if (modal.fuzzyResults.length === 1) return modal.skipPage()

    modal.fuzzyResults.forEach(({
      furigana,
      kana,
      definitions,
      isCommon
    }, index) => {
      const resultWrapper = renderCard(
        modal,
        templateElems,
        index,
        [!!furigana && CSS_CLASSES.HAS_FURIGANA]
      )

      const header = resultWrapper.createEl('h1', { cls: NATIVE_CLASSES.CARD_HEADER })
      header.innerHTML = dictServices.furiganaToRuby(furigana ?? kana)

      if (!isCommon) header.createSpan({
        cls: NATIVE_CLASSES.FLAIR,
        text: 'UNCOMMON'
      })

      resultWrapper.createEl('p', {
        text: truncateDefinition(definitions[0].join(', '))
      })
    })
  },
  async modal => {
    const { index } = modal.getPageData(ModalPage.Result)
    const result = modal.fuzzyResults[index.value]
    const { furigana, kanji, kana } = result

    Object.assign(modal.result, {
      ..._.pick(result, ['pitch', 'audio', 'kanji', 'kana']),
      solution: furigana ?? kana,
      sentences: await dictServices.searchSentence(kanji ?? kana)
    })

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

    console.log('Definitions: ', modal.dictDefinitions)
  },
  {
    data: {
      index: memoize(0)
    },
    className: NATIVE_CLASSES.SETTING_WRAPPER
  }
)

export default selectPage
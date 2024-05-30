import { Notice, SuggestModal, TFile, TFolder } from 'obsidian'

import Card from '../card'
import dictServices from '../services/dictServices'
import { DEFAULT_SETTINGS } from '../settings/constants'
import { compareJp, hasJp, hasKanji, prepString, truncateDef } from '../utils/dictUtils'
import { getFile } from '../utils/obsidianUtil'
import { filterFalsy } from '../utils/util'
import CardModal from './cardModal/cardModal'

import type { CardInterface } from '../card'
class CardSuggestModal extends SuggestModal<CardInterface> {
  constructor() {
    super(app)
  }

  async getSuggestions(query: string) {
    const folder = getFile(DEFAULT_SETTINGS.SUBFOLDER)
    if (!(folder instanceof TFolder)) return []
    const files = folder.children.filter(file => file instanceof TFile) as TFile[]
    const cards = filterFalsy(await Promise.all(files.map(file => Card.parseFromFile(file))))

    return cards.filter(card => {
      if (!hasJp(query)) {
        return compareJp(card.kana, query)
      } else if (hasKanji(query) && card.kanji) {
        return prepString(card.kanji).contains(prepString(query))
      } else if (!hasKanji(query)) {
        return prepString(card.kana).contains(prepString(query))
      }
    })
  }

  renderSuggestion(card: CardInterface, el: HTMLElement) {
    const header = el.createDiv()

    header.createSpan().innerHTML = dictServices
      .furiganaToRuby(card.solutionAlias ?? card.solution)

    const [definition] = card.definitions
    const subheader = el.createDiv()
    const posSpan = subheader.createEl('small', { cls: 'card-suggest-pos' }) // TODO
    const posHtmlArray = dictServices
      .posToText(definition.partsOfSpeech, { shorten: true })
      .map(([type]) => type)
    posSpan.innerHTML = posHtmlArray.join(', ') + ' '

    subheader.createEl('small', {
      text: truncateDef(card.definitionAlias ?? definition.translations.join(', '))
    })
  }

  onChooseSuggestion(card: CardInterface) {
    new CardModal(card).open()
  }
}

export default CardSuggestModal
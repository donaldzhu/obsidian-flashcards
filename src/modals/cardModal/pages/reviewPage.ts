import _ from 'lodash'
import { Setting } from 'obsidian'

import dictServices from '../../../services/dictServices'
import logServices from '../../../services/logServices'
import { CSS_CLASSES, NATIVE_CLASSES } from '../../../settings/constants'
import conjugate from '../../../utils/conjugationUtil'
import { isKanaOnly } from '../../../utils/dictUtils'
import { createAudio, createDefinitions, createPitch } from '../../../utils/modalUtils'
import { createTooltips } from '../../../utils/obsidianUtil'
import CreateModalPage from '../../createModalPage'
import { PageModal } from '../../pageModal'

import type { ParsedSentence } from '../../../types/cardTypes'
import type { CardInterface } from '../../../card'
import type { ModalElem } from '../../pageModalType'
import type { VerbPos } from '../../../utils/conjugationUtil'

import type CardModal from '../cardModal'
const createHeader = (
  {
    solution,
    solutionAlias,
    kana,
    audio,
    pitch,
    tags
  }: CardInterface,
  { pageWrapper }: ModalElem
) => {
  const cardWrapper = pageWrapper.createDiv({
    cls: `${CSS_CLASSES.REVIEW_ROW_WRAPPER} review-card-header-wrapper`
  })

  const headerWrapper = cardWrapper.createDiv({
    cls: CSS_CLASSES.SOLUTION_HEADER_WRAPPER
  })

  const header = headerWrapper.createEl('h1', {
    cls: CSS_CLASSES.SOLUTION_HEADER
  })

  const furigana = solutionAlias ?? solution
  header.innerHTML = furigana ? dictServices.furiganaToRuby(furigana) : kana

  const subheaderWrapper = cardWrapper.createDiv({
    cls: 'solution-subheader-wrapper' // TODO
  })

  createPitch(pitch, {
    wrapper: subheaderWrapper,
    cls: CSS_CLASSES.PITCH_WRAPPER
  })
  createAudio(audio, {
    wrapper: subheaderWrapper,
    cls: CSS_CLASSES.AUDIO_WRAPPER
  })
}

const createConjugations = (
  conjugations: ReturnType<typeof conjugate>,
  pageWrapper: HTMLDivElement
) => {
  conjugations.forEach(conjugation => {
    const formWrapper = pageWrapper.createDiv()

    formWrapper.createEl('h3', {
      text: _.capitalize(conjugation.name),
      cls: 'stop-border'
    })

    const conjugationWrapper = formWrapper.createDiv({
      cls: 'review-card-conjugation'
    })

    const positivities = ['positive', 'negative'] as const
    const formalities = ['informal', 'formal'] as const

    const hasPositivity =
      conjugation.formal?.negative ??
      conjugation.informal?.negative
    const hasFormality = conjugation.formal && conjugation.informal

    positivities.forEach(positivity => {
      if (!hasPositivity && positivity === 'negative') return
      const positivityWrapper = conjugationWrapper.createDiv({ cls: 'callout' })
      positivityWrapper.dataset.callout =
        !hasPositivity ? 'quote' :
          positivity === 'positive' ?
            'success' : 'failure'


      formalities.forEach(formality => {
        const text = conjugation[formality]?.[positivity]
        if (!text) return
        const formalityWrapper = positivityWrapper.createDiv()
        formalityWrapper.createEl('p', { text })
        if (!hasFormality) return
        formalityWrapper.createEl('p', {
          text: formality,
          cls: NATIVE_CLASSES.FLAIR_FLAT
        })
      })
    })
  })
}

const createPrimary = (
  {
    definitions,
    definitionAlias,
    kana,
    kanji,
    lesson
  }: CardInterface,
  { pageWrapper }: ModalElem
) => {
  const primaryWrapper = pageWrapper.createDiv({ cls: `${CSS_CLASSES.REVIEW_ROW_WRAPPER} ${CSS_CLASSES.REVIEW_PRIMARY_WRAPPER}` })

  const posRowWrapper = primaryWrapper.createDiv({ cls: CSS_CLASSES.POS_WRAPPER })
  createDefinitions(definitions[0], {
    innerWrapper: posRowWrapper,
    outerWrapper: primaryWrapper,
    definitionAlias,
    misc: lesson
  })

  const verbPos = definitions[0].partsOfSpeech.find(pos =>
    pos.type === 'verb' &&
    pos.verbType &&
    pos.verbSpecialSuffix !== 'ずる' &&
    pos.verbSpecialSuffix !== '~する'
  ) as VerbPos
  if (!verbPos) return
  if (verbPos.verbType === 'る') verbPos.verbSuffix = 'る'

  const conjugations = conjugate({
    kana,
    kanji,
    kanaOnly: isKanaOnly(definitions[0]),
    pos: verbPos
  })

  new Setting(posRowWrapper)
    .addButton(btn => btn
      .setButtonText('Show Conjugations')
      .onClick(() => {
        PageModal.openSinglePage(() => new CreateModalPage(
          {
            header: 'Conjugations',
            render: ({ pageWrapper }) => createConjugations(conjugations, pageWrapper),
            className: 'review-card-conjugations'
          }
        ))
      })
    )
}

const createFromSentenceArray = (
  sentenses: ParsedSentence[],
  wrapper: Element
) => {
  const sentencesList = wrapper
    .createDiv({ cls: `${CSS_CLASSES.REVIEW_ROW_WRAPPER} ${CSS_CLASSES.REVIEW_SENTENCE_WRAPPER}` })
    .createEl('ul')

  return sentenses.map(({ furigana, audio, translation }) => {
    const listItem = sentencesList.createEl('li')

    const sentenceWrapper = listItem.createDiv({
      cls: 'solution-sentence-wrapper'
    })

    const sentenceElem = sentenceWrapper.createDiv()
    const furiganaWrapper = sentenceElem.createDiv({
      cls: 'solution-sentence-furigana-wrapper'
    })

    const furiganaElem = furiganaWrapper.createEl('span', {
      cls: 'solution-sentence-furigana'
    })

    createAudio(audio, {
      wrapper: furiganaWrapper,
      cls: 'solution-audio-wrapper'
    }) // TODO

    const { kanji, kana } = dictServices.parseFurigana(furigana)
    furiganaElem.innerText = kanji ?? ''
    furiganaElem.onmouseover = e => createTooltips(e, kana)
    furiganaElem.onmouseout = () => document.querySelector('#furigana-tooltip')?.remove()
    sentenceElem.createEl('p', {
      text: translation,
      cls: 'solution-sentence-translation'
    })

    return sentenceWrapper
  })
}

const createSentences = (card: CardInterface, { pageWrapper }: ModalElem) => {
  const { sentences } = card
  if (!sentences.length) return

  const sentenceWrapper = createFromSentenceArray(sentences.slice(0, 1), pageWrapper)[0]

  new Setting(sentenceWrapper)
    .addButton(btn => btn
      .setButtonText('Show More')
      .onClick(() =>
        PageModal.openSinglePage(() => new CreateModalPage(
          {
            header: 'Example Sentences',
            render: ({ pageWrapper }) => {
              createFromSentenceArray(sentences.slice(0, 5), pageWrapper)
            }
          }
        ))
      )
    )
}

const createTags = ({ tags }: CardInterface, { pageWrapper }: ModalElem) => {
  if (!tags) return
  const tagsWrapper = pageWrapper
    .createDiv({
      cls: `${CSS_CLASSES.REVIEW_ROW_WRAPPER} metadata-property-value review-card-tags-wrapper`
    })
    .createDiv({
      cls: 'multi-select-container'
    })
  tags.forEach(tag =>
    tagsWrapper.createDiv({ cls: NATIVE_CLASSES.MULTI_SELECT_PILL })
      .createDiv({ cls: NATIVE_CLASSES.MULTI_SELECT_PILL_CONTENT, text: tag }))
}

const createReviewPage = (modal: CardModal) => new CreateModalPage(
  {
    header: 'Review Flashcard',
    render: templateElems => {
      const { card } = modal

      logServices.log('Review card:', card)
      createHeader(card, templateElems)
      createPrimary(card, templateElems)
      createSentences(card, templateElems)
      createTags(card, templateElems)
    },
    wrapperClassName: 'flashcard-solution'
  }
)

export default createReviewPage

import _ from 'lodash'
import { Notice } from 'obsidian'

import dictServices from '../services/dictServices'
import { CSS_CLASSES, NATIVE_CLASSES } from '../settings/constants'
import { validateString } from './util'

import type { CardInterface } from '../types/cardTypes'
import type { ModalElem } from '../modals/pageModalType'

export interface Memoized<T> {
  reset: () => void
  value: T
}

export const memoize = <T>(initial: T): Memoized<T> => {
  return {
    reset: function () {
      this.value = _.cloneDeep(initial)
    },
    value: _.cloneDeep(initial)
  }
}

export const onIncompleteCardError = (card: Partial<CardInterface>, message?: string) => {
  if (message) {
    new Notice(message, 8000)
    console.error(message, card)
  }
  else console.error(card)
  return new Error('Incomplete card data.')
}

export const createCardModalPage = (result: Partial<CardInterface>, templateElems: ModalElem) => {
  const { pageWrapper } = templateElems
  console.log('Results:', result)

  const { solution, kana, definitions, audio, pitch } = result
  if (!kana || !definitions) return

  const { partsOfSpeech, misc } = definitions[0]

  const cardWrapper = pageWrapper.createDiv({
    cls: CSS_CLASSES.SOLUTION_CARD_WRAPPER
  })

  const headerWrapper = cardWrapper.createDiv({
    cls: CSS_CLASSES.SOLUTION_HEADER_WRAPPER
  })
  const solutionHeader = headerWrapper.createEl('h1', {
    cls: CSS_CLASSES.SOLUTION_HEADER
  })

  solutionHeader.innerHTML = solution ? dictServices.furiganaToRuby(solution) : kana

  if (audio) {
    const audioWrapper = headerWrapper.createDiv({ cls: CSS_CLASSES.AUDIO_WRAPPER })
    const audioIcon = audioWrapper.createEl('i', {
      cls: 'fa-solid fa-volume-high'
    })

    const audioPlayer = new Audio(result.audio)
    audioPlayer.load()
    audioIcon.onclick = () => audioPlayer.play()
  }

  if (pitch) {
    const pitchWrapper = headerWrapper.createDiv({ cls: CSS_CLASSES.PITCH_WRAPPER })
    const pitchText = pitchWrapper.createEl('h2')
    dictServices
      .parsePitch(pitch)
      .forEach(parsedPitch => pitchText.appendChild(parsedPitch))
  }

  const posStringArrays = dictServices.posToText(partsOfSpeech, { prefix: true })
  const posHtmlArray = posStringArrays.map(([type, props]) => {
    return `${type} ${props ? `<span class='${NATIVE_CLASSES.POS}'>(${props})</span>` : ''}`
  })

  const miscWrapper = cardWrapper
    .createEl('p', { cls: CSS_CLASSES.POS })

  const posElem = miscWrapper
    .createEl('i')
  posElem.innerHTML = posHtmlArray.join(', ')

  const miscs = _.intersection(misc ?? [], ['Kana Only', 'Archaic', 'Obsolete', 'Rare'])

  // TODO
  miscs.forEach(text => miscWrapper.createSpan({
    cls: 'flair mod-flat', text
  }))

  const ulElem = cardWrapper.createEl('ul')

  definitions[0].translations.forEach(text =>
    ulElem.createEl('li', { text }))

  const tagsOuterWrapper = cardWrapper.createDiv({
    cls: NATIVE_CLASSES.METADATA_PROPERTY_VALUE
  })

  tagsOuterWrapper.createDiv({
    cls: NATIVE_CLASSES.MULTI_SELECT_CONTAINER
  })

  tagsOuterWrapper.style.display = 'none'
}

export const renderModalTags = (tags: Memoized<string[]>, templateElems: ModalElem) => {
  const { pageWrapper } = templateElems
  const tagsOuterWrapper = pageWrapper.querySelector(`.${NATIVE_CLASSES.METADATA_PROPERTY_VALUE}`)
  const tagsWrapper = pageWrapper.querySelector(`.${NATIVE_CLASSES.MULTI_SELECT_CONTAINER}`)

  const isHTMLElem = (element: Element | null): element is HTMLElement =>
    !!(element && (element instanceof HTMLElement))

  if (
    !isHTMLElem(tagsWrapper) ||
    !isHTMLElem(tagsOuterWrapper)
  ) return

  tagsOuterWrapper.style.display = validateString(!tags.value.length, 'none')

  tagsWrapper.empty()
  tags.value.forEach(tag => {
    if (!tagsWrapper) return
    const tagWrapper = tagsWrapper.createDiv({
      cls: NATIVE_CLASSES.MULTI_SELECT_PILL
    })

    tagWrapper.createDiv({ cls: NATIVE_CLASSES.MULTI_SELECT_PILL_CONTENT, text: tag })
    tagWrapper.createDiv({ cls: NATIVE_CLASSES.MULTI_SELECT_PILL_REMOVE })
      .createEl('i', 'fa-solid fa-xmark')
      .onclick = () => {
        _.pull(tags.value, tag)
        renderModalTags(tags, templateElems)
      }
  })
}
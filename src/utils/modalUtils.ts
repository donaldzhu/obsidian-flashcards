import _ from 'lodash'

import dictServices from '../services/dictServices'
import logServices from '../services/logServices'
import { CSS_CLASSES, NATIVE_CLASSES } from '../settings/constants'
import { filterFalsy, validateString } from './util'

import type { MiscType, ParsedDefinition, ParsedPos } from '../types/cardTypes'
import type { JotobaPitch } from '../types/dictTypes'
import type Card from '../card'
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

interface ModalPartConfig {
  wrapper: Element,
  cls?: string
}

interface DefinitionConfig {
  innerWrapper: Element,
  outerWrapper?: Element,
  definitionAlias?: string
  misc?: string
}

export const createAudio = (audio: string | undefined, { wrapper, cls }: ModalPartConfig) => {
  if (!audio) return
  const audioWrapper = wrapper.createDiv({ cls })
  const audioIcon = audioWrapper.createEl('i', {
    cls: 'fa-solid fa-volume-high' // TODO
  })

  const audioPlayer = new Audio(audio)
  audioPlayer.load()
  audioIcon.onclick = () => audioPlayer.play()
}

export const createPitch = (
  pitch: JotobaPitch[] | undefined,
  { wrapper, cls }: ModalPartConfig
) => {
  if (!pitch) return
  const pitchWrapper = wrapper.createDiv({ cls })
  const pitchText = pitchWrapper.createEl('h2')
  dictServices
    .parsePitch(pitch)
    .forEach(parsedPitch => pitchText.appendChild(parsedPitch))
}

export const createPos = (partsOfSpeech: ParsedPos[], { wrapper }: ModalPartConfig) => {
  const posStringArrays = dictServices.posToText(partsOfSpeech, { prefix: true })
  const posHtmlArray = posStringArrays.map(([type, props]) =>
    `${type} ${props ? `<span class='${NATIVE_CLASSES.POS}'>(${props})</span>` : ''}`
  )
  wrapper.innerHTML = posHtmlArray.join(', ')
}

export const createDefinitions = (
  definition: ParsedDefinition,
  {
    innerWrapper,
    outerWrapper,
    definitionAlias,
    misc
  }: DefinitionConfig
) => {
  const { partsOfSpeech } = definition
  const miscWrapper = innerWrapper.createEl('p', { cls: CSS_CLASSES.POS })
  createPos(partsOfSpeech, { wrapper: miscWrapper.createEl('i') })

  const miscs = misc ? [misc] : _.intersection(definition.misc ?? [], ['Kana Only', 'Archaic', 'Obsolete', 'Rare'])
  miscs.forEach(text => miscWrapper.createSpan({
    cls: NATIVE_CLASSES.FLAIR_FLAT, text
  }))

  const ulElem = (outerWrapper ?? innerWrapper).createEl('ul')

  const translations = filterFalsy([definitionAlias, ...definition.translations])
  translations.slice(0, 5).forEach(text =>
    ulElem.createEl('li', { text }))
}

export const createCardModalPage = (card: Card, templateElems: ModalElem) => {
  const { pageWrapper } = templateElems
  logServices.log('Results:', card)

  const { solution, kana, definitions, audio, pitch } = card
  if (!kana || !definitions) return

  const cardWrapper = pageWrapper.createDiv({
    cls: CSS_CLASSES.CREATE_CARD_SOLUTION_WRAPPER
  })

  const headerWrapper = cardWrapper.createDiv({
    cls: CSS_CLASSES.SOLUTION_HEADER_WRAPPER
  })
  const solutionHeader = headerWrapper.createEl('h1', {
    cls: CSS_CLASSES.SOLUTION_HEADER
  })

  solutionHeader.innerHTML = solution ? dictServices.furiganaToRuby(solution) : kana

  createPitch(pitch, {
    wrapper: headerWrapper,
    cls: CSS_CLASSES.PITCH_WRAPPER
  })
  createAudio(audio, {
    wrapper: headerWrapper,
    cls: CSS_CLASSES.AUDIO_WRAPPER
  })
  createDefinitions(definitions[0], { innerWrapper: cardWrapper })

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
      .createEl('i', 'fa-solid fa-xmark') // TODO
      .onclick = () => {
        _.pull(tags.value, tag)
        renderModalTags(tags, templateElems)
      }
  })
}
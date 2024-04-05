import _ from 'lodash'
import { Setting } from 'obsidian'

import dictServices from '../../services/dictServices'
import { CSS_CLASSES, DEFAULT_SETTINGS, NATIVE_CLASSES } from '../../settings/constants'
import GenericTextSuggester from '../../suggesters/genericTextSuggest'
import TagSuggester from '../../suggesters/tagSuggest'
import { validateString } from '../../utils/util'
import CreateCardModalPage from '../createCardModalPage'
import { ModalPage } from '../createCardModalTypes'

import type { CreateCardModal } from '../createCardModal'
import type { ModalElem } from '../createCardModalTypes'
import type { CardInterface } from '../../types/cardTypes'

const getPropKey = (key: keyof typeof DEFAULT_SETTINGS.PROP_KEYS) => {
  return `${DEFAULT_SETTINGS.PROP_PREFIX} ${DEFAULT_SETTINGS.PROP_KEYS[key]}`
}

const renderTags = (modal: CreateCardModal, templateElems: ModalElem) => {
  const { pageWrapper: settingWrapper } = templateElems
  const tagsOuterWrapper = settingWrapper.querySelector(`.${NATIVE_CLASSES.METADATA_PROPERTY_VALUE}`)
  const tagsWrapper = settingWrapper.querySelector(`.${NATIVE_CLASSES.MULTI_SELECT_CONTAINER}`)

  const isHTMLElem = (element: Element | null): element is HTMLElement =>
    !!(element && (element instanceof HTMLElement))

  if (
    !isHTMLElem(tagsWrapper) ||
    !isHTMLElem(tagsOuterWrapper)
  ) return

  const { tags } = modal.getPageData(ModalPage.Extra)

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
        renderTags(modal, templateElems)
      }
  })
}

const createExtraPage = () => new CreateCardModalPage(
  'Review Flashcard',
  'Submit',
  (modal, templateElems) => {
    const { pageWrapper: settingWrapper } = templateElems
    console.log('Results:', modal.result)

    const { solution, kana, definitions, audio, pitch } = modal.result
    if (!kana || !definitions) return

    const { partsOfSpeech, misc } = definitions[0]

    const cardWrapper = settingWrapper.createDiv({
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

      const audioPlayer = new Audio(modal.result.audio)
      audioPlayer.load()
      audioIcon.onclick = audioPlayer.play
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

    const { definitionAlias, solutionAlias, tags, lesson } = modal.getPageData(ModalPage.Extra)
    const definitionAliasSetting = new Setting(settingWrapper)
      .setName('Definition Alias')
      .setDesc('How the flashcard’s English definition will be shown.')
      .addText(text => text
        .setPlaceholder(definitions[0].translations.join(', '))
        .onChange(value => definitionAlias.value = value))

    new Setting(settingWrapper)
      .setName('Solution Alias')
      .setDesc('How the flashcard’s Japanese solution will be shown.')
      .addText(text => text
        .setValue(solution ?? '')
        .onChange(value => solutionAlias.value = value))

    new Setting(settingWrapper)
      .setName('Tags')
      .setDesc('Additional Tags.')
      .addText(text => new TagSuggester(
        text.inputEl,
        getPropKey('TAGS'),
        tags.value,
        {
          subfolder: DEFAULT_SETTINGS.SUBFOLDER,
          onSelect: item => {
            tags.value.push(item)
            renderTags(modal, templateElems)
          }
        }
      ))

    new Setting(settingWrapper)
      .setName('Lesson')
      .setDesc('The textbook lesson that the entry is from.')
      .addText(text => {
        const tags = TagSuggester.getTags(
          getPropKey('LESSON'),
          DEFAULT_SETTINGS.SUBFOLDER
        )
        text.onChange(value => lesson.value = value)
        new GenericTextSuggester(text.inputEl, tags)
      })

    definitionAliasSetting.controlEl.querySelector('input')?.focus()
  },
  modal => {
    const { definitionAlias, solutionAlias, tags, lesson } = modal.getPageData(ModalPage.Extra)
    const { result } = modal

    if (
      !result.solution ||
      !result.definitions ||
      !result.kana
    ) throw new Error(`Card data incomplete: ${result}`)

    result.definitionAlias = definitionAlias.value || undefined
    result.solutionAlias = solutionAlias.value || undefined
    result.tags = tags.value
    result.lesson = lesson.value || undefined

    // i don't know why typescript gave up here
    modal.onSubmit(result as CardInterface)
    modal.close()
  },
  {
    data: {
      definitionAlias: '',
      solutionAlias: '',
      tags: [],
      lesson: ''
    }
  }
)

export default createExtraPage
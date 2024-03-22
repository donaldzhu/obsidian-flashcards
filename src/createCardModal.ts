import _ from 'lodash'
import { Modal, Setting } from 'obsidian'

import dictServices from './services/dictServices'
import { cssClass, nativeClass } from './settings/constants'
import { filterFalsy, truncateDefinition } from './utils/util'

import type { Falsey } from 'lodash'
import type { FuzzyResult } from './services/dictTypes'

import type { App, ButtonComponent } from 'obsidian'
import type { CardInterface, DictDefintion } from './types/cardTypes'
type OnSubmitType = (result: CardInterface) => void
interface Elem {
  settingWrapper: HTMLDivElement
  title: HTMLHeadingElement
  nextButton: ButtonComponent,
  backButton: ButtonComponent
}
type PartialElem = Elem | Record<keyof Elem, undefined>

export class CreateCardModal extends Modal {
  private query: string
  private result: Partial<CardInterface>

  private fuzzyResults: FuzzyResult[]
  private resultIndex: number

  private dictDefinitions: DictDefintion[]
  private definitionIndex: number

  private pageNumber: number
  private pageProps: {
    header: string
    next: string,
    unmount: () => void,
    render: () => void,
    submit: () => Promise<void> | void
  }[]
  private elems: PartialElem
  private buttonIsDisabled: boolean
  private onSubmit: OnSubmitType

  constructor(app: App, onSubmit: OnSubmitType) {
    super(app)
    this.query = ''
    this.result = {
      solution: undefined,
      definitions: undefined,
      pitch: undefined,
      audio: undefined,
      kanji: undefined,
      kana: undefined,
      sentences: []
    }

    this.fuzzyResults = []
    this.resultIndex = 0

    this.dictDefinitions = []
    this.definitionIndex = 0

    this.pageNumber = -1
    this.pageProps = [
      {
        header: 'Create new flashcard',
        next: 'Search',
        unmount: _.noop,
        render: this.renderInputs,
        submit: this.submitInputs
      },
      {
        header: 'Select Search Result',
        next: 'Select',
        unmount: this.unmountSearchResults,
        render: this.renderSearchResults,
        submit: this.submitSearchResults
      },
      {
        header: 'Select Primary Definition',
        next: 'Create',
        unmount: this.unmountDefinitions,
        render: this.renderDefinitions,
        submit: this.submitDefinition
      },
      {
        header: 'Add Extra Data',
        next: 'Submit',
        unmount: _.noop,
        render: this.renderExtra,
        submit: _.noop
      }
    ]

    this.elems = {
      settingWrapper: undefined,
      title: undefined,
      nextButton: undefined,
      backButton: undefined
    }
    this.buttonIsDisabled = false

    this.onSubmit = onSubmit
  }

  onOpen() {
    const { contentEl } = this

    this.elems.title = contentEl.createEl('h1')
    this.elems.settingWrapper = contentEl.createDiv()

    new Setting(contentEl)
      .addButton(btn => {
        this.elems.backButton = btn
        btn
          .setDisabled(true)
          .setButtonText('Back')
          .onClick(() => this.toPrevPage())
        btn.buttonEl.onfocus = () => this.buttonIsDisabled = true
        btn.buttonEl.onblur = () => this.buttonIsDisabled = false
      })
      .addButton(btn => {
        this.elems.nextButton = btn
        btn
          .setCta()
          .onClick(async () => {
            if (this.query)
              this.toNextPage()
          })
      })

    this.toNextPage()
    window.addEventListener('keydown', this.keydownListener)
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
    window.removeEventListener('keydown', this.keydownListener)
  }

  private keydownListener = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !this.buttonIsDisabled)
      this.elems.nextButton?.buttonEl.click()
  }

  private async toNextPage() {
    this.buttonIsDisabled = true
    await this.pageProps[this.pageNumber++]?.submit.apply(this)
    this.turnPage()
  }

  private toPrevPage() {
    this.pageProps[this.pageNumber--]?.unmount.apply(this)
    this.turnPage()
  }

  private turnPage() {
    if (!this.validateElems(this.elems)) return
    const { header, next } = this.pageProps[this.pageNumber]
    const { settingWrapper, title, nextButton, backButton } = this.elems
    settingWrapper.empty()
    title.setText(header)
    nextButton.setButtonText(next)
    backButton.setDisabled(!this.pageNumber)
    this.pageProps[this.pageNumber].render.apply(this)
    this.buttonIsDisabled = false
  }

  private renderInputs() {
    const { settingWrapper } = this.elems
    if (!settingWrapper) return
    new Setting(settingWrapper)
      .setName('Japanese')
      .addText(text => {
        text.setValue(this.query)
        text.onChange(value =>
          this.query = value
        )
      })
  }

  private async submitInputs() {
    this.fuzzyResults = await dictServices.fuzzySearch(this.query)
  }

  private renderSearchResults() {
    this.fuzzyResults.forEach((result, i) => this.renderSearchResult(result, i))
  }

  private renderSearchResult(
    {
      furigana,
      kana,
      definitions,
      isCommon
    }: FuzzyResult,
    index: number
  ) {
    const resultWrapper = this.renderCard(index, [!!furigana && cssClass.HAS_FURIGANA])
    if (!resultWrapper) return

    const header = resultWrapper.createEl('h1')
    header.addClass(nativeClass.CARD_HEADER)
    header.innerHTML = furigana ? dictServices.furiganaToRuby(furigana) : kana
    if (!isCommon) {
      const span = header.createSpan()
      span.classList.add(nativeClass.FLAIR)
      span.innerText = 'UNCOMMON'
    }

    resultWrapper.createEl('p', {
      text: truncateDefinition(definitions[0])
    })
  }

  private onResultClicked(index: number) {
    if (this.pageNumber === 1)
      this.resultIndex = index
    else if (this.pageNumber === 2)
      this.definitionIndex = index
    const { settingWrapper } = this.elems
    if (!settingWrapper) return

    const resultWrappers = Array.from(settingWrapper.getElementsByClassName(nativeClass.CARD))
    for (let i = 0; i < resultWrappers.length; i++) {
      const resultWrapper = resultWrappers[i]
      if (i === index) resultWrapper.classList.add(nativeClass.CARD_IS_SELECTED)
      else resultWrapper.classList.remove(nativeClass.CARD_IS_SELECTED)
    }
  }

  private async submitSearchResults() {
    const result = this.fuzzyResults[this.resultIndex]
    const { furigana, kanji, kana } = result
    const currentResult: Partial<CardInterface> = {
      ..._.pick(result, [
        'pitch',
        'audio',
        'kanji',
        'kana'
      ]),
      solution: furigana ?? kana,
      sentences: await dictServices.searchSentence(kanji ?? kana)
    }

    Object.assign(this.result, currentResult)
    this.dictDefinitions = result.definitions.map((translation, i) => ({
      translation,
      pos: result.partsOfSpeech[i]
    }))

    console.log('Definitions: ', this.dictDefinitions)
  }

  private unmountSearchResults() {
    this.fuzzyResults = []
    this.elems.settingWrapper?.classList.remove(...cssClass.SETTING_WRAPPER)
    this.resultIndex = 0
  }

  private renderDefinitions() {
    this.dictDefinitions.forEach((definition, i) => this.renderDefinition(definition, i))
  }

  private renderDefinition({ translation, pos }: DictDefintion, index: number) {
    const resultWrapper = this.renderCard(index)
    if (!resultWrapper) return

    const posStringArrays = dictServices.posToText(pos.map(partOfSpeech =>
      dictServices.parseDictPos(partOfSpeech)))
    const posHtmlArray = posStringArrays.map(([type, props]) =>
      `${type}${props ? `<span class='${nativeClass.POS}'>(${props})</span>` : ''}`)

    const posElem = resultWrapper.createEl('p')
    posElem.innerHTML = posHtmlArray.join(', ')
    posElem.classList.add(cssClass.POS)

    const paragraph = resultWrapper.createEl('p')
    paragraph.createEl('span', {
      text: truncateDefinition(translation)
    })
  }

  private submitDefinition() {
    this.result.definitions = [
      ..._.pullAt(this.dictDefinitions, this.definitionIndex),
      ...this.dictDefinitions
    ].map(({ translation, pos }) => ({
      translation: translation,
      pos: pos.map(p => dictServices.parseDictPos(p))
    }))

    console.log('Sorted Definitions:', this.result.definitions)
  }

  private unmountDefinitions() {
    this.elems.settingWrapper?.classList.remove(...cssClass.SETTING_WRAPPER)
    this.definitionIndex = 0
  }

  private renderExtra() {
    console.log(this.result)

    const { settingWrapper } = this.elems
    const { solution, kana } = this.result
    if (!settingWrapper || !kana) return

    const solutionHeader = settingWrapper.createEl('h1')
    solutionHeader.innerHTML = solution ? dictServices.furiganaToRuby(solution) : kana
  }

  private renderCard(index: number, cssClasses?: (string | Falsey)[]) {
    const { settingWrapper } = this.elems
    if (!settingWrapper) return

    settingWrapper.classList.add(...cssClass.SETTING_WRAPPER)
    const resultWrapper = settingWrapper.createDiv()

    resultWrapper.classList.add(
      nativeClass.CARD,
      ...filterFalsy(cssClasses ?? [])
    )

    resultWrapper.tabIndex = 0
    resultWrapper.onfocus =
      resultWrapper.onclick =
      () => this.onResultClicked(index) // TODO
    if (!index) resultWrapper.focus()

    return resultWrapper
  }

  private validateElems(elems: PartialElem): elems is Elem {
    return Object.values(elems).every(elem => elem)
  }
}
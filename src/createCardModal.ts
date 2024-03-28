import _ from 'lodash'
import { Modal, Setting } from 'obsidian'

import dictServices from './services/dictServices'
import { cssClass, nativeClass } from './settings/constants'
import { filterFalsy, loopObject, truncateDefinition } from './utils/util'

import type { Falsey } from 'lodash'
import type { JotobaFuzzyResult } from './types/dictTypes'

import type { App, ButtonComponent } from 'obsidian'
import type { CardInterface, ParsedDefinition } from './types/cardTypes'
import type { JMDictData } from './types/dictTypes'

interface Memoized<T> {
  reset: () => void
  value: T
}

interface PageProp<T extends Record<string, Memoized<any>> | undefined = undefined> {
  header: string | (() => string)
  next: string
  render: () => void | (() => void)
  submit: () => Promise<void> | void
  classes?: string
  data: T
}

interface Elem {
  settingWrapper: HTMLDivElement
  title: HTMLHeadingElement
  nextButton: ButtonComponent,
  backButton: ButtonComponent
}

type PartialElem = Elem | Record<keyof Elem, undefined>

type OnSubmitType = (result: CardInterface) => void

enum ModalPage {
  Search,
  Result,
  Definition,
  Extra
}

export class CreateCardModal extends Modal {
  private jmdict: JMDictData
  private result: Partial<CardInterface>

  private initialQuery: string

  private fuzzyResults: JotobaFuzzyResult[]
  private dictDefinitions: ParsedDefinition[]

  private pageNumber: number
  private pageProps: [
    PageProp,
    PageProp<{ index: Memoized<number> }>,
    PageProp<{ index: Memoized<number> }>,
    PageProp
  ]
  private onPageUnmount: void | (() => void)

  private elems: PartialElem
  private buttonIsDisabled: boolean
  private onSubmit: OnSubmitType

  private readonly SETTING_WRAPPER_CLASS: string

  constructor(app: App, onSubmit: OnSubmitType, jmdictData: JMDictData) {
    super(app)
    this.jmdict = jmdictData

    this.result = {
      solution: undefined,
      definitions: undefined,
      pitch: undefined,
      audio: undefined,
      kanji: undefined,
      kana: undefined,
      sentences: []
    }

    this.initialQuery = ''
    this.fuzzyResults = []
    this.dictDefinitions = []

    this.SETTING_WRAPPER_CLASS = cssClass.SETTING_WRAPPER
    this.pageNumber = -1
    this.pageProps = [
      {
        header: 'Create new flashcard',
        next: 'Search',
        render: this.renderInputs,
        submit: this.submitInputs,
        data: undefined
      },
      {
        header: 'Select Search Result',
        next: 'Select',
        render: this.renderSearchResults,
        submit: this.submitSearchResults,
        data: {
          index: this.memoize(0)
        },
        classes: nativeClass.SETTING_WRAPPER
      },
      {
        header: () => {
          const furigana = this.result.solution
          return `Select Primary Definition - ${furigana ?
            dictServices.furiganaToRuby(furigana) : this.result.kana}`
        },
        next: 'Create',
        render: this.renderDefinitions,
        submit: this.submitDefinition,
        data: {
          index: this.memoize(0)
        },
        classes: nativeClass.SETTING_WRAPPER
      },
      {
        header: 'Add Extra Data',
        next: 'Submit',
        render: this.renderExtra,
        submit: _.noop,
        data: undefined
      }
    ]
    this.onPageUnmount = undefined

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
            if (this.initialQuery)
              this.toNextPage()
          })
      })

    this.toNextPage()
    window.addEventListener('keydown', this.submitKeydownListener)
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
    window.removeEventListener('keydown', this.submitKeydownListener)
  }

  private submitKeydownListener = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !this.buttonIsDisabled)
      this.elems.nextButton?.buttonEl.click()
  }

  private async toNextPage() {
    this.buttonIsDisabled = true
    await this.pageProps[this.pageNumber++]?.submit.apply(this)
    this.turnPage()
  }

  private toPrevPage() {
    this.pageNumber--
    const memos = this.getPageData(this.pageNumber)
    if (memos) loopObject(memos, (_, memo) => memo.reset())
    this.turnPage()
  }

  private turnPage() {
    if (!this.validateElems(this.elems)) throw this.invalidElemsError;
    (this.onPageUnmount || _.noop)()

    const { header, next, classes } = this.pageProps[this.pageNumber]
    const { settingWrapper, title, nextButton, backButton } = this.elems
    settingWrapper.empty()

    settingWrapper.className = this.SETTING_WRAPPER_CLASS
    if (classes) settingWrapper.classList.add(classes)

    title.innerHTML = typeof header === 'string' ? header : header()
    nextButton.setButtonText(next)
    backButton.setDisabled(!this.pageNumber)
    this.onPageUnmount = this.pageProps[this.pageNumber].render.apply(this)
    setTimeout(() => this.buttonIsDisabled = false, 100)
  }

  private renderInputs() {
    if (!this.validateElems(this.elems)) throw this.invalidElemsError
    const { settingWrapper } = this.elems
    const input = new Setting(settingWrapper)
      .setName('Japanese')
      .addText(text => {
        text.setValue(this.initialQuery)
        text.onChange(value =>
          this.initialQuery = value
        )
      })

    input.controlEl.querySelector('input')?.focus()
  }

  private async submitInputs() {
    this.fuzzyResults = await dictServices.fuzzySearch(this.initialQuery)
    console.log('Fuzzy: ', this.fuzzyResults)
  }

  private renderSearchResults() {
    this.fuzzyResults.forEach(({
      furigana,
      kana,
      definitions,
      isCommon
    }, index) => {
      const resultWrapper = this.renderCard(index, [!!furigana && cssClass.HAS_FURIGANA])
      const header = resultWrapper.createEl('h1', { cls: nativeClass.CARD_HEADER })
      header.innerHTML = dictServices.furiganaToRuby(furigana ?? kana)
      if (!isCommon) header.createSpan({
        cls: nativeClass.FLAIR,
        text: 'UNCOMMON'
      })

      resultWrapper.createEl('p', {
        text: truncateDefinition(definitions[0].join(', '))
      })
    })

    return this.getArrowKeydownListener(
      this.pageProps[ModalPage.Result].data.index,
      this.fuzzyResults.length
    )
  }

  private async submitSearchResults() {
    const { index } = this.getPageData(ModalPage.Result)
    const result = this.fuzzyResults[index.value]
    const { furigana, kanji, kana } = result

    Object.assign(this.result, {
      ..._.pick(result, [
        'pitch',
        'audio',
        'kanji',
        'kana'
      ]),
      solution: furigana ?? kana,
      sentences: await dictServices.searchSentence(kanji ?? kana)
    })

    if (!this.jmdict.data) await this.jmdict.promise
    const { data } = this.jmdict
    if (!data) throw new Error('Jmdict data is unexpectedly undefined.')

    this.dictDefinitions = result.definitions.map((translations, i) => ({
      translations,
      partsOfSpeech: result.partsOfSpeech[i].map(pos => dictServices.parseDictPos(pos)),
      misc: dictServices.getMisc(
        data,
        kana,
        kanji,
        translations
      )
    }))

    console.log('Definitions: ', this.dictDefinitions)
  }

  private renderDefinitions() {
    this.dictDefinitions.forEach(({ translations, partsOfSpeech }, index) => {
      const resultWrapper = this.renderCard(index)

      const posStringArrays = dictServices.posToText(partsOfSpeech)
      const posHtmlArray = posStringArrays.map(([type, props]) =>
        `${type}${props ? `<span class='${nativeClass.POS}'> (${props})</span>` : ''}`)

      const posElem = resultWrapper.createEl('p')
      posElem.innerHTML = posHtmlArray.join(', ')
      posElem.classList.add(cssClass.POS)

      const ulElem = resultWrapper.createEl('ul')
      for (
        let i = 0, trans = translations.slice(0, 3), chars = 0;
        i < trans.length && chars <= 100;
        chars += trans[i++].length
      ) {
        const translation = trans[i]
        ulElem.createEl('li', {
          text: truncateDefinition(translation, 80)
        })
      }
    })

    return this.getArrowKeydownListener(
      this.pageProps[ModalPage.Definition].data.index,
      this.dictDefinitions.length
    )
  }

  private submitDefinition() {
    const dictDefinitions = [...this.dictDefinitions]
    const { index } = this.getPageData(ModalPage.Definition)
    this.result.definitions = [
      ..._.pullAt(dictDefinitions, index.value),
      ...dictDefinitions
    ]

    console.log('Sorted Definitions:', this.result.definitions)
  }

  private renderExtra() {
    console.log(this.result)

    const { settingWrapper } = this.elems
    const { solution, kana, definitions } = this.result
    if (!settingWrapper || !kana || !definitions) return

    const { partsOfSpeech } = definitions[0]
    const solutionHeader = settingWrapper.createEl('h1')
    solutionHeader.classList.add('solution-header')
    solutionHeader.innerHTML = solution ? dictServices.furiganaToRuby(solution) : kana

    const posStringArrays = dictServices.posToText(partsOfSpeech, true)
    const posHtmlArray = posStringArrays.map(([type, props]) =>
      `${type}${props ? `<span class='${nativeClass.POS}'>(${props})</span>` : ''}`)

    const posElem = settingWrapper.createEl('p')
    posElem.innerHTML = `<i>${posHtmlArray.join(', ')}</i> - ${definitions[0].translations}`
  }

  private renderCard(index: number, cssClasses?: (string | Falsey)[]) {
    if (!this.validateElems(this.elems)) throw this.invalidElemsError
    const { settingWrapper } = this.elems

    settingWrapper.classList.add(...cssClass.SETTING_WRAPPER)
    const resultWrapper = settingWrapper.createDiv({
      cls: [
        nativeClass.CARD,
        ...filterFalsy(cssClasses ?? [])
      ]
    })

    resultWrapper.tabIndex = 0
    resultWrapper.onfocus =
      resultWrapper.onclick =
      () => this.onResultSelected(index)
    if (!index) resultWrapper.focus()

    return resultWrapper
  }

  private onResultSelected(resultIndex: number) {
    if (!this.validateElems(this.elems)) throw this.invalidElemsError

    this.getPageData(this.pageNumber === ModalPage.Result ?
      ModalPage.Result : ModalPage.Definition).index.value = resultIndex

    const { settingWrapper } = this.elems
    const { CARD, CARD_IS_SELECTED } = nativeClass

    const resultWrappers = Array.from(settingWrapper
      .getElementsByClassName(CARD)) as HTMLDivElement[]
    for (let i = 0; i < resultWrappers.length; i++) {
      const resultWrapper = resultWrappers[i]
      if (i === resultIndex) {
        resultWrapper.classList.add(CARD_IS_SELECTED)
        resultWrapper.focus()
      }
      else resultWrapper.classList.remove(CARD_IS_SELECTED)
    }
  }

  private getArrowKeydownListener(
    memoizedIndex: Memoized<number>,
    itemCount: number
  ) {
    const keyboardListener = (e: KeyboardEvent) => {
      const newIndex = this.getArrowKeydownIndex(
        e, memoizedIndex.value, itemCount)
      this.onResultSelected(newIndex)
    }

    window.addEventListener('keydown', keyboardListener)
    return () => window.removeEventListener('keydown', keyboardListener)
  }

  private getArrowKeydownIndex({ key }: KeyboardEvent, currentIndex: number, itemCount: number) {
    let result = currentIndex
    if (key === 'ArrowRight' && !(currentIndex % 2)) result++
    if (key === 'ArrowLeft' && currentIndex % 2) result--
    if (key === 'ArrowUp') result -= 2
    if (key === 'ArrowDown') result += 2
    return _.inRange(result, 0, itemCount) ? result : currentIndex
  }

  private validateElems(elems: PartialElem): elems is Elem {
    return Object.values(elems).every(elem => elem)
  }

  private memoize<T>(initial: T): Memoized<T> {
    return {
      reset: function () { this.value = initial },
      value: initial
    }
  }

  private get invalidElemsError() {
    return new Error('Modal elements are incomplete.')
  }

  private getPageData<T extends ModalPage>(pageNumber: T): typeof this.pageProps[T]['data'] {
    const pageProps = this.pageProps[pageNumber]
    return pageProps.data
  }
}
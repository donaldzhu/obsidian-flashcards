import _ from 'lodash'
import { Modal, Setting } from 'obsidian'

import { CSS_CLASSES, NATIVE_CLASSES } from '../settings/constants'
import { loopObject } from '../utils/util'
import { ModalPage } from './createCardModalTypes'
import createDefinitionPage from './pages/definitionPage'
import createExtraPage from './pages/extraPage'
import createSearchPage from './pages/searchPage'
import createSelectPage from './pages/selectPage'

import type { ModalElem, OnSubmitType, PartialModalElem } from './createCardModalTypes'
import type CreateCardModalPage from './createCardModalPage'
import type { JMDictMap, JotobaFuzzyResult } from '../types/dictTypes'
import type { CardInterface, ParsedDefinition } from '../types/cardTypes'
import type { Memoized } from '../utils/modalUtils'

export class CreateCardModal extends Modal {
  result: Partial<CardInterface>
  initialQuery: string

  fuzzyResults: JotobaFuzzyResult[]
  dictDefinitions: ParsedDefinition[]

  private pageNumber: number
  pages: [
    CreateCardModalPage,
    CreateCardModalPage<{ index: number }>,
    CreateCardModalPage<{ index: number }>,
    CreateCardModalPage<{
      definitionAlias: string,
      solutionAlias: string,
      tags: string[],
      lesson: string
    }>
  ]

  private onPageUnmount: void | (() => void)
  private isToNextPage: boolean

  private templateElems: PartialModalElem

  buttonIsDisabled: boolean

  constructor(
    public onSubmit: OnSubmitType,
    public jmDictMap: JMDictMap
  ) {
    super(app)
    this.result = {
      solution: undefined,
      definitions: undefined,
      pitch: undefined,
      audio: undefined,
      kanji: undefined,
      kana: undefined,
      sentences: [],
      definitionAlias: undefined,
      solutionAlias: undefined,
      tags: [],
      lesson: undefined
    }

    this.initialQuery = ''
    this.fuzzyResults = []
    this.dictDefinitions = []

    this.pageNumber = -1
    this.pages = [
      createSearchPage(),
      createSelectPage(),
      createDefinitionPage(),
      createExtraPage()
    ]

    this.onPageUnmount = undefined
    this.isToNextPage = true

    this.templateElems = {
      pageWrapper: undefined,
      title: undefined,
      nextButton: undefined,
      backButton: undefined,
    }

    this.buttonIsDisabled = false

    this.scope.register([], 'Enter', e => this.doSubmit(e))
    this.scope.register([], null, e => this.onArrowKeydown(e.key))
  }

  onOpen() {
    const { contentEl } = this
    app.keymap.pushScope(this.scope)

    this.templateElems.title = contentEl.createEl('h1')
    this.templateElems.pageWrapper = contentEl.createDiv()

    new Setting(contentEl)
      .addButton(btn => {
        this.templateElems.backButton = btn
        btn
          .setDisabled(true)
          .setButtonText('Back')
          .onClick(() => this.toPrevPage())
        btn.buttonEl.onfocus = () => this.buttonIsDisabled = true
        btn.buttonEl.onblur = () => this.buttonIsDisabled = false
      })
      .addButton(btn => {
        this.templateElems.nextButton = btn
        btn
          .setCta()
          .onClick(() => this.toNextPage())
      })

    this.toNextPage()
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
    app.keymap.popScope(this.scope)
    if (this.onPageUnmount) this.onPageUnmount()
  }

  doSubmit(e?: KeyboardEvent) {
    if (this.buttonIsDisabled) return
    e?.preventDefault()
    this.templateElems.nextButton?.buttonEl.click()
  }

  private async toNextPage() {
    this.buttonIsDisabled = true
    await this.getPage(this.pageNumber++)?.submit()
    if (this.pageNumber >= this.pages.length) return
    this.isToNextPage = true
    this.turnPage()
  }

  private toPrevPage() {
    const memos: Record<string, Memoized<any>> | undefined =
      this.getPageData(this.pageNumber--)
    if (memos) loopObject(memos, (_, memo) => memo.reset())
    this.isToNextPage = false
    this.turnPage()
  }

  private turnPage() {
    if (!this.validateElems(this.templateElems)) throw this.invalidElemsError;
    (this.onPageUnmount || _.noop)()

    const page = this.getPage(this.pageNumber)
    if (!page) return

    const { header, btnText, className } = page
    const { pageWrapper: settingWrapper, title, nextButton, backButton } = this.templateElems
    settingWrapper.empty()

    settingWrapper.className = CSS_CLASSES.SETTING_WRAPPER
    if (className) settingWrapper.classList.add(className)

    title.innerHTML = typeof header === 'string' ? header : header(this)
    nextButton.setButtonText(btnText)
    backButton.setDisabled(!this.pageNumber)
    this.onPageUnmount = page.render()
    setTimeout(() => this.buttonIsDisabled = false, 100)
  }

  async skipPage() {
    if (this.isToNextPage) await this.toNextPage()
    else this.toPrevPage()
  }

  onResultSelected(resultIndex: number) {
    if (!this.validateElems(this.templateElems)) throw this.invalidElemsError

    this.getPageData(this.pageNumber === ModalPage.Result ?
      ModalPage.Result : ModalPage.Definition).index.value = resultIndex

    const { pageWrapper: settingWrapper } = this.templateElems
    const { CARD, IS_SELECTED: CARD_IS_SELECTED } = NATIVE_CLASSES

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

  private onArrowKeydown(key: string) {
    if (
      this.pageNumber !== ModalPage.Result &&
      this.pageNumber !== ModalPage.Definition
    ) return

    const itemCount = this.pageNumber === ModalPage.Result ?
      this.fuzzyResults.length : this.dictDefinitions.length

    const newIndex = this.getArrowKeydownIndex(
      key,
      this.getPageData(this.pageNumber).index.value,
      itemCount
    )

    if (newIndex !== undefined)
      this.onResultSelected(newIndex)
  }

  private getArrowKeydownIndex(key: string, currentIndex: number, itemCount: number) {
    let result: number | undefined
    if (key === 'ArrowRight' && !(currentIndex % 2)) result = currentIndex + 1
    if (key === 'ArrowLeft' && currentIndex % 2) result = currentIndex - 1
    if (key === 'ArrowUp') result = currentIndex - 2
    if (key === 'ArrowDown') result = currentIndex + 2
    return result === undefined ? undefined :
      _.inRange(result, 0, itemCount) ? result : currentIndex
  }

  private validateElems(elems: PartialModalElem): elems is ModalElem {
    return Object.values(elems).every(elem => elem)
  }

  private get invalidElemsError() {
    return new Error('Modal elements are incomplete.')
  }

  private getPage(pageNumber: number) {
    const page = this.pages[pageNumber]

    if (!page) return

    const { templateElems } = this
    if (!this.validateElems(templateElems)) throw this.invalidElemsError

    return {
      ...page,
      render: () => page.render(this, templateElems),
      submit: () => page.submit(this, templateElems)
    }
  }

  getPageData<T extends ModalPage>(pageNumber: T): typeof this.pages[T]['data'] {
    const pageProps = this.pages[pageNumber]
    return pageProps.data
  }
}
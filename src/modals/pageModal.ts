import _ from 'lodash'
import { Modal, Setting } from 'obsidian'

import { CSS_CLASSES } from '../settings/constants'
import { loopObject } from '../utils/util'

import type { Memoized } from '../utils/modalUtils'
import type { ModalElem, PartialModalElem } from './pageModalType'
import type CreateModalPage from './createModalPage'

export abstract class PageModal extends Modal {
  pageNumber: number

  abstract pages: CreateModalPage[]
  abstract pageData?: (Record<string, Memoized<any>> | undefined)[]

  onPageUnmount: void | (() => void)
  isToNextPage: boolean

  templateElems: PartialModalElem

  buttonIsDisabled: boolean

  constructor() {
    super(app)
    this.pageNumber = -1

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

  async toNextPage() {
    this.buttonIsDisabled = true
    await this.getPage(this.pageNumber++)?.submit()
    if (this.pageNumber >= this.pages.length) return
    this.isToNextPage = true
    this.turnPage()
  }

  toPrevPage() {
    const memos: Record<string, Memoized<any>> | undefined =
      (this.pageData ?? [])[this.pageNumber--]
    if (memos) loopObject(memos, (_, memo) => memo.reset())
    this.isToNextPage = false
    this.turnPage()
  }

  turnPage() {
    if (!this.validateElems(this.templateElems)) throw this.invalidElemsError;
    (this.onPageUnmount || _.noop)()

    const page = this.getPage(this.pageNumber)
    if (!page) return

    const { header, btnText, className } = page
    const { pageWrapper, title, nextButton, backButton } = this.templateElems
    pageWrapper.empty()

    pageWrapper.className = CSS_CLASSES.SETTING_WRAPPER
    if (className) pageWrapper.classList.add(className)

    title.innerHTML = typeof header === 'string' ? header : header()
    nextButton.setButtonText(btnText)
    backButton.setDisabled(!this.pageNumber)
    this.onPageUnmount = page.render()
    setTimeout(() => this.buttonIsDisabled = false, 100)
  }

  async skipPage() {
    if (this.isToNextPage) await this.toNextPage()
    else this.toPrevPage()
  }

  validateElems(elems: PartialModalElem): elems is ModalElem {
    return Object.values(elems).every(elem => elem)
  }

  get invalidElemsError() {
    return new Error('Modal elements are incomplete.')
  }

  getPage(pageNumber: number) {
    const page = this.pages[pageNumber]

    if (!page) return

    const { templateElems } = this
    if (!this.validateElems(templateElems)) throw this.invalidElemsError

    return {
      ...page,
      render: () => page.render(templateElems),
      submit: () => page.submit(templateElems)
    }
  }
}
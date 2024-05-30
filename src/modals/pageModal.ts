import { Modal, Setting } from 'obsidian'

import { CSS_CLASSES } from '../settings/constants'
import { loopObject, validateString } from '../utils/util'

import type { Memoized } from '../utils/modalUtils'
import type { ModalElem, PartialModalElem } from './pageModalType'
import type CreateModalPage from './createModalPage'
export abstract class PageModal extends Modal {
  pageNumber: number

  abstract pages: CreateModalPage[]
  abstract pageData?: (Record<string, Memoized<any>> | undefined)[]

  onPageUnmount: Promise<void> | void | (() => void)
  isToNextPage: boolean

  templateElems: PartialModalElem

  buttonIsDisabled: boolean

  constructor(
    private className?: string
  ) {
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

    this.scope.register([], 'Enter', e => {
      const { activeElement } = document
      if (
        activeElement?.tagName === 'BUTTON' &&
        activeElement !== this.templateElems.nextButton?.buttonEl
      ) return
      this.doSubmit(e)
    })
  }

  onOpen() {
    const { contentEl } = this
    app.keymap.pushScope(this.scope)

    this.templateElems.title = contentEl.createEl('h1')
    this.templateElems.pageWrapper = contentEl.createDiv()

    const buttons = new Setting(contentEl)
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

    buttons.setClass(CSS_CLASSES.BUTTON_WRAPPER)
    this.toNextPage()
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
    app.keymap.popScope(this.scope)
    if (typeof this.onPageUnmount === 'function') this.onPageUnmount()
  }

  doSubmit(e?: KeyboardEvent) {
    if (this.buttonIsDisabled || e?.isComposing) return
    e?.preventDefault()
    this.templateElems.nextButton?.buttonEl.click()
  }

  async toNextPage() {
    this.buttonIsDisabled = true
    await this.getPage(this.pageNumber++)?.submit()
    if (this.pageNumber >= this.pages.length) return
    this.isToNextPage = true
    await this.turnPage()
  }

  async toPrevPage() {
    const memos: Record<string, Memoized<any>> | undefined =
      (this.pageData ?? [])[this.pageNumber--]
    if (memos) loopObject(memos, (_, memo) => memo.reset())
    this.isToNextPage = false
    await this.turnPage()
  }

  async turnPage() {
    if (!this.validateElems(this.templateElems)) throw this.invalidElemsError
    if (typeof this.onPageUnmount === 'function') this.onPageUnmount()

    const modalEl = this.containerEl.querySelector('.modal')
    const prevPage = this.getPage(this.pageNumber + (this.isToNextPage ? -1 : 1))

    if (prevPage?.wrapperClassName)
      this.toggleClassNames('remove', prevPage.wrapperClassName, modalEl)

    const page = this.getPage(this.pageNumber)
    if (!page) return

    const { header, btnText, className, wrapperClassName } = page
    const { pageWrapper, title, nextButton, backButton } = this.templateElems
    pageWrapper.empty()

    pageWrapper.className = validateString(this.className, `${this.className} `) + 'page-modal-wrapper'
    if (className) pageWrapper.addClass(className)
    if (wrapperClassName) this.toggleClassNames('add', wrapperClassName, modalEl)

    title.innerHTML = typeof header === 'string' ? header : header()
    nextButton.setButtonText(btnText ?? '')
    backButton.setDisabled(!this.pageNumber)
    this.onPageUnmount = await page.render()
    setTimeout(() => this.buttonIsDisabled = false, 100)
  }

  async skipPage() {
    await (this.isToNextPage ? this.toNextPage() : this.toPrevPage())
  }

  validateElems(elems: PartialModalElem): elems is ModalElem {
    return Object.values(elems).every(elem => elem)
  }

  get invalidElemsError() {
    return new Error('Modal elements are incomplete.')
  }

  private toggleClassNames(toggleType: 'add' | 'remove', className: string, elem: Element | null) {
    if (!elem) return
    !className.match(' ') ?
      elem[`${toggleType}Class`](className) :
      elem[`${toggleType}Classes`](className.split(' '))
  }

  getPage(pageNumber: number) {
    const page = this.pages[pageNumber]

    if (!page) return

    const { templateElems } = this
    if (!this.validateElems(templateElems)) throw this.invalidElemsError

    return {
      ...page,
      render: () => page.render(templateElems),
      submit: () => page.submit ? page.submit(templateElems) : this.close()
    }
  }

  static openSinglePage(createPage: createPageType) {
    const singlePageModal = new SinglePageModal(createPage)
    singlePageModal.open()
    return singlePageModal
  }
}

export type createPageType = (modal: SinglePageModal) => CreateModalPage

class SinglePageModal extends PageModal {
  pages: CreateModalPage[]
  pageData: [undefined]

  constructor(createPage: createPageType) {
    super()
    this.pages = [createPage(this)]
    this.pageData = [undefined]
  }
}

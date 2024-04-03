import { Scope } from 'obsidian'

import { createPopper } from '@popperjs/core'

import { CSS_CLASSES, NATIVE_CLASSES } from '../settings/constants'
import { wrapAround } from '../utils/util'

import type { ISuggestOwner } from 'obsidian'
import type { Instance as PopperInstance } from '@popperjs/core'

class Suggest<T> {
  private values: T[]
  private suggestions: HTMLDivElement[]
  private selectionIndex: number

  constructor(
    private owner: ISuggestOwner<T>,
    private containerElem: HTMLDivElement,
    scope: Scope
  ) {
    this.values = []
    this.suggestions = []
    this.selectionIndex = 0

    containerElem.on(
      'mousedown',
      `.${NATIVE_CLASSES.SUGGESTION_ITEM}`,
      (ev, el) => this.onSuggestionClick(ev, el as HTMLDivElement)
    )

    containerElem.on(
      'mousemove',
      `.${NATIVE_CLASSES.SUGGESTION_ITEM}`,
      (ev, el) => this.onSuggestionMouseover(ev, el as HTMLDivElement)
    )

    scope.register([], 'ArrowUp', ({ isComposing }) => {
      if (!isComposing) {
        this.setSelectedItem(this.selectionIndex - 1, true)
        return false
      }
    })

    scope.register([], 'ArrowDown', ({ isComposing }) => {
      if (!isComposing) {
        this.setSelectedItem(this.selectionIndex + 1, true)
        return false
      }
    })

    scope.register([], 'Enter', (event) => {
      if (!event.isComposing) {
        this.useSelectedItem(event)
        return false
      }
    })
  }

  onSuggestionClick(event: MouseEvent, suggestionElem: HTMLDivElement): void {
    event.preventDefault()

    const suggestion = this.suggestions.indexOf(suggestionElem)
    this.setSelectedItem(suggestion, false)
    this.useSelectedItem(event)
  }

  onSuggestionMouseover(_: MouseEvent, suggestionElem: HTMLDivElement): void {
    const suggestion = this.suggestions.indexOf(suggestionElem)
    this.setSelectedItem(suggestion, false)
  }

  setSuggestions(values: T[]) {
    this.containerElem.empty()
    const suggestionElems = values.map(value => {
      const suggestionElem = this.containerElem.createDiv(NATIVE_CLASSES.SUGGESTION_ITEM)
      this.owner.renderSuggestion(value, suggestionElem)
      return suggestionElem
    })

    this.values = values
    this.suggestions = suggestionElems
    this.setSelectedItem(0, false)
  }

  useSelectedItem(event: MouseEvent | KeyboardEvent) {
    const currentValue = this.values[this.selectionIndex]
    if (currentValue)
      this.owner.selectSuggestion(currentValue, event)
  }

  setSelectedItem(selectedIndex: number, scrollIntoView: boolean) {
    selectedIndex = wrapAround(
      selectedIndex,
      this.suggestions.length
    )

    const prevSuggestion = this.suggestions[this.selectionIndex]
    const selectedSuggestion = this.suggestions[selectedIndex]

    prevSuggestion?.removeClass(NATIVE_CLASSES.IS_SELECTED)
    selectedSuggestion?.addClass(NATIVE_CLASSES.IS_SELECTED)

    this.selectionIndex = selectedIndex

    if (scrollIntoView) selectedSuggestion.scrollIntoView(false)
  }
}

export abstract class TextInputSuggest<T> implements ISuggestOwner<T> {
  private popper?: PopperInstance
  private scope: Scope
  private suggestionElem: HTMLDivElement
  private suggest: Suggest<T>

  constructor(protected inputElem: HTMLInputElement | HTMLTextAreaElement) {
    this.scope = new Scope()
    this.suggestionElem = createDiv(NATIVE_CLASSES.SUGGESTION_CONTAINER)
    const suggestionWrapper = this.suggestionElem.createDiv('suggestion')

    this.suggest = new Suggest(this, suggestionWrapper, this.scope)

    const close = this.close.bind(this)
    const onInputChanged = this.onInputChanged.bind(this)

    this.scope.register([], 'Escape', close)
    this.inputElem.addEventListener('input', onInputChanged)
    this.inputElem.addEventListener('focus', onInputChanged)
    this.inputElem.addEventListener('blur', close)
  }

  onInputChanged() {
    const inputString = this.inputElem.value
    const suggestions = this.getSuggestions(inputString)

    if (!suggestions) return this.close()

    if (suggestions.length > 0) {
      this.suggest.setSuggestions(suggestions)
      this.open(
        //@ts-expect-error
        app.dom.appContainerEl,
        this.inputElem
      )
    } else this.close()
  }

  open(container: HTMLElement, inputEl: HTMLElement): void {
    app.keymap.pushScope(this.scope)

    container.appendChild(this.suggestionElem)
    this.popper = createPopper(inputEl, this.suggestionElem, {
      placement: 'bottom-start',
      modifiers: [
        {
          name: 'sameWidth',
          enabled: true,
          fn: ({ state, instance }) => {
            // Note: positioning needs to be calculated twice -
            // first pass - positioning it according to the width of the popper
            // second pass - position it with the width bound to the reference element
            // we need to early exit to avoid an infinite loop
            const targetWidth = `${state.rects.reference.width}px`
            if (state.styles.popper.width === targetWidth) return
            state.styles.popper.width = targetWidth
            instance.update()
          },
          phase: 'beforeWrite',
          requires: ['computeStyles'],
        },
      ],
    })
  }

  close(): void {
    app.keymap.popScope(this.scope)
    this.suggest.setSuggestions([])
    if (this.popper) this.popper.destroy()
    this.suggestionElem.detach()
  }

  abstract getSuggestions(inputString: string): T[]
  abstract renderSuggestion(item: T, el: HTMLElement): void
  abstract selectSuggestion(item: T): void
}

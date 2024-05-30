import _ from 'lodash'

import Card from '../../card'
import { CSS_CLASSES, NATIVE_CLASSES } from '../../settings/constants'
import { memoize } from '../../utils/modalUtils'
import { filterFalsy } from '../../utils/util'
import { PageModal } from '../pageModal'
import { CreateCardModalPage } from './createCardModalType'
import createDefinitionPage from './pages/definitionPage'
import createExtraPage from './pages/extraPage'
import createSearchPage from './pages/searchPage'
import createSelectPage from './pages/selectPage'

import type { Falsey } from 'lodash'
import type CreateModalPage from '../createModalPage'
import type { Memoized } from '../../utils/modalUtils'
import type { OnSubmitType } from '../modalType'
import type { JMDictMap, JotobaFuzzyResult } from '../../types/dictTypes'
import type { ParsedDefinition } from '../../types/cardTypes'

class CreateCardModal extends PageModal {
  result: Card
  initialQuery: string

  fuzzyResults: JotobaFuzzyResult[]
  dictDefinitions: ParsedDefinition[]

  pages: CreateModalPage[]
  pageData: [
    undefined,
    { index: Memoized<number> },
    { index: Memoized<number> },
    {
      definitionAlias: Memoized<string>,
      solutionAlias: Memoized<string>,
      tags: Memoized<string[]>,
      lesson: Memoized<string>
    }
  ]

  constructor(
    public onSubmit: OnSubmitType,
    public jmDictMap: JMDictMap,
    public lastCardLesson?: string
  ) {
    super(CSS_CLASSES.CREATE_CARD_SETTING_WRAPPER)
    this.result = new Card()

    this.initialQuery = ''
    this.fuzzyResults = []
    this.dictDefinitions = []

    this.pages = [
      createSearchPage(this),
      createSelectPage(this),
      createDefinitionPage(this),
      createExtraPage(this)
    ]

    this.pageData = [
      undefined,
      { index: memoize(0) },
      { index: memoize(0) },
      {
        definitionAlias: memoize(''),
        solutionAlias: memoize(''),
        tags: memoize([]),
        lesson: memoize('')
      }
    ]

    this.scope.register([], null, e => this.onArrowKeydown(e.key))
  }

  onResultSelected(resultIndex: number) {
    if (!this.validateElems(this.templateElems)) throw this.invalidElemsError

    this.pageData[this.pageNumber === CreateCardModalPage.Result ?
      CreateCardModalPage.Result : CreateCardModalPage.Definition].index.value = resultIndex

    const { pageWrapper } = this.templateElems
    const { SEARCH_RESULT: CARD, IS_SELECTED: CARD_IS_SELECTED } = NATIVE_CLASSES

    const resultWrappers = Array.from(pageWrapper
      .getElementsByClassName(CARD)) as HTMLDivElement[]
    for (let i = 0; i < resultWrappers.length; i++) {
      const resultWrapper = resultWrappers[i]
      if (i === resultIndex) {
        resultWrapper.addClass(CARD_IS_SELECTED)
        resultWrapper.focus()
      }
      else resultWrapper.removeClass(CARD_IS_SELECTED)
    }
  }

  private onArrowKeydown(key: string) {
    if (
      this.pageNumber !== CreateCardModalPage.Result &&
      this.pageNumber !== CreateCardModalPage.Definition
    ) return

    const itemCount = this.pageNumber === CreateCardModalPage.Result ?
      this.fuzzyResults.length : this.dictDefinitions.length

    const newIndex = this.getArrowKeydownIndex(
      key,
      this.pageData[this.pageNumber].index.value,
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

  renderCard(
    index: number,
    cssClasses?: (string | Falsey)[]
  ) {
    if (!this.validateElems(this.templateElems)) throw this.invalidElemsError
    const { pageWrapper } = this.templateElems

    pageWrapper.addClass(...CSS_CLASSES.CREATE_CARD_SETTING_WRAPPER)
    const resultWrapper = pageWrapper.createDiv({
      cls: [
        NATIVE_CLASSES.SEARCH_RESULT,
        ...filterFalsy(cssClasses ?? [])
      ]
    })

    resultWrapper.tabIndex = 0
    resultWrapper.onfocus =
      resultWrapper.onclick =
      () => this.onResultSelected(index)

    resultWrapper.ondblclick = () => this.doSubmit()
    if (!index) resultWrapper.focus()

    return resultWrapper
  }
}

export default CreateCardModal
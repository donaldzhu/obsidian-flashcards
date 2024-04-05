import { CSS_CLASSES, NATIVE_CLASSES } from '../settings/constants'
import { memoize } from '../utils/modalUtils'
import { filterFalsy, mapObject } from '../utils/util'

import type { Falsey } from 'lodash'
import type { ModalElem } from './createCardModalTypes'
import type { CreateCardModal } from './createCardModal'
import type { Memoized } from '../utils/modalUtils'

export type MemoizedObject<T> = {
  [P in keyof T]: Memoized<T[P]>
}

class CreateCardModalPage<T extends Record<string, any> = {}> {
  data: MemoizedObject<T>
  className?: string

  constructor(
    public header: string | ((modal: CreateCardModal) => string),
    public btnText: string,
    public render: (modal: CreateCardModal, templateElems: ModalElem) => void | (() => void),
    public submit: (modal: CreateCardModal, templateElems: ModalElem) => Promise<void> | void,
    config?: {
      data?: T
      className?: string
    }
  ) {
    const data = config?.data ?? {}

    this.data = mapObject(data, (_, value) => memoize(value)) as MemoizedObject<T>
    this.className = config?.className
  }
}

export const renderCard = (
  modal: CreateCardModal,
  { pageWrapper: settingWrapper }: ModalElem,
  index: number,
  cssClasses?: (string | Falsey)[]
) => {
  settingWrapper.classList.add(...CSS_CLASSES.SETTING_WRAPPER)
  const resultWrapper = settingWrapper.createDiv({
    cls: [
      NATIVE_CLASSES.CARD,
      ...filterFalsy(cssClasses ?? [])
    ]
  })

  resultWrapper.tabIndex = 0
  resultWrapper.onfocus =
    resultWrapper.onclick =
    () => modal.onResultSelected(index)

  resultWrapper.ondblclick = () => modal.doSubmit()
  if (!index) resultWrapper.focus()

  return resultWrapper
}


export default CreateCardModalPage
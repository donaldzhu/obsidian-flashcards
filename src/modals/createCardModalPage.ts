import { CSS_CLASSES, NATIVE_CLASSES } from '../settings/constants'
import { filterFalsy } from '../utils/util'

import type { Falsey } from 'lodash'
import type { ModalElem } from './createCardModalTypes'
import type { CreateCardModal } from './createCardModal'

interface Memoized<T> {
  reset: () => void
  value: T
}

class CreateCardModalPage<T extends Record<string, Memoized<any>> | undefined = undefined> {
  data: T
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
    // @ts-expect-error
    this.data = config?.data
    this.className = config?.className
  }
}

export const renderCard = (
  modal: CreateCardModal,
  { settingWrapper }: ModalElem,
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
import _ from 'lodash'

import { validateString } from '../utils/util'

import type { ModalElem } from './pageModalType'
type PageRenderType = (templateElems: ModalElem) => Promise<void> | void | (() => void)
type PageSubmitType = (templateElems: ModalElem) => Promise<void> | void

interface PageProps {
  header: string | (() => string),
  btnText: string,
  render: PageRenderType,
  submit: PageSubmitType,
  className: string,
  wrapperClassName: string
}

class CreateModalPage {
  header: string | (() => string)
  btnText?: string
  render: PageRenderType
  submit?: PageSubmitType
  className?: string
  wrapperClassName?: string

  constructor(
    {
      header,
      btnText,
      render,
      submit,
      className,
      wrapperClassName
    }: Partial<PageProps> = {}) {
    this.header = header ?? ''
    this.btnText = btnText
    this.render = render ?? _.noop
    this.submit = submit
    this.className = className
    this.wrapperClassName = `${wrapperClassName}${validateString(!btnText, ' no-button-page-modal')}` // TODO
  }
}

export default CreateModalPage
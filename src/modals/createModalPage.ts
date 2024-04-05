import type { ModalElem } from './pageModalType'

class CreateModalPage {
  constructor(
    public header: string | (() => string),
    public btnText: string,
    public render: (templateElems: ModalElem) => void | (() => void),
    public submit: (templateElems: ModalElem) => Promise<void> | void,
    public className?: string
  ) { }
}

export default CreateModalPage
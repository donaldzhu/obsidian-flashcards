import type { ModalElem } from './pageModalType'

class CreateModalPage {
  constructor(
    public header: string | (() => string),
    public btnText: string,
    public render: (templateElems: ModalElem) => any | (() => any),
    public submit: (templateElems: ModalElem) => Promise<any> | any,
    public className?: string
  ) { }
}

export default CreateModalPage
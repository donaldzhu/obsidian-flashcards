import type { ButtonComponent } from 'obsidian'

export interface ModalElem {
  pageWrapper: HTMLDivElement
  title: HTMLHeadingElement
  nextButton: ButtonComponent,
  backButton: ButtonComponent,
}

export type PartialModalElem = ModalElem | Record<keyof ModalElem, undefined>

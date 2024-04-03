import type { ButtonComponent } from 'obsidian'
import type { CardInterface } from '../types/cardTypes'
import type { Memoized } from '../utils/modalUtils'


export interface PageProp<T extends Record<string, Memoized<any>> | undefined = undefined> {
  header: string | (() => string)
  next: string
  render: () => void | (() => void)
  submit: () => Promise<void> | void
  classes?: string
  data: T
}

export interface ModalElem {
  settingWrapper: HTMLDivElement
  title: HTMLHeadingElement
  nextButton: ButtonComponent,
  backButton: ButtonComponent,
}

export type PartialModalElem = ModalElem | Record<keyof ModalElem, undefined>

export type OnSubmitType = (result: CardInterface) => void

export enum ModalPage {
  Search,
  Result,
  Definition,
  Extra
}
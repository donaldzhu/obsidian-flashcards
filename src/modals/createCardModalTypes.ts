import type { ButtonComponent } from 'obsidian'
import type { CardInterface } from '../types/cardTypes'

export interface ModalElem {
  pageWrapper: HTMLDivElement
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
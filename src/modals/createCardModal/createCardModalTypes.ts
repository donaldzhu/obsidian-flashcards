import type { CardInterface } from '../../types/cardTypes'

export type OnSubmitType = (result: CardInterface) => void

export enum ModalPage {
  Search,
  Result,
  Definition,
  Extra
}
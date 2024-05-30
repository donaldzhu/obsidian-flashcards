import _ from 'lodash'

import { DEFAULT_SETTINGS } from '../settings/constants'

export const getDate = () => {
  const date = new Date()
  const pad = (dateNum: number) => _.padStart(dateNum.toString(), 2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth())}-${pad(date.getDate())}`
}

export const getPropKey = (key: keyof typeof DEFAULT_SETTINGS.PROP_KEYS) => {
  return `${DEFAULT_SETTINGS.PROP_PREFIX} ${DEFAULT_SETTINGS.PROP_KEYS[key]}`
}

export const getFile = (path: string) => app.vault.getAbstractFileByPath(path)

export const createTooltips = ({ target }: MouseEvent, text: string) => {
  if (!target || !(target instanceof HTMLElement)) return
  const { left, top, width } = target.getBoundingClientRect()
  const container = createDiv({ cls: 'tooltip mod-top' })
  container.id = 'furigana-tooltip'
  container.innerText = text
  container.createDiv({ cls: 'tooltip-arrow' })
  container.style.left = left + width / 2 + 'px'
  container.style.top = top - 32 + 'px'
  document.body.appendChild(container)
  return container
}
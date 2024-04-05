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
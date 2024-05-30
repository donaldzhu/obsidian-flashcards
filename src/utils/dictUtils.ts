import _ from 'lodash'
import * as wanakana from 'wanakana'

import miscMap from '../data/miscMap'
import { ParsedDefinition } from '../types/cardTypes'

export const truncateDef = (definition: string, length = 100) =>
  _.truncate(definition, {
    length,
    separator: /(\.{3})?,? +/
  })


interface TruncateDefListConfig {
  maxTotal?: number
  maxItem?: number
  listLength?: number
}

export const truncateDefList = (defList: string[], config?: TruncateDefListConfig) => {
  const { maxTotal = 100, maxItem = 80, listLength = 3 } = config ?? {}
  const results = []
  for (
    let i = 0, defs = defList.slice(0, listLength), chars = 0;
    i < defs.length && chars <= maxTotal;
    chars += defs[i++].length
  ) {
    results.push(truncateDef(defs[i], maxItem))
  }
  return results
}

export const prepString = (string: string) => string.toLocaleLowerCase().trim()

export const hasKanji = (string: string) =>
  string.match(/[一-龠]/)

export const hasJp = (string: string) =>
  string.match(/[一-龠ぁ-ゔァ-ヴー々〆〤ヶ]/)

export const compareJp = (targetString: string, inputString: string) => {
  if (!hasJp(inputString))
    targetString = wanakana.toRomaji(targetString)
  return prepString(targetString).contains(
    prepString(inputString)
  )
}

export const isKanaOnly = (definition: ParsedDefinition) => !!definition.misc?.includes(miscMap.uk)
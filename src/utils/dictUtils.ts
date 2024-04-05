import _ from 'lodash'
import * as wanakana from 'wanakana'

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


const hasJp = (inputString: string) =>
  inputString.match(/一-龠ぁ-ゔァ-ヴー々〆〤ヶ/)

export const compareJp = (targetString: string, inputString: string) => {
  if (!hasJp(inputString))
    targetString = wanakana.toRomaji(targetString)
  return targetString
    .toLowerCase()
    .trim()
    .contains(
      inputString
        .toLowerCase()
        .trim()
    )
}
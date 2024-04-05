import _ from 'lodash'

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


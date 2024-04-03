import _ from 'lodash'

export const truncateDefinition = (definition: string, length = 100) =>
  _.truncate(definition, {
    length,
    separator: /(\.{3})?,? +/
  })

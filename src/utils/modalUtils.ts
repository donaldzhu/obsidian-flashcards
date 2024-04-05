import _ from 'lodash'

export interface Memoized<T> {
  reset: () => void
  value: T
}

export const memoize = <T>(initial: T): Memoized<T> => {
  return {
    reset: function () {
      this.value = _.cloneDeep(initial)
    },
    value: _.cloneDeep(initial)
  }
}


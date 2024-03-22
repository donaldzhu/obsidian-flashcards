import _ from 'lodash'

import type { Falsey } from 'lodash'

export function typedKeys<T extends object>(object: T): (keyof T)[]
export function typedKeys<T extends string>(object: object): T[]
export function typedKeys<T extends (object | string)>(object: T) {
  return Object.keys(object) as (T extends object ? keyof T : T)[]
}

export const mapObject = <T extends object, R>(
  object: T,
  callback: (key: keyof T, value: T[keyof T]) => R
) => {
  const newObject: Partial<Record<keyof T, R>> = {}
  const keys = typedKeys(object)
  keys.forEach(key => {
    const value = object[key]
    newObject[key] = callback(key, value)
  })

  return newObject as Record<keyof T, R>
}

export function validateString(string: string): string
export function validateString<T>(validator: T, string?: string): string
export function validateString<T>(validatorOrString: T | string, string?: string) {
  if (!string) return validatorOrString || ''
  return validatorOrString ? string : ''
}

export const filterFalsy = <T>(array: T[]) =>
  array.filter(elem => elem) as Exclude<T, Falsey>[]

export const mightInclude = <T, K>(array: readonly T[], element: T | K): element is T => {
  return array.includes(element as unknown as T)
}

export const truncateDefinition = (definition: string, length = 100) =>
  _.truncate(definition, {
    length,
    separator: /(\.{3})?,? +/
  })


export type Tuple<T, N extends number> = N extends N ?
  number extends N ? T[] : _TupleOf<T, N, []> : never
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>

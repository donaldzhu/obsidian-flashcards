import _ from 'lodash'

export const getDate = () => {
  const date = new Date()
  const pad = (dateNum: number) => _.padStart(dateNum.toString(), 2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth())}-${pad(date.getDate())}`
}
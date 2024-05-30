import { TFile } from 'obsidian'

import { getFile } from '../utils/obsidianUtil'
import { typedKeys, validateString } from '../utils/util'

import type { TAbstractFile } from 'obsidian'

const getFrontmatter = (file: TFile) =>
  app.metadataCache.getFileCache(file)?.frontmatter

const getBody = async (file: TFile) => {
  const content = await app.vault.cachedRead(file)
  return content.replace(/^---([\s\S]*)---\n/m, '')
}

const createFrontmatter = (
  frontmatter: Record<string, any | any[]>,
  prefix?: string
) =>
  '---\n' +
  typedKeys(frontmatter).reduce((prev, curr) => {
    let value = frontmatter[curr]
    value ??= ''
    if (typeof value === 'string' && value.match(/\{|\[|\(/))
      value = `"${value}"`

    if (Array.isArray(value))
      value = value.reduce(
        (prev, curr) => prev + `\n  - ${curr}`,
        ''
      )

    return `${prev}\n${validateString(prefix)}${curr}: ${value}`
  }, '') +
  '\n---'

const isSameFile = async (
  targetFile: TAbstractFile,
  content: string
) => {
  if (!(targetFile instanceof TFile)) return false
  const removeUniq = (string: string) =>
    string.replace(/creation date: .*\nflashcard id: ".*"\n/, '')
  const targetContent = removeUniq(await app.vault.cachedRead(targetFile))
  return targetContent === removeUniq(content)
}

const createUniqFile = async (fileName: string, content: string) => {
  let hasExisting = false

  const checkExisting = async (fileName: string) => {
    const file = getFile(fileName)
    if (!file) return null
    hasExisting = await isSameFile(file, content)
    return file
  }

  const withSuffix = (number?: number) => `${fileName}${number ? ` - ${number}` : ''}.md`

  const fileWithSuffix1 = await checkExisting(withSuffix(1))
  if (fileWithSuffix1) {
    if (hasExisting) return {
      fileName: withSuffix(1),
      hasExisting
    }

    let suffixNumber = 2

    while (
      await checkExisting(withSuffix(suffixNumber)) &&
      suffixNumber < 10000 &&
      !hasExisting
    ) suffixNumber++

    return {
      fileName: withSuffix(suffixNumber),
      hasExisting
    }
  }

  const existingFile = await checkExisting(withSuffix())
  if (existingFile) {
    if (hasExisting) return {
      fileName: withSuffix(2),
      hasExisting
    }

    await app.vault.rename(existingFile, withSuffix(1))
    return {
      fileName: withSuffix(2),
      hasExisting
    }
  }

  return {
    fileName: withSuffix(),
    hasExisting: false
  }
}

const obsidianServices = {
  getFrontmatter,
  getBody,
  createFrontmatter,
  isSameFile,
  createUniqFile
}

export default obsidianServices
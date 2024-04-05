import fs from 'fs/promises'
import _ from 'lodash'
import { FileSystemAdapter, Notice, Plugin, TFile } from 'obsidian'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

import jmDictIndices from './data/JMdictIndices'
import CreateCardModal from './modals/createCardModal/createCardModal'
import CreateCustomCardModal from './modals/createCustomCardModal/createCustomCardModal'
import { DEFAULT_SETTINGS, PLUGIN_SUBPATH } from './settings/constants'
import { truncateDefList } from './utils/dictUtils'
import { getDate } from './utils/obsidianUtil'
import { typedKeys } from './utils/util'

import type { TAbstractFile } from 'obsidian'
import type { CardInterface } from './types/cardTypes'
import type { JMDictData, JMDictMap } from './types/dictTypes'
export default class ExamplePlugin extends Plugin {
  private pluginPath: string

  constructor(...args: ConstructorParameters<typeof Plugin>) {
    super(...args)
    this.pluginPath =
      //@ts-expect-error
      app.vault.adapter.basePath +
      PLUGIN_SUBPATH
  }

  async onload() {
    const jmDictMap = jmDictIndices.reduce((dictMap, char) => {
      const dict: JMDictData = {
        data: undefined,
        promise: fs.readFile(
          `${this.pluginPath}/src/data/JMDict/${char}.json`,
          'utf-8'
        )
      }
      dict.promise.then(result =>
        dict.data = new Map(JSON.parse(result)))
      dictMap[char] = dict
      return dictMap
    }, {} as JMDictMap)

    this.loadFontAwesome()
    this.addCommand({
      id: 'create-flashcard',
      name: 'Create Flashcard',
      callback: () =>
        new CreateCardModal(
          this.submitCard.bind(this),
          jmDictMap
        ).open(),
    })

    this.addCommand({
      id: 'create-custom-flashcard',
      name: 'Create Custom Flashcard',
      callback: () =>
        new CreateCustomCardModal().open(),
    })
  }

  async loadFontAwesome() {
    const head = document.getElementsByTagName('head')[0]
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.crossOrigin = 'anonymous'
    script.src = 'https://kit.fontawesome.com/0099ddf8ab.js'
    head.appendChild(script)
  }

  async submitCard(data: CardInterface) {
    const file = await this.createCard(data)
    if (!file) return
    const leaf = app.workspace.getLeaf('tab')
    if (file && file instanceof TFile)
      leaf.openFile(file)
  }

  private async createCard(data: CardInterface) {
    console.log('Card Data: ', data)
    const adapter = app.vault.adapter
    if (!(adapter instanceof FileSystemAdapter)) return

    const parsedData = {
      id: uuidv4(),
      ..._.omit(data, ['definitions', 'pitch', 'sentences']),
    }

    const frontmatter =
      `---\ncreation date: ${getDate()}` +
      typedKeys(parsedData).reduce((prev, curr) => {
        let unformattedValue = parsedData[curr] ?? ''

        unformattedValue = Array.isArray(unformattedValue) ?
          unformattedValue.reduce(
            (prev, curr) => prev + `\n  - ${curr}`,
            ''
          ) : `"${unformattedValue}"`
        return `${prev}\n${DEFAULT_SETTINGS.PROP_PREFIX} ${curr}: ${unformattedValue}`
      }, '') +
      '\n---'

    const content = '```\n' + JSON.stringify(_.pick(data, ['definitions', 'pitch', 'sentences'])) + '\n```'
    const { definitions, kana, kanji, definitionAlias } = data

    const titleSolution = ((definitions[0].misc?.includes('Kana Only') ?? !kanji) ?
      kana : kanji
    ).replaceAll(/(^"|"$)/g, '')

    const titleDefinition = definitionAlias ??
      truncateDefList(definitions[0].translations, { listLength: 4 })
    const title = `${titleSolution} - ${titleDefinition}`

    const contnet = frontmatter + '\n' + content
    const { fileName, hasExisting } = await this.createUniqFile(
      `${DEFAULT_SETTINGS.SUBFOLDER}/${title}`,
      contnet
    )

    const cardName = path.parse(fileName).name

    if (hasExisting) {
      new Notice(`${cardName}: identical flashcard exists.`, 8000)
      const file = app.vault.getAbstractFileByPath(fileName)
      return file instanceof TFile ? file : undefined
    }

    const existingFile = app.vault.getAbstractFileByPath(fileName)
    if (existingFile) throw new Error(`Failed to create new file '${fileName}' - file already exists.`)

    new Notice(`${cardName}: flashcard created.`, 8000) // TODO
    return await this.app.vault.create(
      fileName, contnet
    )
  }

  private async createUniqFile(fileName: string, content: string) {
    let hasExisting = false

    const checkExisting = async (fileName: string) => {
      const file = app.vault.getAbstractFileByPath(fileName)
      if (!file) return null
      hasExisting = await this.isSameFile(file, content)
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

  private async isSameFile(
    targetFile: TAbstractFile,
    content: string
  ) {
    if (!(targetFile instanceof TFile)) return false
    const removeUniq = (string: string) =>
      string.replace(/creation date: .*\nflashcard id: ".*"\n/, '')
    const targetContent = removeUniq(await app.vault.cachedRead(targetFile))
    return targetContent === removeUniq(content)
  }
}
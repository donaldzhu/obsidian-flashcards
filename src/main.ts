import fs from 'fs/promises'
import _ from 'lodash'
import { FileSystemAdapter, Notice, Plugin, TFile, TFolder } from 'obsidian'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

import jmDictIndices from './data/JMdictIndices'
import CardSuggestModal from './modals/cardSuggestModal'
import CreateCardModal from './modals/createCardModal/createCardModal'
import CreateCustomCardModal from './modals/createCustomCardModal/createCustomCardModal'
import logServices from './services/logServices'
import obsidianServices from './services/obsidianServices'
import { DEFAULT_SETTINGS, NOTICE_DURATION, PLUGIN_SUBPATH } from './settings/constants'
import { truncateDefList } from './utils/dictUtils'
import { getDate, getFile } from './utils/obsidianUtil'
import { toNewObject, toObject, typedKeys } from './utils/util'

import type { PropOf } from './types/utilTypes'
import type { CardInterface } from './card'
import type { JMDictData } from './types/dictTypes'

export default class ExamplePlugin extends Plugin {
  private pluginPath: string
  private lastCardLesson?: string

  constructor(...args: ConstructorParameters<typeof Plugin>) {
    super(...args)
    this.pluginPath =
      //@ts-expect-error
      app.vault.adapter.basePath +
      PLUGIN_SUBPATH
  }

  async onload() {
    const jmDictMap = toObject(jmDictIndices, key => {
      const dict: JMDictData = {
        data: undefined,
        promise: fs.readFile(
          `${this.pluginPath}/src/data/JMDict/${key}.json`,
          'utf-8'
        )
      }
      dict.promise.then(result =>
        dict.data = new Map(JSON.parse(result)))
      return dict
    })

    this.loadFontAwesome()
    this.addCommand({
      id: 'create-flashcard',
      name: 'Create Flashcard',
      callback: () =>
        new CreateCardModal(
          this.submitCard.bind(this),
          jmDictMap,
          this.lastCardLesson
        ).open(),
    })

    this.addCommand({
      id: 'create-custom-flashcard',
      name: 'Create Custom Flashcard',
      callback: () =>
        new CreateCustomCardModal(
          this.submitCard.bind(this),
          this.lastCardLesson
        ).open(),
    })

    this.addCommand({
      id: 'review-flashcard',
      name: 'Review Flashcard',
      callback: () => new CardSuggestModal().open()
    })

    this.addCommand({
      id: 'reset-folder',
      name: 'Reset Folder',
      callback: () => this.resetFolder()
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
    if (file && file instanceof TFile)
      app.workspace.getLeaf('tab').openFile(file)
  }

  private async createCard(data: CardInterface) {
    logServices.log('Card Data: ', data)
    const adapter = app.vault.adapter
    if (!(adapter instanceof FileSystemAdapter)) return
    if (data.lesson) this.lastCardLesson = data.lesson

    const frontmatterProps = _.omit(data, ['definitions', 'pitch', 'sentences'])
    type FrontmatterType = typeof frontmatterProps
    const parsedData = toNewObject<keyof FrontmatterType, string, PropOf<FrontmatterType>>(
      typedKeys(frontmatterProps),
      (result, key) =>
        result[`${DEFAULT_SETTINGS.PROP_PREFIX} ${key}`] = data[key]
    )

    const frontmatter = obsidianServices.createFrontmatter(
      {
        'creation date': getDate(),
        [`${DEFAULT_SETTINGS.PROP_PREFIX} id`]: uuidv4(),
        ...parsedData
      }
    )

    const content = '```\n' + JSON.stringify(_.pick(data, ['definitions', 'pitch', 'sentences'])) + '\n```'
    const { definitions, kana, kanji, definitionAlias } = data

    const titleSolution = ((definitions[0].misc?.includes('Kana Only') ?? !kanji) ?
      kana : kanji
    ).replaceAll(/(^"|"$)/g, '')

    const titleDefinition = definitionAlias ??
      truncateDefList(definitions[0].translations, { listLength: 4 }).join(', ')
    const title = `${titleSolution} - ${titleDefinition}`

    const contnet = frontmatter + '\n' + content
    const { fileName, hasExisting } = await obsidianServices.createUniqFile(
      `${DEFAULT_SETTINGS.SUBFOLDER}/${title}`,
      contnet
    )

    const cardName = path.parse(fileName).name

    if (hasExisting) {
      new Notice(`${cardName}: identical flashcard exists.`, NOTICE_DURATION)
      const file = getFile(fileName)
      return file instanceof TFile ? file : undefined
    }

    const existingFile = getFile(fileName)
    if (existingFile) throw new Error(`Failed to create new file '${fileName}' - file already exists.`)

    new Notice(`${cardName}: flashcard created.`, NOTICE_DURATION)
    return await this.app.vault.create(
      fileName, contnet
    )
  }

  private async resetFolder() {
    const folder = getFile('Japanese Flashcards')
    const backupFolder = getFile('Japanese Flashcards (Backup)')
    if (!(folder instanceof TFolder) || !(backupFolder instanceof TFolder)) return
    await Promise.all(folder.children.map(file => app.vault.delete(file)))
    await Promise.all(backupFolder.children.map(file => {
      if (!(file instanceof TFile)) return
      return app.vault.copy(file, file.path.replace('Japanese Flashcards (Backup)', 'Japanese Flashcards'))
    }))
  }
}
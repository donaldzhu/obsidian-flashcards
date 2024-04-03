import fs from 'fs/promises'
import { Plugin } from 'obsidian'

import jmDictIndices from './data/JMdictIndices'
import { CreateCardModal } from './modals/createCardModal'
import { PLUGIN_SUBPATH } from './settings/constants'

import type { WorkspaceLeaf } from 'obsidian'
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
          this.createCard,
          jmDictMap
        ).open(),
    })
  }

  async onunload() {
  }

  async loadFontAwesome() {
    const head = document.getElementsByTagName('head')[0]
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.crossOrigin = 'anonymous'
    script.src = 'https://kit.fontawesome.com/0099ddf8ab.js'
    head.appendChild(script)
  }

  async createCard(data: CardInterface) {


    console.log('Card Data: ', data)
    // const adapter = app.vault.adapter
    // if (!(adapter instanceof FileSystemAdapter)) return

    // const parsedData = { ...data }

    // const frontmatter = '---' + typedKeys(parsedData).reduce((prev, curr) =>
    //   `${prev}\n${curr}: ${parsedData[curr]}`, ''
    // ) + '\n---'

    // this.app.vault.create(
    //   `${settings.FOLDER_NAME}/${parsedData.solution}.md`,
    //   frontmatter
    // )
  }
}
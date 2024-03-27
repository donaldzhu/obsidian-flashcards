import fs from 'fs/promises'
import _ from 'lodash'
import { FileSystemAdapter, Plugin } from 'obsidian'

import { CreateCardModal } from './createCardModal'
import { VIEW_TYPE_REACT_EXAMPLE } from './reactView'
import settings from './settings'
import { typedKeys } from './utils/util'

import type { WorkspaceLeaf } from 'obsidian'
import type { CardInterface, JmdictData } from './types/cardTypes'
export default class ExamplePlugin extends Plugin {
  async onload() {
    const jmdict: JmdictData = {
      data: undefined,
      promise: fs.readFile(
        //@ts-expect-error
        app.vault.adapter.basePath +
        '/.obsidian/plugins/view-test/src/data/JMdict.json', 'utf-8'
      )
    }

    jmdict.promise.then(result => {
      jmdict.data = new Map(_.toPairs(JSON.parse(result)))
      console.log('dicted')
    })

    this.addCommand({
      id: 'create-flashcard',
      name: 'Create Flashcard',
      callback: () =>
        new CreateCardModal(this.app, this.createCard, jmdict).open(),
    })
  }

  async onunload() {
  }

  async activateView() {
    const { workspace } = this.app

    let leaf: WorkspaceLeaf | null = null
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_REACT_EXAMPLE)

    if (leaves.length > 0) {
      // A leaf with our view already exists, use that
      leaf = leaves[0]
    } else {
      // Our view could not be found in the workspace, create a new leaf
      // in the right sidebar for it
      leaf = workspace.getLeaf(false)
      await leaf.setViewState({ type: VIEW_TYPE_REACT_EXAMPLE, active: true })
    }

    // 'Reveal' the leaf in case it is in a collapsed sidebar
    workspace.revealLeaf(leaf)
  }

  async createCard(data: CardInterface) {
    const adapter = app.vault.adapter
    if (!(adapter instanceof FileSystemAdapter)) return

    const parsedData = { ...data }

    const frontmatter = '---' + typedKeys(parsedData).reduce((prev, curr) =>
      `${prev}\n${curr}: ${parsedData[curr]}`, ''
    ) + '\n---'

    this.app.vault.create(
      `${settings.FOLDER_NAME}/${parsedData.solution}.md`,
      frontmatter
    )
  }
}
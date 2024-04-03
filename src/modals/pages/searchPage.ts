import { Setting } from 'obsidian'

import dictServices from '../../services/dictServices'
import CreateCardModalPage from '../createCardModalPage'

const searchPage = new CreateCardModalPage(
  'Select Search Result',
  'Select',
  (modal, { settingWrapper }) => {
    const input = new Setting(settingWrapper)
      .setName('Japanese')
      .addText(text => text
        .setValue(modal.initialQuery)
        .onChange(value => modal.initialQuery = value))

    input.controlEl.querySelector('input')?.focus()
  },
  async modal => {
    modal.fuzzyResults = await dictServices.fuzzySearch(modal.initialQuery)
    console.log('Fuzzy: ', modal.fuzzyResults)
  }
)

export default searchPage
import { Setting } from 'obsidian'

import dictServices from '../../../services/dictServices'
import CreateModalPage from '../../createModalPage'

import type CreateCardModal from '../createCardModal'

const createSearchPage = (modal: CreateCardModal) => new CreateModalPage(
  'Select Search Result',
  'Select',
  ({ pageWrapper }) => {
    const input = new Setting(pageWrapper)
      .setName('Japanese')
      .addText(text => text
        .setValue(modal.initialQuery)
        .onChange(value => {
          modal.initialQuery = value
          modal.buttonIsDisabled = !value
        }))

    input.controlEl.querySelector('input')?.focus()
  },
  async () => {
    modal.fuzzyResults = await dictServices.fuzzySearch(modal.initialQuery)
    console.log('Fuzzy: ', modal.fuzzyResults)
  }
)

export default createSearchPage
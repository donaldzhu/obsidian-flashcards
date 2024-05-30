import { Setting } from 'obsidian'

import dictServices from '../../../services/dictServices'
import logServices from '../../../services/logServices'
import CreateModalPage from '../../createModalPage'

import type CreateCardModal from '../createCardModal'
const createSearchPage = (modal: CreateCardModal) => new CreateModalPage(
  {
    header: 'Select Search Result',
    btnText: 'Select',
    render: ({ pageWrapper }) => {
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
    submit: async () => {
      modal.fuzzyResults = await dictServices.fuzzySearch(modal.initialQuery)
      logServices.log('Fuzzy: ', modal.fuzzyResults)
    }
  }
)

export default createSearchPage
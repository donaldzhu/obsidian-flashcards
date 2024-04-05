import { compareJp } from '../utils/dictUtils'
import { TextInputSuggest } from './textSuggest'

class GenericTextSuggester extends TextInputSuggest<string> {
  constructor(
    inputElem: HTMLInputElement | HTMLTextAreaElement,
    private items: string[],
    private maxSuggestions = Infinity
  ) {
    super(inputElem)
  }

  getSuggestions(inputString: string) {
    const filtered = this.items.filter(item => compareJp(item, inputString))

    if (!filtered) this.close()

    const limited = filtered.slice(0, this.maxSuggestions)
    return limited
  }

  selectSuggestion(item: string): void {
    this.inputElem.value = item
    this.inputElem.trigger('input')
    this.close()
  }

  renderSuggestion(value: string, el: HTMLElement): void {
    if (value) el.setText(value)
  }
}


export default GenericTextSuggester
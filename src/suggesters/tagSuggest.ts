import _ from 'lodash'
import { TFile } from 'obsidian'
import path from 'path'

import { compareJp } from '../utils/dictUtils'
import { filterFalsy } from '../utils/util'
import { TextInputSuggest } from './textSuggest'

type suggestChildren = string | HTMLElement

interface TagSuggesterSettings {
  subfolder?: string
  maxSuggestions?: number
  onSelect?: (item: string) => void
}

class TagSuggester extends TextInputSuggest<suggestChildren> {
  private subfolder?: string
  private maxSuggestions: number
  private onSelect?: (item: string) => void

  constructor(
    inputElem: HTMLInputElement | HTMLTextAreaElement,
    private tagName: string,
    private selectedTags: string[],
    setting?: TagSuggesterSettings
  ) {
    super(inputElem)
    const {
      subfolder,
      maxSuggestions = Infinity,
      onSelect
    } = (setting ?? {})

    this.subfolder = subfolder
    this.maxSuggestions = maxSuggestions
    this.onSelect = onSelect
  }

  getSuggestions(inputString: string) {
    const inputLowerCase = inputString.toLowerCase().trim()
    const tags = TagSuggester.getTags(this.tagName, this.subfolder)

    const filtered = tags.filter(item => {
      if (
        compareJp(item, inputString) &&
        !this.selectedTags.includes(item)
      ) return true
    })

    const limited: suggestChildren[] = filtered.slice(0, this.maxSuggestions)

    if (inputLowerCase) {
      const span = createSpan()
      span.innerHTML = `<i class='fa-solid fa-plus'></i> ${inputLowerCase}`
      limited.push(span)
    }

    if (!limited.length) this.close()

    return limited
  }

  selectSuggestion(item: suggestChildren) {
    if (this.onSelect) {
      const value = typeof item === 'string' ? item : this.inputElem.value
      if (!this.selectedTags.includes(value))
        this.onSelect(value)
    }

    this.inputElem.value = ''
    this.inputElem.trigger('input')
    this.close()
  }

  renderSuggestion(selected: suggestChildren, elem: HTMLElement) {
    if (!selected) return
    if (typeof selected === 'string') elem.setText(selected)
    else elem.appendChild(selected)
  }

  static getTags(tagName: string, subfolder?: string) {
    const pagesInFolder = app.vault.getAllLoadedFiles()
      .filter(file => {
        if (!(file instanceof TFile)) return false
        if (subfolder !== undefined) {
          return subfolder === path.dirname(file.path)
        } else return true
      }) as TFile[]

    return _.uniq(
      filterFalsy(
        pagesInFolder.map(file => {
          const metadata = app.metadataCache.getFileCache(file)
          const frontmatter = metadata?.frontmatter ?? {}
          return (frontmatter[tagName] ?? []) as string[]
        }).flat()
      )
    )
  }
}



export default TagSuggester
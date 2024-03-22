import { ItemView } from 'obsidian'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import type { WorkspaceLeaf } from 'obsidian'
import type { Root } from 'react-dom/client'

export const VIEW_TYPE_REACT_EXAMPLE = 'example-react-view'

const ReactView = () => {
  return <h4>Hello, React!</h4>
}

export class ExampleReactView extends ItemView {
  root: Root | null = null

  constructor(leaf: WorkspaceLeaf) {
    super(leaf)
  }

  getViewType() {
    return VIEW_TYPE_REACT_EXAMPLE
  }

  getDisplayText() {
    return 'Example view'
  }

  async onOpen() {
    this.root = createRoot(this.containerEl.children[1])
    this.root.render(
      <StrictMode>
        <ReactView />
      </StrictMode>
    )
  }

  async onClose() {
    this.root?.unmount()
  }
}
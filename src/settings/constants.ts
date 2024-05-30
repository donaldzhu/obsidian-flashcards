export const NATIVE_CLASSES = {
  SEARCH_RESULTS_WRAPPER: 'community-modal-search-results',
  SEARCH_RESULT: 'community-item',
  SEARCH_RESULT_HEADER: 'community-item-name',
  IS_SELECTED: 'is-selected',
  FLAIR: 'flair',
  FLAIR_FLAT: 'flair mod-flat',
  POS: 'community-item-author',
  SUGGESTION_CONTAINER: 'suggestion-container',
  SUGGESTION_ITEM: 'suggestion-item',
  METADATA_PROPERTY_VALUE: 'metadata-property-value',
  MULTI_SELECT_CONTAINER: 'multi-select-container',
  MULTI_SELECT_PILL: 'multi-select-pill',
  MULTI_SELECT_PILL_CONTENT: 'multi-select-pill-content',
  MULTI_SELECT_PILL_REMOVE: 'multi-select-pill-remove-button',
}

export const CSS_CLASSES = {
  CREATE_CARD_SETTING_WRAPPER: 'create-card-setting-wrapper',
  BUTTON_WRAPPER: 'button-wrapper',
  NESTED_SETTING_WRAPPER: 'nested-setting-wrapper',
  HAS_FURIGANA: 'search-result-has-furigana',
  POS: 'parts-of-speech',
  POS_WRAPPER: 'parts-of-speech-wrapper',
  AUDIO_WRAPPER: 'solution-audio-wrapper',
  PITCH_WRAPPER: 'solution-pitch-wrapper',
  SOLUTION_HEADER: 'solution-header',
  SOLUTION_HEADER_WRAPPER: 'solution-header-wrapper',
  CREATE_CARD_SOLUTION_WRAPPER: 'create-card-solution-wrapper',
  PITCH_LOW: 'pitch-low',
  PITCH_HIGH: 'pitch-high',
  PITCH_DROP: 'pitch-drop',
  REVIEW_ROW_WRAPPER: 'review-card-row-wrapper',
  REVIEW_PRIMARY_WRAPPER: 'review-card-primary-wrapper',
  REVIEW_SENTENCE_WRAPPER: 'review-card-sentence-wrapper'
}

export const ICON_NAMES = {
  ADD: 'plus-with-circle',
  CROSS: 'cross'
}

export const PLUGIN_SUBPATH = '/.obsidian/plugins/view-test'

export const DEFAULT_SETTINGS = {
  SUBFOLDER: 'Japanese Flashcards',
  PROP_PREFIX: 'flashcard',
  PROP_KEYS: {
    TAGS: 'tags',
    LESSON: 'lesson',
  }
}

export const NOTICE_DURATION = 8000

export const MODAL_DESC = {
  SOLUTION_ALIAS: 'How the flashcard’s Japanese solution will be shown.',
  LESSON: 'The textbook lesson that the entry is from.',
  TAGS: 'Additional Tags.'
}

const JOTOBA = 'https://jotoba.de'
const TATOEBA = 'https://tatoeba.org'
export const URLS = {
  JOTOBA,
  JOTOBA_SEARCH: `${JOTOBA}/api/search`,
  TATOEBA_SEARCH: `${TATOEBA}/en/api_v0/search`,
  TATOEBA_AUDIO: `${TATOEBA}/en/audio/download`,
}

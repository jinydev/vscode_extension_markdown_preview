export const EXTENSION_ID = 'jiny-markdown';
export const CUSTOM_EDITOR_VIEW_TYPE = 'jinyMarkdown.customEditor';

export enum ViewMode {
  CODE = 'code',
  SPLIT = 'split',
  PREVIEW = 'preview'
}

export const COMMANDS = {
  OPEN_EDITOR: 'jinyMarkdown.openEditor',
  OPEN_PREVIEW: 'jinyMarkdown.openPreview',
  TOGGLE_SPLIT: 'jinyMarkdown.toggleSplit',
  SET_MODE_CODE: 'jinyMarkdown.setModeCode',
  SET_MODE_SPLIT: 'jinyMarkdown.setModeSplit',
  SET_MODE_PREVIEW: 'jinyMarkdown.setModePreview',
  CYCLE_MODE: 'jinyMarkdown.cycleMode'
};

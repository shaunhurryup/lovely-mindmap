import {PluginSettingTab, Setting as ObsidianSetting} from 'obsidian'
import LovelyMindmap from '../main'


const DEFAULT_SETTINGS = {
  autoFocus: false
}

class Setting extends PluginSettingTab {
  main: LovelyMindmap

  ROW_GAP = 20
  COLUMN_GAP = 200
  autoFocus = false

  readonly MACRO_TASK_DELAY = 50
  readonly EPSILON = 1
  readonly OFFSET_WEIGHT = 1.1

  constructor(main: LovelyMindmap) {
    super(main.app, main)
    this.main = main
    console.log('setting')
  }

  display() {
    const {containerEl} = this

    containerEl.empty();
    containerEl.createEl('h3', {text: '🚧🚧🚧'})
    containerEl.createEl('h3', {text: 'The page is under development'})
    containerEl.createEl('h3', {text: 'Most settings are out-of-the-box'})
    this.addAutoFocus()
  }

  addAutoFocus() {
    new ObsidianSetting(this.containerEl)
      .setName('autoFocus')
      .setDesc('auto focus node when create new node')
      .addToggle(component => component
          .setValue(this.main.config.autoFocus)
          .onChange(async (open) => {
            this.main.config.autoFocus = open
            await this.main.saveData(this.main.config)
          })
      )
  }

  async loadSettings() {
    this.main.config = { ...DEFAULT_SETTINGS, ...await this.main.loadData()}
  }
}

export { Setting }

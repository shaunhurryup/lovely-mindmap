import {App, Plugin, PluginManifest, PluginSettingTab, Setting as ObsidianSetting } from 'obsidian'
import {Keymap, Layout, Node, Setting, View} from './module'


export default class LovelyMindmap extends Plugin{
  canvas: any = null
  intervalTimer = new Map()
  node: Node
  keymap: Keymap
  view: View
  setting: Setting
  layout: Layout
  // todo: move to setting
  config: Record<keyof Setting, any>

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest)
    this.node = new Node(this)
    this.keymap = new Keymap(this)
    this.view = new View(this)
    this.setting = new Setting(this)
    this.layout = new Layout(this)
  }

  createCanvasInstance() {
    const timer = setInterval(() => {
      // @ts-ignore
      this.canvas = app.workspace.getLeavesOfType('canvas').first()?.view?.canvas
      if (!!this.canvas) {
        clearInterval(this.intervalTimer.get('canvas'))
      }
    }, 1000)

    if (!this.intervalTimer.get('canvas')) {
      this.intervalTimer.set('canvas', timer)
    }
  }

  async onload() {
    await this.setting.loadSettings()
    this.addSettingTab(new Setting(this))
    this.keymap.registerAll()
    this.createCanvasInstance()
  }

  onunload() {
    this.keymap.unregisterAll()
    this.intervalTimer.forEach(clearInterval)
  }
}

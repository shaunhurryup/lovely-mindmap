import {App, Modifier, Plugin, PluginManifest} from 'obsidian'
import {Keymap, Node, Setting, View} from './module'


interface MyPluginSettings {
  mySetting: string
  autoFocus: boolean
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: 'default',
  autoFocus: false,
}

type NewNodeSize = 'inherit' | { width: number, height: number }

interface Shortcut {
  modifiers: Modifier
  key: string
  vkey: string
}


export default class LovelyMindmap extends Plugin{
  settings: MyPluginSettings
  canvas: any = null
  hotkeys2: any = []
  intervalTimer = new Map()
  node: Node
  keymap: Keymap
  view: View
  setting: Setting

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest)
    this.node = new Node(this)
    this.keymap = new Keymap(this)
    this.view = new View(this)
    this.setting = new Setting(this)
    // mixin(LovelyMindmap, Node, Keymap)
  }


  // sibNodes must have x,y,height,width attributes
  reflow(parentNode, sibNodes) {
    const ROW_GAP = 20
    const COLUMN_GAP = 200

    const bbox = sibNodes.reduce((prev, node, idx) => {
      return idx > 0
        ? {
          height: prev.height + node.height + ROW_GAP,
          heightNodes: prev.heightNodes.concat(node.height),
        }
        : {
          height: prev.height + node.height,
          heightNodes: prev.heightNodes.concat(node.height),
        }
    }, {
      height: 0,
      heightNodes: [],
    })

    const top = parentNode.y + parentNode.height * 0.5 - bbox.height * 0.5

    const getSum = (arr: number[]) => arr.reduce((sum, cur) => sum + cur, 0)

    sibNodes.sort((a, b) => a.y - b.y).forEach((node, i) => {
      node.moveTo({
        x: parentNode.width + parentNode.x + COLUMN_GAP,
        y: top + ROW_GAP * i + getSum(bbox.heightNodes.slice(0, i))
      })
    })
  }


  createCanvas() {
    const timer = setInterval(() => {
      this.canvas = app.workspace.getLeavesOfType('canvas').first()?.view?.canvas
      if (!!this.canvas) {
        clearInterval(this.intervalTimer.get('canvasInitial'))
      }
    }, 1000)

    if (!this.intervalTimer.get('canvasInitial')) {
      this.intervalTimer.set('canvasInitial', timer)
    }
  }

  async onload() {
    await this.loadSettings()
    this.keymap.registerAll()
    this.createCanvas()
  }

  onunload() {
    this.keymap.unregisterAll()
    this.intervalTimer.forEach(clearInterval)
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }
}

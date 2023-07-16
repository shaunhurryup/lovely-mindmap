import {App, KeymapEventHandler, Modifier, Plugin, PluginManifest} from 'obsidian'
import {Debounce} from './decorator'
import {filter} from 'builtin-modules'
import {Node} from './feature/Node'
import {calcDistance, createId, findClosestNodeByBbox, mixin} from './tool'
import {Keymap} from './feature/keymap'


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


const MACRO_TASK_DELAY = 50



export default class LovelyMindmap extends Plugin{
  settings: MyPluginSettings
  canvas: any = null
  hotkeys2: any = []
  intervalTimer = new Map()
  node: Node
  keymap: Keymap

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest)
    this.node = new Node(this)
    this.keymap = new Keymap(this)
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

  editToNode(node: M.Node) {
    setTimeout(() => node.startEditing(), MACRO_TASK_DELAY)
  }

  zoomToNode(node: M.Node) {
    this.canvas.selectOnly(node)
    this.canvas.zoomToSelection()

    // 魔法打败魔法
    if (DEFAULT_SETTINGS.autoFocus) {
      this.editToNode(node)
    }
  }

  view2Focus() {
    if (this.getSingleSelection() !== null) {
      return
    }

    const viewportBBox = this.canvas.getViewportBBox()
    const centerPoint: M.Position = [
      (viewportBBox.minX + viewportBBox.maxX) / 2,
      (viewportBBox.minY + viewportBBox.maxY) / 2,
    ]

    const viewportNodes = this.canvas.getViewportNodes()
    const res = findClosestNodeByBbox(centerPoint, viewportNodes)
    this.zoomToNode(res.node)
  }

  focus2Edit() {
    const selection = this.getSingleSelection()
    if (!selection || !selection.isFocused || selection.isEditing) {
      return
    }

    this.editToNode(selection)
  }

  edit2Focus() {
    const selection = this.getSingleSelection()
    if (!selection || !selection.isEditing) {
      return
    }

    selection.blur()
    // hack: blur will lose selection style
    selection.focus()
  }

  focus2View() {
    const selection = this.getSingleSelection()
    if (!selection) {
      return
    }

    this.canvas.deselectAll()
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

    // setTimeout(() => this.registerAll(), 1000)
    // console.log(
    //   this.hotkeys,
    //   this.hotkeys2,
    // )
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

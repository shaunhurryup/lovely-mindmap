import {App, KeymapEventHandler, Modal, moment, Plugin, PluginSettingTab, Setting} from 'obsidian'


interface MyPluginSettings {
  mySetting: string
  autoFocus: boolean
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: 'default',
  autoFocus: false,
}

const directionMap = {
  'up': 'arrowUp',
  'down': 'arrowDown',
  'left': 'arrowLeft',
  'right': 'arrowRight',
}


const random = (e: number) => {
  let t = []
  for (let n = 0; n < e; n++) {
    t.push((16 * Math.random() | 0).toString(16))
  }
  return t.join('')
}

const MACRO_TASK_DELAY = 50

const EPSILON = 1

const OFFSET_WEIGHT = 1.1


export default class MyPlugin extends Plugin {
  settings: MyPluginSettings
  canvas: any
  hotkeys: KeymapEventHandler[] = []

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

  getSingleSelection(): OMM.Node | null {
    const selections = this.canvas.selection

    if (selections === undefined) return null

    if (selections.size !== 1) {
      console.error(`You are using \`getSingleSelection\` function! Expect selected node number is \`1\`, you select \`${selections.size}\``)
      return null
    }

    return selections.values().next().value
  }

  zoomToNode(node: OMM.Node) {
    this.canvas.selectOnly(node)
    this.canvas.zoomToSelection()

    // 魔法打败魔法
    if (DEFAULT_SETTINGS.autoFocus) {
      setTimeout(() => node.startEditing(), MACRO_TASK_DELAY)
    }
  }

  getFromNodes(target: OMM.Node) {
    const fromNodeFilter = (edge: OMM.Edge) => edge.to.node.id === target.id

    return this.canvas
      .getEdgesForNode(target)
      .filter(fromNodeFilter)
      .map((edge: OMM.Edge) => edge.from.node)
  }

  getSibNodes(target: OMM.Node) {
    const fromNodes = this.getFromNodes(target)
    const toNodes = this.getToNodes(fromNodes[0])
    return toNodes.filter(node => node.id !== target.id)
  }

  getToNodes(target: OMM.Node) {
    const toNodeFilter = (edge: OMM.Edge) => edge.from.node.id === target.id

    return this.canvas
      .getEdgesForNode(target)
      .filter(toNodeFilter)
      .map((edge: OMM.Edge) => edge.to.node)
  }

  focusNode() {
    return this.app.scope.register([], ' ', () => {
      const selection = this.getSingleSelection()
      if (!selection || selection.isEditing) return
      selection.startEditing()
      this.canvas.zoomToSelection()
    })
  }

  createChildren() {
    return this.app.scope.register([], 'Tab', () => {
      const selectionNode = this.getSingleSelection()
      if (!selectionNode || selectionNode.isEditing) return

      const {
        x,
        y,
        width,
        height,
      } = selectionNode

      // node with from and to attrs we called `Edge`
      // node without from and to but has x,y,width,height attrs we called `Node`
      const rightSideNodeFilter = (node: OMM.Edge) => node?.to?.side === 'left' && selectionNode.id !== node?.to?.node?.id

      // return this.edgeFrom.getArray(e).concat(this.edgeTo.getArray(e))
      const sibNodes = this.canvas
        .getEdgesForNode(selectionNode)
        .filter(rightSideNodeFilter)
        .map((node: OMM.Edge) => node.to.node)

      const childNode = this.canvas.createTextNode({
        pos: {
          x: x + width + 200,
          y: y,
        },
        size: {
          height: height,
          width: width
        },
        text: '',
        focus: false,
        save: true,
      })

      const data = this.canvas.getData()

      this.canvas.importData({
        'edges': [
          ...data.edges,
          {
            'id': random(6),
            'fromNode': selectionNode.id,
            'fromSide': 'right',
            'toNode': childNode.id,
            'toSide': 'left',
          }
        ],
        'nodes': data.nodes,
      })

      this.reflow(selectionNode, sibNodes.concat(childNode))

      this.zoomToNode(childNode)
    })
  }

  createSibNode() {
    return this.app.scope.register([], 'enter', () => {
      const selectionNode = this.getSingleSelection()
      if (!selectionNode || selectionNode.isEditing) return

      const {
        x,
        y,
        width,
        height,
      } = selectionNode

      const fromNode = this.getFromNodes(selectionNode)[0]
      const toNodes = this.getToNodes(fromNode)

      const willInsertedNode = this.canvas.createTextNode({
        pos: {
          x: x,
          y: y + EPSILON,
        },
        size: {
          height,
          width,
        },
        text: moment().format('YYYY-MM-DD HH:mm:ss'),
        focus: false,
        save: true,
      })

      const data = this.canvas.getData()

      this.canvas.importData({
        'edges': [
          ...data.edges,
          {
            'id': random(6),
            'fromNode': fromNode.id,
            'fromSide': 'right',
            'toNode': willInsertedNode.id,
            'toSide': 'left',
          }
        ],
        'nodes': data.nodes,
      })


      this.reflow(fromNode, toNodes.concat(willInsertedNode))
      this.zoomToNode(willInsertedNode)
    })
  }

  nodeNavigation(direction: keyof typeof directionMap) {
    return app.scope.register(['Alt'], directionMap[direction], () => {
      const selection = this.getSingleSelection()
      if (!selection || selection.isEditing) return

      const data = this.canvas.getViewportNodes()


      // todo: 直线距离计算也应该更复杂
      const offsetX = (a: OMM.Node, b: OMM.Node) => Math.abs(b.x - a.x)
      const offsetY = (a: OMM.Node, b: OMM.Node) => Math.abs(b.y - a.y)
      // fixed: 复数的非整次方为 NaN
      // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/pow#return_value:~:text=base%20%3C%200%20and%20exponent%20is%20not%20an%20integer.
      const endpointOffset = (a: OMM.Node, b: OMM.Node) => Math.min(
        Math.abs(b.y - a.y + 2 / a.height),
        Math.abs(b.y + b.height - a.y - 2 / a.height),
        Math.abs(b.x - a.x + 2 / a.width),
        Math.abs(b.x + b.width - a.x + 2 / a.width),
      )
      const calcDistance = (a: OMM.Node, b: OMM.Node) => (direction === 'left' || direction === 'right')
        ? offsetX(a, b) + endpointOffset(a, b) ** OFFSET_WEIGHT
        : offsetY(a, b) + endpointOffset(a, b) ** OFFSET_WEIGHT
      const isSameDirection = (node: OMM.Node) => {
        const notSelf = node.id !== selection.id
        const strategies = {
          right: notSelf && node.x > selection.x + selection.width,
          left: notSelf && node.x + node.width < selection.x,
          up: notSelf && node.y + node.height < selection.y,
          down: notSelf && node.y > selection.y + selection.height,
        }
        return strategies[direction]
      }

      const midpoints = data
        .filter(isSameDirection)
        .map((node: OMM.Node) => ({
          node,
          offsetX: offsetX(selection, node),
          offsetY: offsetY(selection, node),
          endpointOffset: endpointOffset(selection, node),
          distance: calcDistance(selection, node)
        }))
        .sort((a: OMM.Node, b: OMM.Node) => a.distance - b.distance)

      console.log('midpoints:\n', midpoints)

      if (midpoints.length > 0) {
        this.zoomToNode(midpoints[0].node)
      }
    })
  }

  help() {
    return this.app.scope.register([], 'h', () => {
      console.log('canvas:\n', this.canvas)

      const selections = this.canvas.selection.values().next().value
      console.log('selections:\n', selections)
    })
  }


  async onload() {
    await this.loadSettings()

    this.canvas = app.workspace.getLeavesOfType('canvas').first()?.view?.canvas

    this.hotkeys.push(this.focusNode())

    this.hotkeys.push(this.createChildren())

    this.hotkeys.push(this.createSibNode())

    this.hotkeys.push(this.app.scope.register(['Shift'], 'enter', () => console.log('shift enter')))

    this.hotkeys.push(this.nodeNavigation('right'))
    this.hotkeys.push(this.nodeNavigation('left'))
    this.hotkeys.push(this.nodeNavigation('up'))
    this.hotkeys.push(this.nodeNavigation('down'))

    this.hotkeys.push(this.help())

    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    const statusBarItemEl = this.addStatusBarItem()
    statusBarItemEl.setText('Status Bar Text')

    // This adds a simple command that can be triggered anywhere
    this.addCommand({
      id: 'open-sample-modal-simple',
      name: 'Open sample modal (simple)',
      callback: () => {
        new SampleModal(this.app).open()
      }
    })

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SampleSettingTab(this.app, this))

    // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // Using this function will automatically remove the event listener when this plugin is disabled.
    // this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
    // 	console.log('click', evt);
    // });

    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000))
  }

  onunload() {
    this.hotkeys.forEach(key => {
      this.app.scope.unregister(key)
    })
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }
}

class SampleModal extends Modal {
  constructor(app: App) {
    super(app)
  }

  onOpen() {
    const {contentEl} = this
    contentEl.setText('Woah!')
  }

  onClose() {
    const {contentEl} = this
    contentEl.empty()
  }
}

class SampleSettingTab extends PluginSettingTab {
  plugin: MyPlugin

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const {containerEl} = this

    containerEl.empty()

    containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'})

    containerEl.createEl('h1', {text: 'Heading 1'})

    new Setting(containerEl)
      .setName('Setting #1')
      .setDesc('It\'s a secret')
      .addText(text => text
        .setPlaceholder('Enter your secret')
        .setValue(this.plugin.settings.mySetting)
        .onChange(async (value) => {
          console.log('Secret: ' + value)
          this.plugin.settings.mySetting = value
          await this.plugin.saveSettings()
        }))
  }
}

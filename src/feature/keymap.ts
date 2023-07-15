import {App, KeymapEventHandler, KeymapEventListener, Modifier} from 'obsidian'
import {mixin} from '../tool'
import {Node} from './Node'
import {Debounce} from '../decorator'
import LovelyMindmap from '../main'

/**
 * Register and manage your keymap
 */
class Keymap {
  hotkeys: KeymapEventHandler[] = []
  main: LovelyMindmap
  node: Node

  constructor(main: LovelyMindmap) {
    this.node = main.node
    this.main = main
    // mixin(Keymap, Node)
    this.hotkeys = []
  }

  @Debounce()
  help() {
    console.log('this:\n', this)

    console.log('app:\n', this.main.app)

    console.log('canvas:\n', this.main.canvas)

    console.log('selections:\n', this.node.getSingleSelection())
  }

  nodeNavigation() {
    const selection = this.node.getSingleSelection()
    if (!selection || selection.isEditing) {
      // const notice = new Notice('')
      // notice.setMessage('Press `cmd + Esc` to exit creating view')
      return
    }

    const data = this.main.canvas.getViewportNodes()


    const offsetX = (a: M.Node, b: M.Node) => Math.abs(b.x - a.x)
    const offsetY = (a: M.Node, b: M.Node) => Math.abs(b.y - a.y)
    // fixed: 复数的非整次方为 NaN
    // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/pow#return_value:~:text=base%20%3C%200%20and%20exponent%20is%20not%20an%20integer.
    const endpointOffset = (a: M.Node, b: M.Node) => Math.min(
      Math.abs(b.y - a.y + 2 / a.height),
      Math.abs(b.y + b.height - a.y - 2 / a.height),
      Math.abs(b.x - a.x + 2 / a.width),
      Math.abs(b.x + b.width - a.x + 2 / a.width),
    )
    const calcDistance = (a: M.Node, b: M.Node) => (direction === 'left' || direction === 'right')
      ? offsetX(a, b) + endpointOffset(a, b) ** OFFSET_WEIGHT
      : offsetY(a, b) + endpointOffset(a, b) ** OFFSET_WEIGHT
    const isSameDirection = (node: M.Node) => {
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
      .map((node: M.Node) => ({
        node,
        offsetX: offsetX(selection, node),
        offsetY: offsetY(selection, node),
        endpointOffset: endpointOffset(selection, node),
        distance: calcDistance(selection, node)
      }))
      .sort((a: M.Node, b: M.Node) => a.distance - b.distance)

    if (midpoints.length > 0) {
      this.zoomToNode(midpoints[0].node)
    }
  }

  blurNode() {
    const selection = this.node.getSingleSelection()
    if (!selection) return

    if (selection.isEditing) {
      this.edit2Focus()
      return
    }

    if (selection.isFocused) {
      this.focus2View()
      return
    }
  }

  focusNode() {
    const selection = this.node.getSingleSelection()

    const isView = !selection
    if (isView) {
      this.view2Focus()
      return
    }

    const isFocus = selection.isFocused === true
    if (isFocus) {
      this.focus2Edit()
      return
    }
  }

  register(
    modifiers: Modifier[],
    key: string | null,
    func: KeymapEventListener
  ): KeymapEventHandler {
    return this.main.app.scope.register(modifiers, key, func)
  }

  registerAll() {
    this.hotkeys.push(
      this.register([], 'f', this.focusNode.bind(this)),
      this.register(['Meta'], 'Escape', this.blurNode),
      this.register([], 'Tab', this.createChildren),
      this.register([], 'enter', this.createSibNode),
      this.register(['Shift'], 'enter', this.createSibNode),
      this.register(['Alt'], 'arrowLeft', this.nodeNavigation),
      this.register(['Alt'], 'arrowRight', this.nodeNavigation),
      this.register(['Alt'], 'arrowUp', this.nodeNavigation),
      this.register(['Alt'], 'arrowDown', this.nodeNavigation),
      this.register([], 'h', this.help.bind(this))
    )
  }

  unregisterAll() {
    this.hotkeys.forEach(key => this.main.app.scope.unregister(key))
  }
}

export { Keymap }

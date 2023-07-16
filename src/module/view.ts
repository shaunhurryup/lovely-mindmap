import LovelyMindmap from '../main'
import {findClosestNodeByBbox} from '../tool'

/**
 * A friendly way to manage your attention
 * Three ways to interaction
 *  - Touch
 *  - Navigation
 *  - Creation
 *
 */
class View {
  main: LovelyMindmap

  constructor(main: LovelyMindmap) {
    this.main = main
  }

  isTouching() {
    return this.main.node.getSelection().size === 0
  }

  isNavigating() {
    const node = this.main.node.getSingleSelection()
    if (!node) return false

    return node.isFocused && !node.isEditing
  }

  isCreating() {
    const node = this.main.node.getSingleSelection()
    if (!node) return false

    return node.isFocused && node.isEditing
  }

  useTouch() {
    this.main.canvas.deselectAll()
  }

  useCreation(node: M.Node) {
    setTimeout(
      () => node.startEditing(),
      this.main.setting.MACRO_TASK_DELAY
    )
  }

  creation2Navigation() {
    const selection = this.main.node.getSingleSelection()
    if (!selection || !this.isCreating()) return

    selection.blur()
    // magic: blur will lose selection style
    selection.focus()
  }

  touch2Navigation() {
    const viewportBBox = this.main.canvas.getViewportBBox()
    const centerPoint: M.Position = [
      (viewportBBox.minX + viewportBBox.maxX) / 2,
      (viewportBBox.minY + viewportBBox.maxY) / 2,
    ]

    const viewportNodes = this.main.canvas.getViewportNodes()
    const res = findClosestNodeByBbox(centerPoint, viewportNodes)
    this.zoomToNode(res.node)
  }

  zoomToNode(node: M.Node) {
    this.main.canvas.selectOnly(node)
    this.main.canvas.zoomToSelection()

    if (this.main.setting.autoFocus) {
      this.useCreation(node)
    }
  }
}

export {View}

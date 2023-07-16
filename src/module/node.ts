import {calcDistance, createId, mixin} from '../tool'
import LovelyMindmap from '../main'
import {App, PluginManifest} from 'obsidian'
import {Debounce} from '../decorator'


const EPSILON = 1


class Node {
  main: LovelyMindmap

  constructor(main: LovelyMindmap) {
    this.main = main
  }

  getSelection(): Set<M.Node> {
    return this.main.canvas.selection
  }

  getSingleSelection(): M.Node | null {
    const selections = this.main.canvas.selection

    if (selections.size === 0 || selections.size > 1) {
      return null
    }

    return selections.values().next().value
  }

  getFromNodes(node: M.Node) {
    const fromNodeFilter = (edge: M.Edge) => edge.to.node.id === node.id

    return this.main.canvas
      .getEdgesForNode(node)
      .filter(fromNodeFilter)
      .map((edge: M.Edge) => edge.from.node)
  }

  getToNodes(node: M.Node) {
    const toNodeFilter = (edge: M.Edge) => edge.from.node.id === node.id

    return this.main.canvas
      .getEdgesForNode(node)
      .filter(toNodeFilter)
      .map((edge: M.Edge) => edge.to.node)
  }

  getSibNodes(target: M.Node) {
    const fromNodes = this.getFromNodes(target)
    const toNodes = this.getToNodes(fromNodes[0])
    return toNodes.filter((node: M.Node) => node.id !== target.id)
  }

  @Debounce()
  createChildren() {
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
    const rightSideNodeFilter = (node: M.Edge) => node?.to?.side === 'left' && selectionNode.id !== node?.to?.node?.id

    const sibNodes = this.main.canvas
      .getEdgesForNode(selectionNode)
      .filter(rightSideNodeFilter)
      .map((node: M.Edge) => node.to.node)

    const nextNodeY = Math.max(...sibNodes.map((node: M.Node) => node.y)) + EPSILON

    const childNode = this.main.canvas.createTextNode({
      pos: {
        x: x + width + 200,
        y: nextNodeY,
      },
      size: {
        height: height,
        width: width
      },
      text: '',
      focus: false,
      save: true,
    })

    const data = this.main.canvas.getData()

    this.main.canvas.importData({
      'edges': [
        ...data.edges,
        {
          'id': createId(6),
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
  }

  @Debounce()
  createSibNode(_: unknown, shortcut: Shortcut) {
    const selectionNode = this.getSingleSelection()
    if (!selectionNode || selectionNode.isEditing) return

    const {
      x,
      y,
      width,
      height,
    } = selectionNode

    const isPressedShift = shortcut.modifiers === 'Shift'

    const fromNode = this.getFromNodes(selectionNode)[0]
    const toNodes = this.getToNodes(fromNode)

    const willInsertedNode = this.main.canvas.createTextNode({
      pos: {
        x: x,
        y: isPressedShift ? y - EPSILON : y + EPSILON,
      },
      size: {
        height,
        width,
      },
      text: '',
      focus: false,
      save: true,
    })

    const data = this.main.canvas.getData()

    this.main.canvas.importData({
      'edges': [
        ...data.edges,
        {
          'id': createId(6),
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
  }
}

export { Node }

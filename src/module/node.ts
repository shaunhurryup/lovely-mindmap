import {uuid, debounce} from '../tool'
import LovelyMindmap from '../main'
import {KeymapContext} from 'obsidian'
import autobind from 'autobind-decorator'


@autobind
class Node {
  main: LovelyMindmap

  constructor(main: LovelyMindmap) {
    this.main = main
  }

  getNavigationNode(): M.Node | null {
    const node = this.getSingleSelection()
    if (!node || !node.isFocused || node.isEditing) return null

    return node
  }

  getCreationNode(): M.Node | null {
    const node = this.getSingleSelection()
    if (!node || !node.isFocused || !node.isEditing) return null

    return node
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

  @debounce()
  createChildren() {
    const selection = this.getNavigationNode()
    if (!selection) return

    const {
      x,
      y,
      width,
      height,
    } = selection

    // node with from and to attrs we called `Edge`
    // node without from and to but has x,y,width,height attrs we called `Node`
    const rightSideNodeFilter = (node: M.Edge) => node?.to?.side === 'left' && selection.id !== node?.to?.node?.id

    const sibNodes = this.main.canvas
      .getEdgesForNode(selection)
      .filter(rightSideNodeFilter)
      .map((node: M.Edge) => node.to.node)

    const nextNodeY = Math.max(...sibNodes.map((node: M.Node) => node.y)) + this.main.setting.EPSILON

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
          'id': uuid(),
          'fromNode': selection.id,
          'fromSide': 'right',
          'toNode': childNode.id,
          'toSide': 'left',
        }
      ],
      'nodes': data.nodes,
    })

    this.main.layout.useSide(selection, sibNodes.concat(childNode))

    this.main.view.zoomToNode(childNode)
  }

  @debounce()
  createSibNode(_: unknown, context: KeymapContext) {
    const selection = this.getNavigationNode()
    if (!selection) return

    const {
      x,
      y,
      width,
      height,
    } = selection
    const { EPSILON } = this.main.setting

    const isPressedShift = context.modifiers === 'Shift'

    const fromNode = this.main.node.getFromNodes(selection)[0]
    const toNodes = this.main.node.getToNodes(fromNode)

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
          'id': uuid(),
          'fromNode': fromNode.id,
          'fromSide': 'right',
          'toNode': willInsertedNode.id,
          'toSide': 'left',
        }
      ],
      'nodes': data.nodes,
    })


    this.main.layout.useSide(fromNode, toNodes.concat(willInsertedNode))
    this.main.view.zoomToNode(willInsertedNode)
  }
}

export { Node }

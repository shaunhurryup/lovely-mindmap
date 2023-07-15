import {calcDistance} from '../tool'

class Node {
  getSingleSelection(): M.Node | null {
    const selections = this.canvas.selection

    if (selections.size === 0 || selections.size > 1) {
      return null
    }

    return selections.values().next().value
  }

  getFromNodes(node: M.Node) {
    const fromNodeFilter = (edge: M.Edge) => edge.to.node.id === node.id

    return this.canvas
      .getEdgesForNode(node)
      .filter(fromNodeFilter)
      .map((edge: M.Edge) => edge.from.node)
  }

  getToNodes(node: M.Node) {
    const toNodeFilter = (edge: M.Edge) => edge.from.node.id === node.id

    return this.canvas
      .getEdgesForNode(node)
      .filter(toNodeFilter)
      .map((edge: M.Edge) => edge.to.node)
  }

  getSibNodes(target: M.Node) {
    const fromNodes = this.getFromNodes(target)
    const toNodes = this.getToNodes(fromNodes[0])
    return toNodes.filter((node: M.Node) => node.id !== target.id)
  }
}

export { Node }

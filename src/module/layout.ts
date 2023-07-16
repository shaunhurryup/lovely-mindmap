import LovelyMindmap from '../main'

/**
 * Similar to Node module, but with multiple nodes, at least two
 */
class Layout {
  main: LovelyMindmap

  constructor(main: LovelyMindmap) {
    this.main = main
  }

  useSide(parent: M.Node, child: M.Node[]) {
    const { ROW_GAP, COLUMN_GAP } = this.main.setting

    const bbox = child.reduce((prev, node, idx) => {
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
      heightNodes: [] as number[],
    })

    const top = parent.y + parent.height * 0.5 - bbox.height * 0.5

    const getSum = (arr: number[]) => arr.reduce((sum, cur) => sum + cur, 0)

    child.sort((a, b) => a.y - b.y).forEach((node, i) => {
      node.moveTo({
        x: parent.width + parent.x + COLUMN_GAP,
        y: top + ROW_GAP * i + getSum(bbox.heightNodes.slice(0, i))
      })
    });
  }

  useSurround() {
    // TODO
  }
}

export { Layout }

declare namespace M {
  type Position = [x: number, y: number]

  interface MyPluginSettings {
    mySetting: string;
  }

  interface BBox {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }

  interface Rect {
    height: number
    width: number
    x: number
    y: number
  }

  interface Node extends Rect {
    alwaysKeepLoaded: boolean
    app: unknown
    aspectRadio: number
    bbox: BBox
    canvas: unknown
    child: unknown
    color: string
    containerEl: HTMLDivElement
    contentBlockerEl: HTMLDivElement
    contentEl: HTMLDivElement
    destroyed: boolean
    id: string
    initialized: boolean
    isContentMounted: boolean
    isEditing: boolean
    nodeEl: HTMLDivElement
    placeholderEl: HTMLDivElement
    renderedZIndex: number
    resizeDirty: boolean
    text: string
    unknownData: unknown
    zIndex: number
    isAttached: boolean
    isFocused: boolean
    rect: Rect
    [key: string]: any
  }

  type Sign = 'none' | 'arrow'

  type Side = 'left' | 'right'

  interface NodeDirection {
    end: Sign
    node: Node
    side: Side
  }

  interface Edge {
    bbox: BBox
    bezier: unknown
    canvas: unknown
    color: string
    from: NodeDirection
    fromLineEnd: unknown
    id: string
    initialized: boolean
    label: unknown
    lineEndGroupEl: HTMLOrSVGElement
    lineGroupEl: HTMLOrSVGElement
    path: unknown
    to: NodeDirection
    toLineEnd: { el: HTMLOrSVGElement, type: 'arrow' }
    unknownData: unknown
    isAttached: boolean
    [key: string]: any
  }

}

function mixin(target: Function, ...sources: Function[]) {
  sources.forEach(source => {
    Object.getOwnPropertyNames(source.prototype).forEach(name => {
      target.prototype[name] = source.prototype[name];
    });
  });
}

function calcDistance(a: M.Position, b: M.Position) {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 +
    (a[1] - b[1]) ** 2
  )
}

function findClosestNodeByBbox(pos: M.Position, nodes: M.Node[]): { node: M.Node, distance: number } {
  return nodes.reduce((prev, cur, idx) => {
    const a: M.Position = [cur.bbox.minX, cur.bbox.minY]
    const b: M.Position = [cur.bbox.maxX, cur.bbox.minY]
    const c: M.Position = [cur.bbox.minX, cur.bbox.maxY]
    const d: M.Position = [cur.bbox.maxX, cur.bbox.maxY]
    // todo: at least two or more point in each node can be ignored
    const distance = Math.min(
      calcDistance(pos, a),
      calcDistance(pos, b),
      calcDistance(pos, c),
      calcDistance(pos, d),
    )

    if (idx === 0) {
      return {
        node: cur,
        distance: distance,
      }
    }

    return distance < prev.distance
      ? {node: cur, distance}
      : prev

  }, {
    node: {} as any,
    distance: 0,
  })
}

function createId(e: number) {
  let t = []
  for (let n = 0; n < e; n++) {
    t.push((16 * Math.random() | 0).toString(16))
  }
  return t.join('')
}

export { mixin, calcDistance, findClosestNodeByBbox, createId }

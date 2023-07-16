function debounce(delay: number = 100): MethodDecorator {
  let lastTime = 0
  let timer: NodeJS.Timeout

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      const now = Date.now()
      clearTimeout(timer)

      if ((now - lastTime) < delay) {
        return
      }

      timer = setTimeout(() => {
        originalMethod.apply(this, args)
        lastTime = 0
      }, delay)

      lastTime = now
    }

    return descriptor
  }
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

/**
 * generate a 12-bit number
 */
function uuid() {
  const first = Math.floor(Math.random() * 9 + 1)
  const rest = String(Math.random()).slice(2, 10)
  const random9 = first + rest

 return string10To64(Date.now()) + string10To64(random9)
}

function string10To64(str: number | string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  const radix = chars.length
  let num = typeof str === 'string' ? parseInt(str) : str
  const res = []

  do {
    const mod = num % radix
    res.push(chars[mod])
    num = (num - mod) / radix
  } while (num > 0)

  return res.join('')
}

export { debounce, calcDistance, findClosestNodeByBbox, uuid }

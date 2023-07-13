function Debounce(delay: number = 100): MethodDecorator {
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

export { Debounce }

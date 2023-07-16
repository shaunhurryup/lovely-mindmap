import LovelyMindmap from '../main'

type millisecond = number

class Setting {
  main: LovelyMindmap
  MACRO_TASK_DELAY: millisecond = 50

  constructor(main: LovelyMindmap) {
    this.main = main
  }
}

export { Setting }

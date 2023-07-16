import LovelyMindmap from '../main'

type millisecond = number

class Setting {
  main: LovelyMindmap
  MACRO_TASK_DELAY: millisecond = 50
  ROW_GAP: number = 20
  COLUMN_GAP: number = 200

  constructor(main: LovelyMindmap) {
    this.main = main
  }
}

export { Setting }

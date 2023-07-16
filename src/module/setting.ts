import LovelyMindmap from '../main'


class Setting {
  main: LovelyMindmap

  MACRO_TASK_DELAY = 50
  ROW_GAP = 20
  COLUMN_GAP = 200
  autoFocus = false

  readonly EPSILON = 1
  readonly OFFSET_WEIGHT = 1.1

  constructor(main: LovelyMindmap) {
    this.main = main
  }
}

export { Setting }

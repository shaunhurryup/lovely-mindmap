import {Notice} from 'obsidian'


interface Options {
  duration?: number
}

class Message {
  info(message: string, options?: Options) {
    const notice = new Notice('', options?.duration)
    notice.setMessage('🔷\n' + message)
  }

  warn(message: string, options?: Options) {
    const notice = new Notice('', options?.duration)
    notice.setMessage('⚠️\n' + message)
  }
}

const message = new Message()

export {message}

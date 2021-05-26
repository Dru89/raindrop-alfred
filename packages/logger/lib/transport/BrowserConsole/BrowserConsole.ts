import TransportStream from 'winston-transport';
import { LEVEL, MESSAGE } from 'triple-beam';
import { STYLES } from '../../format/BrowserColorize';

interface MessageInfo {
  [LEVEL]: string;
  [MESSAGE]: string;
  [STYLES]?: string[];
}

function getMethod(level: string) {
  /* eslint-disable no-console */
  switch (level) {
    case 'trace':
      return console.trace;
    case 'debug':
      return console.debug;
    case 'info':
      return console.info;
    case 'warn':
      return console.warn;
    case 'error':
      return console.error;
    default:
      return console.log;
  }
  /* eslint-enable no-console */
}

export default class BrowserConsole extends TransportStream {
  log(info: MessageInfo, next: () => void): void {
    setImmediate(() => this.emit('logged', info));
    const message = info[MESSAGE];
    const styles = info[STYLES];
    const method = getMethod(info[LEVEL]);
    if (styles) {
      method(message, ...styles);
    } else {
      method(message);
    }
    next();
  }
}

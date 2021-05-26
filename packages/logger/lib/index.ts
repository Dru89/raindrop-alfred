import * as winston from 'winston';
import BrowserTransport from 'winston-transport-browserconsole';
import type * as Transport from 'winston-transport';

import { browserColorize, stringify } from './format';

function isBrowser() {
  return (
    typeof window !== 'undefined' && typeof window.document !== 'undefined'
  );
}

const createDefaultTransport = (
  opts: winston.transports.ConsoleTransportOptions = {}
) =>
  isBrowser()
    ? [new BrowserTransport(opts)]
    : [new winston.transports.Console(opts)];

interface Options {
  level?: string;
  format?: winston.Logform.Format;
  transports?: Transport[];
}

export const createLogger = (
  label: string,
  { level = 'info', format, transports }: Options = {}
): winston.Logger => {
  return winston.createLogger({
    level,
    format:
      format ??
      winston.format.combine(
        winston.format.splat(),
        winston.format.label({ label, message: true }),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        isBrowser() ? browserColorize() : winston.format.colorize(),
        winston.format.errors({ stack: true }),
        stringify()
      ),
    transports: transports ?? createDefaultTransport(),
  });
};

export default createLogger('root');

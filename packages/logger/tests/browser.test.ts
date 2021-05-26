import winston from 'winston';

import { browserColorize, stringify } from '../lib/format';
import { BrowserConsole } from '../lib/transport';

describe('it logs correctly in the browser', () => {
  let logger: winston.Logger;

  beforeEach(() => {
    logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.splat(),
        winston.format.label({ label: 'test' }),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        browserColorize(),
        winston.format.errors({ stack: true }),
        stringify()
      ),
      transports: new BrowserConsole(),
    });
  });
  it('will log a message in color', () => {
    logger.info('this is a message', { extra: 'with some more data' });
    logger.debug('and what about %s', 'formatting?');
  });
});

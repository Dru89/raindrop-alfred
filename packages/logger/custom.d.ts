declare module 'triple-beam' {
  export const LEVEL: unique symbol;
  export const MESSAGE: unique symbol;
  export const SPLAT: unique symbol;
  export const configs: {
    cli: {
      levels: {
        error: 0;
        warn: 1;
        help: 2;
        data: 3;
        info: 4;
        debug: 5;
        prompt: 6;
        verbose: 7;
        input: 8;
        silly: 9;
      };
      colors: {
        error: 'red';
        warn: 'yellow';
        help: 'cyan';
        data: 'grey';
        info: 'green';
        debug: 'blue';
        prompt: 'grey';
        verbose: 'cyan';
        input: 'grey';
        silly: 'magenta';
      };
    };
    npm: {
      levels: {
        error: 0;
        warn: 1;
        info: 2;
        http: 3;
        verbose: 4;
        debug: 5;
        silly: 6;
      };
      colors: {
        error: 'red';
        warn: 'yellow';
        info: 'green';
        http: 'green';
        verbose: 'cyan';
        debug: 'blue';
        silly: 'magenta';
      };
    };
    syslog: {
      levels: {
        emerg: 0;
        alert: 1;
        crit: 2;
        error: 3;
        warning: 4;
        notice: 5;
        info: 6;
        debug: 7;
      };
      colors: {
        emerg: 'red';
        alert: 'yellow';
        crit: 'red';
        error: 'red';
        warning: 'red';
        notice: 'yellow';
        info: 'green';
        debug: 'blue';
      };
    };
  };
}

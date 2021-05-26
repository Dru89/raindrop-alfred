import * as winston from 'winston';
import { TransformableInfo } from 'logform';
import { LEVEL, MESSAGE } from 'triple-beam';

import { AnyStyle, applyStyles } from './colors';
import {
  LEVEL_STYLES,
  MESSAGE_STYLES,
  STYLES,
  TIMESTAMP_STYLES,
  LABEL_STYLES,
} from './types';

interface ColorizeOptions {
  levels?: Record<string, AnyStyle | AnyStyle[]>;
  label?: AnyStyle | AnyStyle[];
  timestamp?: AnyStyle | AnyStyle[];
  message?: AnyStyle | AnyStyle[];
}

type Info = TransformableInfo & {
  [TIMESTAMP_STYLES]?: string[];
  [LEVEL_STYLES]?: string[];
  [LABEL_STYLES]?: string[];
  [MESSAGE_STYLES]?: string[];
  [STYLES]?: string[];
  [MESSAGE]?: string;
  [LEVEL]?: string;
  label?: string;
  timestamp?: string;
};

const defaultOptions: ColorizeOptions = {
  timestamp: ['cyan'],
  label: ['cyan'],
  levels: {
    trace: ['gray'],
    debug: ['blue'],
    info: ['green'],
    warning: ['yellow', 'underline'],
    error: ['red', 'bold'],
  },
};

const toArray = <T>(val: undefined | T | T[]): T[] => {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
};
function withArrayValues(
  record: Record<string, AnyStyle | AnyStyle[] | undefined> | undefined
) {
  if (record == null) return {};
  const rec: Record<string, AnyStyle[]> = {};
  Object.keys(record).forEach((key) => {
    rec[key] = toArray(record[key]);
  });
  return rec;
}

export class BrowserColorizer implements winston.Logform.Format {
  static allColors: Partial<ColorizeOptions> = {};

  options: ColorizeOptions;

  constructor(opts: Partial<ColorizeOptions> = {}) {
    this.options = {
      ...defaultOptions,
      ...opts,
      levels: {
        ...defaultOptions.levels,
        ...(opts.levels ?? {}),
      },
    };
    this.addColors(this.options);
  }

  static addColors(colors: ColorizeOptions): ColorizeOptions {
    BrowserColorizer.allColors.levels = withArrayValues(colors.levels);
    BrowserColorizer.allColors.label = toArray(colors.label);
    BrowserColorizer.allColors.timestamp = toArray(colors.timestamp);
    BrowserColorizer.allColors.message = toArray(colors.message);
    return BrowserColorizer.allColors;
  }

  // eslint-disable-next-line class-methods-use-this
  addColors(colors: ColorizeOptions): ColorizeOptions {
    return BrowserColorizer.addColors(colors);
  }

  transform: winston.Logform.TransformFunction = (
    infoObject,
    opts: ColorizeOptions
  ) => {
    const info = infoObject as Info;
    if (opts.label && info.label) {
      const [message, styles] = applyStyles(info.label, toArray(opts.label));
      info.label = message;
      info[LABEL_STYLES] = styles;
    }

    if (opts.timestamp && info.timestamp) {
      const [message, styles] = applyStyles(
        info.timestamp,
        toArray(opts.timestamp)
      );
      info.timestamp = message;
      info[TIMESTAMP_STYLES] = styles;
    }

    if (opts.message && info.message) {
      const [message, styles] = applyStyles(
        info.message,
        toArray(opts.message)
      );
      info.message = message;
      info[MESSAGE_STYLES] = styles;
    }

    const level = info[LEVEL] ?? info.level;
    if (opts.levels && opts.levels[level]) {
      const [message, styles] = applyStyles(
        info.level,
        toArray(opts.levels[level])
      );
      info.level = message;
      info[LEVEL_STYLES] = styles;
    }

    return info;
  };
}

export default function colorize(opts: ColorizeOptions = {}): BrowserColorizer {
  return new BrowserColorizer(opts);
}

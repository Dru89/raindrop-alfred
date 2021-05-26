/* eslint-disable no-console */
import { FormatWrap, format, TransformableInfo } from 'logform';
import { MESSAGE } from 'triple-beam';
import jsonStringify from 'safe-stable-stringify';

import {
  LEVEL_STYLES,
  MESSAGE_STYLES,
  STYLES,
  TIMESTAMP_STYLES,
  LABEL_STYLES,
} from '../BrowserColorize';

type Info = TransformableInfo & {
  [TIMESTAMP_STYLES]?: string[];
  [LEVEL_STYLES]?: string[];
  [LABEL_STYLES]?: string[];
  [MESSAGE_STYLES]?: string[];
  [STYLES]?: string[];
  [MESSAGE]?: string;
};

const asArray = (val: string | string[] | undefined): string[] => {
  if (val == null) return [];
  if (typeof val === 'string') return [val];
  return val;
};

function checkAndReplace(
  info: Info,
  field: string,
  symbol: symbol & keyof Info
): [string | undefined, string[]] {
  const value = info[field] as string | undefined;
  const styles = asArray(info[symbol]);

  if (typeof value !== 'string') return [undefined, []];

  const count = (value.match(/%c/g) ?? []).length;
  if (count > 0 && styles == null) {
    // eslint-disable-next-line no-console
    console.error(
      `Error trying to style string "${value}" for console. No provided styles.`
    );
    return [value.replace(/%c/g, ''), []];
  }

  if (count === 0) {
    if (styles.length > 0) {
      console.warn(
        `Can't style string "${value}". The following styles were provided, but not included in the format string. ${JSON.stringify(
          styles
        )}`
      );
    }
    return [value, []];
  }

  if (count > styles.length) {
    console.error(
      `Error trying to style string "${value}" for console. Not enough style values were provided in ${JSON.stringify(
        styles
      )}). Removing all provided styles.`
    );

    return [value.replace(/%c/g, ''), []];
  }

  if (count < styles.length) {
    console.warn(
      `Too many styles were provided to format "${value}". The output will likely look wrong. Styles provided: ${JSON.stringify(
        styles
      )}`
    );
    return [value, styles.slice(0, count)];
  }

  return [value, styles];
}

const transform: FormatWrap = format((origInfo) => {
  const info = origInfo as Info;
  console.log(info);

  const [ts, tsStyles] = checkAndReplace(info, 'timestamp', TIMESTAMP_STYLES);
  const [level, levelStyles] = checkAndReplace(info, 'level', LEVEL_STYLES);
  const [label, labelStyles] = checkAndReplace(info, 'label', LABEL_STYLES);
  const [msg, msgStyles] = checkAndReplace(info, 'message', MESSAGE_STYLES);
  const rest = jsonStringify({
    ...info,
    timestamp: undefined,
    level: undefined,
    label: undefined,
    message: undefined,
    splat: undefined,
  });

  let message = '';
  if (ts) message += `${ts} `;
  if (level) message += `[${level}] `;
  if (label) message += `${label} - `;
  if (msg) message += msg;
  if (rest !== '{}') message += ` ${rest}`;
  info[MESSAGE] = message;
  info[STYLES] = [...tsStyles, ...levelStyles, ...labelStyles, ...msgStyles];

  return info;
});

export default transform;

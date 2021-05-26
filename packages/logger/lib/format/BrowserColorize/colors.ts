export const colors = {
  black: '#403f53',
  red: '#de3d3b',
  green: '#08916a',
  blue: '#288ed7',
  yellow: '#e0af02',
  magenta: '#d6438a',
  cyan: '#2aa298',
  white: '#f0f0f0',
  grey: '#9898a2',
  gray: '#9898a2',
  brightBlack: '#403f53',
  brightRed: '#de3d3b',
  brightGreen: '#08916a',
  brightYellow: '#daaa01',
  brightBlue: '#288ed7',
  brightMagenta: '#d6438a',
  brightCyan: '#2aa298',
  brightWhite: '#f0f0f0',
} as const;

export const styles = [
  'reset',
  'bold',
  'italic',
  'underline',
  'strikethrough',
] as const;

export type ForegroundColor = keyof typeof colors;
export type BackgroundColor = `bg${Capitalize<ForegroundColor>}`;
export type Color = ForegroundColor | BackgroundColor;
export type Style = typeof styles[number];
export type AnyStyle = Color | Style;

export function isForegroundColor(color: unknown): color is ForegroundColor {
  return typeof color === 'string' && colors[color as ForegroundColor] != null;
}

export function isBackgroundColor(color: unknown): color is BackgroundColor {
  return (
    typeof color === 'string' &&
    color.startsWith('bg') &&
    /A-Z/.test(color[2]) &&
    isForegroundColor(color[2].toLowerCase() + color.slice(3))
  );
}

export function isColor(color: unknown): color is Color {
  return isForegroundColor(color) || isBackgroundColor(color);
}

export function getForegroundColor(color: Color): ForegroundColor;
export function getForegroundColor(color: unknown): ForegroundColor | undefined;
export function getForegroundColor(
  color: unknown
): ForegroundColor | undefined {
  if (!isColor(color)) return undefined;
  if (isForegroundColor(color)) return color;
  if (isBackgroundColor(color)) {
    return (color[2].toLowerCase() + color.slice(3)) as ForegroundColor;
  }
  return undefined;
}

export function isStyle(style: unknown): style is Style {
  return typeof style === 'string' && styles.includes(style as Style);
}

export function createStyle(style: AnyStyle): Record<string, string> {
  if (isForegroundColor(style)) {
    return { color: colors[style] };
  }
  if (isBackgroundColor(style)) {
    return { 'background-color': colors[getForegroundColor(style)] };
  }
  switch (style) {
    case 'bold':
      return { 'font-weight': 'bold' };
    case 'italic':
      return { 'font-style': 'italic' };
    case 'underline':
      return { 'text-decoration': 'underline' };
    case 'strikethrough':
      return { 'text-decoration': 'line-through' };
    case 'reset':
    default:
      return {
        color: 'inherit',
        'background-color': 'inherit',
        'font-weight': 'inherit',
        'font-style': 'inherit',
        'text-decoration': 'inherit',
      };
  }
}

function toCssString(rec: Record<string, string>) {
  let cssStr = '';
  const properties = Object.keys(rec);
  for (const property of properties) {
    cssStr += `${property}: ${rec[property]};`;
  }
  return cssStr;
}

export function applyStyles(
  message: string,
  stylesArray: AnyStyle[] | undefined
): [string, string[]];
export function applyStyles(
  message: string | undefined,
  stylesArray: AnyStyle[] | undefined
): [string | undefined, string[]];
export function applyStyles(
  message: string | undefined,
  stylesArray: AnyStyle[] | undefined
): [string | undefined, string[]] {
  if (!message || stylesArray == null || stylesArray.length === 0) {
    return [message, []];
  }

  const css: Record<string, string> = {};

  for (const styleStr of stylesArray) {
    const style = createStyle(styleStr);
    const properties = Object.keys(style);
    for (const property of properties) {
      const value = style[property];
      if (
        css[property] &&
        property === 'text-decoration' &&
        value !== 'inherit' &&
        css[property] !== 'inherit'
      ) {
        css[property] = `${css[property]} ${value}`;
      } else {
        css[property] = value;
      }
    }
  }

  return [
    `%c${message}%c`,
    [toCssString(css), toCssString(createStyle('reset'))],
  ];
}

import { FormatCode } from './types';

export const FORMAT_DESCRIPTIONS: Record<FormatCode, string> = {
  [FormatCode.DATE]: 'Current Date (DD-MM-YYYY)',
  [FormatCode.TIME_HM]: 'Current Time (HH:MM)',
  [FormatCode.TIME_HMS]: 'Current Time (HH:MM:SS)',
  [FormatCode.LAST_10]: 'Keep Last 10 Digits',
  [FormatCode.ADD_91]: 'Prefix +91',
  [FormatCode.UPPER]: 'Uppercase',
  [FormatCode.LOWER]: 'Lowercase',
  [FormatCode.TITLE]: 'Title Case',
  [FormatCode.INTEGER]: 'To Integer',
  [FormatCode.TRIM_DASH]: 'Remove Dashes (-)',
  [FormatCode.TRIM_UNDERSCORE]: 'Remove Underscores (_)',
  [FormatCode.TRIM_DOT]: 'Remove Dots (.)',
  [FormatCode.DICT_LOOKUP]: 'Dictionary Lookup',
  [FormatCode.DICT_DEFAULT]: 'Dict Lookup w/ Default',
};

export const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

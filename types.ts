export type RowData = Record<string, any>;

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  data: RowData[];
  columns: string[];
}

export enum FormatCode {
  DATE = 'a',
  TIME_HM = 'b',
  TIME_HMS = 'c',
  LAST_10 = 'd',
  ADD_91 = 'e',
  UPPER = 'f',
  LOWER = 'g',
  TITLE = 'h',
  INTEGER = 'i',
  TRIM_DASH = 'j',
  TRIM_UNDERSCORE = 'u',
  TRIM_DOT = 'x',
  DICT_LOOKUP = 'k',
  DICT_DEFAULT = 'q',
}

export interface DictionaryItem {
  key: string;
  value: string;
}

export interface ColumnRule {
  id: string;
  outputName: string;
  sourceColumns: string[]; // Can be multiple for concatenation
  formatCodes: FormatCode[];
  dictionary: DictionaryItem[];
  defaultValue?: string; // For 'q' code
  alignment: 'left' | 'center' | 'right';
}

export interface Template {
  name: string;
  rules: ColumnRule[];
  uniqueColumns: string[]; // Output column names to check for uniqueness
  removeBlanks: boolean;
}

export interface ProcessingOptions {
  uniqueColumns: string[]; // IDs of rules
  removeBlanks: boolean;
}

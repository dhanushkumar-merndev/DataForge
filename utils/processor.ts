import { ColumnRule, FormatCode, RowData } from '../types';

const formatDate = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

const formatTime = (date: Date, includeSeconds: boolean): string => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  if (!includeSeconds) return `${h}:${m}`;
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const applySingleFormat = (val: any, code: FormatCode, rule: ColumnRule): any => {
  const strVal = val === null || val === undefined ? '' : String(val);

  switch (code) {
    case FormatCode.DATE:
      return formatDate(new Date());
    case FormatCode.TIME_HM:
      return formatTime(new Date(), false);
    case FormatCode.TIME_HMS:
      return formatTime(new Date(), true);
    case FormatCode.LAST_10: {
      const digits = strVal.replace(/\D/g, '');
      return digits.length >= 10 ? digits.slice(-10) : '';
    }
    case FormatCode.ADD_91:
      return strVal ? '+91' + strVal : '';
    case FormatCode.UPPER:
      return strVal.toUpperCase();
    case FormatCode.LOWER:
      return strVal.toLowerCase();
    case FormatCode.TITLE:
      return strVal.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    case FormatCode.INTEGER: {
      const digits = strVal.replace(/\D/g, '');
      return digits ? parseInt(digits, 10) : '';
    }
    case FormatCode.TRIM_DASH:
      return strVal.replace(/-/g, '');
    case FormatCode.TRIM_UNDERSCORE:
      return strVal.replace(/_/g, '');
    case FormatCode.TRIM_DOT:
      return strVal.replace(/\./g, '');
    case FormatCode.DICT_LOOKUP:
    case FormatCode.DICT_DEFAULT: {
      const lowerVal = strVal.toLowerCase().trim();
      // Find match
      const match = rule.dictionary.find(d => lowerVal.includes(d.key.toLowerCase()));
      if (match) return match.value;
      if (code === FormatCode.DICT_DEFAULT && rule.defaultValue) return rule.defaultValue;
      return code === FormatCode.DICT_DEFAULT ? (rule.defaultValue || '') : ''; 
    }
    default:
      return val;
  }
};

export const processRow = (sourceRow: RowData, rules: ColumnRule[]): RowData => {
  const newRow: RowData = {};

  rules.forEach((rule) => {
    let rawValue = '';

    // Handle Source Columns (Single or Concatenation)
    if (rule.sourceColumns.length === 0) {
      rawValue = ''; // BLANK/EMPTY logic from script (mapping '0')
    } else if (rule.sourceColumns.length === 1) {
      rawValue = sourceRow[rule.sourceColumns[0]];
    } else {
      // Multiple columns: join unique non-empty values
      const values = rule.sourceColumns
        .map((col) => sourceRow[col])
        .filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
      // Python script uses dict.fromkeys to unique-ify, then joins with space
      const uniqueValues = Array.from(new Set(values.map(v => String(v).trim())));
      rawValue = uniqueValues.join(' ');
    }

    // Apply Formats sequentially
    let processedValue = rawValue;
    
    // Check if we have Date/Time codes which ignore input value usually
    const isDateTime = rule.formatCodes.some(c => 
        [FormatCode.DATE, FormatCode.TIME_HM, FormatCode.TIME_HMS].includes(c)
    );

    // If it's a date/time code, we might not care about source, but let's apply sequentially
    // The python script applies formats in order.
    rule.formatCodes.forEach((code) => {
        processedValue = applySingleFormat(processedValue, code, rule);
    });

    newRow[rule.outputName] = processedValue;
  });

  return newRow;
};

export const processDataset = (
  data: RowData[],
  rules: ColumnRule[],
  uniqueColumnNames: string[],
  removeBlanks: boolean
): { cleanData: RowData[]; duplicates: RowData[]; blanks: RowData[] } => {
  
  // 1. Map Data
  let processedData = data.map((row) => processRow(row, rules));

  const blanks: RowData[] = [];
  const duplicates: RowData[] = [];
  const cleanData: RowData[] = [];
  const seenKeys = new Set<string>();

  // 2. Filter & Dedupe
  for (const row of processedData) {
    let isBlank = false;
    let isDuplicate = false;

    // Check Blank (if enabled)
    // "Blank cells in selected columns" logic from script
    if (removeBlanks && uniqueColumnNames.length > 0) {
        // If ANY of the unique columns are blank, it counts as a blank row in the script logic provided
        const hasBlankCell = uniqueColumnNames.some(col => {
            const val = row[col];
            return val === null || val === undefined || String(val).trim() === '';
        });
        if (hasBlankCell) {
            isBlank = true;
        }
    }

    if (isBlank) {
      blanks.push(row);
      continue;
    }

    // Check Unique
    if (uniqueColumnNames.length > 0) {
      // Create a composite key based on selected columns
      const key = uniqueColumnNames.map((col) => String(row[col]).trim()).join('|');
      if (seenKeys.has(key)) {
        isDuplicate = true;
      } else {
        seenKeys.add(key);
      }
    }

    if (isDuplicate) {
      duplicates.push(row);
    } else {
      cleanData.push(row);
    }
  }

  return { cleanData, duplicates, blanks };
};

import React, { useState } from 'react';
import { ColumnRule, FormatCode } from '../types';
import { FORMAT_DESCRIPTIONS, ALIGNMENT_OPTIONS } from '../constants';
import { Button, Input, DialogOverlay, Label, Badge } from './ui';
import { Plus, Trash2, ArrowRight, Check } from 'lucide-react';

interface RuleEditorProps {
  rule: ColumnRule;
  allSourceColumns: string[];
  onSave: (rule: ColumnRule) => void;
  onCancel: () => void;
}

export const RuleEditor: React.FC<RuleEditorProps> = ({ rule, allSourceColumns, onSave, onCancel }) => {
  const [editedRule, setEditedRule] = useState<ColumnRule>(JSON.parse(JSON.stringify(rule)));
  const [dictKey, setDictKey] = useState('');
  const [dictVal, setDictVal] = useState('');

  const toggleSourceCol = (col: string) => {
    // Single Select Logic:
    // If the column is already selected, deselect it.
    // Otherwise, select it (and replace any existing selection).
    if (editedRule.sourceColumns.includes(col)) {
        setEditedRule({ ...editedRule, sourceColumns: [] });
    } else {
        setEditedRule({ ...editedRule, sourceColumns: [col] });
    }
  };

  const toggleFormat = (code: FormatCode) => {
    const exists = editedRule.formatCodes.includes(code);
    if (exists) {
        setEditedRule({ ...editedRule, formatCodes: editedRule.formatCodes.filter(c => c !== code) });
    } else {
        setEditedRule({ ...editedRule, formatCodes: [...editedRule.formatCodes, code] });
    }
  };

  const addDictItem = () => {
    if (dictKey && dictVal) {
        setEditedRule({
            ...editedRule,
            dictionary: [...editedRule.dictionary, { key: dictKey, value: dictVal }]
        });
        setDictKey('');
        setDictVal('');
    }
  };

  const removeDictItem = (idx: number) => {
      const newDict = [...editedRule.dictionary];
      newDict.splice(idx, 1);
      setEditedRule({ ...editedRule, dictionary: newDict });
  };

  return (
    <DialogOverlay open={true} onOpenChange={() => onCancel()}>
        <div className="flex flex-col h-full overflow-hidden">
            <div className="mb-6">
                <h2 className="text-xl font-bold leading-none tracking-tight">Edit Column: {editedRule.outputName}</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure data sources and transformations.</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-8 pb-4">
                
                {/* 1. Source Columns */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label className="uppercase text-xs text-muted-foreground tracking-widest">1. Source Column (Select One)</Label>
                        <span className="text-xs text-muted-foreground">Single Select</span>
                    </div>
                    <div className="border rounded-md p-4 bg-muted/20">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {allSourceColumns.map(col => {
                                const isSelected = editedRule.sourceColumns.includes(col);
                                return (
                                    <div 
                                        key={col} 
                                        onClick={() => toggleSourceCol(col)}
                                        className={`
                                            cursor-pointer text-sm px-3 py-2 rounded-md border transition-all select-none relative
                                            ${isSelected 
                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                                                : 'bg-background hover:bg-muted text-foreground border-input'}
                                        `}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <span className="truncate" title={col}>{col}</span>
                                            {isSelected && <Check className="w-3 h-3 ml-auto shrink-0" />}
                                        </div>
                                    </div>
                                )
                            })}
                            {allSourceColumns.length === 0 && <span className="text-destructive text-sm col-span-full">No columns found in uploaded files.</span>}
                        </div>
                        {editedRule.sourceColumns.length === 0 && (
                            <p className="text-xs text-amber-600 mt-3 font-medium flex items-center">
                                Warning: No source selected. Column will be empty.
                            </p>
                        )}
                    </div>
                </div>

                {/* 2. Format Codes */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label className="uppercase text-xs text-muted-foreground tracking-widest">2. Transformations (Multi-select)</Label>
                        <span className="text-xs text-muted-foreground">Processing Order: Top to Bottom</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(FORMAT_DESCRIPTIONS).map(([code, desc]) => {
                            const isSelected = editedRule.formatCodes.includes(code as FormatCode);
                            return (
                                <label 
                                    key={code} 
                                    className={`
                                        flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition-all
                                        ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50 border-input'}
                                    `}
                                >
                                    <input 
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleFormat(code as FormatCode)}
                                        className="rounded border-input text-primary focus:ring-primary h-4 w-4 accent-primary"
                                    />
                                    <span className="text-sm font-medium">{desc}</span>
                                </label>
                            )
                        })}
                    </div>
                </div>

                {/* 3. Alignment */}
                <div className="space-y-3">
                    <Label className="uppercase text-xs text-muted-foreground tracking-widest">3. Output Alignment</Label>
                    <div className="flex space-x-4 p-3 border rounded-md bg-muted/20">
                        {ALIGNMENT_OPTIONS.map(opt => (
                            <label key={opt.value} className="flex items-center space-x-2 cursor-pointer">
                                 <input 
                                    type="radio"
                                    name="alignment"
                                    checked={editedRule.alignment === opt.value}
                                    onChange={() => setEditedRule({...editedRule, alignment: opt.value as any})}
                                    className="text-primary focus:ring-primary accent-primary"
                                />
                                <span className="text-sm">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* 4. Dictionary */}
                {(editedRule.formatCodes.includes(FormatCode.DICT_LOOKUP) || editedRule.formatCodes.includes(FormatCode.DICT_DEFAULT)) && (
                    <div className="space-y-3 pt-2">
                         <Label className="uppercase text-xs text-muted-foreground tracking-widest">Dictionary Mapping</Label>
                         <div className="border rounded-md p-4 bg-amber-50/50 border-amber-200/50 space-y-4">
                            
                            {editedRule.formatCodes.includes(FormatCode.DICT_DEFAULT) && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Default Value (Fallback)</Label>
                                    <Input 
                                        value={editedRule.defaultValue || ''}
                                        onChange={(e) => setEditedRule({...editedRule, defaultValue: e.target.value})}
                                        placeholder="e.g. N/A"
                                        className="bg-white"
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label className="text-xs">Add Mapping Rule</Label>
                                <div className="flex space-x-2">
                                    <Input 
                                        placeholder="If contains..." 
                                        value={dictKey}
                                        onChange={e => setDictKey(e.target.value)}
                                        className="bg-white"
                                    />
                                    <ArrowRight className="text-muted-foreground self-center shrink-0" size={16}/>
                                    <Input 
                                        placeholder="Replace with..." 
                                        value={dictVal}
                                        onChange={e => setDictVal(e.target.value)}
                                        className="bg-white"
                                    />
                                    <Button size="icon" onClick={addDictItem} disabled={!dictKey || !dictVal} className="shrink-0">
                                        <Plus size={16}/>
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-white border rounded-md overflow-hidden">
                                <div className="max-h-[150px] overflow-y-auto">
                                    {editedRule.dictionary.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-muted-foreground">No dictionary rules added.</div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted text-xs text-muted-foreground">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-medium">Input</th>
                                                    <th className="px-3 py-2 text-left font-medium">Output</th>
                                                    <th className="w-8"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {editedRule.dictionary.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-3 py-2">{item.key}</td>
                                                        <td className="px-3 py-2 font-medium">{item.value}</td>
                                                        <td className="px-3 py-2 text-right">
                                                            <button onClick={() => removeDictItem(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                                                                <Trash2 size={14}/>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4 mt-auto border-t">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={() => onSave(editedRule)}>Save Changes</Button>
            </div>
        </div>
    </DialogOverlay>
  );
};
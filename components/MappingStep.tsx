import React, { useState } from 'react';
import { ColumnRule, Template } from '../types';
import { Button, Input, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui';
import { RuleEditor } from './RuleEditor';
import { Plus, Edit2, Trash2, Save, Upload, Settings, FileJson, X } from 'lucide-react';

interface MappingStepProps {
  rules: ColumnRule[];
  setRules: React.Dispatch<React.SetStateAction<ColumnRule[]>>;
  uniqueColumns: string[]; 
  setUniqueColumns: React.Dispatch<React.SetStateAction<string[]>>;
  removeBlanks: boolean;
  setRemoveBlanks: React.Dispatch<React.SetStateAction<boolean>>;
  allSourceColumns: string[];
}

export const MappingStep: React.FC<MappingStepProps> = ({
  rules, setRules, uniqueColumns, setUniqueColumns, removeBlanks, setRemoveBlanks, allSourceColumns
}) => {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const addColumn = () => {
    const newRule: ColumnRule = {
      id: Math.random().toString(36).substr(2, 9),
      outputName: `Column ${rules.length + 1}`,
      sourceColumns: [],
      formatCodes: [],
      dictionary: [],
      alignment: 'center'
    };
    setRules([...rules, newRule]);
    setEditingRuleId(newRule.id);
  };

  const updateRule = (updated: ColumnRule) => {
    setRules(rules.map(r => r.id === updated.id ? updated : r));
    setEditingRuleId(null);
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    const rule = rules.find(r => r.id === id);
    if (rule) {
        setUniqueColumns(uniqueColumns.filter(name => name !== rule.outputName));
    }
  };

  const toggleUnique = (name: string) => {
    if (uniqueColumns.includes(name)) {
        setUniqueColumns(uniqueColumns.filter(n => n !== name));
    } else {
        setUniqueColumns([...uniqueColumns, name]);
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
        alert("Please enter a template name");
        return;
    }
    const template: Template = { name: templateName, rules, uniqueColumns, removeBlanks };
    try {
        const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${templateName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowSaveModal(false);
        setTemplateName('');
    } catch (e) {
        alert("Failed to save template.");
    }
  };

  const loadTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const t = JSON.parse(evt.target?.result as string) as Template;
            if (t.rules && Array.isArray(t.rules)) {
                const newRules = t.rules.map(r => ({...r, id: Math.random().toString(36).substr(2, 9)}));
                setRules(newRules);
                setUniqueColumns(t.uniqueColumns || []);
                setRemoveBlanks(!!t.removeBlanks);
            } else {
                alert("Invalid template format.");
            }
        } catch (err) {
            alert("Invalid template file.");
        }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h3 className="text-lg font-semibold tracking-tight">Output Schema</h3>
            <p className="text-sm text-muted-foreground">Define the structure of your processed file.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="relative cursor-pointer">
                <Upload className="w-4 h-4 mr-2"/> Load Template
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".json" onChange={loadTemplate}/>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSaveModal(true)}>
                <Save className="w-4 h-4 mr-2"/> Save Template
            </Button>
            <Button size="sm" onClick={addColumn}>
                <Plus className="w-4 h-4 mr-2"/> Add Column
            </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead className="w-[250px]">Output Column Name</TableHead>
                        <TableHead className="min-w-[200px]">Source Columns</TableHead>
                        <TableHead>Transforms</TableHead>
                        <TableHead className="text-center w-[100px]">Unique Key</TableHead>
                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rules.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                No columns defined. Click "Add Column" to start.
                            </TableCell>
                        </TableRow>
                    )}
                    {rules.map((rule, idx) => (
                        <TableRow key={rule.id}>
                            <TableCell className="text-muted-foreground font-medium">{idx + 1}</TableCell>
                            <TableCell>
                                <Input 
                                    value={rule.outputName}
                                    onChange={(e) => setRules(rules.map(r => r.id === rule.id ? {...r, outputName: e.target.value} : r))}
                                    className="h-8"
                                />
                            </TableCell>
                            <TableCell className="text-sm">
                                {rule.sourceColumns.length === 0 ? (
                                    <span className="text-muted-foreground italic">Empty (None)</span>
                                ) : (
                                    <div className="flex flex-wrap gap-1">
                                        {rule.sourceColumns.map(col => (
                                            <Badge key={col} variant="secondary" className="font-normal">{col}</Badge>
                                        ))}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {rule.formatCodes.length === 0 && <span className="text-muted-foreground">-</span>}
                                    {rule.formatCodes.map(c => (
                                        <Badge key={c} variant="outline" className="text-[10px] uppercase">{c}</Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <input 
                                    type="checkbox"
                                    checked={uniqueColumns.includes(rule.outputName)}
                                    onChange={() => toggleUnique(rule.outputName)}
                                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                                />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingRuleId(rule.id)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                                        <Edit2 className="w-4 h-4"/>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                        <Trash2 className="w-4 h-4"/>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </Card>

      <div className="bg-muted/30 p-4 rounded-lg border flex items-start gap-3">
        <Settings className="w-5 h-5 text-muted-foreground mt-0.5" />
        <div>
            <h4 className="text-sm font-medium text-foreground">Advanced Deduplication Settings</h4>
            <div className="flex items-center space-x-2 mt-2">
                <input 
                    type="checkbox" 
                    id="removeBlanks"
                    checked={removeBlanks}
                    onChange={(e) => setRemoveBlanks(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="removeBlanks" className="text-sm text-muted-foreground cursor-pointer select-none">
                    Remove rows where <strong>all</strong> selected Unique Keys are empty?
                </label>
            </div>
        </div>
      </div>

      {editingRuleId && (
        <RuleEditor 
            rule={rules.find(r => r.id === editingRuleId)!}
            allSourceColumns={allSourceColumns}
            onSave={updateRule}
            onCancel={() => setEditingRuleId(null)}
        />
      )}

      {/* Save Template Dialog */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
             <Card className="w-full max-w-sm animate-in fade-in-0 zoom-in-95">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle>Save Template</CardTitle>
                        <Button variant="ghost" size="icon" className="h-6 w-6 -mt-2 -mr-2" onClick={() => setShowSaveModal(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <CardDescription>Save your current rules to reuse later.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Template Name</label>
                        <Input 
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="e.g. Monthly Sales Report"
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowSaveModal(false)}>Cancel</Button>
                        <Button onClick={handleSaveTemplate}>Save Template</Button>
                    </div>
                </CardContent>
             </Card>
        </div>
      )}
    </div>
  );
};
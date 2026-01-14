import React, { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { MappingStep } from './components/MappingStep';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Input } from './components/ui';
import { UploadedFile, ColumnRule, RowData } from './types';
import { processDataset } from './utils/processor';
import { Layers, ArrowRight, Download, CheckCircle, RotateCcw, ChevronRight } from 'lucide-react';

function App() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [rules, setRules] = useState<ColumnRule[]>([]);
  const [uniqueColumns, setUniqueColumns] = useState<string[]>([]);
  const [removeBlanks, setRemoveBlanks] = useState(false);
  const [processingResult, setProcessingResult] = useState<{
      cleanData: RowData[], 
      duplicates: RowData[], 
      blanks: RowData[]
  } | null>(null);

  // Export Filename States
  const [cleanFilename, setCleanFilename] = useState('processed_output');
  const [duplicatesFilename, setDuplicatesFilename] = useState('duplicates');
  const [blanksFilename, setBlanksFilename] = useState('blank_rows');

  const allSourceColumns = useMemo(() => {
    const cols = new Set<string>();
    files.forEach(f => f.columns.forEach(c => cols.add(c)));
    return Array.from(cols).sort();
  }, [files]);

  const rawData = useMemo(() => {
    return files.flatMap(f => f.data);
  }, [files]);

  const handleProcess = () => {
    if (rules.length === 0) {
        alert("Please add at least one output column.");
        return;
    }
    const result = processDataset(rawData, rules, uniqueColumns, removeBlanks);
    setProcessingResult(result);
    setStep(3);
  };

  const handleExport = (type: 'clean' | 'duplicates' | 'blanks') => {
    const XLSX = (window as any).XLSX;
    if (!processingResult || !XLSX) {
        alert("Export failed: XLSX library not available. Please refresh the page.");
        return;
    }
    
    let data: RowData[] = [];
    let filename = '';
    
    if (type === 'clean') {
        data = processingResult.cleanData;
        filename = `${cleanFilename.trim() || 'processed_output'}.xlsx`;
    } else if (type === 'duplicates') {
        data = processingResult.duplicates;
        filename = `${duplicatesFilename.trim() || 'duplicates'}.xlsx`;
    } else {
        data = processingResult.blanks;
        filename = `${blanksFilename.trim() || 'blank_rows'}.xlsx`;
    }

    if (data.length === 0) {
        alert(`No ${type} data to export.`);
        return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const headers = Object.keys(data[0] || {});
    const colWidthsMap = headers.reduce((acc, key) => {
        acc[key] = key.length; 
        return acc;
    }, {} as Record<string, number>);

    const scanLimit = Math.min(data.length, 5000);
    for (let i = 0; i < scanLimit; i++) {
        const row = data[i];
        headers.forEach(key => {
            const val = row[key];
            const len = val ? String(val).length : 0;
            if (len > colWidthsMap[key]) colWidthsMap[key] = len;
        });
    }

    ws['!cols'] = headers.map(key => ({
        wch: Math.min(colWidthsMap[key] + 5, 80)
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename);
  };

  const reset = () => {
    if(confirm("Start over? All data will be lost.")) {
        setStep(1);
        setFiles([]);
        setRules([]);
        setUniqueColumns([]);
        setProcessingResult(null);
        // Reset filenames defaults
        setCleanFilename('processed_output');
        setDuplicatesFilename('duplicates');
        setBlanksFilename('blank_rows');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Navbar */}
      <header className="border-b bg-background sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                    <Layers className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold tracking-tight">DataForge</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-2 text-sm font-medium">
                <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs mr-2 border ${step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>1</span>
                    Upload
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs mr-2 border ${step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>2</span>
                    Map
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs mr-2 border ${step >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>3</span>
                    Export
                </div>
            </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8">
        
        {step === 1 && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Import Data</h1>
                    <p className="text-muted-foreground">Upload your raw Excel or CSV files to get started.</p>
                </div>
                
                <FileUpload files={files} setFiles={setFiles} />
                
                <div className="flex justify-end pt-4">
                    <Button size="lg" disabled={files.length === 0} onClick={() => setStep(2)}>
                        Next Step <ArrowRight className="ml-2 w-4 h-4"/>
                    </Button>
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center pb-4 border-b">
                     <div>
                        <h2 className="text-2xl font-bold tracking-tight">Configure Rules</h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            Processing <span className="font-mono font-medium text-foreground">{rawData.length.toLocaleString()}</span> raw rows.
                        </p>
                    </div>
                    <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                </div>

                <MappingStep 
                    rules={rules}
                    setRules={setRules}
                    uniqueColumns={uniqueColumns}
                    setUniqueColumns={setUniqueColumns}
                    removeBlanks={removeBlanks}
                    setRemoveBlanks={setRemoveBlanks}
                    allSourceColumns={allSourceColumns}
                />

                <div className="flex justify-end pt-6 border-t mt-8">
                    <Button size="lg" onClick={handleProcess} className="shadow-lg shadow-primary/20">
                        Process Data <CheckCircle className="ml-2 w-4 h-4"/>
                    </Button>
                </div>
            </div>
        )}

        {step === 3 && processingResult && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center pb-4 border-b">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Results Ready</h2>
                        <p className="text-muted-foreground">Your data has been processed successfully.</p>
                    </div>
                    <Button variant="ghost" onClick={reset} className="text-destructive hover:bg-destructive/10">
                        <RotateCcw className="mr-2 w-4 h-4"/> Start Over
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-emerald-50/50 border-emerald-100 flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-4xl text-emerald-600">{processingResult.cleanData.length.toLocaleString()}</CardTitle>
                            <CardDescription className="text-emerald-700 font-medium">Clean Rows</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto">
                             <div className="flex items-center space-x-2 mb-3">
                                <Input 
                                    value={cleanFilename} 
                                    onChange={(e) => setCleanFilename(e.target.value)} 
                                    className="h-8 bg-white/80" 
                                    placeholder="filename"
                                />
                                <span className="text-xs text-emerald-700 font-medium">.xlsx</span>
                             </div>
                             <Button className="w-full bg-emerald-600 hover:bg-emerald-700 border-0" onClick={() => handleExport('clean')}>
                                <Download className="mr-2 w-4 h-4"/> Download Clean
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-50/50 border-amber-100 flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-4xl text-amber-600">{processingResult.duplicates.length.toLocaleString()}</CardTitle>
                            <CardDescription className="text-amber-700 font-medium">Duplicates Removed</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto">
                             <div className="flex items-center space-x-2 mb-3">
                                <Input 
                                    value={duplicatesFilename} 
                                    onChange={(e) => setDuplicatesFilename(e.target.value)} 
                                    className="h-8 bg-white/80" 
                                    placeholder="filename"
                                />
                                <span className="text-xs text-amber-700 font-medium">.xlsx</span>
                             </div>
                             <Button variant="outline" className="w-full border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900" onClick={() => handleExport('duplicates')} disabled={processingResult.duplicates.length === 0}>
                                <Download className="mr-2 w-4 h-4"/> Download Duplicates
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50/50 border-slate-200 flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-4xl text-slate-600">{processingResult.blanks.length.toLocaleString()}</CardTitle>
                            <CardDescription className="text-slate-700 font-medium">Blanks Removed</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto">
                             <div className="flex items-center space-x-2 mb-3">
                                <Input 
                                    value={blanksFilename} 
                                    onChange={(e) => setBlanksFilename(e.target.value)} 
                                    className="h-8 bg-white/80" 
                                    placeholder="filename"
                                />
                                <span className="text-xs text-slate-700 font-medium">.xlsx</span>
                             </div>
                             <Button variant="outline" className="w-full" onClick={() => handleExport('blanks')} disabled={processingResult.blanks.length === 0}>
                                <Download className="mr-2 w-4 h-4"/> Download Blanks
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Data Preview (First 10 Rows)</h3>
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {rules.map(rule => (
                                        <TableHead key={rule.id} className="whitespace-nowrap bg-muted/50 text-foreground font-semibold">{rule.outputName}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processingResult.cleanData.slice(0, 10).map((row, rIdx) => (
                                    <TableRow key={rIdx}>
                                        {rules.map(rule => (
                                            <TableCell key={rule.id} className="whitespace-nowrap text-muted-foreground">
                                                {String(row[rule.outputName] || '')}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
                
                 <div className="flex justify-start pt-4">
                     <Button variant="outline" onClick={() => setStep(2)}>
                        <ArrowRight className="mr-2 w-4 h-4 rotate-180"/> Back to Mapping
                     </Button>
                 </div>
            </div>
        )}

      </main>
    </div>
  );
}

export default App;
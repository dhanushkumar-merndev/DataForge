import React from 'react';
import { Upload, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { UploadedFile } from '../types';
import { Button, Card, CardContent } from './ui';

interface FileUploadProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
}

export const FileUpload: React.FC<FileUploadProps> = ({ files, setFiles }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const processFile = async (file: File) => {
    const XLSX = (window as any).XLSX;
    
    if (!XLSX) {
        throw new Error("XLSX library not found.");
    }

    const data = await file.arrayBuffer();
    
    let workbook;
    try {
        workbook = XLSX.read(data, { type: 'array' });
    } catch (e) {
        throw new Error("Failed to parse file.");
    }

    if (!workbook.SheetNames.length) throw new Error("File contains no sheets.");

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    if (!XLSX.utils || typeof XLSX.utils.sheet_to_json !== 'function') throw new Error("XLSX.utils error.");

    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
    const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
    const cleanedHeaders = headers.map(h => h.trim().toLowerCase());
    
    const cleanedData = jsonData.map(row => {
        const newRow: Record<string, any> = {};
        Object.keys(row).forEach((key, index) => {
             const cleanKey = key.trim().toLowerCase();
             newRow[cleanKey] = row[key];
        });
        return newRow;
    });

    return {
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      data: cleanedData,
      columns: cleanedHeaders,
    };
  };

  const handleFiles = async (fileList: File[]) => {
      setIsLoading(true);
      const newFiles: UploadedFile[] = [];
      for (const file of fileList) {
        try {
            const processed = await processFile(file);
            newFiles.push(processed);
        } catch (err) {
            console.error("Error", err);
            alert(`Failed to read ${file.name}: ${(err as Error).message}`);
        }
      }
      setFiles(prev => [...prev, ...newFiles]);
      setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const onDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) {
          handleFiles(Array.from(e.dataTransfer.files));
      }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-4">
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
            border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ease-in-out cursor-pointer group
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'}
        `}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
          {isLoading ? (
             <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          ) : (
             <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:bg-primary/20 transition-colors">
                <Upload className="w-6 h-6 text-primary" />
             </div>
          )}
          <h3 className="text-lg font-semibold text-foreground">
             {isLoading ? "Processing..." : "Upload Files"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            Drag and drop Excel or CSV files here, or click to browse.
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <Card>
            <CardContent className="p-0 divide-y">
                {files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="bg-emerald-100 p-2 rounded-md">
                                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="font-medium text-sm text-foreground">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB • {file.data.length.toLocaleString()} rows
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)} className="text-muted-foreground hover:text-destructive">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
      )}
    </div>
  );
};
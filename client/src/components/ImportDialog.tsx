import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileJson, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportResult {
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (fileData: { data: string; format: string }): Promise<ImportResult> => {
      const response = await apiRequest("POST", "/api/contacts/import", fileData);
      return await response.json();
    },
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === "/api/contacts" || 
                              (Array.isArray(query.queryKey) && query.queryKey[0] === "/api/contacts/search")
      });
      
      if (result.imported > 0) {
        toast({
          title: "Import Successful",
          description: `${result.imported} contact${result.imported > 1 ? 's' : ''} imported successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Failed to import contacts. Please check the file format.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const format = file.name.endsWith('.json') ? 'json' : 'csv';
      
      importMutation.mutate({ data: content, format });
    };
    reader.readAsText(file);
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    onOpenChange(false);
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="h-8 w-8" />;
    return file.name.endsWith('.json') ? <FileJson className="h-8 w-8" /> : <FileText className="h-8 w-8" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV or JSON file to import contacts. The file should contain contact information with headers matching the export format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="text-muted-foreground">
                {getFileIcon()}
              </div>
              
              {file ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFile(null)}
                    data-testid="button-clear-file"
                  >
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Click to select a CSV or JSON file
                  </p>
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    data-testid="input-file"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" asChild data-testid="button-select-file">
                      <span>Select File</span>
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Import Result */}
          {importResult && (
            <div className="space-y-3">
              {importResult.imported > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Successfully imported {importResult.imported} contact{importResult.imported > 1 ? 's' : ''}
                  </AlertDescription>
                </Alert>
              )}

              {importResult.failed > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to import {importResult.failed} contact{importResult.failed > 1 ? 's' : ''}
                    {importResult.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium">View errors</summary>
                        <ul className="mt-2 space-y-1 text-xs">
                          {importResult.errors.slice(0, 5).map((error, idx) => (
                            <li key={idx}>
                              Row {error.row}: {error.error}
                            </li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li>... and {importResult.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      </details>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel-import"
            >
              {importResult ? 'Close' : 'Cancel'}
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importMutation.isPending}
              data-testid="button-import"
            >
              {importMutation.isPending ? 'Importing...' : 'Import'}
            </Button>
          </div>

          {/* Format Guide */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Expected Format:</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>CSV:</strong> Name, Company, Email, Phone, Notes, Last Contact Date, Next Touch Date, Tags</p>
              <p><strong>JSON:</strong> Array of objects with properties: name, company, email, phone, notes, lastContactDate, nextTouchDate, tags</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

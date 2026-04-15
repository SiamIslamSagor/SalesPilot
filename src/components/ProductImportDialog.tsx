import { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  data?: {
    importedCount: number;
    failedCount: number;
    errors?: string[];
  };
}

export default function ProductImportDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: ProductImportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      const validExtensions = [".xlsx", ".xls"];
      const fileExtension = file.name
        .toLowerCase()
        .slice(file.name.lastIndexOf("."));

      if (
        !validTypes.includes(file.type) &&
        !validExtensions.includes(fileExtension)
      ) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload an Excel file (.xlsx or .xls)",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
        });
        return;
      }

      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = localStorage.getItem("qt_token");
      const response = await fetch(`${API_URL}/products/import`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const result: ImportResult = await response.json();

      if (result.success) {
        toast({
          title: "Import successful",
          description: result.message,
        });
        setImportResult(result);
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        toast({
          variant: "destructive",
          title: "Import failed",
          description: result.message,
        });
        setImportResult(result);
      }
    } catch (error) {
      console.error("Error importing products:", error);
      toast({
        variant: "destructive",
        title: "Import error",
        description: "Failed to import products. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Products from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx or .xls) containing product data. The
            file should include columns: productNumber, name, description,
            category, brand, purchasePrice, salesPrice, and optionally imageUrl.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!selectedFile && !importResult && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
            >
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                Excel files (.xlsx, .xls) up to 5MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {selectedFile && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileSpreadsheet className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Products
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {importResult && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg ${
                  importResult.success
                    ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  {importResult.success ? (
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">
                      {importResult.message}
                    </p>
                    {importResult.data && (
                      <div className="text-xs space-y-1">
                        <p>
                          <span className="font-medium">Imported:</span>{" "}
                          {importResult.data.importedCount}
                        </p>
                        {importResult.data.failedCount > 0 && (
                          <p>
                            <span className="font-medium">Failed:</span>{" "}
                            {importResult.data.failedCount}
                          </p>
                        )}
                        {importResult.data.errors &&
                          importResult.data.errors.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-current/20">
                              <p className="font-medium mb-1">Errors:</p>
                              <ul className="list-disc list-inside space-y-0.5">
                                {importResult.data.errors.map(
                                  (error, index) => (
                                    <li key={index}>{error}</li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleClose}
                  className="flex-1"
                  variant={importResult.success ? "default" : "outline"}
                >
                  {importResult.success ? "Done" : "Close"}
                </Button>
                {!importResult.success && (
                  <Button onClick={handleReset} variant="default">
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

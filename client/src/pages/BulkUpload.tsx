import { ArrowLeft, Upload, FileText, Download, CheckCircle, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface UploadStatus {
  fileName: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  message?: string;
}

export const BulkUpload = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const [uploadFiles, setUploadFiles] = useState<UploadStatus[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles: UploadStatus[] = Array.from(files).map(file => ({
      fileName: file.name,
      status: 'pending',
      progress: 0
    }));
    
    setUploadFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startUpload = () => {
    setIsUploading(true);
    
    uploadFiles.forEach((file, index) => {
      if (file.status === 'pending') {
        // Simulate upload progress
        setUploadFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, status: 'uploading' } : f
        ));
        
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 30;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setUploadFiles(prev => prev.map((f, i) => 
              i === index ? { 
                ...f, 
                status: Math.random() > 0.8 ? 'error' : 'success', 
                progress: 100,
                message: Math.random() > 0.8 ? 'Invalid file format' : 'Upload successful'
              } : f
            ));
          } else {
            setUploadFiles(prev => prev.map((f, i) => 
              i === index ? { ...f, progress } : f
            ));
          }
        }, 200);
      }
    });
    
    setTimeout(() => setIsUploading(false), 3000);
  };

  const downloadTemplate = () => {
    // In a real app, this would download a CSV/Excel template
    console.log("Downloading template...");
  };

  return (
    <div className="min-h-screen bg-[#161611] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#161611]/90 backdrop-blur-sm border-b border-[#2a2920]">
        <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-[#2a2920]">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Bulk Upload Cocktails
            </h1>
          </div>
          <Button 
            onClick={startUpload}
            disabled={uploadFiles.length === 0 || isUploading}
            className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611] disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Start Upload'}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Instructions */}
        <Card className="bg-[#2a2920] border-[#4a4735]">
          <CardHeader>
            <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica] flex items-center gap-2">
              <FileText className="w-5 h-5" />
              How to Bulk Upload Cocktails
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#f2c40c] text-[#161611] text-sm font-bold flex items-center justify-center">1</div>
                  <h3 className="font-medium text-white">Download Template</h3>
                </div>
                <p className="text-[#bab59b] text-sm">Download our CSV template with the required columns and format.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#f2c40c] text-[#161611] text-sm font-bold flex items-center justify-center">2</div>
                  <h3 className="font-medium text-white">Fill Your Data</h3>
                </div>
                <p className="text-[#bab59b] text-sm">Add your cocktail recipes following the template format.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#f2c40c] text-[#161611] text-sm font-bold flex items-center justify-center">3</div>
                  <h3 className="font-medium text-white">Upload Files</h3>
                </div>
                <p className="text-[#bab59b] text-sm">Drag and drop or select your CSV files to upload.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 pt-4 border-t border-[#4a4735]">
              <Button 
                onClick={downloadTemplate}
                variant="outline" 
                className="bg-[#383529] border-[#f2c40c] text-[#f2c40c] hover:bg-[#f2c40c] hover:text-[#161611] font-medium"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
              <div className="text-sm text-[#bab59b]">
                Supported formats: CSV, Excel (.xlsx)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card className="bg-[#2a2920] border-[#4a4735]">
          <CardHeader>
            <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Upload Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? 'border-[#f2c40c] bg-[#f2c40c]/10' 
                  : 'border-[#544f3a] hover:border-[#f2c40c]/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="w-12 h-12 text-[#bab59b] mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Drag and drop your files here</h3>
              <p className="text-[#bab59b] mb-4">or</p>
              <input
                type="file"
                multiple
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <Button 
                onClick={() => document.getElementById('file-upload')?.click()}
                variant="outline"
                className="bg-[#383529] border-[#f2c40c] text-[#f2c40c] hover:bg-[#f2c40c] hover:text-[#161611] font-medium"
              >
                Choose Files
              </Button>
              <p className="text-[#bab59b] text-sm mt-2">Maximum file size: 10MB</p>
            </div>
          </CardContent>
        </Card>

        {/* Upload Progress */}
        {uploadFiles.length > 0 && (
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardHeader>
              <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Upload Progress ({uploadFiles.length} files)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {uploadFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-[#26261c] rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white text-sm font-medium">{file.fileName}</span>
                      <Badge 
                        className={`
                          ${file.status === 'success' ? 'bg-green-600' : ''}
                          ${file.status === 'error' ? 'bg-red-600' : ''}
                          ${file.status === 'uploading' ? 'bg-blue-600' : ''}
                          ${file.status === 'pending' ? 'bg-[#544f3a]' : ''}
                        `}
                      >
                        {file.status}
                      </Badge>
                    </div>
                    
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="h-2" />
                    )}
                    
                    {file.message && (
                      <p className={`text-sm mt-1 ${
                        file.status === 'error' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {file.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.status === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                    {file.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                    
                    {file.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-[#bab59b] hover:text-white"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Upload Results Summary */}
        {uploadFiles.some(f => f.status === 'success' || f.status === 'error') && (
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardHeader>
              <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Upload Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[#26261c] rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {uploadFiles.filter(f => f.status === 'success').length}
                  </div>
                  <div className="text-[#bab59b] text-sm">Successful</div>
                </div>
                <div className="text-center p-4 bg-[#26261c] rounded-lg">
                  <div className="text-2xl font-bold text-red-400">
                    {uploadFiles.filter(f => f.status === 'error').length}
                  </div>
                  <div className="text-[#bab59b] text-sm">Failed</div>
                </div>
                <div className="text-center p-4 bg-[#26261c] rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {uploadFiles.length}
                  </div>
                  <div className="text-[#bab59b] text-sm">Total Files</div>
                </div>
              </div>
              
              {uploadFiles.filter(f => f.status === 'success').length > 0 && (
                <Alert className="bg-green-600/20 border-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-200">
                    {uploadFiles.filter(f => f.status === 'success').length} cocktail(s) were successfully uploaded to your collection.
                  </AlertDescription>
                </Alert>
              )}
              
              {uploadFiles.filter(f => f.status === 'error').length > 0 && (
                <Alert className="bg-red-600/20 border-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">
                    {uploadFiles.filter(f => f.status === 'error').length} file(s) failed to upload. Please check the format and try again.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
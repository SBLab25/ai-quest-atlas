import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, XCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export const MobileUploadTest = () => {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      addTestResult(`File selected: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }
  };

  const handleTestClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
      addTestResult('File input clicked');
    }
  };

  const runMobileTests = () => {
    addTestResult('=== Mobile Upload Test Started ===');
    addTestResult(`Device detected as mobile: ${isMobile}`);
    addTestResult(`User Agent: ${navigator.userAgent}`);
    addTestResult(`Touch support: ${'ontouchstart' in window}`);
    addTestResult(`File API support: ${!!window.File && !!window.FileReader}`);
    addTestResult(`Camera support: ${!!navigator.mediaDevices}`);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Mobile Upload Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button onClick={runMobileTests} variant="outline" className="w-full">
            Run Mobile Tests
          </Button>
          
          <Button onClick={handleTestClick} className="w-full">
            Test File Upload
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            capture={isMobile ? "environment" : undefined}
          />
        </div>

        {selectedFile && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">File Selected Successfully!</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">Test Results:</h4>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {testResults.length === 0 ? (
              <p className="text-sm text-gray-500">No tests run yet</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Mobile Detection:</strong> {isMobile ? 'Yes' : 'No'}</p>
          <p><strong>Touch Support:</strong> {'ontouchstart' in window ? 'Yes' : 'No'}</p>
          <p><strong>File API:</strong> {!!window.File ? 'Yes' : 'No'}</p>
          <p><strong>Camera API:</strong> {!!navigator.mediaDevices ? 'Yes' : 'No'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

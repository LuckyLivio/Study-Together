'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CourseImportProps {
  onImportSuccess: () => void;
  onClose: () => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
  errors?: string[];
}

export function CourseImport({ onImportSuccess, onClose }: CourseImportProps) {
  const [importMethod, setImportMethod] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [textData, setTextData] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileType === 'csv' || fileType === 'xlsx' || fileType === 'xls') {
        setFile(selectedFile);
        setResult(null);
      } else {
        alert('请选择 CSV 或 Excel 文件');
      }
    }
  };

  // 下载模板
  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/courses/import');
      if (!response.ok) {
        throw new Error('下载模板失败');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'course_import_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('下载模板失败:', error);
      alert('下载模板失败，请重试');
    }
  };

  // 执行导入
  const handleImport = async () => {
    if (importMethod === 'file' && !file) {
      alert('请选择要导入的文件');
      return;
    }
    
    if (importMethod === 'text' && !textData.trim()) {
      alert('请输入要导入的课程数据');
      return;
    }

    try {
      setImporting(true);
      setResult(null);
      
      let response: Response;
      
      if (importMethod === 'file') {
        const formData = new FormData();
        formData.append('file', file!);
        formData.append('replaceExisting', replaceExisting.toString());
        
        response = await fetch('/api/courses/import', {
          method: 'POST',
          body: formData
        });
      } else {
        response = await fetch('/api/courses/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            textData: textData,
            replaceExisting: replaceExisting
          })
        });
      }
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          importedCount: data.importedCount
        });
        
        // 清空表单
        setFile(null);
        setTextData('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // 通知父组件刷新数据
        onImportSuccess();
      } else {
        setResult({
          success: false,
          message: data.error || '导入失败',
          errors: data.errors
        });
      }
    } catch (error) {
      console.error('导入失败:', error);
      setResult({
        success: false,
        message: '导入失败，请检查网络连接并重试'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            导入课程数据
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 导入方式选择 */}
        <div>
          <Label className="text-base font-medium">导入方式</Label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="importMethod"
                value="file"
                checked={importMethod === 'file'}
                onChange={(e) => setImportMethod(e.target.value as 'file')}
                className="text-blue-600"
              />
              <span>文件导入 (CSV/Excel)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="importMethod"
                value="text"
                checked={importMethod === 'text'}
                onChange={(e) => setImportMethod(e.target.value as 'text')}
                className="text-blue-600"
              />
              <span>文本导入</span>
            </label>
          </div>
        </div>

        {/* 文件导入 */}
        {importMethod === 'file' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">选择文件</Label>
              <div className="mt-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="cursor-pointer"
                />
                {file && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>已选择: {file.name}</span>
                    <Badge variant="outline">
                      {(file.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载模板
              </Button>
              <span className="text-sm text-gray-500">
                不知道格式？下载模板文件参考
              </span>
            </div>
          </div>
        )}

        {/* 文本导入 */}
        {importMethod === 'text' && (
          <div>
            <Label htmlFor="text-data">课程数据</Label>
            <Textarea
              id="text-data"
              placeholder="请输入课程数据，格式：课程名称,课程代码,教师,地点,学分,颜色,星期,开始时间,结束时间,周次&#10;例如：高等数学,MATH101,张教授,A101,4,#3B82F6,1,08:00,09:40,1-16"
              value={textData}
              onChange={(e) => setTextData(e.target.value)}
              rows={8}
              className="mt-2"
            />
            <div className="mt-2 text-sm text-gray-500">
              <p>格式说明：</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>每行一门课程，字段用逗号分隔</li>
                <li>字段顺序：课程名称,课程代码,教师,地点,学分,颜色,星期,开始时间,结束时间,周次</li>
                <li>星期：1-7 (周一到周日)</li>
                <li>时间格式：HH:MM (如 08:00)</li>
                <li>周次格式：1-16 或 1,3,5-8</li>
              </ul>
            </div>
          </div>
        )}

        {/* 导入选项 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">导入选项</Label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="text-blue-600"
            />
            <span className="text-sm">替换现有课程 (清空当前所有课程后导入)</span>
          </label>
          {replaceExisting && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                警告：此操作将删除您当前的所有课程数据，请谨慎操作！
              </span>
            </div>
          )}
        </div>

        {/* 导入结果 */}
        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? '导入成功' : '导入失败'}
              </span>
            </div>
            <p className={`text-sm ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.message}
            </p>
            {result.importedCount !== undefined && (
              <p className="text-sm text-green-700 mt-1">
                成功导入 {result.importedCount} 门课程
              </p>
            )}
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-red-700 font-medium">错误详情：</p>
                <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || (importMethod === 'file' && !file) || (importMethod === 'text' && !textData.trim())}
          >
            {importing ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-pulse" />
                导入中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                开始导入
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
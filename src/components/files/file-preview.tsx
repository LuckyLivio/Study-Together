'use client';

import { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface FilePreviewProps {
  file: {
    id: string;
    displayName: string;
    filePath: string;
    mimeType: string;
    fileSize: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function FilePreview({ file, isOpen, onClose }: FilePreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isImage = file.mimeType.startsWith('image/');
  const isPDF = file.mimeType === 'application/pdf';
  const isPreviewable = isImage || isPDF;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `/api/files/${file.id}/download`;
    link.download = file.displayName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold truncate">{file.displayName}</h3>
            <p className="text-sm text-gray-500">
              {file.mimeType} • {formatFileSize(file.fileSize)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-gray-100 rounded"
                  disabled={zoom <= 25}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-gray-100 rounded"
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded"
              title="下载文件"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                下载文件
              </button>
            </div>
          )}

          {!error && isImage && (
            <div className="flex justify-center">
              <img
                src={`/api/files/${file.id}/preview`}
                alt={file.displayName}
                style={{ transform: `scale(${zoom / 100})` }}
                className="max-w-full h-auto transition-transform"
                onError={() => setError('图片加载失败')}
              />
            </div>
          )}

          {!error && isPDF && (
            <div className="w-full h-96">
              <iframe
                src={`/api/files/${file.id}/preview`}
                className="w-full h-full border-0"
                title={file.displayName}
                onError={() => setError('PDF 预览失败')}
              />
            </div>
          )}

          {!error && !isPreviewable && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                此文件类型不支持预览
              </p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                下载文件
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
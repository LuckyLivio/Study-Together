'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Filter,
  Tag,
  Folder,
  FolderOpen,
  Users,
  Lock,
  Home,
  ChevronRight
} from 'lucide-react';
import FilePreview from '@/components/files/file-preview';

interface FileItem {
  id: string;
  displayName: string;
  description?: string;
  filename: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  visibility: 'PRIVATE' | 'COUPLE';
  downloadCount: number;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    username: string;
  };
  folder?: {
    id: string;
    name: string;
    color: string;
  };
  tags: {
    id: string;
    tag: string;
  }[];
}

interface FolderItem {
  id: string;
  name: string;
  description?: string;
  color: string;
  parentId?: string;
  parent?: FolderItem;
  children?: FolderItem[];
  depth?: number;
  _count: {
    files: number;
    children: number;
  };
}

export default function FilesPage() {
  const { user } = useAuthStore();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // 上传表单状态
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    displayName: '',
    description: '',
    folderId: '',
    visibility: 'PRIVATE' as 'PRIVATE' | 'COUPLE',
    tags: ''
  });
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFiles();
      fetchFolders();
      updateBreadcrumbs();
    }
  }, [user, currentPage, currentFolder, selectedTag, visibility]);

  const fetchFiles = async () => {
    try {
      const params = new URLSearchParams();
      
      if (currentFolder) params.append('folderId', currentFolder.id);
      if (selectedTag) params.append('tag', selectedTag);
      if (visibility !== 'all') params.append('visibility', visibility);
      
      const response = await fetch(`/api/files?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setFiles(data.files);
      } else {
        toast.error(data.error || '获取文件列表失败');
      }
    } catch (error) {
      toast.error('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const params = new URLSearchParams();
      if (currentFolder) {
        params.append('parentId', currentFolder.id);
      }
      
      const response = await fetch(`/api/folders?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setFolders(data.folders);
      }
    } catch (error) {
      console.error('获取文件夹失败:', error);
    }
  };

  const updateBreadcrumbs = () => {
    const crumbs: FolderItem[] = [];
    let current = currentFolder;
    while (current) {
      crumbs.unshift(current);
      current = current.parent || null;
    }
    setBreadcrumbs(crumbs);
  };

  // 获取所有文件夹（用于下拉选择）
  const getAllFolders = (): FolderItem[] => {
    const allFolders: FolderItem[] = [];
    
    const addFolderAndChildren = (folder: FolderItem, depth = 0) => {
      allFolders.push({ ...folder, depth });
      if (folder.children) {
        folder.children.forEach(child => addFolderAndChildren(child, depth + 1));
      }
    };
    
    folders.filter(f => !f.parentId).forEach(folder => addFolderAndChildren(folder));
    return allFolders;
  };

  // 获取文件夹深度（用于缩进显示）
  const getFolderDepth = (folder: FolderItem): number => {
    let depth = 0;
    let current = folder.parent;
    while (current) {
      depth++;
      current = current.parent;
    }
    return depth;
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) {
      toast.error('请选择文件');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('displayName', uploadForm.displayName || uploadForm.file.name);
    formData.append('description', uploadForm.description);
    formData.append('folderId', uploadForm.folderId);
    formData.append('visibility', uploadForm.visibility);
    formData.append('tags', uploadForm.tags);

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('文件上传成功');
        setUploadForm({
          file: null,
          displayName: '',
          description: '',
          folderId: currentFolder?.id || '',
          visibility: 'PRIVATE',
          tags: ''
        });
        fetchFiles();
      } else {
        toast.error(data.error || '文件上传失败');
      }
    } catch (error) {
      toast.error('网络错误');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('请输入文件夹名称');
      return;
    }

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolder?.id,
          color: '#3B82F6'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('文件夹创建成功');
        setNewFolderName('');
        setShowNewFolder(false);
        fetchFolders();
      } else {
        toast.error(data.error || '文件夹创建失败');
      }
    } catch (error) {
      toast.error('网络错误');
    }
  };

  const handleFolderClick = (folder: FolderItem) => {
    setCurrentFolder(folder);
  };

  const handleBackClick = () => {
    setCurrentFolder(currentFolder?.parent || null);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('确定要删除这个文件吗？')) return;

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('文件删除成功');
        fetchFiles();
      } else {
        const data = await response.json();
        toast.error(data.error || '文件删除失败');
      }
    } catch (error) {
      toast.error('网络错误');
    }
  };

  const handleDownload = (fileId: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/files/${fileId}/download`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (fileType: string, mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-green-500" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <File className="h-8 w-8 text-blue-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || file.tags.some(tag => tag.tag === selectedTag);
    const matchesVisibility = visibility === 'all' || file.visibility === visibility.toUpperCase();
    
    return matchesSearch && matchesTag && matchesVisibility;
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">请先登录</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-20 pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">资料库</h1>
          <p className="text-gray-600 mt-2">管理和分享你的文件资料</p>
        </div>
        
        <Button 
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          {showUploadForm ? '取消上传' : '上传文件'}
        </Button>
      </div>

      {/* 上传表单 */}
      {showUploadForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">上传文件</h2>
          </div>
          
          <form onSubmit={handleFileUpload} className="space-y-6">
            {/* 文件选择区域 */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="file-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadForm(prev => ({ 
                      ...prev, 
                      file,
                      displayName: prev.displayName || file.name.split('.')[0]
                    }));
                  }
                }}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                required
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-lg font-medium text-gray-900 mb-2">
                  {uploadForm.file ? uploadForm.file.name : '选择文件上传'}
                </div>
                <p className="text-sm text-gray-500">
                  支持 PDF, Word, 图片, 文本文件，最大 50MB
                </p>
              </label>
            </div>
            
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayName">文件标题（可选）</Label>
                <Input
                  id="displayName"
                  value={uploadForm.displayName}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="留空将使用文件名"
                />
              </div>
              
              <div>
                <Label htmlFor="visibility">可见性 *</Label>
                <select
                  id="visibility"
                  value={uploadForm.visibility}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, visibility: e.target.value as 'PRIVATE' | 'COUPLE' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="PRIVATE">🔒 私有（仅自己可见）</option>
                  <option value="COUPLE">💕 情侣可见</option>
                </select>
              </div>
            </div>
            
            {/* 可选信息 */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span>更多选项（可选）</span>
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200">
                <div>
                  <Label htmlFor="folder">存储位置</Label>
                  <select
                    id="folder"
                    value={uploadForm.folderId}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, folderId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{currentFolder ? `当前文件夹: ${currentFolder.name}` : '根目录'}</option>
                    {getAllFolders().map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {'  '.repeat(getFolderDepth(folder))} {folder.name}
                      </option>
                           ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="description">文件描述</Label>
                  <Textarea
                    id="description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="添加文件描述..."
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tags">标签</Label>
                  <Input
                    id="tags"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="用逗号分隔多个标签"
                  />
                </div>
              </div>
            </details>
            
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={!uploadForm.file || isUploading}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? '上传中...' : '上传文件'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUploadForm(false);
                  setUploadForm({
                    file: null,
                    displayName: '',
                    description: '',
                    folderId: currentFolder?.id || '',
                    visibility: 'PRIVATE',
                    tags: ''
                  });
                }}
                className="px-6"
              >
                取消
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 面包屑导航 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentFolder(null)}
            className="p-1 h-auto"
          >
            <Home className="h-4 w-4" />
          </Button>
          {breadcrumbs.map((folder, index) => (
            <div key={folder.id} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentFolder(folder)}
                className="p-1 h-auto text-blue-600 hover:text-blue-800"
              >
                {folder.name}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="search" className="text-gray-700 font-medium">搜索文件</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="输入文件名或标签..."
                className="pl-11 h-11 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="visibilityFilter" className="text-gray-700 font-medium">可见性筛选</Label>
            <select
              id="visibilityFilter"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full mt-2 h-11 px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
            >
              <option value="all">📁 全部文件</option>
              <option value="PRIVATE">🔒 仅自己可见</option>
              <option value="COUPLE">💕 情侣共享</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-11 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300">
                  <Plus className="h-5 w-5 mr-2" />
                  新建文件夹
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5 text-blue-600" />
                    创建新文件夹
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newFolderName" className="text-gray-700 font-medium">文件夹名称</Label>
                    <Input
                      id="newFolderName"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="输入文件夹名称"
                      className="mt-2 h-11"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleCreateFolder} className="flex-1 h-11 bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      创建
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewFolder(false)} className="flex-1 h-11">
                      取消
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* 文件夹和文件列表 */}
      <div className="bg-white rounded-lg shadow-sm border">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : (
          <div className="p-6">
            {/* 文件夹列表 */}
             {folders.filter(folder => 
               currentFolder ? folder.parentId === currentFolder.id : !folder.parentId
             ).length > 0 && (
               <div className="mb-8">
                 <div className="flex items-center gap-2 mb-6">
                   <Folder className="h-6 w-6 text-blue-600" />
                   <h3 className="text-xl font-semibold text-gray-900">文件夹</h3>
                   <Badge variant="secondary" className="ml-2">
                     {folders.filter(folder => 
                       currentFolder ? folder.parentId === currentFolder.id : !folder.parentId
                     ).length}
                   </Badge>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                   {folders
                     .filter(folder => 
                       currentFolder ? folder.parentId === currentFolder.id : !folder.parentId
                     )
                     .map(folder => (
                       <div 
                         key={folder.id} 
                         className="group bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-xl hover:shadow-blue-100 transition-all duration-200 cursor-pointer hover:border-blue-300 hover:-translate-y-1"
                         onClick={() => handleFolderClick(folder)}
                       >
                         <div className="flex items-center gap-4">
                           <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                             <Folder className="h-8 w-8 text-blue-600" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-900">{folder.name}</h4>
                             <div className="flex items-center gap-3 mt-1">
                               <span className="text-sm text-gray-500 flex items-center gap-1">
                                 <File className="h-3 w-3" />
                                 {folder._count.files}
                               </span>
                               <span className="text-sm text-gray-500 flex items-center gap-1">
                                 <Folder className="h-3 w-3" />
                                 {folder._count.children}
                               </span>
                             </div>
                           </div>
                         </div>
                       </div>
                     ))
                   }
                 </div>
               </div>
             )}

            {/* 文件列表 */}
             {filteredFiles.length === 0 && folders.filter(folder => 
                currentFolder ? folder.parentId === currentFolder.id : !folder.parentId
              ).length === 0 ? (
               <div className="text-center py-16">
                 <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                   <Upload className="h-12 w-12 text-blue-500" />
                 </div>
                 <h3 className="text-2xl font-semibold text-gray-900 mb-3">暂无文件</h3>
                 <p className="text-gray-600 mb-8 max-w-md mx-auto">这里还很空呢！上传你的第一个文件，开始构建你的资料库吧</p>
                 <Button 
                   onClick={() => setShowUploadForm(true)}
                   className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                 >
                   <Upload className="h-5 w-5 mr-2" />
                   上传第一个文件
                 </Button>
               </div>
            ) : filteredFiles.length > 0 ? (
               <div>
                 <div className="flex items-center gap-2 mb-6">
                   <FileText className="h-6 w-6 text-green-600" />
                   <h3 className="text-xl font-semibold text-gray-900">文件</h3>
                   <Badge variant="secondary" className="ml-2">
                     {filteredFiles.length}
                   </Badge>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {filteredFiles.map(file => (
              <Card key={file.id} className="group hover:shadow-xl hover:shadow-blue-100 transition-all duration-200 border-gray-200 hover:border-blue-300 hover:-translate-y-1">
                <CardHeader className="pb-3">
                   <div className="flex items-start justify-between">
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                         {getFileIcon(file.fileType, file.mimeType)}
                       </div>
                       <div className="flex-1 min-w-0">
                         <CardTitle 
                           className="text-sm font-semibold group-hover:text-blue-900 break-words line-clamp-2"
                           title={file.displayName}
                         >
                           {file.displayName}
                         </CardTitle>
                         <CardDescription className="text-xs text-gray-500">
                           {formatFileSize(file.fileSize)} • {new Date(file.createdAt).toLocaleDateString()}
                         </CardDescription>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       {file.visibility === 'PRIVATE' ? (
                         <div className="p-1 bg-gray-100 rounded-full">
                           <Lock className="h-3 w-3 text-gray-500" />
                         </div>
                       ) : (
                         <div className="p-1 bg-blue-100 rounded-full">
                           <Users className="h-3 w-3 text-blue-600" />
                         </div>
                       )}
                       {file.user.id === user.id && (
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => handleDeleteFile(file.id)}
                           className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                         >
                           <Trash2 className="h-3 w-3" />
                         </Button>
                       )}
                     </div>
                   </div>
                 </CardHeader>
                
                <CardContent className="pt-0">
                  {file.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {file.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                     {file.folder && (
                       <Badge 
                         variant="outline" 
                         className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                       >
                         <Folder className="h-3 w-3 mr-1" />
                         {file.folder.name}
                       </Badge>
                     )}
                     {file.tags.map(tag => (
                       <Badge key={tag.id} variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                         <Tag className="h-3 w-3 mr-1" />
                         {tag.tag}
                       </Badge>
                     ))}
                   </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>上传者: {file.user.displayName}</span>
                    <span>{file.downloadCount} 次下载</span>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                       onClick={() => setPreviewFile(file)}
                     >
                       <Eye className="h-4 w-4 mr-1" />
                       预览
                     </Button>
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="flex-1 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                       onClick={() => handleDownload(file.id, file.displayName)}
                     >
                       <Download className="h-4 w-4 mr-1" />
                       下载
                     </Button>
                   </div>
                </CardContent>
              </Card>
            ))}
              </div>
               </div>
             ) : null}
          </div>
        )}
      </div>

      {/* 文件预览模态框 */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
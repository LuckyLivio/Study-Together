'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Heart, 
  Send, 
  Image, 
  Smile, 
  Trash2, 
  Upload,
  Sparkles,
  MessageCircle,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import EmojiRain, { useEmojiRain } from '@/components/ui/emoji-rain';

interface MessageWallPost {
  id: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'STICKER' | 'SURPRISE' | 'MIXED';
  attachments: string[];
  surpriseType?: string;
  surpriseData?: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    displayName: string;
    avatar?: string;
  };
  receiver: {
    id: string;
    displayName: string;
    avatar?: string;
  };
  reactions: {
    id: string;
    emoji: string;
    user: {
      id: string;
      displayName: string;
    };
  }[];
}

interface MessageWallData {
  messages: MessageWallPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const EMOJI_LIST = ['❤️', '😍', '🥰', '😘', '💕', '💖', '💗', '💝', '👍', '😊', '😂', '🎉', '🌟', '✨', '🔥', '💯'];
const SURPRISE_TYPES = [
  { type: 'heart_rain', label: '爱心雨', icon: '💕' },
  { type: 'confetti', label: '彩带', icon: '🎉' },
  { type: 'fireworks', label: '烟花', icon: '🎆' },
  { type: 'sparkles', label: '闪光', icon: '✨' }
];

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageWallPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [noCoupleRelationship, setNoCoupleRelationship] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSurprisePicker, setShowSurprisePicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { activeEffect, triggerEffect, stopEffect } = useEmojiRain();

  // 禁用页面滚动
  useEffect(() => {
    // 禁用body滚动
    document.body.style.overflow = 'hidden';
    
    // 组件卸载时恢复滚动
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // 获取当前用户ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.user.id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // 获取留言列表
  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data: MessageWallData = await response.json();
        const newMessages = data.messages;
        
        // 检查是否有新的小惊喜留言
         if (messages.length > 0 && currentUserId) {
           const latestMessage = newMessages[0];
           if (latestMessage && latestMessage.surpriseType && 
               !messages.find(m => m.id === latestMessage.id)) {
             // 如果是新的小惊喜留言且不是自己发送的，触发效果
             if (latestMessage.sender.id !== currentUserId) {
               triggerEffect(latestMessage.surpriseType, latestMessage.id);
             }
           }
         }
        
        setMessages(newMessages);
      } else if (response.status === 400) {
        // 没有情侣关系
        setNoCoupleRelationship(true);
      } else {
        const error = await response.json();
        toast.error(error.error || '获取留言失败');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('获取留言失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleNoCoupleRelationship = () => {
    return (
      <div className="fixed inset-0 top-16 overflow-hidden">
        <div className="h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">💕</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">情侣留言墙</h1>
              <p className="text-gray-600 mb-6">
                您还没有建立情侣关系，无法使用留言墙功能。
              </p>
              <p className="text-sm text-gray-500 mb-6">
                请先在情侣页面建立情侣关系，然后再来享受甜蜜的留言功能吧！
              </p>
              <button
                onClick={() => router.push('/couple')}
                className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                去建立情侣关系
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 滚动到底部
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // 使用更精确的滚动控制，只在ScrollArea内部滚动
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  // 移除自动滚动，改为手动控制

  // 发送留言
  const sendMessage = async (surpriseType?: string) => {
    if (!newMessage.trim() && selectedFiles.length === 0) {
      toast.error('请输入留言内容或选择文件');
      return;
    }

    setSending(true);
    try {
      let attachments: string[] = [];
      
      // 上传文件
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', file.type.startsWith('image/') ? 'image' : 'sticker');
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            attachments.push(uploadData.url);
          }
        }
      }

      // 发送留言
      const messageData = {
        content: newMessage,
        messageType: attachments.length > 0 ? (newMessage ? 'MIXED' : 'IMAGE') : 'TEXT',
        attachments,
        surpriseType,
        surpriseData: surpriseType ? JSON.stringify({ type: surpriseType }) : undefined
      };

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // 如果是小惊喜留言，触发emoji雨效果
        if (surpriseType) {
          triggerEffect(surpriseType, result.message.id);
        }
        
        setNewMessage('');
        setSelectedFiles([]);
        setShowSurprisePicker(false);
        await fetchMessages();
        // 发送成功后滚动到底部
        setTimeout(() => scrollToBottom(), 100);
        toast.success('留言发送成功');
      } else {
        const error = await response.json();
        toast.error(error.error || '发送失败');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('发送失败');
    } finally {
      setSending(false);
    }
  };

  // 添加emoji反应
  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emoji })
      });

      if (response.ok) {
        await fetchMessages();
      } else {
        const error = await response.json();
        toast.error(error.error || '操作失败');
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('操作失败');
    }
  };

  // 删除留言
  const deleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchMessages();
        toast.success('留言已删除');
      } else {
        const error = await response.json();
        toast.error(error.error || '删除失败');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('删除失败');
    }
  };

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  // 移除选中的文件
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (noCoupleRelationship) {
    return handleNoCoupleRelationship();
  }

  return (
    <div className="fixed inset-0 top-16 overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 via-indigo-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl h-full flex justify-center">
        <Card className="w-full h-full flex flex-col backdrop-blur-md bg-white/90 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-2xl sm:rounded-3xl overflow-hidden relative">
          {/* 装饰性背景元素 */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-indigo-500/5 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-300/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-300/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>
        {/* 优化的标题栏 */}
        <div className="relative flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-pink-500/8 via-purple-500/8 to-indigo-500/8 backdrop-blur-sm border-b border-white/30 flex-shrink-0 z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm"></div>
          {/* 左侧标题 */}
          <div className="relative flex items-center gap-2 sm:gap-3 z-10">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg sm:rounded-xl shadow-lg ring-1 ring-white/20">
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow-sm" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
                情侣留言墙
              </h1>
              <p className="text-xs text-gray-600/80 mt-0.5 hidden sm:block font-medium">分享你们的甜蜜时光</p>
            </div>
          </div>
          
          {/* 右侧留言统计 */}
          <div className="relative flex items-center gap-2 sm:gap-4 z-10">
            <div className="text-right">
              <div className="text-sm font-bold text-gray-700 drop-shadow-sm">
                {messages.length}
              </div>
              <div className="text-xs text-gray-600/80 font-medium">
                条留言
              </div>
            </div>
            <div className="w-px h-6 sm:h-8 bg-gradient-to-b from-pink-300/60 via-purple-300/60 to-indigo-300/60 shadow-sm"></div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-700 drop-shadow-sm">
                {new Set(messages.map(m => m.sender.id)).size}
              </div>
              <div className="text-xs text-gray-600/80 font-medium">
                <span className="hidden sm:inline">位</span>用户
              </div>
            </div>
          </div>
        </div>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* 留言列表 */}
          <ScrollArea className="flex-1 pr-2" style={{height: 'calc(100vh - 12rem)'}}>
            <div className="space-y-3 py-3 pl-4 pr-3">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">还没有留言，快来写下第一条留言吧！</p>
                </div>
              ) : (
                messages.slice().reverse().map((message) => {
                  // 计算消息内容长度来决定气泡宽度
                  const contentLength = message.content?.length || 0;
                  const hasAttachments = message.attachments.length > 0;
                  
                  // 根据内容长度动态设置最大宽度
                  let maxWidth = 'max-w-[70%]';
                  if (contentLength < 20 && !hasAttachments) {
                    maxWidth = 'max-w-fit';
                  } else if (contentLength < 50 && !hasAttachments) {
                    maxWidth = 'max-w-[40%]';
                  } else if (contentLength < 100) {
                    maxWidth = 'max-w-[60%]';
                  }
                  
                  return (
                    <div key={message.id} className={`flex gap-3 ${message.sender.id === currentUserId ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-white shadow-md">
                        <AvatarImage src={message.sender.avatar} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-semibold text-sm">
                          {message.sender.displayName[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex flex-col ${maxWidth} ${message.sender.id === currentUserId ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-center gap-2 mb-1 ${message.sender.id === currentUserId ? 'flex-row-reverse' : ''}`}>
                          <span className="text-sm font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{message.sender.displayName}</span>
                          <span className="text-xs text-gray-500/80 font-medium">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: zhCN })}
                          </span>
                          {message.sender.id === currentUserId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMessage(message.id)}
                              className="h-6 w-6 p-0 text-gray-400/60 hover:text-red-500 hover:bg-red-50/80 rounded-lg transition-all duration-200 ring-1 ring-transparent hover:ring-red-200/50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        <div className={`relative rounded-2xl px-4 py-3 break-words transition-all duration-200 hover:shadow-lg ${
                          message.sender.id === currentUserId 
                            ? 'bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30 ring-1 ring-white/20' 
                            : 'bg-gradient-to-br from-white via-gray-50/50 to-white border border-gray-200/60 text-gray-800 shadow-md hover:shadow-lg ring-1 ring-gray-100/50'
                        } ${contentLength < 20 && !hasAttachments ? 'inline-block' : 'w-full'}`}>
                          {message.content && (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          )}
                          
                          {message.attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.attachments.map((attachment, index) => (
                                <img
                                  key={`${message.id}-attachment-${index}-${attachment.split('/').pop()}`}
                                  src={attachment}
                                  alt="附件"
                                  className="max-w-full h-auto rounded-xl shadow-sm border border-white/20"
                                />
                              ))}
                            </div>
                          )}
                          
                          {message.surpriseType && (
                            <div className={`mt-3 flex items-center gap-2 text-sm ${
                              message.sender.id === currentUserId ? 'text-pink-100/90' : 'text-pink-600'
                            }`}>
                              <Sparkles className="h-4 w-4 animate-pulse" />
                              <span className="font-semibold">小惊喜: {SURPRISE_TYPES.find(s => s.type === message.surpriseType)?.label}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* 反应 */}
                        {message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {message.reactions.map((reaction) => (
                              <Badge key={reaction.id} variant="secondary" className="text-xs bg-pink-50 text-pink-700 border-pink-200">
                                {reaction.emoji} {reaction.user.displayName}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {/* Emoji反应按钮 */}
                        <div className="flex gap-1 mt-3">
                          {EMOJI_LIST.slice(0, 6).map((emoji) => (
                            <Button
                              key={`${message.id}-emoji-${emoji}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => addReaction(message.id, emoji)}
                              className="h-7 w-7 p-0 text-sm hover:bg-pink-100 hover:scale-110 transition-all duration-200 rounded-full"
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
        </CardContent>
        
        {/* 发送区域 - 固定在底部 */}
        <div className="relative flex-shrink-0 p-2 sm:p-3 bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-md border-t border-white/40 z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-indigo-500/5"></div>
          <div className="relative space-y-2 z-10">
            {/* 选中的文件预览 */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-r from-pink-50/80 via-purple-50/80 to-indigo-50/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
                {selectedFiles.map((file, index) => (
                  <div key={`file-preview-${index}-${file.name}-${file.size}-${file.lastModified || crypto.randomUUID()}`} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-16 w-16 object-cover rounded-lg border border-white/80 shadow-md group-hover:scale-105 transition-all duration-200"
                    />
                    <Button
                       variant="destructive"
                       size="sm"
                       className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 bg-red-500 hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ring-1 ring-white/50"
                       onClick={() => removeFile(index)}
                     >
                       <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="写下你想说的话..."
                  className="min-h-[50px] max-h-[100px] resize-none border border-white/50 bg-white/80 backdrop-blur-sm rounded-xl focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20 transition-all duration-200 text-sm shadow-sm placeholder:text-gray-400 w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
              </div>
              
              <div className="flex gap-2">
                {/* 文件上传 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 rounded-xl border border-white/60 bg-white/80 backdrop-blur-sm hover:border-blue-400/60 hover:bg-blue-50/80 transition-all duration-200 shadow-sm hover:shadow-md ring-1 ring-white/20"
                >
                  <Image className="h-4 w-4 text-blue-600" />
                </Button>
                
                {/* 小惊喜 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSurprisePicker(!showSurprisePicker)}
                  className="h-10 w-10 rounded-xl border border-white/60 bg-white/80 backdrop-blur-sm hover:border-purple-400/60 hover:bg-purple-50/80 transition-all duration-200 shadow-sm hover:shadow-md ring-1 ring-white/20"
                >
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </Button>
                
                {/* 发送 */}
                <Button
                  onClick={() => sendMessage()}
                  disabled={sending || (!newMessage.trim() && selectedFiles.length === 0)}
                  className="h-10 w-10 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-0 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 ring-1 ring-white/30"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* 小惊喜选择器 */}
            {showSurprisePicker && (
              <div className="absolute bottom-full mb-3 right-0 bg-white/95 backdrop-blur-md border border-white/60 rounded-xl shadow-xl p-3 z-50 ring-1 ring-white/20 min-w-[200px]">
                <div className="grid grid-cols-2 gap-2">
                  {SURPRISE_TYPES.map((surprise) => (
                    <Button
                      key={surprise.type}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        sendMessage(surprise.type);
                        setShowSurprisePicker(false);
                      }}
                      className="flex items-center gap-1 text-left h-10 rounded-xl border border-transparent hover:border-white/50 hover:bg-gradient-to-r hover:from-pink-50/80 hover:to-purple-50/80 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <span className="text-base">{surprise.icon}</span>
                      <span className="text-xs font-medium text-gray-700">{surprise.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        </Card>
        
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* Emoji雨效果 */}
        <EmojiRain
          isActive={!!activeEffect}
          surpriseType={activeEffect?.type || ''}
          duration={3000}
          onComplete={stopEffect}
        />
      </div>
    </div>
  );
}
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useAIStore } from '@/lib/ai-store';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


export default function AIAssistantPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { 
    messages, 
    isLoading, 
    error, 
    addMessage, 
    clearMessages, 
    sendMessage 
  } = useAIStore();
  const [inputMessage, setInputMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化欢迎消息
  useEffect(() => {
    if (isAuthenticated && messages.length === 0) {
      // 使用setTimeout确保在下一个事件循环中执行，避免与clearMessages的竞态条件
      const timer = setTimeout(() => {
        // 再次检查消息长度，确保没有其他地方添加了消息
        if (messages.length === 0) {
          addMessage({
            role: 'assistant',
            content: `你好${user?.name ? `, ${user.name}` : ''}！我是你的AI学习助手。我可以帮助你：\n\n📚 制定学习计划\n💡 解答学习问题\n🎯 提供学习建议\n💪 给予学习动力\n👫 情侣学习指导\n\n有什么我可以帮助你的吗？`
          });
        }
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.name, messages.length, addMessage]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageContent = inputMessage.trim();
    setInputMessage('');
    
    try {
      await sendMessage(messageContent, user?.id, user?.coupleId);
    } catch (error) {
      console.error('发送消息失败:', error);
      toast.error('发送消息失败，请重试');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    clearMessages();
    // 清空后，初始化useEffect会自动添加欢迎消息
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">需要登录</h2>
              <p className="text-gray-600 mb-4">请先登录以使用AI学习助手功能</p>
              <Button onClick={() => window.location.href = '/landing'}>
                前往登录
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-16 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 via-purple-50 to-pink-50 pt-0">
      <div className="container mx-auto max-w-4xl h-full p-4 flex justify-center">
        <div className="w-full h-full flex flex-col backdrop-blur-md bg-white/90 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-2xl sm:rounded-3xl overflow-hidden relative">
            {/* 装饰性背景元素 */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-300/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-300/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>
            {/* 优化的标题栏 */}
            <div className="relative flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-500/8 via-indigo-500/8 to-purple-500/8 backdrop-blur-sm border-b border-white/30 flex-shrink-0 z-10">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm"></div>
              {/* 左侧标题 */}
              <div className="relative flex items-center gap-2 sm:gap-3 z-10">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg sm:rounded-xl shadow-lg ring-1 ring-white/20">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow-sm" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                    AI学习助手
                  </h1>
                  <p className="text-xs text-gray-600/80 mt-0.5 hidden sm:block font-medium">你的专属学习伙伴</p>
                </div>
              </div>
              
              {/* 右侧消息统计 */}
              <div className="relative flex items-center gap-2 sm:gap-4 z-10">
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-700 drop-shadow-sm">
                    {messages.length}
                  </div>
                  <div className="text-xs text-gray-600/80 font-medium">
                    条对话
                  </div>
                </div>
                <div className="w-px h-6 sm:h-8 bg-gradient-to-b from-blue-300/60 via-indigo-300/60 to-purple-300/60 shadow-sm"></div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-700 drop-shadow-sm">
                    AI
                  </div>
                  <div className="text-xs text-gray-600/80 font-medium">
                    助手
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 flex overflow-hidden">
              {/* 左侧清空按钮区域 */}
              <div className="w-16 flex flex-col items-center py-4 bg-gradient-to-b from-white/50 to-white/30 backdrop-blur-sm border-r border-white/30">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearChat}
                  disabled={messages.length === 0}
                  className="h-10 w-10 p-0 rounded-lg border border-white/60 bg-white/80 backdrop-blur-sm hover:border-red-400/60 hover:bg-red-50/80 transition-all duration-200 shadow-sm hover:shadow-md ring-1 ring-white/20 flex items-center justify-center"
                  title="清空聊天"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
              {/* 消息列表 */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 pr-2" ref={scrollAreaRef}>
                <div className="space-y-3 py-3 pl-4 pr-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <Bot className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">开始与AI助手对话吧！</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      // 计算消息内容长度来决定气泡宽度
                      const contentLength = message.content?.length || 0;
                      
                      // 根据内容长度动态设置最大宽度
                      let maxWidth = 'max-w-[80%]';
                      if (contentLength < 20) {
                        maxWidth = 'max-w-fit';
                      } else if (contentLength < 50) {
                        maxWidth = 'max-w-[60%]';
                      } else if (contentLength < 100) {
                        maxWidth = 'max-w-[70%]';
                      }
                      
                      return (
                        <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-white shadow-md">
                            <AvatarFallback className={`font-semibold text-sm ${
                              message.role === 'user' 
                                ? 'bg-gradient-to-br from-green-400 to-blue-500 text-white' 
                                : 'bg-gradient-to-br from-blue-400 to-purple-500 text-white'
                            }`}>
                              {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className={`flex flex-col ${maxWidth} ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-center gap-2 mb-1 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                              <span className={`text-sm font-semibold ${
                                message.role === 'user' 
                                  ? 'bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent' 
                                  : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
                              }`}>
                                {message.role === 'user' ? '你' : 'AI助手'}
                              </span>
                              <span className="text-xs text-gray-500/80 font-medium">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            <div className={`relative rounded-2xl px-4 py-3 break-words transition-all duration-200 hover:shadow-lg ${
                              message.role === 'user' 
                                ? 'bg-gradient-to-br from-green-500 via-green-600 to-blue-600 text-white shadow-lg shadow-green-500/30 ring-1 ring-white/20' 
                                : 'bg-gradient-to-br from-white via-gray-50/50 to-white border border-gray-200/60 text-gray-800 shadow-md hover:shadow-lg ring-1 ring-gray-100/50'
                            } ${contentLength < 20 ? 'inline-block' : 'w-full'}`}>
                              <div className="break-words">
                                {message.role === 'assistant' ? (
                                  <div className="prose prose-sm max-w-none">
                                    <ReactMarkdown 
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                        code: ({ children }) => (
                                          <code className="bg-blue-100/80 text-blue-800 px-1 py-0.5 rounded text-sm">
                                            {children}
                                          </code>
                                        ),
                                        pre: ({ children }) => (
                                          <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto my-2">
                                            {children}
                                          </pre>
                                        ),
                                        ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                                        li: ({ children }) => <li className="mb-1">{children}</li>,
                                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                                        blockquote: ({ children }) => (
                                          <blockquote className="border-l-4 border-blue-300 pl-3 italic my-2">
                                            {children}
                                          </blockquote>
                                        ),
                                      }}
                                    >
                                      {message.content}
                                    </ReactMarkdown>
                                  </div>
                                ) : (
                                  <div className="whitespace-pre-wrap">{message.content}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                
                  {/* 加载指示器 */}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-white shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold text-sm">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gradient-to-br from-white via-gray-50/50 to-white border border-gray-200/60 rounded-2xl px-4 py-3 shadow-md ring-1 ring-gray-100/50">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          <span className="font-medium">AI正在思考中...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {/* 输入区域 - 固定在底部 */}
              <div className="relative flex-shrink-0 p-2 sm:p-3 bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-md border-t border-white/40 z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
                <div className="relative space-y-2 z-10">
                  {error && (
                    <div className="mb-3 p-3 bg-gradient-to-r from-red-50/80 via-red-50/80 to-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-xl shadow-sm">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{error}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="输入你的问题...（按Enter发送）"
                        disabled={isLoading}
                        className="min-h-[50px] border border-white/50 bg-white/80 backdrop-blur-sm rounded-xl focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 text-sm shadow-sm placeholder:text-gray-400 w-full"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!inputMessage.trim() || isLoading}
                      className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 ring-1 ring-white/30"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500/80 font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-blue-500" />
                    提示：你可以询问学习计划、学习方法、课程建议等问题
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
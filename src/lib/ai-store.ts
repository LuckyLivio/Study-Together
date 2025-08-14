import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ChatMessage, generateMessageId } from './ai-config'

interface AIStore {
  // 聊天消息
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  
  // AI配置
  isAIEnabled: boolean
  maxMessages: number
  
  // 操作方法
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  updateLastMessage: (content: string) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // 发送消息到AI
  sendMessage: (content: string, userId?: string, coupleId?: string) => Promise<void>
  
  // 配置方法
  setAIEnabled: (enabled: boolean) => void
  setMaxMessages: (max: number) => void
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      messages: [],
      isLoading: false,
      error: null,
      isAIEnabled: true,
      maxMessages: 50,
      
      // 添加消息
      addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateMessageId(),
          timestamp: new Date()
        }
        
        set((state: AIStore) => {
          const newMessages = [...state.messages, newMessage]
          // 限制消息数量
          if (newMessages.length > state.maxMessages) {
            return {
              messages: newMessages.slice(-state.maxMessages)
            }
          }
          return { messages: newMessages }
        })
      },
      
      // 更新最后一条消息
      updateLastMessage: (content: string) => {
        set((state: AIStore) => {
          const messages = [...state.messages]
          if (messages.length > 0) {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content
            }
          }
          return { messages }
        })
      },
      
      // 清空消息
      clearMessages: () => {
        set({ messages: [], error: null })
      },
      
      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
      
      // 设置错误
      setError: (error: string | null) => {
        set({ error })
      },
      
      // 发送消息到AI
      sendMessage: async (content: string, userId?: string, coupleId?: string) => {
        const { addMessage, setLoading, setError, messages } = get()
        
        // 添加用户消息
        addMessage({
          role: 'user',
          content: content.trim()
        })
        
        setLoading(true)
        setError(null)
        
        try {
          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [...messages, {
                id: generateMessageId(),
                role: 'user',
                content: content.trim(),
                timestamp: new Date()
              }],
              userId,
              coupleId
            }),
          })
          
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'AI服务暂时不可用')
          }
          
          if (data.success && data.message) {
            addMessage({
              role: 'assistant',
              content: data.message.content
            })
          } else {
            throw new Error('AI响应格式错误')
          }
        } catch (error) {
          console.error('AI聊天错误:', error)
          const errorMessage = error instanceof Error ? error.message : 'AI服务暂时不可用，请稍后重试'
          setError(errorMessage)
          
          // 添加错误消息到聊天记录
          addMessage({
            role: 'assistant',
            content: `抱歉，我遇到了一些问题：${errorMessage}`
          })
        } finally {
          setLoading(false)
        }
      },
      
      // 设置AI启用状态
      setAIEnabled: (enabled: boolean) => {
        set({ isAIEnabled: enabled })
      },
      
      // 设置最大消息数
      setMaxMessages: (max: number) => {
        set({ maxMessages: max })
      }
    }),
    {
      name: 'ai-store',
      partialize: (state: AIStore) => ({
        messages: state.messages,
        isAIEnabled: state.isAIEnabled,
        maxMessages: state.maxMessages
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const data = JSON.parse(str)
          // 恢复 Date 对象
          if (data.state?.messages) {
            data.state.messages = data.state.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }
          return data
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        }
      }
    }
  )
)

// 导出类型
export type { ChatMessage } from './ai-config'
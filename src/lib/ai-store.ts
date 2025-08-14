import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ChatMessage, generateMessageId } from './ai-config'

interface Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
}

interface AIStore {
  // 当前对话和消息
  currentConversationId: string | null
  conversations: Conversation[]
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  
  // AI配置
  isAIEnabled: boolean
  maxMessages: number
  
  // 对话管理
  loadConversations: () => Promise<void>
  createConversation: (title?: string) => Promise<string | null>
  selectConversation: (conversationId: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  
  // 消息操作
  loadMessages: (conversationId: string) => Promise<void>
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
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
      currentConversationId: null,
      conversations: [],
      messages: [],
      isLoading: false,
      error: null,
      isAIEnabled: true,
      maxMessages: 50,
      
      // 加载对话列表
      loadConversations: async () => {
        try {
          const response = await fetch('/api/chat/conversations')
          if (response.ok) {
            const data = await response.json()
            const conversations = data.conversations.map((conv: any) => ({
              ...conv,
              createdAt: new Date(conv.createdAt),
              updatedAt: new Date(conv.updatedAt)
            }))
            set({ conversations })
          }
        } catch (error) {
          console.error('Failed to load conversations:', error)
        }
      },
      
      // 创建新对话
      createConversation: async (title?: string) => {
        try {
          const response = await fetch('/api/chat/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title })
          })
          
          if (response.ok) {
            const data = await response.json()
            const newConversation = {
              ...data.conversation,
              createdAt: new Date(data.conversation.createdAt),
              updatedAt: new Date(data.conversation.updatedAt)
            }
            
            set((state) => ({
              conversations: [newConversation, ...state.conversations],
              currentConversationId: newConversation.id,
              messages: []
            }))
            
            return newConversation.id
          }
        } catch (error) {
          console.error('Failed to create conversation:', error)
        }
        return null
      },
      
      // 选择对话
      selectConversation: async (conversationId: string) => {
        set({ currentConversationId: conversationId })
        await get().loadMessages(conversationId)
      },
      
      // 删除对话
      deleteConversation: async (conversationId: string) => {
        try {
          const response = await fetch(`/api/chat/conversations?conversationId=${conversationId}`, {
            method: 'DELETE'
          })
          
          if (response.ok) {
            set((state) => {
              const newConversations = state.conversations.filter(conv => conv.id !== conversationId)
              const newCurrentId = state.currentConversationId === conversationId ? null : state.currentConversationId
              return {
                conversations: newConversations,
                currentConversationId: newCurrentId,
                messages: newCurrentId ? state.messages : []
              }
            })
          }
        } catch (error) {
          console.error('Failed to delete conversation:', error)
        }
      },
      
      // 加载消息
      loadMessages: async (conversationId: string) => {
        try {
          const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
          if (response.ok) {
            const data = await response.json()
            const messages = data.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.createdAt)
            }))
            set({ messages })
          }
        } catch (error) {
          console.error('Failed to load messages:', error)
        }
      },
      
      // 添加消息（仅用于UI更新）
      addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateMessageId(),
          timestamp: new Date()
        }
        
        set((state: AIStore) => ({
          messages: [...state.messages, newMessage]
        }))
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
        const { addMessage, setLoading, setError, currentConversationId, createConversation } = get()
        
        setLoading(true)
        setError(null)
        
        try {
          // 如果没有当前对话，创建一个新的
          let conversationId = currentConversationId
          if (!conversationId) {
            conversationId = await createConversation('新对话')
            if (!conversationId) {
              throw new Error('无法创建对话')
            }
          }
          
          // 添加用户消息到UI
          addMessage({
            role: 'user',
            content: content.trim()
          })
          
          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [{
                id: generateMessageId(),
                role: 'user',
                content: content.trim(),
                timestamp: new Date()
              }],
              userId,
              coupleId,
              conversationId
            }),
          })
          
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'AI服务暂时不可用')
          }
          
          if (data.success && data.message) {
            // 添加AI回复到UI
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
        isAIEnabled: state.isAIEnabled,
        maxMessages: state.maxMessages
      })
    }
  )
)

// 导出类型
export type { ChatMessage } from './ai-config'
export type { Conversation }
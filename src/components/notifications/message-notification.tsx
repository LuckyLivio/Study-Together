'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { MessageCircle, Heart, Gift } from 'lucide-react'

interface MessageNotification {
  id: string
  senderId: string
  senderName: string
  content: string
  messageType: 'TEXT' | 'IMAGE' | 'SURPRISE' | 'MIXED'
  surpriseType?: string
  createdAt: string
}

export function MessageNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const router = useRouter()
  const [lastChecked, setLastChecked] = useState<Date>(new Date())
  const [isPolling, setIsPolling] = useState(false)

  // 检查新留言
  const checkNewMessages = async () => {
    if (!user?.id || !user?.coupleId || isPolling) return
    
    setIsPolling(true)
    try {
      const response = await fetch(`/api/messages/notifications?since=${lastChecked.toISOString()}`)
      if (response.ok) {
        const data = await response.json()
        const newMessages: MessageNotification[] = data.messages || []
        
        // 显示新留言通知
        newMessages.forEach(message => {
          showMessageNotification(message)
        })
        
        if (newMessages.length > 0) {
          setLastChecked(new Date())
        }
      }
    } catch (error) {
      console.error('检查新留言失败:', error)
    } finally {
      setIsPolling(false)
    }
  }

  // 显示留言通知
  const showMessageNotification = (message: MessageNotification) => {
    const getIcon = () => {
      switch (message.messageType) {
        case 'SURPRISE':
          return <Gift className="w-4 h-4 text-pink-500" />
        case 'IMAGE':
        case 'MIXED':
          return <MessageCircle className="w-4 h-4 text-blue-500" />
        default:
          return <Heart className="w-4 h-4 text-red-500" />
      }
    }

    const getTitle = () => {
      switch (message.messageType) {
        case 'SURPRISE':
          return `${message.senderName} 给你发了一个小惊喜！`
        case 'IMAGE':
          return `${message.senderName} 发送了图片`
        case 'MIXED':
          return `${message.senderName} 发送了消息和图片`
        default:
          return `${message.senderName} 给你留言了`
      }
    }

    const getDescription = () => {
      if (message.messageType === 'SURPRISE') {
        return message.surpriseType === 'heart_rain' ? '爱心雨特效' : 
               message.surpriseType === 'confetti' ? '彩带特效' : '小惊喜'
      }
      if (message.messageType === 'IMAGE') {
        return '点击查看图片'
      }
      return message.content.length > 30 ? 
             message.content.substring(0, 30) + '...' : 
             message.content
    }

    toast(getTitle(), {
      description: getDescription(),
      icon: getIcon(),
      duration: 5000,
      action: {
        label: '查看',
        onClick: () => {
          // 使用router导航，防止页面滚动
          router.push('/messages', { scroll: false })
        }
      },
      className: 'cursor-pointer'
    })

    // 播放通知音效（如果浏览器支持）
    try {
      // 使用Web Audio API生成简单的通知音效
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      // 忽略音频相关错误
    }
  }

  // 定期检查新留言
  useEffect(() => {
    if (!user?.id || !user?.coupleId) return

    // 立即检查一次
    checkNewMessages()

    // 每30秒检查一次新留言
    const interval = setInterval(checkNewMessages, 30000)

    // 当页面获得焦点时也检查一次
    const handleFocus = () => {
      checkNewMessages()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user?.id, user?.coupleId, lastChecked])

  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id && user?.coupleId) {
        // 页面变为可见时检查新留言
        setTimeout(checkNewMessages, 1000)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user?.id, user?.coupleId])

  return <>{children}</>
}

// 手动触发检查新留言的Hook
export function useMessageNotifications() {
  const { user } = useAuthStore()
  
  const checkNewMessages = async () => {
    if (!user?.id || !user?.coupleId) return
    
    try {
      const response = await fetch('/api/messages/notifications')
      if (response.ok) {
        const data = await response.json()
        return data.unreadCount || 0
      }
    } catch (error) {
      console.error('检查新留言失败:', error)
    }
    return 0
  }

  return { checkNewMessages }
}
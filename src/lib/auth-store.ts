'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthState, User, Couple, LoginCredentials, RegisterCredentials } from '@/types/auth'
import { LocalStorage, STORAGE_KEYS } from './storage'

interface AuthStore extends AuthState {
  // 认证操作
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; message: string }>
  logout: () => void
  
  // 用户资料操作
  updateProfile: (data: { name: string; email: string; gender?: string; bio?: string }) => Promise<{ success: boolean; message: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>
  
  // 情侣绑定操作
  generateInviteCode: () => Promise<{ success: boolean; code?: string; link?: string; message: string }>
  joinByInviteCode: (code: string) => Promise<{ success: boolean; message: string }>
  
  // 状态更新
  setUser: (user: User | null) => void
  setCouple: (couple: Couple | null) => void
  setLoading: (loading: boolean) => void
  
  // 初始化
  initialize: () => void
}

// 模拟API调用的延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 生成随机ID
const generateId = () => Math.random().toString(36).substr(2, 9)

// 生成邀请码
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      couple: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          })
          
          const data = await response.json()
          
          if (response.ok && data.user) {
            const authUser: User = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.displayName || data.user.username,
              gender: data.user.gender,
              role: data.user.role,
              isAdmin: data.user.isAdmin || false,
              createdAt: data.user.createdAt,
              updatedAt: data.user.updatedAt,
              coupleId: data.user.coupleId,
              partnerId: data.user.partnerId,
              partnerName: data.user.partnerName
            }
            
            set({ 
              user: authUser,
              couple: data.couple || null,
              isAuthenticated: true,
              isLoading: false 
            })
            
            return { success: true, message: '登录成功' }
          } else {
            set({ isLoading: false })
            return { success: false, message: data.error || '登录失败' }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, message: '登录失败，请重试' }
        }
      },

      register: async (credentials) => {
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          })
          
          const data = await response.json()
          
          if (response.ok && data.user) {
            const authUser: User = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.displayName || data.user.username,
              gender: data.user.gender,
              role: data.user.role,
              isAdmin: data.user.isAdmin || false,
              createdAt: data.user.createdAt,
              updatedAt: data.user.updatedAt,
              coupleId: data.user.coupleId,
              partnerId: data.user.partnerId,
              partnerName: data.user.partnerName
            }
            
            set({ 
              user: authUser,
              couple: data.couple || null,
              isAuthenticated: true,
              isLoading: false 
            })
            
            return { 
              success: true, 
              message: data.message || '注册成功'
            }
          } else {
            set({ isLoading: false })
            return { success: false, message: data.error || '注册失败' }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, message: '注册失败，请重试' }
        }
      },

      logout: async () => {
         try {
           await fetch('/api/auth/logout', {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             },
           })
         } catch (error) {
           console.error('注销请求失败:', error)
         }
         
         set({ 
           user: null, 
           couple: null, 
           isAuthenticated: false 
         })
       },

      updateProfile: async (data) => {
        const { user } = get()
        if (!user) {
          return { success: false, message: '用户未登录' }
        }

        try {
          const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })

          const result = await response.json()

          if (response.ok && result.user) {
            const updatedUser = {
              ...user,
              name: result.user.displayName || result.user.name,
              email: result.user.email,
              gender: result.user.gender,
              bio: result.user.bio,
              updatedAt: result.user.updatedAt
            }

            set({ user: updatedUser })
            return { success: true, message: '个人资料更新成功' }
          } else {
            return { success: false, message: result.error || '更新失败' }
          }
        } catch (error) {
          return { success: false, message: '更新失败，请重试' }
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        const { user } = get()
        if (!user) {
          return { success: false, message: '请先登录' }
        }

        try {
          const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              currentPassword,
              newPassword
            })
          })

          const result = await response.json()

          if (response.ok) {
            return { success: true, message: '密码修改成功' }
          } else {
            return { success: false, message: result.error || '密码修改失败' }
          }
        } catch (error) {
          return { success: false, message: '密码修改失败，请重试' }
        }
      },

      generateInviteCode: async () => {
        const { user } = get()
        if (!user) {
          return { success: false, message: '请先登录' }
        }
        
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/couples/invite', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          const data = await response.json()
          
          if (response.ok && data.couple) {
            set({ couple: data.couple, isLoading: false })
            
            const inviteLink = `${window.location.origin}/register?invite=${data.couple.inviteCode}`
            
            return {
              success: true,
              code: data.couple.inviteCode,
              link: inviteLink,
              message: '邀请码生成成功'
            }
          } else {
            set({ isLoading: false })
            return { success: false, message: data.error || '生成邀请码失败' }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, message: '生成邀请码失败' }
        }
      },

      joinByInviteCode: async (code) => {
        const { user } = get()
        if (!user) {
          return { success: false, message: '请先登录' }
        }
        
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/couples/join', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inviteCode: code }),
          })
          
          const data = await response.json()
          
          if (response.ok && data.user && data.couple) {
            const updatedUser: User = {
              ...user,
              coupleId: data.user.coupleId,
              partnerId: data.user.partnerId,
              partnerName: data.user.partnerName,
              role: data.user.role,
              updatedAt: data.user.updatedAt
            }
            
            set({ 
              user: updatedUser,
              couple: data.couple,
              isLoading: false 
            })
            
            return { success: true, message: '成功加入情侣！' }
          } else {
            set({ isLoading: false })
            return { success: false, message: data.error || '加入失败' }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, message: '加入失败，请重试' }
        }
      },

      setUser: (user) => set({ user }),
      setCouple: (couple) => set({ couple }),
      setLoading: (isLoading) => set({ isLoading }),

      initialize: () => {
        // 从持久化存储中恢复状态时的初始化逻辑
        const { user } = get()
        if (user) {
          set({ isAuthenticated: true })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        couple: state.couple,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
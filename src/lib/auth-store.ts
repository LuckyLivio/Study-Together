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
        await delay(1000) // 模拟网络请求
        
        try {
          // 从本地存储获取用户数据
          const users = LocalStorage.getItem(STORAGE_KEYS.USERS, []) as any[]
          const user = users.find((u: any) => 
            (u.email === credentials.email || u.name === credentials.email) && u.password === credentials.password
          )
          
          if (!user) {
            set({ isLoading: false })
            return { success: false, message: '用户名/邮箱或密码错误' }
          }
          
          // 获取情侣信息
          const couples = LocalStorage.getItem(STORAGE_KEYS.COUPLES, []) as any[]
          const couple = couples.find((c: any) => 
            c.person1Id === user.id || c.person2Id === user.id
          )
          
          set({ 
            user: { ...user, password: undefined }, // 不存储密码
            couple,
            isAuthenticated: true,
            isLoading: false 
          })
          
          return { success: true, message: '登录成功' }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, message: '登录失败，请重试' }
        }
      },

      register: async (credentials) => {
        set({ isLoading: true })
        await delay(1000)
        
        try {
          const users = LocalStorage.getItem(STORAGE_KEYS.USERS, []) as any[]
          
          // 检查邮箱是否已存在
          if (users.find((u: any) => u.email === credentials.email)) {
            set({ isLoading: false })
            return { success: false, message: '该邮箱已被注册' }
          }
          
          const userId = generateId()
          const now = new Date().toISOString()
          
          const newUser: User = {
            id: userId,
            email: credentials.email,
            name: credentials.name,
            createdAt: now,
            updatedAt: now,
            role: 'person1', // 默认角色，后续可能会根据情侣绑定调整
            isAdmin: credentials.email === 'admin@studytogether.com' // 管理员邮箱自动设置为管理员
          }
          
          // 保存用户（包含密码用于登录验证）
          const userWithPassword = { ...newUser, password: credentials.password }
          users.push(userWithPassword)
          LocalStorage.setItem(STORAGE_KEYS.USERS, users)
          
          let couple: Couple | null = null
          
          // 如果有邀请码，尝试加入情侣
          if (credentials.inviteCode) {
            const couples = LocalStorage.getItem(STORAGE_KEYS.COUPLES, []) as any[]
            const targetCouple = couples.find((c: any) => 
              c.inviteCode === credentials.inviteCode && !c.isComplete
            )
            
            if (targetCouple) {
              // 加入现有情侣
              targetCouple.person2Id = userId
              targetCouple.person2Name = credentials.name
              targetCouple.isComplete = true
              targetCouple.updatedAt = now
              
              // 更新用户角色
              newUser.coupleId = targetCouple.id
              newUser.partnerId = targetCouple.person1Id
              newUser.role = 'person2'
              
              // 更新第一个用户的伙伴信息
              const person1Index = users.findIndex((u: any) => u.id === targetCouple.person1Id)
              if (person1Index !== -1) {
                users[person1Index].partnerId = userId
                users[person1Index].partnerName = credentials.name
                users[person1Index].coupleId = targetCouple.id
              }
              
              // 更新当前用户
              const currentUserIndex = users.findIndex((u: any) => u.id === userId)
              if (currentUserIndex !== -1) {
                users[currentUserIndex] = { ...users[currentUserIndex], ...newUser }
              }
              
              LocalStorage.setItem(STORAGE_KEYS.USERS, users)
              LocalStorage.setItem(STORAGE_KEYS.COUPLES, couples)
              
              couple = targetCouple
            }
          }
          
          set({ 
            user: newUser,
            couple,
            isAuthenticated: true,
            isLoading: false 
          })
          
          return { 
            success: true, 
            message: couple ? '注册成功并已加入情侣！' : '注册成功' 
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, message: '注册失败，请重试' }
        }
      },

      logout: () => {
        set({ 
          user: null, 
          couple: null, 
          isAuthenticated: false, 
          isLoading: false 
        })
      },

      generateInviteCode: async () => {
        const { user } = get()
        if (!user) {
          return { success: false, message: '请先登录' }
        }
        
        set({ isLoading: true })
        await delay(500)
        
        try {
          const couples = LocalStorage.getItem(STORAGE_KEYS.COUPLES, []) as any[]
          
          // 检查用户是否已有情侣
          const existingCouple = couples.find((c: any) => 
            c.person1Id === user.id || c.person2Id === user.id
          )
          
          if (existingCouple && existingCouple.isComplete) {
            set({ isLoading: false })
            return { success: false, message: '您已经有情侣了' }
          }
          
          let couple: Couple
          
          if (existingCouple && !existingCouple.isComplete) {
            // 使用现有的未完成情侣记录
            couple = existingCouple
          } else {
            // 创建新的情侣记录
            const coupleId = generateId()
            const inviteCode = generateInviteCode()
            const now = new Date().toISOString()
            
            couple = {
              id: coupleId,
              inviteCode,
              person1Id: user.id,
              person1Name: user.name,
              createdAt: now,
              updatedAt: now,
              isComplete: false
            }
            
            couples.push(couple)
            
            // 更新用户信息
            const users = LocalStorage.getItem(STORAGE_KEYS.USERS, []) as any[]
            const userIndex = users.findIndex((u: any) => u.id === user.id)
            if (userIndex !== -1) {
              users[userIndex].coupleId = coupleId
            }
            
            LocalStorage.setItem(STORAGE_KEYS.USERS, users)
          }
          
          LocalStorage.setItem(STORAGE_KEYS.COUPLES, couples)
          
          set({ couple, isLoading: false })
          
          const inviteLink = `${window.location.origin}/register?invite=${couple.inviteCode}`
          
          return {
            success: true,
            code: couple.inviteCode,
            link: inviteLink,
            message: '邀请码生成成功'
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
        await delay(500)
        
        try {
          const couples = LocalStorage.getItem(STORAGE_KEYS.COUPLES, []) as any[]
          const targetCouple = couples.find((c: any) => 
            c.inviteCode === code && !c.isComplete
          )
          
          if (!targetCouple) {
            set({ isLoading: false })
            return { success: false, message: '邀请码无效或已过期' }
          }
          
          if (targetCouple.person1Id === user.id) {
            set({ isLoading: false })
            return { success: false, message: '不能加入自己创建的情侣' }
          }
          
          // 更新情侣信息
          targetCouple.person2Id = user.id
          targetCouple.person2Name = user.name
          targetCouple.isComplete = true
          targetCouple.updatedAt = new Date().toISOString()
          
          // 更新用户信息
          const users = LocalStorage.getItem(STORAGE_KEYS.USERS, []) as any[]
          
          // 更新当前用户
          const currentUserIndex = users.findIndex((u: any) => u.id === user.id)
          if (currentUserIndex !== -1) {
            users[currentUserIndex].coupleId = targetCouple.id
            users[currentUserIndex].partnerId = targetCouple.person1Id
            users[currentUserIndex].partnerName = targetCouple.person1Name
            users[currentUserIndex].role = 'person2'
          }
          
          // 更新伙伴用户
          const partnerIndex = users.findIndex((u: any) => u.id === targetCouple.person1Id)
          if (partnerIndex !== -1) {
            users[partnerIndex].partnerId = user.id
            users[partnerIndex].partnerName = user.name
          }
          
          LocalStorage.setItem(STORAGE_KEYS.USERS, users)
          LocalStorage.setItem(STORAGE_KEYS.COUPLES, couples)
          
          // 更新状态
          const updatedUser = users[currentUserIndex]
          set({ 
            user: { ...updatedUser, password: undefined },
            couple: targetCouple,
            isLoading: false 
          })
          
          return { success: true, message: '成功加入情侣！' }
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
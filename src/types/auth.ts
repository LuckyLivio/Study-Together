// 用户认证相关类型定义

export interface User {
  id: string
  username?: string
  email: string
  name: string
  displayName?: string
  avatar?: string
  bio?: string
  gender: 'male' | 'female' | 'MALE' | 'FEMALE' | 'OTHER' // 性别：男性或女性
  role: 'person1' | 'person2' | 'USER' | 'ADMIN' | 'MODERATOR' | 'COUPLE' // 用户角色
  status?: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'PENDING'
  createdAt: string
  updatedAt: string
  lastLogin?: string
  // 情侣相关
  coupleId?: string
  partnerId?: string
  partnerName?: string
  // 系统权限
  isAdmin?: boolean // 是否为管理员
}

export interface Couple {
  id: string
  inviteCode: string
  person1Id?: string
  person2Id?: string
  person1Name?: string
  person2Name?: string
  createdAt: string
  updatedAt: string
  isComplete: boolean // 是否已配对完成
}

export interface AuthState {
  user: User | null
  couple: Couple | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
  gender: 'male' | 'female' | 'other' // 性别选择
  inviteCode?: string // 可选的情侣邀请码
}

export interface CoupleInvite {
  code: string
  inviterName: string
  expiresAt: string
  isUsed: boolean
}

// API 响应类型
export interface AuthResponse {
  success: boolean
  message: string
  user?: User
  couple?: Couple
  token?: string
}

export interface CoupleBindingResponse {
  success: boolean
  message: string
  couple?: Couple
  inviteCode?: string
  inviteLink?: string
}
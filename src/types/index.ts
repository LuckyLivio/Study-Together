// 用户相关类型
export interface User {
  id: string
  username: string
  email: string
  coupleId?: string
  createdAt: Date
  updatedAt: Date
}

// 情侣相关类型
export interface Couple {
  id: string
  inviteCode: string
  person1Id: string
  person2Id?: string
  createdAt: Date
  updatedAt: Date
}

// 学习任务类型
export interface StudyTask {
  id: string
  userId: string
  title: string
  description?: string
  completed: boolean
  date: Date
  pomodoroCount?: number
  createdAt: Date
  updatedAt: Date
}

// 倒计时目标类型
export interface CountdownTarget {
  id: string
  userId: string
  title: string
  targetDate: Date
  type: 'exam' | 'goal' | 'other'
  createdAt: Date
  updatedAt: Date
}

// 课程类型
export interface Course {
  id: string
  userId: string
  name: string
  startTime: string
  endTime: string
  dayOfWeek: number // 0-6, 0为周日
  color?: string
  location?: string
  rating?: number
  review?: string
  createdAt: Date
  updatedAt: Date
}

// 文件分享类型
export interface SharedFile {
  id: string
  userId: string
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  isShared: boolean
  tags?: string[]
  description?: string
  createdAt: Date
  updatedAt: Date
}

// 留言类型
export interface Message {
  id: string
  fromUserId: string
  toUserId: string
  content: string
  type: 'text' | 'emoji' | 'image'
  createdAt: Date
  updatedAt: Date
}

// 项目进展类型
export interface Project {
  id: string
  userId: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  progress: number // 0-100
  screenshots?: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}
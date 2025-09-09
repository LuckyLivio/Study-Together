'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, Target, Edit, Save, X, BookOpen, GraduationCap, Briefcase, Trophy } from 'lucide-react'
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { toast } from 'sonner'

interface ExamGoal {
  id: string
  title: string
  description?: string
  examType: 'POSTGRADUATE' | 'CIVIL_SERVICE' | 'TOEFL' | 'IELTS' | 'CET' | 'OTHER'
  targetDate: Date
  isActive: boolean
  studyStartDate: Date
  totalStudyDays: number
  currentProgress: number // 0-100
  createdAt: Date
  updatedAt: Date
}

interface DDayCountdownProps {
  goals: ExamGoal[]
  onGoalCreate?: (data: Omit<ExamGoal, 'id' | 'createdAt' | 'updatedAt'>) => void
  onGoalUpdate?: (goalId: string, data: Partial<ExamGoal>) => void
  onGoalDelete?: (goalId: string) => void
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
  totalDays: number
}

const examTypeLabels = {
  POSTGRADUATE: '考研',
  CIVIL_SERVICE: '考公',
  TOEFL: '托福',
  IELTS: '雅思',
  CET: '四六级',
  OTHER: '其他'
}

const examTypeIcons = {
  POSTGRADUATE: GraduationCap,
  CIVIL_SERVICE: Briefcase,
  TOEFL: BookOpen,
  IELTS: BookOpen,
  CET: BookOpen,
  OTHER: Target
}

const examTypeColors = {
  POSTGRADUATE: 'from-blue-500 to-purple-600',
  CIVIL_SERVICE: 'from-green-500 to-teal-600',
  TOEFL: 'from-red-500 to-pink-600',
  IELTS: 'from-yellow-500 to-orange-600',
  CET: 'from-indigo-500 to-blue-600',
  OTHER: 'from-gray-500 to-gray-600'
}

function calculateTimeRemaining(targetDate: Date, studyStartDate: Date): TimeRemaining {
  const now = new Date()
  const target = new Date(targetDate)
  const studyStart = new Date(studyStartDate)
  
  const totalDays = differenceInDays(target, studyStart)
  const remainingMs = target.getTime() - now.getTime()
  
  if (remainingMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      totalDays
    }
  }
  
  const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000)
  
  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    totalDays
  }
}

export default function DDayCountdown({ goals, onGoalCreate, onGoalUpdate, onGoalDelete }: DDayCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: TimeRemaining }>({})
  const [isCreating, setIsCreating] = useState(false)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    examType: 'POSTGRADUATE' as const,
    targetDate: '',
    studyStartDate: new Date().toISOString().split('T')[0],
    currentProgress: 0
  })
  
  // 更新倒计时
  useEffect(() => {
    const updateCountdowns = () => {
      const newTimeRemaining: { [key: string]: TimeRemaining } = {}
      goals.forEach(goal => {
        if (goal.isActive) {
          newTimeRemaining[goal.id] = calculateTimeRemaining(goal.targetDate, goal.studyStartDate)
        }
      })
      setTimeRemaining(newTimeRemaining)
    }
    
    updateCountdowns()
    const interval = setInterval(updateCountdowns, 1000)
    
    return () => clearInterval(interval)
  }, [goals])
  
  const handleCreateGoal = async () => {
    if (!newGoal.title || !newGoal.targetDate) {
      toast.error('请填写目标名称和考试日期')
      return
    }
    
    const studyStart = new Date(newGoal.studyStartDate)
    const examDate = new Date(newGoal.targetDate)
    const totalDays = differenceInDays(examDate, studyStart)
    
    if (totalDays <= 0) {
      toast.error('考试日期必须晚于开始学习日期')
      return
    }
    
    const goalData: Omit<ExamGoal, 'id' | 'createdAt' | 'updatedAt'> = {
      title: newGoal.title,
      description: newGoal.description || undefined,
      examType: newGoal.examType,
      targetDate: examDate,
      studyStartDate: studyStart,
      totalStudyDays: totalDays,
      currentProgress: newGoal.currentProgress,
      isActive: true
    }
    
    onGoalCreate?.(goalData)
    setNewGoal({
      title: '',
      description: '',
      examType: 'POSTGRADUATE',
      targetDate: '',
      studyStartDate: new Date().toISOString().split('T')[0],
      currentProgress: 0
    })
    setIsCreating(false)
    toast.success('考试目标创建成功')
  }
  
  const handleUpdateProgress = (goalId: string, progress: number) => {
    onGoalUpdate?.(goalId, { currentProgress: progress })
    toast.success('学习进度已更新')
  }
  
  const handleToggleActive = (goalId: string, isActive: boolean) => {
    onGoalUpdate?.(goalId, { isActive })
  }
  
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600'
    if (progress >= 60) return 'text-blue-600'
    if (progress >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  const getDDayStatus = (days: number) => {
    if (days === 0) return 'D-Day'
    if (days > 0) return `D-${days}`
    return `D+${Math.abs(days)}`
  }
  
  const activeGoals = goals.filter(goal => goal.isActive)
  
  return (
    <div className="space-y-6">
      {/* 创建新目标 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              D-Day 考试倒计时
            </CardTitle>
            {!isCreating && (
              <Button
                onClick={() => setIsCreating(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Target className="h-4 w-4 mr-2" />
                新建考试目标
              </Button>
            )}
          </div>
        </CardHeader>
        
        {isCreating && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="examTitle">考试名称</Label>
                <Input
                  id="examTitle"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="例：2024年考研、国考等"
                />
              </div>
              <div>
                <Label htmlFor="examType">考试类型</Label>
                <select
                  id="examType"
                  value={newGoal.examType}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, examType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="POSTGRADUATE">考研</option>
                  <option value="CIVIL_SERVICE">考公</option>
                  <option value="TOEFL">托福</option>
                  <option value="IELTS">雅思</option>
                  <option value="CET">四六级</option>
                  <option value="OTHER">其他</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="examDescription">考试描述（可选）</Label>
              <Input
                id="examDescription"
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="详细描述考试信息"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studyStartDate">开始学习日期</Label>
                <Input
                  id="studyStartDate"
                  type="date"
                  value={newGoal.studyStartDate}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, studyStartDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="examDate">考试日期</Label>
                <Input
                  id="examDate"
                  type="datetime-local"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="currentProgress">当前学习进度 ({newGoal.currentProgress}%)</Label>
              <input
                id="currentProgress"
                type="range"
                min="0"
                max="100"
                value={newGoal.currentProgress}
                onChange={(e) => setNewGoal(prev => ({ ...prev, currentProgress: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCreateGoal} size="sm">
                <Save className="h-4 w-4 mr-2" />
                创建目标
              </Button>
              <Button
                onClick={() => {
                  setIsCreating(false)
                  setNewGoal({
                    title: '',
                    description: '',
                    examType: 'POSTGRADUATE',
                    targetDate: '',
                    studyStartDate: new Date().toISOString().split('T')[0],
                    currentProgress: 0
                  })
                }}
                size="sm"
                variant="outline"
              >
                <X className="h-4 w-4 mr-2" />
                取消
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* 活跃目标展示 */}
      {activeGoals.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeGoals.map(goal => {
            const time = timeRemaining[goal.id]
            if (!time) return null
            
            const IconComponent = examTypeIcons[goal.examType]
            const gradientColor = examTypeColors[goal.examType]
            const passedDays = time.totalDays - time.days
            const progressFromTime = time.totalDays > 0 ? (passedDays / time.totalDays) * 100 : 0
            
            return (
              <Card key={goal.id} className={`overflow-hidden ${time.isExpired ? 'border-red-300' : 'border-gray-200'}`}>
                {/* 头部渐变背景 */}
                <div className={`bg-gradient-to-r ${gradientColor} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-6 w-6" />
                      <div>
                        <h3 className="font-semibold text-lg">{goal.title}</h3>
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {examTypeLabels[goal.examType]}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleToggleActive(goal.id, false)}
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* D-Day 显示 */}
                  <div className="mt-4 text-center">
                    <div className="text-3xl font-bold">
                      {time.isExpired ? '已结束' : getDDayStatus(time.days)}
                    </div>
                    {!time.isExpired && (
                      <div className="text-sm opacity-90">
                        {format(new Date(goal.targetDate), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                      </div>
                    )}
                  </div>
                </div>
                
                <CardContent className="p-4 space-y-4">
                  {goal.description && (
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  )}
                  
                  {/* 倒计时详情 */}
                  {!time.isExpired && (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-gray-700">{time.days}</div>
                        <div className="text-xs text-gray-500">天</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-gray-700">{time.hours}</div>
                        <div className="text-xs text-gray-500">时</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-gray-700">{time.minutes}</div>
                        <div className="text-xs text-gray-500">分</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-gray-700">{time.seconds}</div>
                        <div className="text-xs text-gray-500">秒</div>
                      </div>
                    </div>
                  )}
                  
                  {/* 学习进度 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">学习进度</span>
                      <span className={`text-sm font-semibold ${getProgressColor(goal.currentProgress)}`}>
                        {goal.currentProgress}%
                      </span>
                    </div>
                    <Progress value={goal.currentProgress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>时间进度: {Math.round(progressFromTime * 10) / 10}%</span>
                      <span>已过 {passedDays}/{time.totalDays} 天</span>
                    </div>
                  </div>
                  
                  {/* 进度更新 */}
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={goal.currentProgress}
                      onChange={(e) => handleUpdateProgress(goal.id, parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  {/* 状态提示 */}
                  <div className="text-center p-2 rounded-lg bg-gray-50">
                    {time.isExpired ? (
                      <span className="text-red-600 font-medium">考试已结束</span>
                    ) : goal.currentProgress >= progressFromTime ? (
                      <span className="text-green-600 font-medium">学习进度超前，继续保持！</span>
                    ) : (
                      <span className="text-orange-600 font-medium">需要加快学习进度</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有考试目标</h3>
            <p className="text-gray-500 mb-4">创建你的第一个考试倒计时，开始高效备考之旅</p>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Target className="h-4 w-4 mr-2" />
              创建考试目标
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
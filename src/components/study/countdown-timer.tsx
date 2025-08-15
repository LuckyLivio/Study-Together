'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Target, Edit, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface StudyGoal {
  id: string
  title: string
  description?: string
  targetDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface CountdownTimerProps {
  goals: StudyGoal[]
  onGoalUpdate?: (goalId: string, data: Partial<StudyGoal>) => void
  onGoalCreate?: (data: Omit<StudyGoal, 'id' | 'createdAt' | 'updatedAt'>) => void
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

function calculateTimeRemaining(targetDate: Date): TimeRemaining {
  const now = new Date().getTime()
  const target = new Date(targetDate).getTime()
  const difference = target - now

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true
    }
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24))
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((difference % (1000 * 60)) / 1000)

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false
  }
}

export default function CountdownTimer({ goals, onGoalUpdate, onGoalCreate }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: TimeRemaining }>({})
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: ''
  })

  // 更新倒计时
  useEffect(() => {
    const updateCountdowns = () => {
      const newTimeRemaining: { [key: string]: TimeRemaining } = {}
      goals.forEach(goal => {
        if (goal.isActive) {
          newTimeRemaining[goal.id] = calculateTimeRemaining(goal.targetDate)
        }
      })
      setTimeRemaining(newTimeRemaining)
    }

    updateCountdowns()
    const interval = setInterval(updateCountdowns, 1000)

    return () => clearInterval(interval)
  }, [goals])

  const handleCreateGoal = () => {
    if (!newGoal.title || !newGoal.targetDate) return

    const goalData = {
      title: newGoal.title,
      description: newGoal.description || undefined,
      targetDate: new Date(newGoal.targetDate),
      isActive: true
    }

    onGoalCreate?.(goalData)
    setNewGoal({ title: '', description: '', targetDate: '' })
    setIsCreating(false)
  }

  const handleToggleActive = (goalId: string, isActive: boolean) => {
    onGoalUpdate?.(goalId, { isActive })
  }

  const activeGoals = goals.filter(goal => goal.isActive)

  return (
    <div className="space-y-4">
      {/* 创建新目标 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              学习目标倒计时
            </CardTitle>
            {!isCreating && (
              <Button
                onClick={() => setIsCreating(true)}
                size="sm"
                variant="outline"
              >
                <Target className="h-4 w-4 mr-2" />
                新建目标
              </Button>
            )}
          </div>
        </CardHeader>
        
        {isCreating && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="goalTitle">目标名称</Label>
              <Input
                id="goalTitle"
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="例：考研、考公、托福等"
              />
            </div>
            <div>
              <Label htmlFor="goalDescription">目标描述（可选）</Label>
              <Input
                id="goalDescription"
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="详细描述你的目标"
              />
            </div>
            <div>
              <Label htmlFor="targetDate">目标日期</Label>
              <Input
                id="targetDate"
                type="datetime-local"
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateGoal} size="sm">
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
              <Button
                onClick={() => {
                  setIsCreating(false)
                  setNewGoal({ title: '', description: '', targetDate: '' })
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

      {/* 活跃目标倒计时 */}
      {activeGoals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {activeGoals.map(goal => {
            const time = timeRemaining[goal.id]
            if (!time) return null

            return (
              <Card key={goal.id} className={`${time.isExpired ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <Button
                      onClick={() => handleToggleActive(goal.id, false)}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {goal.description && (
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      目标日期：{format(new Date(goal.targetDate), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                    </div>
                    
                    {time.isExpired ? (
                      <div className="text-center py-4">
                        <Badge variant="destructive" className="text-lg px-4 py-2">
                          目标已到期
                        </Badge>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-2xl font-bold text-blue-600">{time.days}</div>
                          <div className="text-xs text-gray-500">天</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-2xl font-bold text-blue-600">{time.hours}</div>
                          <div className="text-xs text-gray-500">时</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-2xl font-bold text-blue-600">{time.minutes}</div>
                          <div className="text-xs text-gray-500">分</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-2xl font-bold text-blue-600">{time.seconds}</div>
                          <div className="text-xs text-gray-500">秒</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无活跃的学习目标</p>
            <p className="text-sm text-gray-400 mt-2">点击上方"新建目标"开始设置你的学习倒计时</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
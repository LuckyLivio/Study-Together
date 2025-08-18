'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, BookOpen, Clock, Target, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import StudyPlanCard from './study-plan-card'
import CountdownTimer from './countdown-timer'
import PomodoroTimer from './pomodoro-timer'
import DailyCheckin from './daily-checkin'
import StudyProgressSync from './study-progress-sync'
import DDayCountdown from './dday-countdown'

interface StudyTask {
  id: string
  title: string
  description?: string
  taskType: 'CHECKIN' | 'POMODORO' | 'READING' | 'EXERCISE' | 'REVIEW' | 'OTHER'
  duration?: number
  isCompleted: boolean
  completedAt?: string
}

interface StudyPlan {
  id: string
  title: string
  description?: string
  planDate: string
  tasks: StudyTask[]
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

interface StudyGoal {
  id: string
  title: string
  description?: string
  targetDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export default function StudyTaskManager() {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([])
  const [studyGoals, setStudyGoals] = useState<StudyGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    planDate: new Date().toISOString().split('T')[0],
    tasks: [] as Omit<StudyTask, 'id' | 'completedAt'>[]
  })

  // 获取学习计划
  const fetchStudyPlans = async () => {
    try {
      const response = await fetch('/api/study/plans')
      if (response.ok) {
        const data = await response.json()
        setStudyPlans(data.plans || [])
      }
    } catch (error) {
      console.error('获取学习计划失败:', error)
      toast.error('获取学习计划失败')
    }
  }

  // 获取学习目标
  const fetchStudyGoals = async () => {
    try {
      const response = await fetch('/api/study/goals')
      if (response.ok) {
        const data = await response.json()
        setStudyGoals(data.goals || [])
      }
    } catch (error) {
      console.error('获取学习目标失败:', error)
      toast.error('获取学习目标失败')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchStudyPlans(), fetchStudyGoals()])
      setLoading(false)
    }
    loadData()
  }, [])

  // 创建学习计划
  const handleCreatePlan = async () => {
    if (!newPlan.title) {
      toast.error('请输入计划标题')
      return
    }

    try {
      const response = await fetch('/api/study/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newPlan.title,
          description: newPlan.description || undefined,
          planDate: new Date(newPlan.planDate),
          tasks: newPlan.tasks
        })
      })

      if (response.ok) {
        toast.success('学习计划创建成功')
        setNewPlan({
          title: '',
          description: '',
          planDate: new Date().toISOString().split('T')[0],
          tasks: []
        })
        setIsCreatingPlan(false)
        await fetchStudyPlans()
      } else {
        const error = await response.json()
        toast.error(error.message || '创建学习计划失败')
      }
    } catch (error) {
      console.error('创建学习计划失败:', error)
      toast.error('创建学习计划失败')
    }
  }

  // 创建学习目标
  const handleCreateGoal = async (goalData: Omit<StudyGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/study/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(goalData)
      })

      if (response.ok) {
        toast.success('学习目标创建成功')
        await fetchStudyGoals()
      } else {
        const error = await response.json()
        toast.error(error.message || '创建学习目标失败')
      }
    } catch (error) {
      console.error('创建学习目标失败:', error)
      toast.error('创建学习目标失败')
    }
  }

  // 更新学习目标
  const handleUpdateGoal = async (goalId: string, data: Partial<StudyGoal>) => {
    try {
      const response = await fetch(`/api/study/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchStudyGoals()
      } else {
        const error = await response.json()
        toast.error(error.message || '更新学习目标失败')
      }
    } catch (error) {
      console.error('更新学习目标失败:', error)
      toast.error('更新学习目标失败')
    }
  }

  // 切换任务完成状态
  const handleTaskToggle = async (taskId: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/study/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isCompleted })
      })

      if (response.ok) {
        await fetchStudyPlans()
        toast.success(isCompleted ? '任务已完成' : '任务已取消完成')
      } else {
        const error = await response.json()
        toast.error(error.message || '更新任务状态失败')
      }
    } catch (error) {
      console.error('更新任务状态失败:', error)
      toast.error('更新任务状态失败')
    }
  }

  // 添加任务到新计划
  const addTaskToPlan = () => {
    const newTask = {
      title: '新任务',
      taskType: 'READING' as const,
      duration: 25,
      isCompleted: false
    }
    setNewPlan(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }))
  }

  // 更新计划中的任务
  const updatePlanTask = (index: number, field: string, value: any) => {
    setNewPlan(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }))
  }

  // 删除计划中的任务
  const removePlanTask = (index: number) => {
    setNewPlan(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            学习计划
          </TabsTrigger>
          <TabsTrigger value="pomodoro" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            番茄时间
          </TabsTrigger>
          <TabsTrigger value="checkin" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            每日打卡
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            目标倒计时
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          {/* 创建新计划 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  学习计划管理
                </CardTitle>
                {!isCreatingPlan && (
                  <Button
                    onClick={() => setIsCreatingPlan(true)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新建计划
                  </Button>
                )}
              </div>
            </CardHeader>
            
            {isCreatingPlan && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="planTitle">计划标题</Label>
                    <Input
                      id="planTitle"
                      value={newPlan.title}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="今日学习计划"
                    />
                  </div>
                  <div>
                    <Label htmlFor="planDate">计划日期</Label>
                    <Input
                      id="planDate"
                      type="date"
                      value={newPlan.planDate}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, planDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="planDescription">计划描述（可选）</Label>
                  <Textarea
                    id="planDescription"
                    value={newPlan.description}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="描述今天的学习目标和重点"
                    rows={3}
                  />
                </div>

                {/* 任务列表 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>学习任务</Label>
                    <Button
                      onClick={addTaskToPlan}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      添加任务
                    </Button>
                  </div>
                  
                  {newPlan.tasks.map((task, index) => (
                    <div key={index} className="border rounded-lg p-4 mb-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label>任务名称</Label>
                          <Input
                            value={task.title}
                            onChange={(e) => updatePlanTask(index, 'title', e.target.value)}
                            placeholder="学习任务"
                          />
                        </div>
                        <div>
                          <Label>任务类型</Label>
                          <select
                            value={task.taskType}
                            onChange={(e) => updatePlanTask(index, 'taskType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="READING">阅读</option>
                            <option value="EXERCISE">练习</option>
                            <option value="REVIEW">复习</option>
                            <option value="POMODORO">番茄时间</option>
                            <option value="CHECKIN">打卡</option>
                            <option value="OTHER">其他</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label>时长(分钟)</Label>
                            <Input
                              type="number"
                              value={task.duration}
                              onChange={(e) => updatePlanTask(index, 'duration', parseInt(e.target.value) || 0)}
                              min="1"
                              max="480"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              onClick={() => removePlanTask(index)}
                              size="sm"
                              variant="destructive"
                            >
                              删除
                            </Button>
                          </div>
                        </div>
                      </div>
                      {task.description && (
                        <div className="mt-3">
                          <Label>任务描述</Label>
                          <Textarea
                            value={task.description}
                            onChange={(e) => updatePlanTask(index, 'description', e.target.value)}
                            placeholder="详细描述这个任务"
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreatePlan}>
                    创建计划
                  </Button>
                  <Button
                    onClick={() => {
                      setIsCreatingPlan(false)
                      setNewPlan({
                        title: '',
                        description: '',
                        planDate: new Date().toISOString().split('T')[0],
                        tasks: []
                      })
                    }}
                    variant="outline"
                  >
                    取消
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 学习计划列表 */}
          {studyPlans.length > 0 ? (
            <div className="grid gap-4">
              {studyPlans.map(plan => (
                <StudyPlanCard
                  key={plan.id}
                  plan={plan}
                  onTaskToggle={handleTaskToggle}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暂无学习计划</p>
                <p className="text-sm text-gray-400 mt-2">点击上方"新建计划"开始制定你的学习计划</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pomodoro" className="space-y-4">
          <PomodoroTimer />
        </TabsContent>
        
        <TabsContent value="checkin" className="space-y-4">
          <DailyCheckin />
          <StudyProgressSync onSync={() => {
            // 同步完成后刷新数据
            fetchStudyPlans()
            fetchStudyGoals()
          }} />
        </TabsContent>
        
        <TabsContent value="goals">
          <DDayCountdown
            goals={studyGoals.map(goal => {
              const targetDate = new Date(goal.targetDate)
              const startDate = new Date(goal.createdAt)
              const totalDays = Math.max(1, Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
              
              return {
                ...goal,
                examType: 'OTHER' as const,
                studyStartDate: startDate,
                totalStudyDays: totalDays,
                currentProgress: 0,
                targetDate: targetDate
              }
            })}
            onGoalCreate={(data) => {
              const goalData = {
                title: data.title,
                description: data.description,
                targetDate: data.targetDate,
                isActive: data.isActive
              }
              handleCreateGoal(goalData)
            }}
            onGoalUpdate={(goalId, data) => {
              const updateData: any = {}
              if (data.isActive !== undefined) updateData.isActive = data.isActive
              if (data.title) updateData.title = data.title
              if (data.description !== undefined) updateData.description = data.description
              if (data.targetDate) updateData.targetDate = data.targetDate
              handleUpdateGoal(goalId, updateData)
            }}
          />
          
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">简单目标倒计时</h3>
            <CountdownTimer
              goals={studyGoals}
              onGoalCreate={handleCreateGoal}
              onGoalUpdate={handleUpdateGoal}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
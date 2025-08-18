'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Clock, CheckCircle, Circle, Timer, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { toast } from 'sonner'
import { LocalStorage, STORAGE_KEYS } from '@/lib/storage'

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
  isCompleted: boolean
  tasks: StudyTask[]
}

interface StudyPlanCardProps {
  plan: StudyPlan
  onTaskToggle: (taskId: string, isCompleted: boolean) => void
  onPlanUpdate?: () => void
}

const taskTypeLabels = {
  CHECKIN: '打卡',
  POMODORO: '番茄时间',
  READING: '阅读',
  EXERCISE: '练习',
  REVIEW: '复习',
  OTHER: '其他'
}

const taskTypeColors = {
  CHECKIN: 'bg-green-100 text-green-800',
  POMODORO: 'bg-red-100 text-red-800',
  READING: 'bg-blue-100 text-blue-800',
  EXERCISE: 'bg-yellow-100 text-yellow-800',
  REVIEW: 'bg-purple-100 text-purple-800',
  OTHER: 'bg-gray-100 text-gray-800'
}

export default function StudyPlanCard({ plan, onTaskToggle, onPlanUpdate }: StudyPlanCardProps) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    taskType: 'READING' as StudyTask['taskType'],
    duration: 30
  })
  const [editTask, setEditTask] = useState<{
    title: string
    description: string
    taskType: StudyTask['taskType']
    duration: number
  }>({
    title: '',
    description: '',
    taskType: 'READING',
    duration: 30
  })

  // 获取认证头
  const getAuthHeaders = () => {
    // 删除请求不需要Authorization头，因为后端会从cookie中获取token
    // 这样可以避免token获取的复杂性
    console.log('发送删除请求，依赖cookie中的auth-token')
    console.log('当前cookie:', document.cookie)
    
    return {
      'Content-Type': 'application/json'
    }
  }
  
  const completedTasks = plan.tasks.filter(task => task.isCompleted).length
  const totalTasks = plan.tasks.length
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

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
        onTaskToggle(taskId, isCompleted)
      }
    } catch (error) {
      console.error('更新任务状态失败:', error)
    }
  }

  // 添加新任务
  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('请输入任务标题')
      return
    }

    try {
      const response = await fetch('/api/study/tasks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...newTask,
          planId: plan.id
        })
      })

      if (response.ok) {
        toast.success('任务添加成功')
        setNewTask({ title: '', description: '', taskType: 'READING', duration: 30 })
        setIsAddingTask(false)
        onPlanUpdate?.()
      } else {
        const error = await response.json()
        toast.error(error.message || '添加任务失败')
      }
    } catch (error) {
      console.error('添加任务失败:', error)
      toast.error('添加任务失败')
    }
  }

  // 开始编辑任务
  const startEditTask = (task: StudyTask) => {
    setEditingTaskId(task.id)
    setEditTask({
      title: task.title,
      description: task.description || '',
      taskType: task.taskType,
      duration: task.duration || 30
    })
  }

  // 保存编辑的任务
  const handleSaveEdit = async () => {
    if (!editTask.title.trim()) {
      toast.error('请输入任务标题')
      return
    }

    try {
      const response = await fetch(`/api/study/tasks/${editingTaskId}/update`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: editTask.title,
          description: editTask.description,
          taskType: editTask.taskType,
          duration: editTask.duration
        })
      })

      if (response.ok) {
        toast.success('任务更新成功')
        setEditingTaskId(null)
        setEditTask({
          title: '',
          description: '',
          taskType: 'READING',
          duration: 30
        })
        onPlanUpdate?.()
      } else {
        const error = await response.json()
        toast.error(error.message || '更新任务失败')
      }
    } catch (error) {
      console.error('更新任务失败:', error)
      toast.error('更新任务失败')
    }
  }

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) {
      return
    }

    try {
      console.log('开始删除任务:', taskId)
      const headers = getAuthHeaders()
      console.log('请求头:', headers)
      
      const response = await fetch(`/api/study/tasks/${taskId}/delete`, {
        method: 'DELETE',
        headers
      })

      console.log('删除响应状态:', response.status)
      
      if (response.ok) {
        toast.success('任务删除成功')
        onPlanUpdate?.()
      } else {
        const error = await response.json()
        console.error('删除失败响应:', error)
        toast.error(error.error || '删除任务失败')
      }
    } catch (error) {
      console.error('删除任务失败:', error)
      toast.error('删除任务失败')
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{plan.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {completedTasks}/{totalTasks} 完成
            </Badge>
            <div className="text-sm text-muted-foreground">
              {format(new Date(plan.planDate), 'MM月dd日', { locale: zhCN })}
            </div>
            <Button
              onClick={() => setIsAddingTask(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {plan.description && (
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        )}
        
        {/* 进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* 添加新任务表单 */}
          {isAddingTask && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">任务名称</Label>
                    <Input
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="输入任务名称"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">任务类型</Label>
                    <select
                      value={newTask.taskType}
                      onChange={(e) => setNewTask(prev => ({ ...prev, taskType: e.target.value as any }))}
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
                </div>
                <div>
                  <Label className="text-sm">时长(分钟)</Label>
                  <Input
                    type="number"
                    value={newTask.duration}
                    onChange={(e) => setNewTask(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                    min="1"
                    max="480"
                  />
                </div>
                <div>
                  <Label className="text-sm">任务描述（可选）</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="描述任务详情"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddTask} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingTask(false)
                      setNewTask({ title: '', description: '', taskType: 'READING', duration: 30 })
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <X className="h-4 w-4 mr-2" />
                    取消
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 任务列表 */}
          {plan.tasks.map((task) => (
            <div key={task.id} className="border rounded-lg p-3">
              {editingTaskId === task.id ? (
                // 编辑模式
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">任务名称</Label>
                      <Input
                       value={editTask.title || ''}
                       onChange={(e) => setEditTask(prev => ({ ...prev, title: e.target.value }))}
                       placeholder="输入任务名称"
                     />
                    </div>
                    <div>
                      <Label className="text-sm">任务类型</Label>
                      <select
                       value={editTask.taskType || 'READING'}
                       onChange={(e) => setEditTask(prev => ({ ...prev, taskType: e.target.value as StudyTask['taskType'] }))}
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
                  </div>
                  <div>
                    <Label className="text-sm">时长(分钟)</Label>
                    <Input
                     type="number"
                     value={editTask.duration || 30}
                     onChange={(e) => setEditTask(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                     min="1"
                     max="480"
                   />
                  </div>
                  <div>
                    <Label className="text-sm">任务描述（可选）</Label>
                    <Textarea
                     value={editTask.description || ''}
                     onChange={(e) => setEditTask(prev => ({ ...prev, description: e.target.value }))}
                     placeholder="描述任务详情"
                     rows={2}
                   />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      保存
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingTaskId(null)
                        setEditTask({
                          title: '',
                          description: '',
                          taskType: 'READING',
                          duration: 30
                        })
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-4 w-4 mr-2" />
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                // 显示模式
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={task.isCompleted}
                    onCheckedChange={(checked: boolean) => handleTaskToggle(task.id, checked as boolean)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </span>
                      <Badge className={`text-xs ${taskTypeColors[task.taskType]}`}>
                        {taskTypeLabels[task.taskType]}
                      </Badge>
                      {task.duration && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Timer className="h-3 w-3" />
                          {task.duration}分钟
                        </div>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {task.isCompleted && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    <Button
                      onClick={() => startEditTask(task)}
                      size="sm"
                      variant="ghost"
                      disabled={task.isCompleted}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteTask(task.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {plan.tasks.length === 0 && !isAddingTask && (
            <div className="text-center text-muted-foreground py-4">
              <p>暂无学习任务</p>
              <p className="text-sm mt-1">点击右上角的 + 按钮添加任务</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
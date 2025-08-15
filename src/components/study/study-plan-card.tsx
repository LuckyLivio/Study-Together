'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Clock, CheckCircle, Circle, Timer } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

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

export default function StudyPlanCard({ plan, onTaskToggle }: StudyPlanCardProps) {
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
          {plan.tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
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
              
              {task.isCompleted && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          ))}
          
          {plan.tasks.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              暂无学习任务
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
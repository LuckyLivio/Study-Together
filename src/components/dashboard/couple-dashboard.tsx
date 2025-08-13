'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { siteConfig } from '@/lib/config'
import { useSiteConfig } from '@/lib/use-site-config'
import { useAuthStore } from '@/lib/auth-store'
import { useUserStore, useTaskStore, useCountdownStore } from '@/lib/store'
import { Heart, Calendar, Target, BookOpen, Clock, Users, Plus } from 'lucide-react'
import Link from 'next/link'

// 个人仪表盘组件
interface PersonDashboardProps {
  person: 'person1' | 'person2'
  name: string
  color: string
}

function PersonDashboard({ person, name, color }: PersonDashboardProps) {
  const { tasks } = useTaskStore()
  const { targets } = useCountdownStore()
  
  // 模拟数据
  const todayTasks = tasks.filter(task => 
    new Date(task.date).toDateString() === new Date().toDateString()
  )
  const completedTasks = todayTasks.filter(task => task.completed)
  const mainTarget = targets[0] // 主要目标
  
  const getDaysUntilTarget = (targetDate: Date) => {
    const now = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      {/* 个人信息卡片 */}
      <Card className="border-2" style={{ borderColor: color }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2" style={{ color }}>
            <Heart className="h-5 w-5" fill={color} />
            {name}的学习仪表盘
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            今天是 {new Date().toLocaleDateString('zh-CN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </div>
        </CardContent>
      </Card>

      {/* 今日任务进度 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            今日任务进度
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">完成进度</span>
              <span className="text-sm font-medium">
                {completedTasks.length}/{todayTasks.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  backgroundColor: color,
                  width: `${todayTasks.length > 0 ? (completedTasks.length / todayTasks.length) * 100 : 0}%`
                }}
              />
            </div>
            <div className="space-y-2">
              {todayTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">今天还没有安排任务</p>
              ) : (
                todayTasks.slice(0, 3).map((task, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        task.completed ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                      {task.title}
                    </span>
                  </div>
                ))
              )}
              {todayTasks.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  还有 {todayTasks.length - 3} 个任务...
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 考试倒计时 */}
      {mainTarget && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              考试倒计时
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <h3 className="font-medium">{mainTarget.title}</h3>
              <div className="text-3xl font-bold" style={{ color }}>
                D-{getDaysUntilTarget(mainTarget.targetDate)}
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(mainTarget.targetDate).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 今日课程 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            今日课程
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">暂无课程安排</p>
            <Button variant="outline" size="sm" className="w-full">
              查看完整课表
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 番茄时钟 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            番茄时钟
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3">
            <div className="text-2xl font-mono">25:00</div>
            <div className="flex gap-2">
              <Button size="sm" style={{ backgroundColor: color, color: 'white' }}>
                开始
              </Button>
              <Button variant="outline" size="sm">
                暂停
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 主仪表盘组件
export function CoupleDashboard() {
  const { user, partner } = useUserStore()
  const { config, isLoading } = useSiteConfig()
  const siteName = config?.name || 'Study Together'
  const { user: authUser, couple } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-6">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{config.name}</h1>
        <p className="text-muted-foreground">{config.description}</p>
        
        {/* 情侣状态显示 */}
        {authUser && (
          <div className="mt-4 flex justify-center">
            {couple && couple.isComplete ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Users className="h-3 w-3 mr-1" />
                {couple.person1Name} & {couple.person2Name}
              </Badge>
            ) : couple && !couple.isComplete ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  等待伴侣加入
                </Badge>
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    管理邀请
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  未配对
                </Badge>
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    创建或加入情侣
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 双栏布局 */}
      {couple && couple.isComplete ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左栏 - 我 */}
          <div>
            <PersonDashboard 
              person={authUser?.role || "person1"}
              name={authUser?.role === 'person1' ? couple.person1Name || authUser?.name || '用户' : couple.person2Name || authUser?.name || '用户'}
              color={authUser?.role === 'person1' ? config.couple.person1.color : config.couple.person2.color}
            />
          </div>
          
          {/* 右栏 - Ta */}
          <div>
            <PersonDashboard 
              person={authUser?.role === 'person1' ? "person2" : "person1"}
              name={authUser?.role === 'person1' ? couple.person2Name || 'Ta' : couple.person1Name || 'Ta'}
              color={authUser?.role === 'person1' ? config.couple.person2.color : config.couple.person1.color}
            />
          </div>
        </div>
      ) : (
        /* 单人模式或未配对状态 */
        <div className="max-w-2xl mx-auto">
          <PersonDashboard 
            person={authUser?.role || "person1"}
            name={authUser?.name || config.couple.person1.name}
            color={config.couple.person1.color}
          />
          
          {/* 邀请伴侣卡片 */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                邀请您的学习伴侣
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  {couple && !couple.isComplete 
                    ? '您已创建情侣空间，请邀请您的伴侣加入一起学习！'
                    : '创建情侣学习空间，与您的伴侣一起制定学习计划、互相监督进度。'
                  }
                </p>
                <Link href="/profile">
                  <Button className="bg-pink-600 hover:bg-pink-700">
                    <Users className="h-4 w-4 mr-2" />
                    {couple && !couple.isComplete ? '管理邀请' : '开始配对'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 底部共享区域 */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">学习功能</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                {couple && couple.isComplete 
                  ? '与您的伴侣一起使用这些学习功能'
                  : '探索我们的学习功能，提升学习效率'
                }
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col" disabled>
                  <Heart className="h-6 w-6 mb-2" />
                  <span>情侣打卡</span>
                  <span className="text-xs text-muted-foreground">开发中</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col" disabled>
                  <Target className="h-6 w-6 mb-2" />
                  <span>共同目标</span>
                  <span className="text-xs text-muted-foreground">开发中</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col" disabled>
                  <BookOpen className="h-6 w-6 mb-2" />
                  <span>学习记录</span>
                  <span className="text-xs text-muted-foreground">开发中</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Heart, BookOpen, Clock, Target, Calendar, User, Users, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
// 简单的倒计时显示组件
function SimpleCountdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const difference = target - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        
        if (days > 0) {
          setTimeLeft(`${days}天 ${hours}小时`)
        } else if (hours > 0) {
          setTimeLeft(`${hours}小时 ${minutes}分钟`)
        } else {
          setTimeLeft(`${minutes}分钟`)
        }
      } else {
        setTimeLeft('已到期')
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // 每分钟更新一次

    return () => clearInterval(interval)
  }, [targetDate])

  return (
    <div className="text-2xl font-bold text-orange-600">
      {timeLeft}
    </div>
  )
}

interface DashboardData {
  todayTasks: number
  completedTasks: number
  studyTime: number
  goalProgress: number
  upcomingDeadline?: {
    title: string
    date: Date
  }
  currentPlan?: {
    title: string
    progress: number
  }
}

interface CoupleData {
  user: DashboardData
  partner?: DashboardData
}

interface UserInfo {
  id: string
  username: string
  displayName?: string
  coupleId?: string
  partnerId?: string
  partnerName?: string
}

interface CoupleInfo {
  id: string
  isComplete: boolean
  inviteCode?: string
}

export default function CoupleDashboard() {
  const { user } = useAuthStore()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [coupleInfo, setCoupleInfo] = useState<CoupleInfo | null>(null)
  const [coupleData, setCoupleData] = useState<CoupleData>({
    user: {
      todayTasks: 0,
      completedTasks: 0,
      studyTime: 0,
      goalProgress: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取用户和情侣信息
  const fetchUserInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('获取用户信息失败')
      }
      
      const data = await response.json()
      setUserInfo(data.user)
      setCoupleInfo(data.couple)
      
      // 如果有完整的情侣关系，加载学习数据
      if (data.couple?.isComplete) {
        await loadCoupleStudyData(data.user, data.couple)
      } else {
        // 只加载个人数据
        await loadPersonalStudyData(data.user)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取学习统计数据
  const fetchStudyStats = async () => {
    try {
      const response = await fetch('/api/study/stats')
      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (error) {
      console.error('获取学习统计失败:', error)
    }
    return null
  }

  // 获取今日学习计划
  const fetchTodayPlans = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/study/plans?date=${today}`)
      if (response.ok) {
        const data = await response.json()
        return data.plans || []
      }
    } catch (error) {
      console.error('获取今日计划失败:', error)
    }
    return []
  }

  // 获取学习目标
  const fetchStudyGoals = async () => {
    try {
      const response = await fetch('/api/study/goals')
      if (response.ok) {
        const data = await response.json()
        return data.goals || []
      }
    } catch (error) {
      console.error('获取学习目标失败:', error)
    }
    return []
  }

  // 加载个人学习数据
  const loadPersonalStudyData = async (user: UserInfo) => {
    try {
      const [statsData, todayPlans, goals] = await Promise.all([
        fetchStudyStats(),
        fetchTodayPlans(),
        fetchStudyGoals()
      ])

      if (statsData) {
        const stats = statsData.stats
        
        // 计算今日任务数据
        const todayTasks = todayPlans.reduce((total: number, plan: any) => total + plan.tasks.length, 0)
        const completedTasks = todayPlans.reduce((total: number, plan: any) => 
          total + plan.tasks.filter((task: any) => task.isCompleted).length, 0)
        
        // 获取最近的目标和计划
        const upcomingGoal = goals.find((goal: any) => new Date(goal.targetDate) > new Date())
        const currentPlan = todayPlans.length > 0 ? todayPlans[0] : null
        
        // 计算目标进度
        let goalProgress = 0
        if (stats.weeklyGoal > 0) {
          goalProgress = Math.min(100, (stats.weeklyProgress / stats.weeklyGoal) * 100)
        }
        
        setCoupleData({
          user: {
            todayTasks,
            completedTasks,
            studyTime: stats.totalStudyTime,
            goalProgress,
            upcomingDeadline: upcomingGoal ? {
              title: upcomingGoal.title,
              date: new Date(upcomingGoal.targetDate)
            } : undefined,
            currentPlan: currentPlan ? {
              title: currentPlan.title,
              progress: currentPlan.tasks.length > 0 ? 
                (currentPlan.tasks.filter((task: any) => task.isCompleted).length / currentPlan.tasks.length) * 100 : 0
            } : undefined
          }
        })
      }
    } catch (error) {
      console.error('加载个人学习数据失败:', error)
      // 使用默认数据
      setCoupleData({
        user: {
          todayTasks: 0,
          completedTasks: 0,
          studyTime: 0,
          goalProgress: 0
        }
      })
    }
  }

  // 加载情侣学习数据
  const loadCoupleStudyData = async (user: UserInfo, couple: CoupleInfo) => {
    try {
      const [statsData, todayPlans, goals] = await Promise.all([
        fetchStudyStats(),
        fetchTodayPlans(),
        fetchStudyGoals()
      ])

      if (statsData) {
        const myStats = statsData.stats
        const partnerStats = statsData.partnerStats
        
        // 计算我的今日任务数据
        const myTodayTasks = todayPlans.reduce((total: number, plan: any) => total + plan.tasks.length, 0)
        const myCompletedTasks = todayPlans.reduce((total: number, plan: any) => 
          total + plan.tasks.filter((task: any) => task.isCompleted).length, 0)
        
        // 获取我的最近目标和计划
        const myUpcomingGoal = goals.find((goal: any) => new Date(goal.targetDate) > new Date())
        const myCurrentPlan = todayPlans.length > 0 ? todayPlans[0] : null
        
        // 计算我的目标进度
        let myGoalProgress = 0
        if (myStats.weeklyGoal > 0) {
          myGoalProgress = Math.min(100, (myStats.weeklyProgress / myStats.weeklyGoal) * 100)
        }
        
        const userData: DashboardData = {
          todayTasks: myTodayTasks,
          completedTasks: myCompletedTasks,
          studyTime: myStats.totalStudyTime,
          goalProgress: myGoalProgress,
          upcomingDeadline: myUpcomingGoal ? {
            title: myUpcomingGoal.title,
            date: new Date(myUpcomingGoal.targetDate)
          } : undefined,
          currentPlan: myCurrentPlan ? {
            title: myCurrentPlan.title,
            progress: myCurrentPlan.tasks.length > 0 ? 
              (myCurrentPlan.tasks.filter((task: any) => task.isCompleted).length / myCurrentPlan.tasks.length) * 100 : 0
          } : undefined
        }
        
        let partnerData: DashboardData | undefined
        if (partnerStats) {
          // 计算伴侣的目标进度
          let partnerGoalProgress = 0
          if (partnerStats.stats.weeklyGoal > 0) {
            partnerGoalProgress = Math.min(100, (partnerStats.stats.weeklyProgress / partnerStats.stats.weeklyGoal) * 100)
          }
          
          partnerData = {
            todayTasks: 0, // 暂时无法获取伴侣的今日任务，可以后续扩展API
            completedTasks: partnerStats.stats.completedTasks,
            studyTime: partnerStats.stats.totalStudyTime,
            goalProgress: partnerGoalProgress
          }
        }
        
        setCoupleData({
          user: userData,
          partner: partnerData
        })
      }
    } catch (error) {
      console.error('加载情侣学习数据失败:', error)
      // 使用默认数据
      setCoupleData({
        user: {
          todayTasks: 0,
          completedTasks: 0,
          studyTime: 0,
          goalProgress: 0
        }
      })
    }
  }

  // 初始加载和定时刷新
  useEffect(() => {
    fetchUserInfo()
    
    // 设置定时刷新（每30秒）
    const interval = setInterval(fetchUserInfo, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '明天'
    if (diffDays < 7) return `${diffDays}天后`
    return date.toLocaleDateString('zh-CN')
  }

  const PersonCard = ({ data, title, icon }: { data: DashboardData, title: string, icon: React.ReactNode }) => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>

      {/* 今日任务概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            今日任务
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">完成进度</span>
            <span className="text-sm font-medium">{data.completedTasks}/{data.todayTasks}</span>
          </div>
          <Progress value={(data.completedTasks / data.todayTasks) * 100} className="mb-3" />
          <div className="flex gap-2">
            <Badge variant={data.completedTasks === data.todayTasks ? "default" : "secondary"}>
              {data.completedTasks === data.todayTasks ? '已完成' : '进行中'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 学习时长 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            学习时长
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{formatTime(data.studyTime)}</div>
            <p className="text-gray-500">今日累计</p>
          </div>
        </CardContent>
      </Card>

      {/* 目标进度 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            目标进度
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.currentPlan ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">{data.currentPlan.title}</span>
                <span className="text-sm font-medium">{data.currentPlan.progress}%</span>
              </div>
              <Progress value={data.currentPlan.progress} className="mb-3" />
              <Badge variant="outline">{data.goalProgress}% 总体完成度</Badge>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">暂无活动计划</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 倒计时 */}
      {data.upcomingDeadline && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              重要倒计时
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <h3 className="font-medium mb-2">{data.upcomingDeadline.title}</h3>
              <SimpleCountdown targetDate={data.upcomingDeadline.date} />
              <p className="text-sm text-gray-500 mt-2">{formatDate(data.upcomingDeadline.date)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-pink-600" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <div className="text-red-500 mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchUserInfo}
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
            >
              重试
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 获取显示名称
  const getDisplayName = (info: UserInfo | null) => {
    if (!info) return '我'
    return info.displayName || info.username || '我'
  }

  const getPartnerName = () => {
    if (userInfo?.partnerName) return userInfo.partnerName
    return '伴侣'
  }

  // 检查是否有完整的情侣关系
  const hasCompleteCouple = coupleInfo?.isComplete && coupleData.partner

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Heart className="h-8 w-8 text-pink-600" />
            {hasCompleteCouple ? '情侣学习仪表盘' : '个人学习仪表盘'}
          </h1>
          <p className="text-gray-600">
            {hasCompleteCouple ? '一起学习，共同进步' : '开始你的学习之旅'}
          </p>
          {userInfo?.coupleId && !coupleInfo?.isComplete && (
            <Badge variant="outline" className="mt-2">
              等待伴侣加入情侣关系
            </Badge>
          )}
        </div>

        {/* 双栏布局 */}
        <div className={`grid gap-8 ${hasCompleteCouple ? 'lg:grid-cols-2' : 'max-w-2xl mx-auto'}`}>
          {/* 左栏：我 */}
          <PersonCard 
            data={coupleData.user} 
            title={getDisplayName(userInfo)}
            icon={<User className="h-6 w-6 text-blue-600" />}
          />

          {/* 右栏：她/他 */}
          {hasCompleteCouple ? (
            <PersonCard 
              data={coupleData.partner!} 
              title={getPartnerName()}
              icon={<Heart className="h-6 w-6 text-pink-600" />}
            />
          ) : (
            // 只有在双栏布局时才显示等待伴侣的卡片
            hasCompleteCouple === false && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="h-6 w-6 text-gray-400" />
                  <h2 className="text-2xl font-bold text-gray-400">等待伴侣</h2>
                </div>
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-500 mb-2">还没有学习伴侣</h3>
                    <p className="text-gray-400 mb-4">邀请你的伴侣一起加入学习之旅</p>
                    <Badge variant="outline">前往情侣空间绑定伴侣</Badge>
                  </CardContent>
                </Card>
              </div>
            )
          )}
        </div>

        {/* 底部统计对比 - 只在有完整情侣关系时显示 */}
        {hasCompleteCouple && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Target className="h-5 w-5" />
                学习对比
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <h4 className="font-medium mb-2">今日任务完成</h4>
                  <div className="flex justify-center gap-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{coupleData.user.completedTasks}</div>
                      <div className="text-sm text-gray-500">{getDisplayName(userInfo)}</div>
                    </div>
                    <div className="text-gray-300">vs</div>
                    <div>
                      <div className="text-2xl font-bold text-pink-600">{coupleData.partner!.completedTasks}</div>
                      <div className="text-sm text-gray-500">{getPartnerName()}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">学习时长</h4>
                  <div className="flex justify-center gap-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{formatTime(coupleData.user.studyTime)}</div>
                      <div className="text-sm text-gray-500">{getDisplayName(userInfo)}</div>
                    </div>
                    <div className="text-gray-300">vs</div>
                    <div>
                      <div className="text-2xl font-bold text-pink-600">{formatTime(coupleData.partner!.studyTime)}</div>
                      <div className="text-sm text-gray-500">{getPartnerName()}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">目标进度</h4>
                  <div className="flex justify-center gap-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{coupleData.user.goalProgress}%</div>
                      <div className="text-sm text-gray-500">{getDisplayName(userInfo)}</div>
                    </div>
                    <div className="text-gray-300">vs</div>
                    <div>
                      <div className="text-2xl font-bold text-pink-600">{coupleData.partner!.goalProgress}%</div>
                      <div className="text-sm text-gray-500">{getPartnerName()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 未绑定情侣时的提示 */}
        {!userInfo?.coupleId && (
          <Card className="mt-8">
            <CardContent className="text-center py-8">
              <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">开启情侣学习模式</h3>
              <p className="text-gray-600 mb-4">绑定学习伴侣，一起制定目标，互相监督，共同进步</p>
              <Badge variant="outline">前往情侣空间开始绑定</Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
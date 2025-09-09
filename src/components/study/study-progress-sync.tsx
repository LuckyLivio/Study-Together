'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RefreshCw, TrendingUp, Users, RotateCcw, Award } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'

interface StudyStats {
  totalStudyTime: number // 总学习时间（分钟）
  completedTasks: number // 完成任务数
  pomodoroSessions: number // 番茄时间会话数
  checkinDays: number // 打卡天数
  weeklyGoal: number // 周目标（分钟）
  weeklyProgress: number // 周进度（分钟）
}

interface PartnerStats {
  name: string
  avatar?: string
  stats: StudyStats
  lastActive: string
}

interface StudyProgressSyncProps {
  onSync?: () => void
}

export default function StudyProgressSync({ onSync }: StudyProgressSyncProps) {
  const { user } = useAuthStore()
  const [myStats, setMyStats] = useState<StudyStats>({
    totalStudyTime: 0,
    completedTasks: 0,
    pomodoroSessions: 0,
    checkinDays: 0,
    weeklyGoal: 1200, // 20小时/周
    weeklyProgress: 0
  })
  const [partnerStats, setPartnerStats] = useState<PartnerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  
  // 获取学习统计数据
  const fetchStudyStats = async () => {
    try {
      const response = await fetch('/api/study/stats')
      if (response.ok) {
        const data = await response.json()
        setMyStats(data.stats)
        setPartnerStats(data.partnerStats || null)
        setLastSyncTime(new Date())
      }
    } catch (error) {
      console.error('获取学习统计失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // 同步学习进度
  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/study/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        await fetchStudyStats()
        onSync?.()
        toast.success('学习进度同步成功')
      } else {
        toast.error('同步失败，请稍后重试')
      }
    } catch (error) {
      console.error('同步失败:', error)
      toast.error('同步失败，请稍后重试')
    } finally {
      setSyncing(false)
    }
  }
  
  useEffect(() => {
    fetchStudyStats()
    
    // 每5分钟自动同步一次
    const interval = setInterval(fetchStudyStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])
  
  // 计算周进度百分比（四舍五入到一位小数）
  const getWeeklyProgressPercent = (stats: StudyStats) => {
    const percent = Math.min((stats.weeklyProgress / stats.weeklyGoal) * 100, 100)
    return Math.round(percent * 10) / 10 // 四舍五入到一位小数
  }
  
  // 获取进度状态颜色
  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'text-green-600'
    if (percent >= 75) return 'text-blue-600'
    if (percent >= 50) return 'text-yellow-600'
    return 'text-gray-600'
  }
  
  // 比较统计数据
  const compareStats = (my: number, partner: number) => {
    if (my > partner) return 'text-green-600'
    if (my < partner) return 'text-red-600'
    return 'text-gray-600'
  }
  
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* 同步控制 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              学习进度同步
            </CardTitle>
            <Button
              onClick={handleSync}
              disabled={syncing}
              size="sm"
              variant="outline"
            >
              {syncing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {syncing ? '同步中...' : '立即同步'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {lastSyncTime ? (
              <>最后同步：{format(lastSyncTime, 'HH:mm:ss')}</>
            ) : (
              '尚未同步'
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* 我的学习进度 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            我的学习进度
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 周目标进度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">本周学习目标</span>
              <span className="text-sm text-muted-foreground">
                {Math.floor(myStats.weeklyProgress / 60)}h {myStats.weeklyProgress % 60}m / {Math.floor(myStats.weeklyGoal / 60)}h
              </span>
            </div>
            <Progress value={getWeeklyProgressPercent(myStats)} className="h-2" />
            <div className={`text-right text-sm mt-1 ${getProgressColor(getWeeklyProgressPercent(myStats))}`}>
              {getWeeklyProgressPercent(myStats).toFixed(1)}%
            </div>
          </div>
          
          {/* 学习统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-semibold text-blue-600">
                {Math.floor(myStats.totalStudyTime / 60)}h {myStats.totalStudyTime % 60}m
              </div>
              <div className="text-xs text-muted-foreground">总学习时间</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-semibold text-green-600">
                {myStats.completedTasks}
              </div>
              <div className="text-xs text-muted-foreground">完成任务</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-lg font-semibold text-red-600">
                {myStats.pomodoroSessions}
              </div>
              <div className="text-xs text-muted-foreground">番茄时间</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-semibold text-purple-600">
                {myStats.checkinDays}
              </div>
              <div className="text-xs text-muted-foreground">打卡天数</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 情侣对比 */}
      {partnerStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              学习对比
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* 伴侣信息 */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {partnerStats.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{partnerStats.name}</div>
                <div className="text-sm text-muted-foreground">
                  最后活跃：{format(new Date(partnerStats.lastActive), 'MM月dd日 HH:mm', { locale: zhCN })}
                </div>
              </div>
            </div>
            
            {/* 对比统计 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">学习时间</span>
                <div className="flex items-center gap-4">
                  <span className={`font-medium ${compareStats(myStats.totalStudyTime, partnerStats.stats.totalStudyTime)}`}>
                    {Math.floor(myStats.totalStudyTime / 60)}h {myStats.totalStudyTime % 60}m
                  </span>
                  <span className="text-muted-foreground">vs</span>
                  <span className={`font-medium ${compareStats(partnerStats.stats.totalStudyTime, myStats.totalStudyTime)}`}>
                    {Math.floor(partnerStats.stats.totalStudyTime / 60)}h {partnerStats.stats.totalStudyTime % 60}m
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">完成任务</span>
                <div className="flex items-center gap-4">
                  <span className={`font-medium ${compareStats(myStats.completedTasks, partnerStats.stats.completedTasks)}`}>
                    {myStats.completedTasks}
                  </span>
                  <span className="text-muted-foreground">vs</span>
                  <span className={`font-medium ${compareStats(partnerStats.stats.completedTasks, myStats.completedTasks)}`}>
                    {partnerStats.stats.completedTasks}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">番茄时间</span>
                <div className="flex items-center gap-4">
                  <span className={`font-medium ${compareStats(myStats.pomodoroSessions, partnerStats.stats.pomodoroSessions)}`}>
                    {myStats.pomodoroSessions}
                  </span>
                  <span className="text-muted-foreground">vs</span>
                  <span className={`font-medium ${compareStats(partnerStats.stats.pomodoroSessions, myStats.pomodoroSessions)}`}>
                    {partnerStats.stats.pomodoroSessions}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">打卡天数</span>
                <div className="flex items-center gap-4">
                  <span className={`font-medium ${compareStats(myStats.checkinDays, partnerStats.stats.checkinDays)}`}>
                    {myStats.checkinDays}
                  </span>
                  <span className="text-muted-foreground">vs</span>
                  <span className={`font-medium ${compareStats(partnerStats.stats.checkinDays, myStats.checkinDays)}`}>
                    {partnerStats.stats.checkinDays}
                  </span>
                </div>
              </div>
            </div>
            
            {/* 鼓励信息 */}
            <div className="text-center p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
              <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-sm font-medium">
                {myStats.totalStudyTime > partnerStats.stats.totalStudyTime
                  ? '你暂时领先，继续保持！'
                  : myStats.totalStudyTime < partnerStats.stats.totalStudyTime
                  ? '加油追赶，你可以的！'
                  : '势均力敌，一起努力！'
                }
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
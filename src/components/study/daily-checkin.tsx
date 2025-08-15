'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, CheckCircle, Clock, Flame, Target } from 'lucide-react'
import { format, isToday, startOfDay, differenceInDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { toast } from 'sonner'

interface CheckinRecord {
  id: string
  date: string
  studyMinutes: number
  pomodoroSessions: number
  tasksCompleted: number
  notes?: string
  createdAt: string
}

interface DailyCheckinProps {
  onCheckin?: (data: Omit<CheckinRecord, 'id' | 'createdAt'>) => void
}

export default function DailyCheckin({ onCheckin }: DailyCheckinProps) {
  const [checkinRecords, setCheckinRecords] = useState<CheckinRecord[]>([])
  const [todayRecord, setTodayRecord] = useState<CheckinRecord | null>(null)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // 获取打卡记录
  const fetchCheckinRecords = async () => {
    try {
      const response = await fetch('/api/study/checkin')
      if (response.ok) {
        const data = await response.json()
        const records = data.records || []
        setCheckinRecords(records)
        
        // 检查今日是否已打卡
        const today = format(new Date(), 'yyyy-MM-dd')
        const todayCheckin = records.find((record: CheckinRecord) => record.date === today)
        setTodayRecord(todayCheckin || null)
        setIsCheckedIn(!!todayCheckin)
        
        // 计算连续打卡天数
        calculateStreak(records)
      }
    } catch (error) {
      console.error('获取打卡记录失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // 计算连续打卡天数
  const calculateStreak = (records: CheckinRecord[]) => {
    if (records.length === 0) {
      setStreak(0)
      return
    }
    
    // 按日期排序（最新的在前）
    const sortedRecords = records
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    let currentStreak = 0
    const today = startOfDay(new Date())
    
    for (let i = 0; i < sortedRecords.length; i++) {
      const recordDate = startOfDay(new Date(sortedRecords[i].date))
      const expectedDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000))
      
      if (recordDate.getTime() === expectedDate.getTime()) {
        currentStreak++
      } else {
        break
      }
    }
    
    setStreak(currentStreak)
  }
  
  useEffect(() => {
    fetchCheckinRecords()
  }, [])
  
  // 执行打卡
  const handleCheckin = async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    
    // 模拟获取今日学习数据
    const checkinData = {
      date: today,
      studyMinutes: 120, // 这里应该从实际学习记录中获取
      pomodoroSessions: 4,
      tasksCompleted: 3,
      notes: '今日学习状态良好'
    }
    
    try {
      const response = await fetch('/api/study/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkinData)
      })
      
      if (response.ok) {
        const newRecord = await response.json()
        setTodayRecord(newRecord.record)
        setIsCheckedIn(true)
        setStreak(prev => prev + 1)
        
        onCheckin?.(checkinData)
        toast.success('打卡成功！')
      } else {
        const error = await response.json()
        toast.error(error.message || '打卡失败')
      }
    } catch (error) {
      console.error('打卡失败:', error)
      toast.error('打卡失败')
    }
  }
  
  // 获取打卡状态颜色
  const getStreakColor = () => {
    if (streak >= 30) return 'text-purple-600'
    if (streak >= 14) return 'text-blue-600'
    if (streak >= 7) return 'text-green-600'
    if (streak >= 3) return 'text-yellow-600'
    return 'text-gray-600'
  }
  
  // 获取打卡徽章
  const getStreakBadge = () => {
    if (streak >= 30) return '🏆 学霸'
    if (streak >= 14) return '🔥 坚持者'
    if (streak >= 7) return '⭐ 努力者'
    if (streak >= 3) return '💪 初心者'
    return '🌱 新手'
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          每日打卡
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 打卡状态 */}
        <div className="text-center">
          {isCheckedIn ? (
            <div className="space-y-2">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold text-green-600">今日已打卡</h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'MM月dd日', { locale: zhCN })}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Clock className="h-16 w-16 text-gray-400 mx-auto" />
              <h3 className="text-lg font-semibold">今日尚未打卡</h3>
              <Button onClick={handleCheckin} size="lg" className="w-full">
                立即打卡
              </Button>
            </div>
          )}
        </div>
        
        {/* 连续打卡统计 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame className={`h-5 w-5 ${getStreakColor()}`} />
              <span className="text-sm font-medium">连续打卡</span>
            </div>
            <div className={`text-2xl font-bold ${getStreakColor()}`}>
              {streak}
            </div>
            <div className="text-xs text-muted-foreground">天</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">总打卡</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {checkinRecords.length}
            </div>
            <div className="text-xs text-muted-foreground">天</div>
          </div>
        </div>
        
        {/* 成就徽章 */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="text-lg mb-1">{getStreakBadge()}</div>
          <div className="text-sm text-muted-foreground">
            {streak >= 30 ? '你是真正的学习大师！' :
             streak >= 14 ? '坚持就是胜利！' :
             streak >= 7 ? '一周坚持，很棒！' :
             streak >= 3 ? '好的开始！' :
             '开始你的学习之旅吧！'}
          </div>
        </div>
        
        {/* 今日学习数据 */}
        {todayRecord && (
          <div className="space-y-3">
            <h4 className="font-medium">今日学习数据</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">
                  {todayRecord.studyMinutes}
                </div>
                <div className="text-xs text-muted-foreground">学习分钟</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-semibold text-red-600">
                  {todayRecord.pomodoroSessions}
                </div>
                <div className="text-xs text-muted-foreground">番茄时间</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">
                  {todayRecord.tasksCompleted}
                </div>
                <div className="text-xs text-muted-foreground">完成任务</div>
              </div>
            </div>
          </div>
        )}
        
        {/* 最近打卡记录 */}
        {checkinRecords.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">最近打卡</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {checkinRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      {format(new Date(record.date), 'MM月dd日', { locale: zhCN })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {record.studyMinutes}分钟
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
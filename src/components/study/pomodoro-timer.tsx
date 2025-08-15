'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, RotateCcw, Coffee, BookOpen, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface PomodoroSettings {
  workDuration: number // 工作时长（分钟）
  shortBreak: number   // 短休息时长（分钟）
  longBreak: number    // 长休息时长（分钟）
  longBreakInterval: number // 长休息间隔（几个番茄后）
}

interface PomodoroTimerProps {
  onSessionComplete?: (type: 'work' | 'break', duration: number) => void
}

type TimerState = 'idle' | 'running' | 'paused'
type SessionType = 'work' | 'shortBreak' | 'longBreak'

export default function PomodoroTimer({ onSessionComplete }: PomodoroTimerProps) {
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4
  })
  
  const [currentSession, setCurrentSession] = useState<SessionType>('work')
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60) // 秒
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [completedSessions, setCompletedSessions] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // 初始化音频
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3') // 需要添加提示音文件
    audioRef.current.volume = 0.5
  }, [])
  
  // 计时器逻辑
  useEffect(() => {
    if (timerState === 'running' && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timerState, timeLeft])
  
  // 会话完成处理
  const handleSessionComplete = () => {
    setTimerState('idle')
    
    // 播放提示音
    if (audioRef.current) {
      audioRef.current.play().catch(console.error)
    }
    
    if (currentSession === 'work') {
      const newCompletedSessions = completedSessions + 1
      setCompletedSessions(newCompletedSessions)
      
      // 通知父组件工作会话完成
      onSessionComplete?.('work', settings.workDuration)
      
      // 决定下一个会话类型
      const isLongBreak = newCompletedSessions % settings.longBreakInterval === 0
      const nextSession = isLongBreak ? 'longBreak' : 'shortBreak'
      setCurrentSession(nextSession)
      setTimeLeft(isLongBreak ? settings.longBreak * 60 : settings.shortBreak * 60)
      
      toast.success(`工作会话完成！开始${isLongBreak ? '长' : '短'}休息`)
    } else {
      // 休息完成，开始工作
      setCurrentSession('work')
      setTimeLeft(settings.workDuration * 60)
      
      onSessionComplete?.('break', currentSession === 'longBreak' ? settings.longBreak : settings.shortBreak)
      toast.success('休息结束！开始新的工作会话')
    }
  }
  
  // 开始/暂停计时器
  const toggleTimer = () => {
    if (timerState === 'running') {
      setTimerState('paused')
    } else {
      setTimerState('running')
    }
  }
  
  // 重置计时器
  const resetTimer = () => {
    setTimerState('idle')
    setCurrentSession('work')
    setTimeLeft(settings.workDuration * 60)
  }
  
  // 跳过当前会话
  const skipSession = () => {
    handleSessionComplete()
  }
  
  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // 计算进度百分比
  const getProgress = () => {
    const totalTime = currentSession === 'work' 
      ? settings.workDuration * 60
      : currentSession === 'longBreak'
        ? settings.longBreak * 60
        : settings.shortBreak * 60
    return ((totalTime - timeLeft) / totalTime) * 100
  }
  
  // 获取会话标题和图标
  const getSessionInfo = () => {
    switch (currentSession) {
      case 'work':
        return { title: '专注工作', icon: BookOpen, color: 'text-red-600' }
      case 'shortBreak':
        return { title: '短休息', icon: Coffee, color: 'text-green-600' }
      case 'longBreak':
        return { title: '长休息', icon: Coffee, color: 'text-blue-600' }
    }
  }
  
  const sessionInfo = getSessionInfo()
  const SessionIcon = sessionInfo.icon
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SessionIcon className={`h-5 w-5 ${sessionInfo.color}`} />
            番茄时间
          </CardTitle>
          <Button
            onClick={() => setShowSettings(!showSettings)}
            size="sm"
            variant="ghost"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 当前会话信息 */}
        <div className="text-center">
          <Badge variant="outline" className={`mb-2 ${sessionInfo.color}`}>
            {sessionInfo.title}
          </Badge>
          <div className="text-4xl font-mono font-bold mb-2">
            {formatTime(timeLeft)}
          </div>
          <Progress value={getProgress()} className="h-2" />
        </div>
        
        {/* 控制按钮 */}
        <div className="flex justify-center gap-2">
          <Button
            onClick={toggleTimer}
            size="lg"
            className="flex-1"
          >
            {timerState === 'running' ? (
              <><Pause className="h-4 w-4 mr-2" />暂停</>
            ) : (
              <><Play className="h-4 w-4 mr-2" />开始</>
            )}
          </Button>
          <Button
            onClick={resetTimer}
            size="lg"
            variant="outline"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        
        {/* 会话统计 */}
        <div className="text-center text-sm text-muted-foreground">
          已完成 {completedSessions} 个工作会话
        </div>
        
        {/* 设置面板 */}
        {showSettings && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">番茄时间设置</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm">工作时长(分钟)</label>
                <input
                  type="number"
                  value={settings.workDuration}
                  onChange={(e) => setSettings(prev => ({ ...prev, workDuration: parseInt(e.target.value) || 25 }))}
                  className="w-full px-2 py-1 border rounded text-sm"
                  min="1"
                  max="60"
                />
              </div>
              <div>
                <label className="text-sm">短休息(分钟)</label>
                <input
                  type="number"
                  value={settings.shortBreak}
                  onChange={(e) => setSettings(prev => ({ ...prev, shortBreak: parseInt(e.target.value) || 5 }))}
                  className="w-full px-2 py-1 border rounded text-sm"
                  min="1"
                  max="30"
                />
              </div>
              <div>
                <label className="text-sm">长休息(分钟)</label>
                <input
                  type="number"
                  value={settings.longBreak}
                  onChange={(e) => setSettings(prev => ({ ...prev, longBreak: parseInt(e.target.value) || 15 }))}
                  className="w-full px-2 py-1 border rounded text-sm"
                  min="1"
                  max="60"
                />
              </div>
              <div>
                <label className="text-sm">长休息间隔</label>
                <input
                  type="number"
                  value={settings.longBreakInterval}
                  onChange={(e) => setSettings(prev => ({ ...prev, longBreakInterval: parseInt(e.target.value) || 4 }))}
                  className="w-full px-2 py-1 border rounded text-sm"
                  min="2"
                  max="10"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
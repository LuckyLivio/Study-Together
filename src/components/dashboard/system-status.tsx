'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Server, Activity, Database, Cpu, MemoryStick, Clock, Wifi, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface SystemStatusData {
  status: 'healthy' | 'warning' | 'critical' | 'error'
  timestamp: string
  server: {
    uptime: {
      days: number
      hours: number
      minutes: number
      seconds: number
    }
    uptimeSeconds: number
    nodeVersion: string
    platform: string
    architecture: string
  }
  performance: {
    apiResponseTime: number
    dbResponseTime: number
    cpuUsage: number
  }
  memory: {
    used: number
    total: number
    external: number
    rss: number
  }
  health: {
    database: 'healthy' | 'warning' | 'critical' | 'error'
    memory: 'healthy' | 'warning' | 'critical' | 'error'
    api: 'healthy' | 'warning' | 'critical' | 'error'
  }
}

interface SystemStatusResponse {
  success: boolean
  data: SystemStatusData
  error?: string
}

export default function SystemStatus() {
  const [statusData, setStatusData] = useState<SystemStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [refreshInterval, setRefreshInterval] = useState(30) // 默认30秒
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchSystemStatus = async (manual = false) => {
    if (manual) setIsRefreshing(true)
    try {
      const response = await fetch('/api/system/status')
      const result: SystemStatusResponse = await response.json()
      
      if (result.success && result.data) {
        setStatusData(result.data)
        setError(null)
      } else {
        setError(result.error || '获取系统状态失败')
      }
      setLastUpdate(new Date())
    } catch (err) {
      console.error('获取系统状态失败:', err)
      setError('网络连接失败')
    } finally {
      setLoading(false)
      if (manual) setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSystemStatus()
    
    // 根据设置的间隔时间刷新状态
    const interval = setInterval(() => fetchSystemStatus(), refreshInterval * 1000)
    
    return () => clearInterval(interval)
  }, [refreshInterval])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'critical':
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatUptime = (uptime: SystemStatusData['server']['uptime']) => {
    const parts = []
    if (uptime.days > 0) parts.push(`${uptime.days}天`)
    if (uptime.hours > 0) parts.push(`${uptime.hours}小时`)
    if (uptime.minutes > 0) parts.push(`${uptime.minutes}分钟`)
    if (parts.length === 0) parts.push(`${uptime.seconds}秒`)
    return parts.join(' ')
  }

  const getMemoryUsagePercentage = () => {
    if (!statusData) return 0
    return Math.round((statusData.memory.used / statusData.memory.total) * 100)
  }

  if (loading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            网站运行状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-500">正在获取系统状态...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !statusData) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            网站运行状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error || '无法获取系统状态'}</p>
            <button 
              onClick={() => fetchSystemStatus(true)}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              重新获取
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            网站运行状态
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={refreshInterval.toString()} 
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-2 py-1 text-sm border rounded h-8 w-20"
            >
              <option value="5">5秒</option>
              <option value="10">10秒</option>
              <option value="30">30秒</option>
              <option value="60">1分钟</option>
            </select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault()
                fetchSystemStatus(true)
              }}
              disabled={isRefreshing}
              className="h-8"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <div className={`w-2 h-2 rounded-full ${getStatusColor(statusData.status)}`}></div>
            <Badge variant={statusData.status === 'healthy' ? 'default' : statusData.status === 'warning' ? 'secondary' : 'destructive'}>
              {statusData.status === 'healthy' ? '正常' : statusData.status === 'warning' ? '警告' : '异常'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 服务器运行时间 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">运行时间</span>
            </div>
            <p className="text-lg font-semibold">{formatUptime(statusData.server.uptime)}</p>
            <p className="text-xs text-gray-500">{statusData.server.platform} {statusData.server.architecture}</p>
          </div>

          {/* API响应速度 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">API响应</span>
              {getStatusIcon(statusData.health.api)}
            </div>
            <p className="text-lg font-semibold">{statusData.performance.apiResponseTime}ms</p>
            <p className="text-xs text-gray-500">数据库: {statusData.performance.dbResponseTime}ms</p>
          </div>

          {/* CPU使用率 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">CPU使用率</span>
            </div>
            <p className="text-lg font-semibold">{statusData.performance.cpuUsage}%</p>
            <Progress value={statusData.performance.cpuUsage} className="h-2" />
          </div>

          {/* 内存使用 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">内存使用</span>
              {getStatusIcon(statusData.health.memory)}
            </div>
            <p className="text-lg font-semibold">{statusData.memory.used}MB / {statusData.memory.total}MB</p>
            <Progress value={getMemoryUsagePercentage()} className="h-2" />
          </div>
        </div>

        {/* 详细健康状态 */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                <span>数据库</span>
                {getStatusIcon(statusData.health.database)}
              </div>
              <div className="flex items-center gap-1">
                <MemoryStick className="h-4 w-4" />
                <span>内存</span>
                {getStatusIcon(statusData.health.memory)}
              </div>
              <div className="flex items-center gap-1">
                <Wifi className="h-4 w-4" />
                <span>接口</span>
                {getStatusIcon(statusData.health.api)}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {lastUpdate && `最后更新: ${lastUpdate.toLocaleTimeString()}`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
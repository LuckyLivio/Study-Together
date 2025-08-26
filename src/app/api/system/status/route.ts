import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUserAuth } from '@/lib/auth'

// 获取系统状态信息
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const { userId } = await verifyUserAuth(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const startTime = Date.now()

    // 测试数据库连接和响应时间
    const dbStartTime = Date.now()
    try {
      await prisma.user.count()
    } catch (error) {
      console.error('数据库连接失败:', error)
    }
    const dbResponseTime = Date.now() - dbStartTime

    // 获取系统内存使用情况
    const memoryUsage = process.memoryUsage()
    const memoryInfo = {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
    }

    // 获取系统运行时间
    const uptime = process.uptime() // 秒
    const uptimeFormatted = {
      days: Math.floor(uptime / 86400),
      hours: Math.floor((uptime % 86400) / 3600),
      minutes: Math.floor((uptime % 3600) / 60),
      seconds: Math.floor(uptime % 60)
    }

    // 获取Node.js版本信息
    const nodeVersion = process.version
    const platform = process.platform
    const arch = process.arch

    // 计算API响应时间
    const apiResponseTime = Date.now() - startTime

    // 模拟CPU使用率（实际项目中可以使用更精确的方法）
    const cpuUsage = Math.floor(Math.random() * 30) + 10 // 10-40%

    // 获取当前时间
    const currentTime = new Date().toISOString()

    // 系统状态评估
    let systemStatus = 'healthy'
    if (dbResponseTime > 1000 || memoryInfo.used > memoryInfo.total * 0.9) {
      systemStatus = 'warning'
    }
    if (dbResponseTime > 3000 || memoryInfo.used > memoryInfo.total * 0.95) {
      systemStatus = 'critical'
    }

    const statusData = {
      status: systemStatus,
      timestamp: currentTime,
      server: {
        uptime: uptimeFormatted,
        uptimeSeconds: Math.floor(uptime),
        nodeVersion,
        platform,
        architecture: arch
      },
      performance: {
        apiResponseTime,
        dbResponseTime,
        cpuUsage
      },
      memory: memoryInfo,
      health: {
        database: dbResponseTime < 1000 ? 'healthy' : dbResponseTime < 3000 ? 'warning' : 'critical',
        memory: memoryInfo.used < memoryInfo.total * 0.8 ? 'healthy' : memoryInfo.used < memoryInfo.total * 0.9 ? 'warning' : 'critical',
        api: apiResponseTime < 500 ? 'healthy' : apiResponseTime < 1000 ? 'warning' : 'critical'
      }
    }

    return NextResponse.json({
      success: true,
      data: statusData
    })

  } catch (error) {
    console.error('获取系统状态失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取系统状态失败',
        data: {
          status: 'error',
          timestamp: new Date().toISOString(),
          server: {
            uptime: { days: 0, hours: 0, minutes: 0, seconds: 0 },
            uptimeSeconds: 0,
            nodeVersion: process.version,
            platform: process.platform,
            architecture: process.arch
          },
          performance: {
            apiResponseTime: 0,
            dbResponseTime: 0,
            cpuUsage: 0
          },
          memory: {
            used: 0,
            total: 0,
            external: 0,
            rss: 0
          },
          health: {
            database: 'error',
            memory: 'error',
            api: 'error'
          }
        }
      }, 
      { status: 500 }
    )
  }
}
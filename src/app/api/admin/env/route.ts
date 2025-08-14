import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 验证管理员权限
async function verifyAdmin(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                 request.cookies.get('auth-token')?.value
    
    if (!token) {
      return { valid: false, error: 'No token provided' }
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    if (decoded.role !== 'ADMIN' && !decoded.isAdmin) {
      return { valid: false, error: 'Admin access required' }
    }

    return { valid: true, userId: decoded.userId }
  } catch (error) {
    return { valid: false, error: 'Invalid token' }
  }
}

// 获取当前环境变量
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request)
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    // 返回当前环境变量（敏感信息部分隐藏）
    const envVars = {
      DATABASE_URL: process.env.DATABASE_URL ? '***已配置***' : '',
      JWT_SECRET: process.env.JWT_SECRET ? '***已配置***' : '',
      DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? '***已配置***' : '',
      DEEPSEEK_API_URL: process.env.DEEPSEEK_API_URL || '',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
      NODE_ENV: process.env.NODE_ENV || 'development'
    }

    return NextResponse.json(envVars)
  } catch (error) {
    console.error('Failed to read environment variables:', error)
    return NextResponse.json(
      { error: 'Failed to read environment variables' },
      { status: 500 }
    )
  }
}

// 保存环境变量
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request)
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const envData = await request.json()
    const envPath = join(process.cwd(), '.env')
    
    // 读取现有的 .env 文件
    let envContent = ''
    try {
      envContent = readFileSync(envPath, 'utf8')
    } catch (error) {
      // 如果文件不存在，创建新的
      envContent = '# Environment Variables\n'
    }

    // 更新环境变量
    const lines = envContent.split('\n')
    const updatedLines: string[] = []
    const processedKeys = new Set<string>()

    // 处理现有行
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.startsWith('#') || trimmedLine === '') {
        // 保留注释和空行
        updatedLines.push(line)
      } else if (trimmedLine.includes('=')) {
        // 处理环境变量行
        const [key] = trimmedLine.split('=', 1)
        if (envData.hasOwnProperty(key)) {
          updatedLines.push(`${key}="${envData[key]}"`)
          processedKeys.add(key)
        } else {
          // 保留未在请求中的变量
          updatedLines.push(line)
        }
      } else {
        updatedLines.push(line)
      }
    }

    // 添加新的环境变量
    for (const [key, value] of Object.entries(envData)) {
      if (!processedKeys.has(key) && value) {
        updatedLines.push(`${key}="${value}"`)
      }
    }

    // 写入文件
    const newContent = updatedLines.join('\n')
    writeFileSync(envPath, newContent, 'utf8')

    return NextResponse.json({ success: true, message: 'Environment variables saved successfully' })
  } catch (error) {
    console.error('Failed to save environment variables:', error)
    return NextResponse.json(
      { error: 'Failed to save environment variables' },
      { status: 500 }
    )
  }
}
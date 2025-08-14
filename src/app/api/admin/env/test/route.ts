import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '../../../../../generated/prisma'

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

// 测试数据库连接
async function testDatabaseConnection(databaseUrl: string) {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    })
    
    await prisma.$connect()
    await prisma.$disconnect()
    
    return { success: true, message: 'Database connection successful' }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Database connection failed' 
    }
  }
}

// 测试DeepSeek API连接
async function testDeepSeekAPI(apiKey: string, apiUrl: string) {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: 'Hello, this is a test message.'
        }],
        max_tokens: 10
      })
    })

    if (response.ok) {
      return { success: true, message: 'DeepSeek API connection successful' }
    } else {
      const errorText = await response.text()
      return { 
        success: false, 
        error: `API returned ${response.status}: ${errorText}` 
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'DeepSeek API connection failed' 
    }
  }
}

// 测试JWT密钥
function testJWTSecret(secret: string) {
  try {
    if (!secret || secret.length < 32) {
      return { 
        success: false, 
        error: 'JWT secret should be at least 32 characters long' 
      }
    }

    // 测试JWT签名和验证
    const testPayload = { test: true, timestamp: Date.now() }
    const token = jwt.sign(testPayload, secret, { expiresIn: '1m' })
    const decoded = jwt.verify(token, secret)
    
    return { success: true, message: 'JWT secret is valid' }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'JWT secret test failed' 
    }
  }
}

// 测试应用URL
function testAppUrl(url: string) {
  try {
    const parsedUrl = new URL(url)
    
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { 
        success: false, 
        error: 'URL must use HTTP or HTTPS protocol' 
      }
    }
    
    return { success: true, message: 'App URL format is valid' }
  } catch (error) {
    return { 
      success: false, 
      error: 'Invalid URL format' 
    }
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request)
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const { key, value } = await request.json()

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Key is required' },
        { status: 400 }
      )
    }

    // 如果前端发送的是掩码值（***已配置***），则使用服务器上的实际环境变量值
    const getActualValue = (envKey: string, frontendValue: string) => {
      if (frontendValue === '***已配置***' || frontendValue.includes('***')) {
        return process.env[envKey] || ''
      }
      return frontendValue
    }

    let result
    let actualValue

    switch (key) {
      case 'DATABASE_URL':
        actualValue = getActualValue(key, value)
        if (!actualValue) {
          result = { success: false, error: 'DATABASE_URL is not configured' }
        } else {
          result = await testDatabaseConnection(actualValue)
        }
        break
        
      case 'DEEPSEEK_API_KEY':
        actualValue = getActualValue(key, value)
        if (!actualValue) {
          result = { success: false, error: 'DEEPSEEK_API_KEY is not configured' }
        } else {
          // 获取当前配置的 API URL，如果没有则使用默认值
          const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions'
          result = await testDeepSeekAPI(actualValue, apiUrl)
        }
        break
        
      case 'DEEPSEEK_API_URL':
        actualValue = getActualValue(key, value)
        if (!actualValue) {
          result = { success: false, error: 'DEEPSEEK_API_URL is not configured' }
        } else {
          // 测试 API URL 时，使用当前配置的 API 密钥
          const apiKey = process.env.DEEPSEEK_API_KEY
          if (!apiKey) {
            result = { success: false, error: 'DEEPSEEK_API_KEY is required to test API URL' }
          } else {
            result = await testDeepSeekAPI(apiKey, actualValue)
          }
        }
        break
        
      case 'JWT_SECRET':
        actualValue = getActualValue(key, value)
        if (!actualValue) {
          result = { success: false, error: 'JWT_SECRET is not configured' }
        } else {
          result = testJWTSecret(actualValue)
        }
        break
        
      case 'NEXT_PUBLIC_APP_URL':
        actualValue = getActualValue(key, value)
        if (!actualValue) {
          result = { success: false, error: 'NEXT_PUBLIC_APP_URL is not configured' }
        } else {
          result = testAppUrl(actualValue)
        }
        break
        
      default:
        result = { 
          success: false, 
          error: `Testing not supported for ${key}` 
        }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Environment variable test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Test failed' 
      },
      { status: 500 }
    )
  }
}
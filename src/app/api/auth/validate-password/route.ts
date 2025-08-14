import { NextRequest, NextResponse } from 'next/server'
import { validatePasswordPolicy } from '@/lib/security'

// POST /api/auth/validate-password - 验证密码策略
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: '密码不能为空' },
        { status: 400 }
      )
    }

    const validation = await validatePasswordPolicy(password)

    return NextResponse.json({
      valid: validation.valid,
      errors: validation.errors
    })
  } catch (error) {
    console.error('密码验证失败:', error)
    return NextResponse.json(
      { error: '密码验证失败' },
      { status: 500 }
    )
  }
}
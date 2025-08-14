'use client'

import { useState, useEffect } from 'react'
import { Check, X, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
}

interface PasswordValidation {
  valid: boolean
  errors: string[]
}

interface PasswordPolicyValidatorProps {
  password: string
  onPasswordChange: (password: string) => void
  label?: string
  placeholder?: string
  showToggle?: boolean
  className?: string
  disabled?: boolean
}

export function PasswordPolicyValidator({
  password,
  onPasswordChange,
  label = '密码',
  placeholder = '请输入密码',
  showToggle = true,
  className = '',
  disabled = false
}: PasswordPolicyValidatorProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null)
  const [validation, setValidation] = useState<PasswordValidation | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 获取密码策略
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await fetch('/api/admin/security')
        if (response.ok) {
          const data = await response.json()
          setPolicy({
            minLength: data.settings.passwordPolicy.minLength,
            requireUppercase: data.settings.passwordPolicy.requireUppercase,
            requireLowercase: data.settings.passwordPolicy.requireLowercase,
            requireNumbers: data.settings.passwordPolicy.requireNumbers,
            requireSpecialChars: data.settings.passwordPolicy.requireSpecialChars
          })
        }
      } catch (error) {
        console.error('获取密码策略失败:', error)
      }
    }

    fetchPolicy()
  }, [])

  // 验证密码
  useEffect(() => {
    if (!password || !policy) {
      setValidation(null)
      return
    }

    const validatePassword = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/auth/validate-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password })
        })

        if (response.ok) {
          const data = await response.json()
          setValidation(data)
        }
      } catch (error) {
        console.error('密码验证失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(validatePassword, 300)
    return () => clearTimeout(debounceTimer)
  }, [password, policy])

  const getPolicyChecks = () => {
    if (!policy || !password) return []

    const checks = [
      {
        label: `至少${policy.minLength}个字符`,
        valid: password.length >= policy.minLength
      }
    ]

    if (policy.requireUppercase) {
      checks.push({
        label: '包含大写字母',
        valid: /[A-Z]/.test(password)
      })
    }

    if (policy.requireLowercase) {
      checks.push({
        label: '包含小写字母',
        valid: /[a-z]/.test(password)
      })
    }

    if (policy.requireNumbers) {
      checks.push({
        label: '包含数字',
        valid: /\d/.test(password)
      })
    }

    if (policy.requireSpecialChars) {
      checks.push({
        label: '包含特殊字符',
        valid: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      })
    }

    return checks
  }

  const policyChecks = getPolicyChecks()
  const isValid = validation?.valid ?? false

  return (
    <div className={className}>
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`pr-10 ${
              password && validation
                ? isValid
                  ? 'border-green-500 focus:border-green-500'
                  : 'border-red-500 focus:border-red-500'
                : ''
            }`}
          />
          {showToggle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              disabled={disabled}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 密码策略要求 */}
      {password && policy && policyChecks.length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <div className="text-sm font-medium text-gray-700 mb-2">密码要求：</div>
          <div className="space-y-1">
            {policyChecks.map((check, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {check.valid ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span className={check.valid ? 'text-green-700' : 'text-red-700'}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
          
          {validation && validation.errors.length > 0 && (
            <div className="mt-2 text-sm text-red-600">
              {validation.errors.join('，')}
            </div>
          )}
          
          {isValid && (
            <div className="mt-2 text-sm text-green-600 font-medium">
              ✓ 密码符合安全策略
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PasswordPolicyValidator
'use client'

import { useAuthStore } from './auth-store'
import { getThemeByGender, getThemeClasses, getThemeVariables } from './theme'

// 主题Hook
export const useTheme = () => {
  const { user, isAuthenticated } = useAuthStore()
  
  // 如果用户已登录且有性别信息，使用对应主题；否则使用默认主题
  const currentGender = isAuthenticated && user?.gender ? user.gender : 'female'
  const theme = getThemeByGender(currentGender)
  const themeClasses = getThemeClasses(currentGender)
  const themeVariables = getThemeVariables(currentGender)
  
  return {
    gender: currentGender,
    theme,
    classes: themeClasses,
    variables: themeVariables,
    isAuthenticated,
    
    // 便捷方法
    getButtonClass: (variant: 'primary' | 'secondary' = 'primary') => {
      return variant === 'primary' ? themeClasses.button : themeClasses.buttonSecondary
    },
    
    getBackgroundClass: () => themeClasses.background,
    
    getAccentClass: () => themeClasses.textAccent,
    
    getIconClass: () => themeClasses.iconAccent
  }
}
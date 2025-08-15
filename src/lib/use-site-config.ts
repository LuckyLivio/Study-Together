'use client'

import { useState, useEffect } from 'react'
import { siteConfig } from './config'

// 动态网站配置钩子
export function useSiteConfig() {
  const [config, setConfig] = useState(siteConfig)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 从API加载设置
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/site-settings')
        if (response.ok) {
          const savedSettings = await response.json()
          setConfig(prev => ({
            ...prev,
            name: savedSettings.siteName || prev.name,
            description: savedSettings.siteDescription || prev.description,
            url: savedSettings.siteUrl || prev.url,
          }))
        }
      } catch (error) {
        console.error('Failed to load site settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  return { config, isLoading }
}
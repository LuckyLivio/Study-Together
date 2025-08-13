'use client'

import { useState, useEffect } from 'react'
import { siteConfig } from './config'
import { LocalStorage, STORAGE_KEYS } from './storage'

// 动态网站配置钩子
export function useSiteConfig() {
  const [config, setConfig] = useState(siteConfig)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 从本地存储加载设置
    const loadSettings = () => {
      try {
        const savedSettings = LocalStorage.getItem(STORAGE_KEYS.SITE_SETTINGS)
        if (savedSettings) {
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

    // 监听存储变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.SITE_SETTINGS) {
        loadSettings()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return { config, isLoading }
}
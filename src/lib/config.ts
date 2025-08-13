// 网站配置中心
export const siteConfig = {
  name: "Study Together",
  description: "情侣共同备考网站",
  url: "http://localhost:3000",
  ogImage: "/og.jpg",
  links: {
    github: "https://github.com/yourusername/study-together",
  },
  // 情侣配置
  couple: {
    person1: {
      name: "Ta",
      color: "#3b82f6", // blue
    },
    person2: {
      name: "我",
      color: "#ec4899", // pink
    },
  },
  // 功能开关
  features: {
    aiAssistant: true,
    fileSharing: true,
    scheduleComparison: true,
    weatherWidget: true,
    blogSystem: true,
    messageWall: true,
  },
}

export type SiteConfig = typeof siteConfig
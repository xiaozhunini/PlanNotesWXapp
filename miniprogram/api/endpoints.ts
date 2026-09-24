// api/endpoints.ts
// 接口路径常量：所有 API 相对路径集中管理
// 路径与域名完全分离，仅修改 config/env.ts 即可切换环境
// services 层通过此文件引用路径，不硬编码任何 URL

export const API = {
  /** 认证相关（后端 AuthController） */
  auth: {
    /** 微信登录：{ code, nickName, avatarUrl } → 令牌包 */
    login: '/api/Auth/login',
    /** 当前用户信息：GET 返回 User */
    me: '/api/Auth/me',
    /** 刷新令牌：{ refreshToken } → 新令牌包 */
    refresh: '/api/Auth/refresh-token',
  },

  /** 标签管理（goal_tag 表） */
  goalTags: {
    list: '/api/goal-tags',
    detail: (id: number) => `/api/goal-tags/${id}`,
  },

  /** 年计划（yearly_goals 表） */
  yearlyGoals: {
    list: '/api/yearly-goals',
    detail: (id: number) => `/api/yearly-goals/${id}`,
  },

  /** 日程（daily_schedules 表） */
  dailySchedules: {
    list: '/api/daily-schedules',
    detail: (id: number) => `/api/daily-schedules/${id}`,
  },

  /** 日反思（daily_reflections 表） */
  dailyReflections: {
    detail: (planDate: string) => `/api/daily-reflections/${planDate}`,
  },
} as const

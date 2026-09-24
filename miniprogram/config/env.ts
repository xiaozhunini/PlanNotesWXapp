// config/env.ts
// 环境配置：域名与环境的分离管理
// 切换环境只需修改 CURRENT_ENV 这一行，所有接口路径自动使用新域名

/** 支持的环境类型 */
export type Env = 'dev' | 'test' | 'prod'

/** 各环境域名配置 */
const ENV_CONFIG: Record<Env, { baseUrl: string; timeout: number }> = {
  dev: {
    // 后端 ASP.NET Core 开发证书默认端口
    baseUrl: 'https://localhost:7062',
    timeout: 10000,
  },
  test: {
    baseUrl: 'https://test-api.yourdomain.com',
    timeout: 15000,
  },
  prod: {
    baseUrl: 'https://api.yourdomain.com',
    timeout: 15000,
  },
}

/** 当前环境 — 切换环境只改这一行 */
export const CURRENT_ENV: Env = 'dev'

/** 当前环境的完整配置 */
export const ENV = ENV_CONFIG[CURRENT_ENV]

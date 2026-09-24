// utils/token.ts
// 双令牌本地存储管理
// 微信小程序无 HttpOnly Cookie，令牌包整体存入 wx.setStorageSync
// 令牌包含 accessToken / refreshToken / 过期时间 / tokenType
// 过期时间用于 request 层的"主动刷新"（access 到期前提前换新）

/** 登录或刷新返回的完整令牌包 */
export interface TokenBundle {
  accessToken: string
  refreshToken: string
  /** accessToken 过期时间，ISO 8601 字符串 */
  accessTokenExpiresAt: string
  /** refreshToken 过期时间，ISO 8601 字符串 */
  refreshTokenExpiresAt: string
  /** 令牌类型，固定 "Bearer" */
  tokenType: string
}

/** 本地缓存 key */
const TOKEN_BUNDLE_KEY = 'authTokenBundle'

/** 读取令牌包 */
export function getTokenBundle(): TokenBundle | null {
  const raw = wx.getStorageSync(TOKEN_BUNDLE_KEY)
  if (!raw) return null
  if (typeof raw === 'object' && raw && 'accessToken' in raw) {
    return raw as TokenBundle
  }
  return null
}

/** 存储令牌包（登录 / 刷新成功后调用） */
export function setTokenBundle(bundle: TokenBundle): void {
  wx.setStorageSync(TOKEN_BUNDLE_KEY, bundle)
}

/** 清除令牌包（退出登录 / 令牌失效时调用） */
export function clearTokens(): void {
  wx.removeStorageSync(TOKEN_BUNDLE_KEY)
}

/** 读取 accessToken */
export function getAccessToken(): string {
  return getTokenBundle()?.accessToken || ''
}

/** 读取 refreshToken */
export function getRefreshToken(): string {
  return getTokenBundle()?.refreshToken || ''
}

/** 是否存在 accessToken */
export function hasAccessToken(): boolean {
  return !!getAccessToken()
}

/** 是否存在 refreshToken */
export function hasRefreshToken(): boolean {
  return !!getRefreshToken()
}

/**
 * accessToken 是否即将过期（在 bufferMs 内到期）
 * 用于请求层"主动刷新"：到期前提前换新，避免 401 往返
 * 没有过期时间信息时返回 false（交给被动 401 兜底）
 */
export function isAccessTokenExpiringSoon(bufferMs = 60_000): boolean {
  const bundle = getTokenBundle()
  if (!bundle || !bundle.accessTokenExpiresAt) return false
  const expiresAt = new Date(bundle.accessTokenExpiresAt).getTime()
  if (!expiresAt || isNaN(expiresAt)) return false
  return Date.now() + bufferMs >= expiresAt
}

/** refreshToken 是否已过期（用于判断是否还能刷新） */
export function isRefreshTokenExpired(): boolean {
  const bundle = getTokenBundle()
  if (!bundle || !bundle.refreshTokenExpiresAt) return false // 无信息，默认未过期交给后端判定
  const expiresAt = new Date(bundle.refreshTokenExpiresAt).getTime()
  if (!expiresAt || isNaN(expiresAt)) return false
  return Date.now() >= expiresAt
}

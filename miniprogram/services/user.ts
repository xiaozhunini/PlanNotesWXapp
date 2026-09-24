// services/user.ts
// 用户服务：wx.login 拿 code → 后端 /api/Auth/login 自动注册/登录 → 返回令牌包
// 登录响应不含 user，需另调 /api/Auth/me 获取用户信息
// 首次登录用占位 nickName/avatarUrl，用户后续在个人中心补全

import { request } from '../utils/request'
import {
  setTokenBundle,
  clearTokens,
  getAccessToken,
  hasAccessToken,
} from '../utils/token'
import { API } from '../api/endpoints'
import type { TokenBundle } from '../utils/token'
import type { User } from '../models'

/** wx.login 的 Promise 包装，返回临时 code */
function wxLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => resolve(res.code),
      fail: (err) => reject(err),
    })
  })
}

/** 默认占位资料（用户选择占位值方案：登录后由用户在个人中心补全） */
const DEFAULT_NICKNAME = '微信用户'
const DEFAULT_AVATAR = ''

/**
 * 微信登录
 * 1. wx.login 拿 code
 * 2. POST /api/Auth/login { code, nickName, avatarUrl }（skipAuth）
 *    - 后端首次登录自动注册，返回完整令牌包
 * 3. 存储令牌包
 * 4. GET /api/Auth/me 拉取用户信息（用刚拿到的 accessToken）
 * @param nickName 昵称，默认占位
 * @param avatarUrl 头像 URL，默认空字符串（后端可存 null）
 * @returns 当前登录用户
 */
export async function login(
  nickName: string = DEFAULT_NICKNAME,
  avatarUrl: string = DEFAULT_AVATAR
): Promise<User> {
  const code = await wxLogin()
  const bundle = await request<TokenBundle>({
    url: API.auth.login,
    method: 'POST',
    data: { code, nickName, avatarUrl },
    skipAuth: true,
  })
  setTokenBundle(bundle)
  // 登录响应只含令牌，用户信息单独拉取
  const user = await getCurrentUser()
  if (!user) throw new Error('登录后获取用户信息失败')
  return user
}

/**
 * 获取当前登录用户信息
 * 后端从 accessToken 解析 userId，返回对应用户
 * @returns 未登录（无 accessToken）时返回 null，不发请求
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!hasAccessToken()) return null
  return request<User>({
    url: API.auth.me,
    method: 'GET',
  })
}

/**
 * 更新当前用户资料（昵称/头像/手机号）
 * @param patch 待更新字段
 */
export async function updateCurrentUser(
  patch: Partial<Pick<User, 'nickName' | 'avatarUrl' | 'phone'>>
): Promise<User | null> {
  return request<User>({
    url: API.auth.me,
    method: 'PUT',
    data: patch,
  })
}

/**
 * 退出登录：清除本地令牌与认证状态
 * 注：后端未提供令牌注销接口，如需服务端失效 refreshToken，
 *     后端补 POST /api/Auth/logout 后在此处补充调用即可。
 */
export function logout(): void {
  clearTokens()
  // 清除全局用户态
  const app = getApp<IAppOption>()
  app.globalData.user = undefined
}

/** 令牌是否就绪（用于 UI 判断登录态） */
export function isAuthenticated(): boolean {
  return hasAccessToken()
}

/** 兼容：读取当前 accessToken */
export function getToken(): string {
  return getAccessToken()
}

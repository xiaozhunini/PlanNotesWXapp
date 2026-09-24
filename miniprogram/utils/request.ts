// utils/request.ts
// 统一请求封装：域名来自 config/env.ts，路径来自 api/endpoints.ts
// 双令牌机制（TokenBundle）：
// - accessToken 注入 Authorization 头，短期有效
// - 主动刷新：accessToken 即将过期时，发请求前先用 refreshToken 换新（避免 401 往返）
// - 被动刷新：服务端仍返回 401（时钟漂移 / 令牌被吊销）时兜底刷新后重发
// - 并发只刷新一次，其余入队等待；refreshToken 失效（403）则清令牌跳登录页

import { ENV } from '../config/env'
import {
  getAccessToken,
  getRefreshToken,
  setTokenBundle,
  clearTokens,
  isAccessTokenExpiringSoon,
  isRefreshTokenExpired,
} from './token'
import { API } from '../api/endpoints'
import type { TokenBundle } from './token'

/** 请求配置 */
export interface RequestOptions {
  /** 相对路径，如 /api/goal-tags，域名由 env 配置自动拼接 */
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, any>
  /** true 时跳过 token 注入与刷新逻辑（登录 / 刷新接口用） */
  skipAuth?: boolean
}

/** 后端统一响应格式 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/** 携带 statusCode 的错误，便于上层判断是否走刷新流程 */
export interface RequestError extends Error {
  statusCode?: number
  /** 刷新流程产生的错误（用于区分普通业务错误与刷新失败） */
  isRefreshError?: boolean
}

function makeError(message: string, statusCode?: number, isRefreshError = false): RequestError {
  const err = new Error(message) as RequestError
  err.statusCode = statusCode
  err.isRefreshError = isRefreshError
  return err
}

/** 主动刷新的提前量：accessToken 到期前 60 秒即触发刷新 */
const PROACTIVE_REFRESH_BUFFER_MS = 60_000

/**
 * 最底层请求：只负责拼 URL、注入 token、解包响应
 * - 不刷新、不跳转、不 toast
 * - 失败时 reject 一个带 statusCode 的 RequestError
 */
function rawRequest<T>(options: RequestOptions): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (!options.skipAuth) {
      const tk = getAccessToken()
      if (tk) header['Authorization'] = `Bearer ${tk}`
    }
    wx.request({
      url: ENV.baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data,
      timeout: ENV.timeout,
      header,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const body = res.data as any
          // 后端 { code, message, data } 包装格式 → 解包取 data
          if (body && typeof body === 'object' && 'data' in body && 'code' in body) {
            if (body.code === 200 || body.code === 0) {
              resolve(body.data as T)
            } else {
              reject(makeError(body.message || '请求失败', res.statusCode))
            }
          } else {
            // 后端直接返回数据，无包装
            resolve(res.data as T)
          }
        } else {
          const msg = (res.data as any)?.message || `请求失败 (${res.statusCode})`
          reject(makeError(msg, res.statusCode))
        }
      },
      fail: (e) => {
        reject(makeError(e.errMsg || '网络错误'))
      },
    })
  })
}

// ============ 刷新机制 ============
let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: RequestError) => void
}> = []

function flushQueue(token: string): void {
  pendingQueue.forEach((it) => it.resolve(token))
  pendingQueue = []
}

function rejectQueue(err: RequestError): void {
  pendingQueue.forEach((it) => it.reject(err))
  pendingQueue = []
}

/** 清空令牌并跳转登录页（refreshToken 失效时调用） */
function redirectToLogin(msg: string): void {
  clearTokens()
  isRefreshing = false
  rejectQueue(makeError('登录已过期', undefined, true))
  wx.showToast({ title: msg, icon: 'none', duration: 1500 })
  setTimeout(() => {
    wx.reLaunch({ url: '/pages/login/login' })
  }, 300)
}

/** 用 refreshToken 调 /api/Auth/refresh-token 换取新令牌包 */
function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return Promise.reject(makeError('无 refreshToken', undefined, true))
  // skipAuth 防止刷新接口自身 401 递归
  return rawRequest<TokenBundle>({
    url: API.auth.refresh,
    method: 'POST',
    data: { refreshToken },
    skipAuth: true,
  })
    .then((bundle) => {
      // 后端每次刷新都下发完整令牌包（含新 refreshToken，令牌轮换）
      setTokenBundle(bundle)
      return bundle.accessToken
    })
    .catch((err: RequestError) => {
      // 标记为刷新错误，便于 request 层与普通业务错误区分
      err.isRefreshError = true
      throw err
    })
}

/**
 * 获取一个可用的 accessToken（核心：主动刷新入口）
 * - 当前 accessToken 仍有效且未临近过期 → 直接返回
 * - 临近过期且有 refreshToken → 触发刷新（互斥，并发只刷一次）
 * - 无 refreshToken → 返回当前 accessToken（可能为空，由被动 401 / 调用方处理）
 */
function acquireToken(): Promise<string> {
  const at = getAccessToken()
  // 令牌有效且不临近过期 → 直接用
  if (at && !isAccessTokenExpiringSoon(PROACTIVE_REFRESH_BUFFER_MS)) {
    return Promise.resolve(at)
  }
  // 没有 refreshToken，无法主动刷新，返回当前值（可能为空）
  if (!getRefreshToken() || isRefreshTokenExpired()) {
    return Promise.resolve(at)
  }
  // 已有刷新在途 → 入队等待
  if (isRefreshing) {
    return new Promise<string>((res, rej) => {
      pendingQueue.push({ resolve: res, reject: rej })
    })
  }
  // 触发刷新
  isRefreshing = true
  return refreshAccessToken()
    .then((token) => {
      isRefreshing = false
      flushQueue(token)
      return token
    })
    .catch((err: RequestError) => {
      isRefreshing = false
      rejectQueue(err)
      throw err
    })
}

/**
 * 被动刷新：服务端返回 401 后，强制刷新一次并重发原请求
 * - 已在刷新中 → 入队等新 token 后重发
 * - 无 refreshToken → 跳登录页
 * - 刷新返回 403（refreshToken 失效）→ 跳登录页
 */
function reactiveRefreshAndRetry<T>(options: RequestOptions): Promise<T> {
  // 已在刷新（主动流程触发）→ 入队，等新 token 后重发
  if (isRefreshing) {
    return new Promise<string>((res, rej) => {
      pendingQueue.push({ resolve: res, reject: rej })
    }).then(() => rawRequest<T>(options))
  }
  if (!getRefreshToken() || isRefreshTokenExpired()) {
    redirectToLogin('请先登录')
    return Promise.reject(makeError('无 refreshToken', 401, true))
  }
  isRefreshing = true
  return refreshAccessToken()
    .then((token) => {
      isRefreshing = false
      flushQueue(token)
      return rawRequest<T>(options)
    })
    .catch((err: RequestError) => {
      isRefreshing = false
      rejectQueue(err)
      const status = err.statusCode
      const msg = status === 403 ? '登录已过期，请重新登录' : '登录失效，请重新登录'
      redirectToLogin(msg)
      throw err
    })
}

/**
 * 统一请求方法（业务层入口）
 * - 自动注入 accessToken
 * - 主动刷新：accessToken 临近过期时，发请求前先换新（避免 401 往返）
 * - 被动刷新：服务端 401 时兜底刷新后重发；并发请求只刷新一次
 * - refreshToken 失效（403）→ 清除令牌 + 跳转登录页
 * - 非刷新类错误自动 toast 提示
 * @returns 后端响应体中的 data 字段（已解包）
 */
export function request<T>(options: RequestOptions): Promise<T> {
  // skipAuth 直接走底层，不做刷新
  if (options.skipAuth) {
    return rawRequest<T>(options)
  }

  return new Promise<T>((resolve, reject) => {
    acquireToken()
      .then(() => rawRequest<T>(options))
      .then(resolve)
      .catch((err: RequestError) => {
        // 被动 401 → 刷新重试一次
        if (err.statusCode === 401) {
          return reactiveRefreshAndRetry<T>(options).then(resolve, reject)
        }
        // 主动刷新失败（refresh 接口 403 等）→ 跳登录
        if (err.isRefreshError) {
          // redirectToLogin 已在刷新流程内调用，这里只兜底跳转
          if (!isRefreshing) redirectToLogin('登录已过期，请重新登录')
          return reject(err)
        }
        // 普通业务错误
        wx.showToast({ title: err.message || '请求失败', icon: 'none' })
        reject(err)
      })
  })
}

/** 供需要跳过业务包装的场景直接调用底层（如刷新接口内部） */
export { rawRequest }

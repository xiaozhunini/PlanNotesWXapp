// app.ts
import { getCurrentUser } from './services/user'

App<IAppOption>({
  globalData: {user: null },
  loginReady: Promise.resolve(),  // 默认值，防止 onLaunch 之前就被访问
  onLaunch() {
    // 启动时检查令牌：有 accessToken 才请求 /api/Auth/me
    // - accessToken 临近过期 → request 层主动用 refreshToken 换新后重发
    // - accessToken 过期 / 无效 → request 层被动刷新后重发
    // - refreshToken 也失效（403）→ request 层清令牌并跳转登录页
    // - 完全无令牌 → getCurrentUser 返回 null，登录页主动引导
    this.loginReady =  getCurrentUser()
      .then((user) => {
        if (user) this.globalData.user = user
      })
      .catch(() => {
        // 网络错误等静默处理，登录页兜底
      })
  },
})

// app.ts
import { getCurrentUser } from './services/user'

App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 记录启动日志（保留模板能力）
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录流程：检查本地是否已有用户会话
    // 有 → 直接存入 globalData，首页可读取
    // 无 → 登录页会调 ensureUser 自动注册（本地阶段）
    const user = getCurrentUser()
    if (user) {
      this.globalData.user = user
    }
    // 接入 API 后改为：检查 token 有效性 → wx.login 换 code → 后端换 token
  },
})
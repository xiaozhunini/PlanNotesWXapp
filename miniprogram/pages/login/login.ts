// pages/login/login.ts
import { login } from '../../services/user'

Page({
  data: {
    statusBarHeight: 20,
    agreed: false,
  },

  onLoad() {
    const sysInfo = wx.getWindowInfo()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
  },

  /** 切换协议勾选状态 */
  toggleAgreement() {
    this.setData({ agreed: !this.data.agreed })
  },

  /** 打开协议页面（service=用户服务协议） */
  openAgreement(e: WechatMiniprogram.BaseEvent) {
    const type = (e.currentTarget.dataset as { type: string }).type
    wx.navigateTo({ url: `/pages/agreement/agreement?type=${type}` })
  },

  /** 打开隐私政策页面 */
  openPrivacyPolicy(e: WechatMiniprogram.BaseEvent) {
    const type = (e.currentTarget.dataset as { type: string }).type || 'privacy'
    wx.navigateTo({ url: `/pages/agreement/agreement?type=${type}` })
  },

  /** 手机号一键登录回调（按钮 open-type=getPhoneNumber 触发） */
  async onGetPhoneNumber(_e: WechatMiniprogram.ButtonGetPhoneNumber) {
    if (!this.data.agreed) {
      this.shakeAgreement()
      return
    }
    await this.doLogin()
  },

  /** 微信静默登录按钮：未勾选协议时提示 */
  async onSilentLogin() {
    if (!this.data.agreed) {
      this.shakeAgreement()
      return
    }
    await this.doLogin()
  },

  /**
   * 核心登录流程：
   * wx.login 拿 code → POST /api/Auth/login { code, nickName, avatarUrl }
   * → 后端自动注册/登录返回令牌包 → 存令牌 → GET /api/Auth/me 拿用户 → 跳首页
   * 占位资料方案：nickName/avatarUrl 用默认值，用户后续在个人中心补全
   */
  async doLogin() {
    wx.showLoading({ title: '登录中...', mask: true })
    try {
      const user = await login()
      const app = getApp<IAppOption>()
      app.globalData.user = user

      wx.hideLoading()
      wx.showToast({ title: '登录成功', icon: 'success', duration: 800 })

      setTimeout(() => {
        wx.switchTab({ url: '/pages/flag/flag' })
      }, 600)
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
  },

  /** 协议未勾选时的提示 */
  shakeAgreement() {
    wx.showToast({ title: '请先阅读并同意协议', icon: 'none', duration: 1500 })
  },
})

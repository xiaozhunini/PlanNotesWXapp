// pages/login/login.ts
import { ensureUser } from "../../services/user";

Page({
  data: {
    statusBarHeight: 20,
    agreed: false, // ✅ 改为 false
  },

  onLoad() {
    const sysInfo = wx.getWindowInfo();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
  },

  /** 切换协议勾选状态 */
  toggleAgreement() {
    this.setData({ agreed: !this.data.agreed });
  },

  /** 打开协议页面 */
  openAgreement(e: WechatMiniprogram.BaseEvent) {
    const type = (e.currentTarget.dataset as { type: string }).type;
    wx.navigateTo({ url: `/pages/agreement/agreement?type=${type}` });
  },
  /** 打开隐政策 */
  openPrivacyPolicy() {
    wx.openPrivacyContract(); // 一行搞定
  },

  /** 手机号一键登录回调 */
  async onGetPhoneNumber(e: WechatMiniprogram.ButtonGetPhoneNumber) {
    if (!this.data.agreed) {
      this.shakeAgreement();
      return;
    }

    if (e.detail.errMsg !== "getPhoneNumber:ok") {
      await this.doLogin();
      return;
    }

    await this.doLogin();
  },

  /** 静默登录 */
  async onSilentLogin() {
    if (!this.data.agreed) {
      this.shakeAgreement();

      return;
    }
    await this.doLogin();
  },

  /** 核心登录流程 */
  async doLogin() {
    // 1. 显示加载弹窗，mask: true 防止用户点击穿透（防止用户在加载时乱点按钮）
    wx.showLoading({ title: "登录中...", mask: true });

    try {
      // 2. 调用你自己封装的 ensureUser() 服务函数
      // 这个函数内部应该包含了：wx.login() 获取 code → 调用你的后端接口换取用户信息
      const user = await ensureUser();

      // 3. 获取小程序全局实例，把登录成功的用户信息存到 globalData 里
      // 这样其他页面也能通过 getApp().globalData.user 拿到当前用户信息
      const app = getApp<IAppOption>();
      app.globalData.user = user as any;

      // 4. 隐藏加载弹窗
      wx.hideLoading();

      // 5. 弹出成功提示，持续 800 毫秒
      wx.showToast({ title: "登录成功", icon: "success", duration: 800 });

      // 6. 等 600 毫秒（让用户看到"登录成功"的提示），然后用 switchTab 跳转到首页
      // switchTab 会关闭当前登录页，用户无法返回到登录页
      setTimeout(() => {
        wx.switchTab({ url: "/pages/flag/flag" });
      }, 600);
    } catch (e) {
      // 7. 如果上面任何一步报错（网络失败、接口报错等），进入 catch 分支
      wx.hideLoading();
      wx.showToast({ title: "登录失败，请重试", icon: "none" });
    }
  },

  /** 协议未勾选时的抖动提示 */
  shakeAgreement() {
    wx.showToast({ title: "请先阅读并同意协议", icon: "none", duration: 1500 });
  },
});

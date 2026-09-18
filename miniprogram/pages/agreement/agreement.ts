// pages/agreement/agreement.ts
Page({
  data: {
    type: 'service', // service=用户服务协议, privacy=隐私政策
  },

  onLoad(options: { type?: string }) {
    const type = options.type || 'service'
    this.setData({ type })
  },
})

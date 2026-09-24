// app.d.ts（和 app.ts 同级目录）
interface IAppOption {
  globalData: {
    user: any
  }
  loginReady: Promise<void>
}
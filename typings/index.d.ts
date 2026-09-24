// app.d.ts
declare module 'miniprogram-api-typings' {
  namespace App {
    interface Instance<T> {
      loginReady?: Promise<void>
    }
  }
}

interface IAppOption {
  globalData: {
    user: any
  }
  loginReady: Promise<void>
}
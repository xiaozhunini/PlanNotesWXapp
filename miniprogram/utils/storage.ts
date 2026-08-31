// utils/storage.ts
// 本地存储统一封装：所有业务数据集中管理，后续接入 API 时只需替换 services 内部实现

const PREFIX = 'plannotes_'

/** 读取本地存储，读取失败或为空时返回默认值 */
export function read<T>(key: string, defaultValue: T): T {
  try {
    const value = wx.getStorageSync(PREFIX + key)
    if (value === '' || value === null || value === undefined) {
      return defaultValue
    }
    return value as T
  } catch {
    return defaultValue
  }
}

/** 写入本地存储 */
export function write<T>(key: string, value: T): void {
  try {
    wx.setStorageSync(PREFIX + key, value)
  } catch {
    // 存储写入失败（如容量满）时静默处理
  }
}

/** 自增 ID，模拟数据库各表的自增主键 */
export function nextId(table: string): number {
  const counters = read<Record<string, number>>('id_counters', {})
  counters[table] = (counters[table] || 0) + 1
  write('id_counters', counters)
  return counters[table]
}

// services/user.ts
// 用户服务：本地版用存储模拟单用户登录，接入 API 后替换为 wx.login 换取 token 的流程
import { read, write, nextId } from '../utils/storage'
import { User } from '../models'

const USERS_KEY = 'users'
const CURRENT_USER_ID_KEY = 'current_user_id'

/**
 * 获取当前登录用户
 * 等价 SQL：SELECT * FROM users WHERE id = <当前会话的 id>
 * @returns 未登录时返回 null
 */
export async function getCurrentUser(): Promise<User | null> {
  const users = read<User[]>(USERS_KEY, []) // 读出 users 表全部行
  const id = read<number>(CURRENT_USER_ID_KEY, 0) // 读“当前会话”记录的 user_id
  return users.find(u => u.id === id) || null // 按 id 找行，找不到说明未登录
}

/**
 * 确保存在当前用户（首次使用时自动创建，模拟注册）
 * 幂等设计：调用方永远不用判断“有没有用户”，第一次调用会自动注册并建立会话
 * 接入 API 后改为 wx.login 换取 code → 后端换 openId → 落库并建立会话
 * @param profile 可选的昵称/头像（来自微信授权）
 */
export async function ensureUser(
  profile?: Partial<Pick<User, 'nickName' | 'avatarUrl'>>
): Promise<User> {
  const existing = await getCurrentUser()
  if (existing) return existing // 已有会话，直接返回，保证幂等

  const now = Date.now()
  // 构造一行新数据，模拟 INSERT INTO users ...
  const user: User = {
    id: nextId('users'), // 自增主键
    openId: `local_${now}`, // 接入后端后由 wx.login 换取
    unionId: '',
    nickName: profile?.nickName || '微信用户',
    avatarUrl: profile?.avatarUrl || '',
    phone: '',
    userStatus: 0, // 0 = 正常
    lastLoginTime: now,
    createdAt: now,
    updatedAt: now,
  }
  const users = read<User[]>(USERS_KEY, [])
  users.push(user) // 追加到“表”
  write(USERS_KEY, users) // 写回整张表
  write(CURRENT_USER_ID_KEY, user.id) // 建立会话：记录当前 user_id
  return user
}

/**
 * 更新当前用户资料（昵称/头像/手机号）
 * 等价 SQL：UPDATE users SET <patch 字段>, updated_at = NOW() WHERE id = <当前 id>
 * @param patch 只允许传昵称/头像/手机号，其他字段（如 openId/状态）不开放给前端改
 * @returns 更新后的用户；未登录返回 null
 */
export async function updateCurrentUser(
  patch: Partial<Pick<User, 'nickName' | 'avatarUrl' | 'phone'>>
): Promise<User | null> {
  const users = read<User[]>(USERS_KEY, [])
  const id = read<number>(CURRENT_USER_ID_KEY, 0)
  const index = users.findIndex(u => u.id === id)
  if (index === -1) return null // 未登录，无法更新
  // 对象展开合并：patch 传了什么就覆盖什么，没传的保持原值，同时刷新 updated_at
  users[index] = { ...users[index], ...patch, updatedAt: Date.now() }
  write(USERS_KEY, users)
  return users[index]
}

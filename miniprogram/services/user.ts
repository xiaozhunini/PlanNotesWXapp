// services/user.ts
// 用户服务：本地版用存储模拟单用户登录，接入 API 后替换为 wx.login 换取 token 的流程
import { read, write, nextId } from '../utils/storage'
import { User } from '../models'

const USERS_KEY = 'users'
const CURRENT_USER_ID_KEY = 'current_user_id'

/** 获取当前登录用户 */
export async function getCurrentUser(): Promise<User | null> {
  const users = read<User[]>(USERS_KEY, [])
  const id = read<number>(CURRENT_USER_ID_KEY, 0)
  return users.find(u => u.id === id) || null
}

/** 确保存在当前用户（首次使用时自动创建，模拟注册） */
export async function ensureUser(
  profile?: Partial<Pick<User, 'nickName' | 'avatarUrl'>>
): Promise<User> {
  const existing = await getCurrentUser()
  if (existing) return existing

  const now = Date.now()
  const user: User = {
    id: nextId('users'),
    openId: `local_${now}`, // 接入后端后由 wx.login 换取
    unionId: '',
    nickName: profile?.nickName || '微信用户',
    avatarUrl: profile?.avatarUrl || '',
    phone: '',
    userStatus: 0,
    lastLoginTime: now,
    createdAt: now,
    updatedAt: now,
  }
  const users = read<User[]>(USERS_KEY, [])
  users.push(user)
  write(USERS_KEY, users)
  write(CURRENT_USER_ID_KEY, user.id)
  return user
}

/** 更新当前用户资料（昵称/头像/手机号） */
export async function updateCurrentUser(
  patch: Partial<Pick<User, 'nickName' | 'avatarUrl' | 'phone'>>
): Promise<User | null> {
  const users = read<User[]>(USERS_KEY, [])
  const id = read<number>(CURRENT_USER_ID_KEY, 0)
  const index = users.findIndex(u => u.id === id)
  if (index === -1) return null
  users[index] = { ...users[index], ...patch, updatedAt: Date.now() }
  write(USERS_KEY, users)
  return users[index]
}

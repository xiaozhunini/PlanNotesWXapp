// services/goal-tag.ts
// 标签服务（对应 goal_tag 表），当前为本地存储实现
import { read, write, nextId } from '../utils/storage'
import { ensureUser } from './user'
import { GoalTag } from '../models'

const KEY = 'goal_tags'

export interface GoalTagInput {
  name: string
  icon?: string
  color?: string
  sortOrder?: number
}

/**
 * 标签列表（系统通用 + 当前用户自建）
 * 等价 SQL：SELECT * FROM goal_tag WHERE user_id = 0 OR user_id = ?
 *          ORDER BY sort_order ASC, id ASC
 * 系统标签 user_id=0，所有用户可见；用户自建标签只对自己可见
 */
export async function listGoalTags(): Promise<GoalTag[]> {
  const userId = (await ensureUser()).id
  return read<GoalTag[]>(KEY, [])
    .filter(t => t.userId === 0 || t.userId === userId) // 系统标签 + 自己的标签
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id) // 先按 sort_order，再按 id 兜底
}

/**
 * 按 ID 获取标签
 * 等价 SQL：SELECT * FROM goal_tag WHERE id = ?
 */
export async function getGoalTag(id: number): Promise<GoalTag | null> {
  return read<GoalTag[]>(KEY, []).find(t => t.id === id) || null
}

/**
 * 新增用户标签
 * 等价 SQL：INSERT INTO goal_tag (user_id, name, ...) VALUES (?, ...)
 * 注意：user_id 由服务层注入，调用方无法创建系统标签（user_id=0）
 */
export async function addGoalTag(input: GoalTagInput): Promise<GoalTag> {
  const user = await ensureUser()
  const tag: GoalTag = {
    id: nextId(KEY),
    name: input.name.trim(),
    icon: input.icon || '',
    color: input.color || '',
    userId: user.id, // 普通用户只能建自己的标签，不能建系统标签
    sortOrder: input.sortOrder ?? 0,
    createdAt: Date.now(),
  }
  const tags = read<GoalTag[]>(KEY, [])
  tags.push(tag)
  write(KEY, tags)
  return tag
}

/**
 * 更新标签
 * 等价 SQL：UPDATE goal_tag SET <patch> WHERE id = ? AND user_id = ?
 * @param patch 排除 id/userId/createdAt，这三个字段不可改
 */
export async function updateGoalTag(
  id: number,
  patch: Partial<Omit<GoalTag, 'id' | 'userId' | 'createdAt'>>
): Promise<GoalTag | null> {
  const userId = (await ensureUser()).id
  const tags = read<GoalTag[]>(KEY, [])
  // 普通用户只能改自己的标签，不能改系统标签
  const index = tags.findIndex(t => t.id === id && t.userId === userId)
  if (index === -1) return null
  tags[index] = { ...tags[index], ...patch }
  write(KEY, tags)
  return tags[index]
}

/**
 * 删除标签
 * 等价 SQL：DELETE FROM goal_tag WHERE id = ? AND user_id = ?
 * @returns 是否删除成功（系统标签删不掉、别人的标签删不掉）
 */
export async function removeGoalTag(id: number): Promise<boolean> {
  const userId = (await ensureUser()).id
  const tags = read<GoalTag[]>(KEY, [])
  const rest = tags.filter(t => !(t.id === id && t.userId === userId))
  write(KEY, rest)
  return rest.length !== tags.length
}

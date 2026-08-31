export const formatTime = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  )
}

const formatNumber = (n: number) => {
  const s = n.toString()
  return s[1] ? s : '0' + s
}

/** 格式化为 'YYYY-MM-DD'（用于 plan_date、week_start_date 等日期字段） */
export const formatDate = (date: Date) => {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map(formatNumber)
    .join('-')
}

/** 格式化为 'HH:mm'（用于 start_time、end_time 等时间字段） */
export const formatHM = (date: Date) => {
  return [date.getHours(), date.getMinutes()].map(formatNumber).join(':')
}

/** 日期加减天数 */
export const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

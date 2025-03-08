import moment from 'moment';
// 使用 moment 内置方法导入中文语言包
moment.locale('zh-cn');

/**
 * 日期格式化
 * @param date 日期
 * @param format 格式
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string | number | Date, format = 'YYYY-MM-DD'): string => {
  return moment(date).format(format);
};

/**
 * 时间格式化
 * @param date 日期
 * @param format 格式
 * @returns 格式化后的时间字符串
 */
export const formatTime = (date: string | number | Date, format = 'HH:mm:ss'): string => {
  return moment(date).format(format);
};

/**
 * 日期时间格式化
 * @param date 日期
 * @param format 格式
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (date: string | number | Date, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  return moment(date).format(format);
};

/**
 * 获取相对时间
 * @param date 日期
 * @returns 相对时间字符串，如"几分钟前"
 */
export const fromNow = (date: string | number | Date): string => {
  return moment(date).fromNow();
};

/**
 * 获取两个日期之间的差值
 * @param date1 日期1
 * @param date2 日期2
 * @param unit 单位
 * @returns 差值
 */
export const diff = (date1: string | number | Date, date2: string | number | Date, unit: 'days' | 'months' | 'years' | 'hours' | 'minutes' | 'seconds' = 'days'): number => {
  return moment(date1).diff(moment(date2), unit);
};

/**
 * 判断日期是否在指定范围内
 * @param date 日期
 * @param start 开始日期
 * @param end 结束日期
 * @returns 是否在范围内
 */
export const isBetweenDates = (date: string | number | Date, start: string | number | Date, end: string | number | Date): boolean => {
  return moment(date).isBetween(start, end);
};

/**
 * 获取本月第一天
 * @returns 本月第一天
 */
export const getFirstDayOfMonth = (): Date => {
  return moment().startOf('month').toDate();
};

/**
 * 获取本月最后一天
 * @returns 本月最后一天
 */
export const getLastDayOfMonth = (): Date => {
  return moment().endOf('month').toDate();
};

/**
 * 获取本周第一天
 * @returns 本周第一天
 */
export const getFirstDayOfWeek = (): Date => {
  return moment().startOf('week').toDate();
};

/**
 * 获取本周最后一天
 * @returns 本周最后一天
 */
export const getLastDayOfWeek = (): Date => {
  return moment().endOf('week').toDate();
};

/**
 * 增加指定时间
 * @param date 日期
 * @param amount 数量
 * @param unit 单位
 * @returns 增加后的日期
 */
export const addTime = (date: string | number | Date, amount: number, unit: 'days' | 'months' | 'years' | 'hours' | 'minutes' | 'seconds'): Date => {
  return moment(date).add(amount, unit).toDate();
};

/**
 * 减少指定时间
 * @param date 日期
 * @param amount 数量
 * @param unit 单位
 * @returns 减少后的日期
 */
export const subtractTime = (date: string | number | Date, amount: number, unit: 'days' | 'months' | 'years' | 'hours' | 'minutes' | 'seconds'): Date => {
  return moment(date).subtract(amount, unit).toDate();
};

/**
 * 日期是否为今天
 * @param date 日期
 * @returns 是否为今天
 */
export const isToday = (date: string | number | Date): boolean => {
  return moment(date).isSame(moment(), 'day');
};

/**
 * 日期是否为昨天
 * @param date 日期
 * @returns 是否为昨天
 */
export const isYesterday = (date: string | number | Date): boolean => {
  return moment(date).isSame(moment().subtract(1, 'days'), 'day');
};

/**
 * 日期是否为明天
 * @param date 日期
 * @returns 是否为明天
 */
export const isTomorrow = (date: string | number | Date): boolean => {
  return moment(date).isSame(moment().add(1, 'days'), 'day');
};

/**
 * 解析日期
 * @param dateStr 日期字符串
 * @param format 格式
 * @returns 日期对象
 */
export const parseDate = (dateStr: string, format: string): Date | null => {
  const parsed = moment(dateStr, format);
  return parsed.isValid() ? parsed.toDate() : null;
};

/**
 * 获取日历时间
 * @param date 日期
 * @returns 日历时间字符串 
 */
export const calendarTime = (date: string | number | Date): string => {
  return moment(date).calendar();
};

/**
 * 获取季度
 * @param date 日期
 * @returns 季度
 */
export const getQuarter = (date: string | number | Date): number => {
  return moment(date).quarter();
};

export default moment; 
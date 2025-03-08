/**
 * 日期工具函数集合
 */
import i18n from '@/lib/i18n';

/**
 * 判断是否为闰年
 * @param year 年份
 * @returns 是否为闰年
 */
export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * 获取某月的天数
 * @param year 年份
 * @param month 月份 (1-12)
 * @returns 天数
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

/**
 * 获取某天是一周的第几天
 * @param date 日期
 * @returns 星期几 (0-6, 0表示星期日)
 */
export const getDayOfWeek = (date: Date): number => {
  return date.getDay();
};

/**
 * 获取某天是一年中的第几天
 * @param date 日期
 * @returns 天数 (1-366)
 */
export const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

/**
 * 获取某年某月的第一天是星期几
 * @param year 年份
 * @param month 月份 (1-12)
 * @returns 星期几 (0-6, 0表示星期日)
 */
export const getFirstDayOfWeekInMonth = (year: number, month: number): number => {
  return new Date(year, month - 1, 1).getDay();
};

/**
 * 获取两个日期之间的所有日期
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 日期数组
 */
export const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

/**
 * 获取星期几，支持国际化
 * @param day 星期几 (0-6, 0表示星期日)
 * @returns 当前语言环境下的星期几
 */
export const getChineseWeekday = (day: number): string => {
  const weekdayKeys = [
    'sunday', 'monday', 'tuesday', 'wednesday', 
    'thursday', 'friday', 'saturday'
  ];
  
  return i18n.t(`date-utils.weekdays.${weekdayKeys[day]}`);
};

/**
 * 获取当前语言环境下的月份名称
 * @param month 月份 (1-12)
 * @returns 当前语言环境下的月份
 */
export const getChineseMonth = (month: number): string => {
  const monthKeys = [
    'january', 'february', 'march', 'april', 
    'may', 'june', 'july', 'august', 
    'september', 'october', 'november', 'december'
  ];
  
  return i18n.t(`date-utils.months.${monthKeys[month - 1]}`);
};

/**
 * 获取农历日期
 * @param date 公历日期
 * @returns 农历日期字符串
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getLunarDate = (date: Date): string => {
  // 这里仅作为占位函数，实际实现农历转换需要使用专门的库
  // 可考虑使用 lunar-javascript 或 solarlunar 等第三方库
  return '农历日期转换需要额外的库支持';
};

/**
 * 格式化倒计时
 * @param milliseconds 毫秒数
 * @returns 格式化后的倒计时字符串 (HH:MM:SS)
 */
export const formatCountdown = (milliseconds: number): string => {
  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
  const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
};

/**
 * 获取时间戳
 * @returns 当前时间戳（毫秒）
 */
export const getTimestamp = (): number => {
  return Date.now();
};

/**
 * 格式化时间段
 * @param milliseconds 毫秒数
 * @returns 格式化后的时间段
 */
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const currentLang = i18n.language;
  
  if (currentLang === 'zh') {
    if (days > 0) {
      return `${days}天${hours % 24}小时`;
    } else if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  } else {
    // 英文和其他语言
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hour${hours % 24 > 1 || hours % 24 === 0 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} minute${minutes % 60 > 1 || minutes % 60 === 0 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds % 60} second${seconds % 60 > 1 || seconds % 60 === 0 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
  }
};

/**
 * 检查日期是否有效
 * @param year 年份
 * @param month 月份 (1-12)
 * @param day 日 (1-31)
 * @returns 是否有效
 */
export const isValidDate = (year: number, month: number, day: number): boolean => {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

/**
 * 将秒数转换为时分秒格式，支持国际化
 * @param seconds 秒数
 * @returns 时分秒格式字符串
 */
export const secondsToHMS = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const currentLang = i18n.language;
  
  if (currentLang === 'zh') {
    const hDisplay = h > 0 ? h + '小时' : '';
    const mDisplay = m > 0 ? m + '分钟' : '';
    const sDisplay = s > 0 ? s + '秒' : '';
    
    return hDisplay + mDisplay + sDisplay || '0秒';
  } else {
    // 英文和其他语言
    const hDisplay = h > 0 ? h + (h === 1 ? ' hour ' : ' hours ') : '';
    const mDisplay = m > 0 ? m + (m === 1 ? ' minute ' : ' minutes ') : '';
    const sDisplay = s > 0 ? s + (s === 1 ? ' second' : ' seconds') : '';
    
    return hDisplay + mDisplay + sDisplay || '0 seconds';
  }
};

/**
 * 获取年龄
 * @param birthDate 出生日期
 * @returns 年龄
 */
export const getAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}; 
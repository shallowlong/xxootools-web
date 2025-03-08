# 日期工具使用示例

## 导入方式

```typescript
// 导入整个日期工具模块
import * as date from 'src/lib/date';

// 导入特定日期库的工具函数
import { dayjsUtils, momentUtils, dateUtils } from 'src/lib/date';

// 导入 dayjs 或 moment 实例
import { dayjs, moment } from 'src/lib/date';

// 使用默认导出 (dayjs 工具函数)
import dateTools from 'src/lib/date';
```

## dayjs 工具函数示例

```typescript
import { dayjsUtils } from 'src/lib/date';

// 格式化日期
const formattedDate = dayjsUtils.formatDate(new Date(), 'YYYY年MM月DD日');
console.log(formattedDate); // 例如: 2024年03月07日

// 获取相对时间
const relativeTime = dayjsUtils.fromNow(new Date('2024-01-01'));
console.log(relativeTime); // 例如: 2个月前

// 日期比较
const isFuture = dayjsUtils.isBetweenDates(
  new Date('2024-12-31'),
  new Date(),
  new Date('2025-01-01')
);
console.log(isFuture); // true

// 获取本月第一天
const firstDay = dayjsUtils.getFirstDayOfMonth();
console.log(dayjsUtils.formatDate(firstDay)); // 2024-03-01
```

## moment.js 工具函数示例

```typescript
import { momentUtils } from 'src/lib/date';

// 格式化日期
const formattedDate = momentUtils.formatDate(new Date(), 'YYYY年MM月DD日');
console.log(formattedDate); // 例如: 2024年03月07日

// 获取相对时间
const relativeTime = momentUtils.fromNow(new Date('2024-01-01'));
console.log(relativeTime); // 例如: 2个月前

// 获取日历时间
const calendarTime = momentUtils.calendarTime(new Date());
console.log(calendarTime); // 例如: 今天 13:45

// 获取季度
const quarter = momentUtils.getQuarter(new Date());
console.log(quarter); // 例如: 1 (第一季度)
```

## 通用日期工具函数示例

```typescript
import { dateUtils } from 'src/lib/date';

// 判断是否为闰年
const isLeap = dateUtils.isLeapYear(2024);
console.log(isLeap); // true

// 获取某月天数
const daysInMonth = dateUtils.getDaysInMonth(2024, 2);
console.log(daysInMonth); // 29 (2024年2月是闰年)

// 获取中文星期几
const weekday = dateUtils.getChineseWeekday(new Date().getDay());
console.log(weekday); // 例如: 星期四

// 获取两个日期之间的所有日期
const dates = dateUtils.getDatesBetween(
  new Date('2024-03-01'),
  new Date('2024-03-05')
);
console.log(dates.length); // 5

// 格式化倒计时
const countdown = dateUtils.formatCountdown(3661000);
console.log(countdown); // 01:01:01

// 格式化时间段
const duration = dateUtils.formatDuration(3661000);
console.log(duration); // 1小时1分钟1秒
```

## 完整示例

```typescript
import { dayjsUtils, momentUtils, dateUtils } from 'src/lib/date';

// 使用当前时间
const now = new Date();

// dayjs 格式化
const dayjsFormatted = dayjsUtils.formatDateTime(now);
console.log(`Dayjs 格式化: ${dayjsFormatted}`);

// moment 格式化
const momentFormatted = momentUtils.formatDateTime(now);
console.log(`Moment 格式化: ${momentFormatted}`);

// 使用通用日期工具
const weekday = dateUtils.getChineseWeekday(now.getDay());
console.log(`今天是: ${weekday}`);

// 年龄计算
const birthDate = new Date('1990-01-01');
const age = dateUtils.getAge(birthDate);
console.log(`年龄: ${age}岁`);
``` 
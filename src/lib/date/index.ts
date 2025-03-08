import * as dayjsUtils from './dayjs';
import * as momentUtils from './moment';
import * as dateUtils from './utils';

// 导出所有模块
export { dayjsUtils, momentUtils, dateUtils };

// 导出默认的 dayjs 和 moment 实例
export { default as dayjs } from './dayjs';
export { default as moment } from './moment';

// 将 dayjs 作为默认推荐的日期处理库导出
export default dayjsUtils; 
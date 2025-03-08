import { useState } from 'react';
import { dateUtils } from '@/lib/date';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import ToolLayout from '@/components/tool/ToolLayout';

const DateUtils = () => {
  const { t } = useTranslation();
  
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [day, setDay] = useState<number>(new Date().getDate());
  const [date, setDate] = useState<Date>(new Date());
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  });

  // 新增时间戳转换工具的状态
  const [milliseconds, setMilliseconds] = useState<number>(Date.now());
  const [seconds, setSeconds] = useState<number>(Math.floor(Date.now() / 1000));
  const [timeFormat, setTimeFormat] = useState<string>('YYYY-MM-DD HH:mm:ss');

  // 处理日期选择
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(new Date(e.target.value));
  };

  // 处理开始日期选择
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(new Date(e.target.value));
  };

  // 处理结束日期选择
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(new Date(e.target.value));
  };

  // 格式化日期为 ISO 字符串，并截取 YYYY-MM-DD 部分
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // 时间格式示例
  const formatExamples = [
    'YYYY-MM-DD HH:mm:ss',
    'YYYY年MM月DD日 HH时mm分ss秒',
    'YYYY/MM/DD HH:mm:ss',
    'MM/DD/YYYY HH:mm:ss',
    'DD/MM/YYYY HH:mm:ss',
    'ddd, MMM D, YYYY HH:mm:ss',
    'dddd, MMMM D, YYYY HH:mm:ss'
  ];


  return (
    <ToolLayout
      categoryId="date"
      toolId="date-utils"
      title={t('date-utils.title')}
      description={``}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 时间戳转换工具 */}
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <span>{t('date-utils.timestampTools.title')}</span>
          </h2>
          
          {/* 毫秒时间戳部分 - 更紧凑的布局 */}
          <div className="space-y-2">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium whitespace-nowrap min-w-[80px]">{t('date-utils.timestampTools.millisecondTimestamp')}</label>
                <div className="flex-1 flex gap-1">
                  <input
                    type="number"
                    className="w-full px-2 py-1 text-sm border rounded-md"
                    value={milliseconds}
                    onChange={(e) => setMilliseconds(parseInt(e.target.value) || 0)}
                  />
                  <button
                    className="px-2 py-1 text-sm bg-primary text-white rounded-md whitespace-nowrap"
                    onClick={() => setMilliseconds(Date.now())}
                  >
                    {t('date-utils.timestampTools.current')}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium whitespace-nowrap min-w-[80px]">{t('date-utils.timestampTools.format')}</label>
                <select
                  className="flex-1 px-2 py-1 text-sm border rounded-md"
                  value={timeFormat}
                  onChange={(e) => setTimeFormat(e.target.value)}
                >
                  {formatExamples.map((fmt) => (
                    <option key={fmt} value={fmt}>
                      {fmt}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium whitespace-nowrap min-w-[80px]">{t('date-utils.timestampTools.result')}</label>
                <div className="flex-1 px-2 py-1 text-sm border rounded-md bg-gray-50 dark:bg-gray-900 font-mono overflow-x-auto">
                  {moment(milliseconds).format(timeFormat)}
                </div>
              </div>
            </div>
            
            {/* 秒时间戳部分 */}
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium whitespace-nowrap min-w-[80px]">{t('date-utils.timestampTools.secondTimestamp')}</label>
                <div className="flex-1 flex gap-1">
                  <input
                    type="number"
                    className="w-full px-2 py-1 text-sm border rounded-md"
                    value={seconds}
                    onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                  />
                  <button
                    className="px-2 py-1 text-sm bg-primary text-white rounded-md whitespace-nowrap"
                    onClick={() => setSeconds(Math.floor(Date.now() / 1000))}
                  >
                    {t('date-utils.timestampTools.current')}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium whitespace-nowrap min-w-[80px]">{t('date-utils.timestampTools.result')}</label>
                <div className="flex-1 px-2 py-1 text-sm border rounded-md bg-gray-50 dark:bg-gray-900 font-mono overflow-x-auto">
                  {moment.unix(seconds).format(timeFormat)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">{t('date-utils.yearMonthDayTools.title')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('date-utils.yearMonthDayTools.year')}</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-md"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('date-utils.yearMonthDayTools.month')}</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-md"
                  min={1}
                  max={12}
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('date-utils.yearMonthDayTools.day')}</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-md"
                  min={1}
                  max={31}
                  value={day}
                  onChange={(e) => setDay(parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('date-utils.yearMonthDayTools.isLeapYear')}</span>
                <span>{dateUtils.isLeapYear(year) ? t('date-utils.yearMonthDayTools.yes') : t('date-utils.yearMonthDayTools.no')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('date-utils.yearMonthDayTools.daysInMonth')}</span>
                <span>{dateUtils.getDaysInMonth(year, month)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('date-utils.yearMonthDayTools.firstDayOfMonth')}</span>
                <span>{dateUtils.getChineseWeekday(dateUtils.getFirstDayOfWeekInMonth(year, month))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('date-utils.yearMonthDayTools.isValidDate')}</span>
                <span>{dateUtils.isValidDate(year, month, day) ? t('date-utils.yearMonthDayTools.valid') : t('date-utils.yearMonthDayTools.invalid')}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">{t('date-utils.dateRangeTools.title')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('date-utils.dateRangeTools.startDate')}</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md"
                value={formatDateForInput(startDate)}
                onChange={handleStartDateChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('date-utils.dateRangeTools.endDate')}</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md"
                value={formatDateForInput(endDate)}
                onChange={handleEndDateChange}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('date-utils.dateRangeTools.daysBetween')}</span>
                <span>{dateUtils.getDatesBetween(startDate, endDate).length}</span>
              </div>
            
            </div>
          </div>
        </div>
        
        
        
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">{t('date-utils.dateInfoTools.title')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('date-utils.dateInfoTools.date')}</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md"
                value={formatDateForInput(date)}
                onChange={handleDateChange}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('date-utils.dateInfoTools.weekday')}</span>
                <span>{dateUtils.getChineseWeekday(dateUtils.getDayOfWeek(date))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('date-utils.dateInfoTools.dayOfYear')}</span>
                <span>{dateUtils.getDayOfYear(date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('date-utils.dateInfoTools.currentTimestamp')}</span>
                <span>{dateUtils.getTimestamp()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('date-utils.dateInfoTools.ageIfBirthday')}</span>
                <span>{dateUtils.getAge(date)}{t('date-utils.dateInfoTools.yearsOld')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default DateUtils; 
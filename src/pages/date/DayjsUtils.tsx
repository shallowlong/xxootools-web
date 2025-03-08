import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import ToolLayout from '@/components/tool/ToolLayout';

const DayjsUtils = () => {
  const { t } = useTranslation();
  const [dayjsCode, setDayjsCode] = useState<string>("dayjs().format('YYYY-MM-DD HH:mm:ss')");
  const [codeResult, setCodeResult] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // dayjs代码示例
  const codeExamples = [
    "dayjs().format('YYYY-MM-DD HH:mm:ss')",
    "dayjs('2023-01-01').add(1, 'day').format('YYYY-MM-DD')",
    "dayjs().subtract(7, 'day').fromNow()",
    "dayjs().startOf('month').format('YYYY-MM-DD')",
    "dayjs().endOf('year').format('YYYY-MM-DD')",
    "dayjs().isValid()",
    "dayjs().diff(dayjs('2022-01-01'), 'day')",
    "dayjs().daysInMonth()"
  ];

  // 执行dayjs代码
  const executeDayjsCode = () => {
    try {
      // 使用Function构造器创建一个可执行的函数，只提供 dayjs
      const result = new Function('dayjs', `return ${dayjsCode}`)(dayjs);
      setCodeResult(String(result));
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('dayjs-utils.unknownError'));
      setCodeResult('');
    }
  };

  // 当代码变化时自动执行
  useEffect(() => {
    executeDayjsCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayjsCode]);

  return (
    <ToolLayout
      categoryId="date"
      toolId="dayjs-utils"
      title={t('dayjs-utils.title')}
      description={``}
    >
      <div className="space-y-4">
        {/* 新增代码运行器 */}
        <div className="rounded-lg mb-4">
          {/* <h2 className="text-xl font-semibold mb-4">{t('dayjs-utils.codeRunner.title')}</h2> */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium">{t('dayjs-utils.codeRunner.inputLabel')}</label>
                <select
                  className="px-2 py-1 text-xs border rounded-md"
                  onChange={(e) => e.target.value && setDayjsCode(e.target.value)}
                >
                  <option value="">{t('dayjs-utils.codeRunner.selectExample')}</option>
                  {codeExamples.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <textarea
                  className="w-full px-3 py-2 border rounded-md font-mono"
                  rows={3}
                  value={dayjsCode}
                  onChange={(e) => setDayjsCode(e.target.value)}
                />
                <button
                  className="px-3 py-2 bg-primary text-white rounded-md flex items-center"
                  onClick={executeDayjsCode}
                >
                  <Play className="h-4 w-4 mr-1" />
                  {t('dayjs-utils.codeRunner.runButton')}
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <p>{t('dayjs-utils.codeRunner.helpText1')}</p>
                <p>{t('dayjs-utils.codeRunner.helpText2')}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t('dayjs-utils.codeRunner.resultLabel')}</label>
              <div className="px-3 py-2 border rounded-md min-h-[40px] bg-gray-50 dark:bg-gray-900 font-mono">
                {errorMessage ? (
                  <span className="text-red-500">{errorMessage}</span>
                ) : (
                  codeResult
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default DayjsUtils; 
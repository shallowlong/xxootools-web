import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

const MomentUtils = () => {
  const { t, i18n } = useTranslation();
  
  // 删除未使用的状态和导入
  // 新增：代码运行器相关状态
  const [momentCode, setMomentCode] = useState<string>("moment().format('YYYY-MM-DD HH:mm:ss')");
  const [codeResult, setCodeResult] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // moment代码示例
  const codeExamples = [
    "moment().format('YYYY-MM-DD HH:mm:ss')",
    "moment('2023-01-01').add(1, 'days').format('YYYY-MM-DD')",
    "moment().subtract(7, 'days').fromNow()",
    "moment().startOf('month').format('YYYY-MM-DD')",
    "moment().endOf('year').format('YYYY-MM-DD')",
    "moment().isValid()",
    "moment().diff(moment('2022-01-01'), 'days')",
    "moment().daysInMonth()",
    "moment().quarter()",
    "moment().calendar()"
  ];

  // 执行moment代码
  const executeMomentCode = () => {
    try {
      // 设置moment的语言环境为当前i18n语言
      moment.locale(i18n.language);
      
      
      const result = new Function('moment', `return ${momentCode}`)(moment);
      setCodeResult(String(result));
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('categories.date.tools.moment-utils.unknownError'));
      setCodeResult('');
    }
  };

  // 当代码变化时自动执行
  useEffect(() => {
    executeMomentCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [momentCode, i18n.language]);

  // 当语言改变时设置 moment 的语言
  useEffect(() => {
    moment.locale(i18n.language);
  }, [i18n.language]);

  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 新增代码运行器 */}
        <div className="border p-4 rounded-lg md:col-span-2 mb-4">
          <h2 className="text-xl font-semibold mb-4">{t('categories.date.tools.moment-utils.codeRunner.title')}</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium">{t('categories.date.tools.moment-utils.codeRunner.inputLabel')}</label>
                <select
                  className="px-2 py-1 text-xs border rounded-md"
                  onChange={(e) => e.target.value && setMomentCode(e.target.value)}
                >
                  <option value="">{t('categories.date.tools.moment-utils.codeRunner.selectExample')}</option>
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
                  value={momentCode}
                  onChange={(e) => setMomentCode(e.target.value)}
                />
                <button
                  className="px-3 py-2 bg-primary text-white rounded-md flex items-center"
                  onClick={executeMomentCode}
                >
                  <Play className="h-4 w-4 mr-1" />
                  {t('categories.date.tools.moment-utils.codeRunner.runButton')}
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <p>{t('categories.date.tools.moment-utils.codeRunner.tip1')}</p>
                <p>{t('categories.date.tools.moment-utils.codeRunner.tip2')}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t('categories.date.tools.moment-utils.codeRunner.resultLabel')}</label>
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
    </div>
  );
};

export default MomentUtils; 
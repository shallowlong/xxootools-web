import React, { useRef, useState, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import ToolLayout from '@/components/tool/ToolLayout';
import { UploadCloud, Download, RefreshCw, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { Button } from '@/components/ui/button';
import Editor from '@monaco-editor/react';

const SVGToPDF = () => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [svgCode, setSvgCode] = useState<string>('');
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const svgPreviewRef = useRef<HTMLDivElement>(null);
  
  // 处理文件上传
  const handleFile = useCallback(async (file: File) => {
    if (file && file.type === 'image/svg+xml') {
      setFileName(file.name.replace(/\.svg$/i, ''));
      
      // 读取文件内容并预览
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSvgCode(content);
        setPdfDataUri(null);
      };
      reader.readAsText(file);
    }
  }, []);
  
  // 拖拽事件处理函数
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 检查鼠标是否真的离开了元素(而不是进入了子元素)
    if (dropzoneRef.current && !dropzoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);
  
  // Handle editor changes
  const handleEditorChange = (value: string | undefined) => {
    setSvgCode(value || '');
    setPdfDataUri(null);
  };
  
  // PDF Generation Logic (returns data URI)
  const generatePdf = useCallback(async (): Promise<string | null> => {
    if (!svgCode) return null;

    // Create SVG element in memory
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = svgCode;
    const svgElement = tempDiv.querySelector('svg');

    if (!svgElement) {
        console.error("Could not parse SVG code.");
        return null;
    }

    // --- Dimension Calculation ---
    // Strategy: Prioritize viewBox, then absolute width/height attributes.

    let svgWidth: number | undefined;
    let svgHeight: number | undefined;
    let source = "unknown";

    // 1. Try viewBox first
    const viewBox = svgElement.viewBox.baseVal;
    if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
        svgWidth = viewBox.width;
        svgHeight = viewBox.height;
        source = "viewBox";
    }

    // 2. If no valid viewBox, try width/height attributes (check for relative units)
    if (svgWidth === undefined || svgHeight === undefined) {
        const widthAttr = svgElement.getAttribute('width');
        const heightAttr = svgElement.getAttribute('height');

        if (widthAttr && heightAttr && !widthAttr.includes('%') && !/[a-z]/i.test(widthAttr) && !heightAttr.includes('%') && !/[a-z]/i.test(heightAttr)) {
           // Looks like absolute units (or unitless, defaults to px)
            svgWidth = parseFloat(widthAttr);
            svgHeight = parseFloat(heightAttr);
            if (!isNaN(svgWidth) && !isNaN(svgHeight) && svgWidth > 0 && svgHeight > 0) {
                 source = "attributes";
            } else {
                 // Parsing failed or resulted in invalid dimensions
                 svgWidth = undefined;
                 svgHeight = undefined;
            }
        } else if (widthAttr || heightAttr) {
            // Attributes exist but contain relative units or unsupported units
             console.warn(`SVG width/height attributes contain relative units ('${widthAttr}', '${heightAttr}') which are not reliably supported for PDF conversion. Consider using viewBox or absolute units (px).`);
             // Keep dimensions undefined to signal failure unless viewBox was found earlier
        }
    }

    // If dimensions are still unknown, error out
    if (svgWidth === undefined || svgHeight === undefined || svgWidth <= 0 || svgHeight <= 0) {
        console.error(`Could not determine valid SVG dimensions. Please ensure the SVG has a valid viewBox or absolute width/height attributes.`);
        return null;
    }

    console.log(`Using dimensions: ${svgWidth}x${svgHeight} (from ${source})`);

    // --- PDF Generation ---
    const orientation = svgWidth > svgHeight ? 'l' : 'p';
    const pdf = new jsPDF(orientation, 'pt', [svgWidth, svgHeight]);

    try {
        // Pass the in-memory SVG element
        await pdf.svg(svgElement, {
            x: 0,
            y: 0,
            width: svgWidth,
            height: svgHeight,
        });
        return pdf.output('datauristring'); // Return data URI
    } catch (error) {
        console.error('PDF generation using jsPDF.svg failed:', error);
        return null;
    }
  }, [svgCode]);
  
  // 执行SVG到PDF的转换
  const convertToPDF = useCallback(async () => {
    setIsConverting(true);
    setPdfDataUri(null);
    try {
      // Get PDF data URI
      const dataUri = await generatePdf();
      if (dataUri) {
        setPdfDataUri(dataUri);
      } else {
        // Handle error (e.g., show a notification)
        console.error("Failed to generate PDF.");
      }
    } catch (error) {
      console.error('Conversion failed:', error);
    } finally {
      setIsConverting(false);
    }
  }, [generatePdf]);
  
  // Download PDF from data URI
  const downloadPDF = useCallback(() => {
    if (!pdfDataUri || !fileName) return;
    const link = document.createElement('a');
    link.href = pdfDataUri;
    link.download = `${fileName || 'converted'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfDataUri, fileName]);
  
  // 重置
  const resetForm = useCallback(() => {
    setSvgCode('');
    setPdfDataUri(null);
    setFileName('');
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }, []);
  
  return (
    <ToolLayout
      categoryId="svg"
      toolId="svg-to-pdf"
      title={t('categories.svg.tools.svg-to-pdf.name')}
      description={`（${t('categories.svg.tools.svg-to-pdf.description')}）`}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <h3 className="text-lg font-medium">
            {fileName ? `${fileName}.svg` : t('svgToPdf.uploadOrPaste')}
          </h3>
          <div className="flex gap-2">
            {svgCode && (
              <Button variant="outline" size="sm" onClick={resetForm}>
                 <X className="h-4 w-4 mr-2" />
                {t('svgToPdf.reset')}
              </Button>
            )}
            <Button
              onClick={convertToPDF}
              disabled={isConverting || !svgCode}
              size="sm"
            >
              {isConverting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t('svgToPdf.convertToPDF')}
            </Button>
             {pdfDataUri && (
               <Button
                 onClick={downloadPDF}
                 disabled={!pdfDataUri}
                 size="sm"
               >
                 <Download className="h-4 w-4 mr-2" />
                 {t('svgToPdf.downloadPDF')}
               </Button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* <h4 className="text-md font-medium">SVG Input</h4> */}
            {!svgCode ? (
              <div
                ref={dropzoneRef}
                onClick={() => document.getElementById('file-upload')?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer h-96 flex flex-col justify-center items-center
                  ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'}`}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".svg,image/svg+xml"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">{t('svgPreview.clickOrDragToUpload')}</h3>
                <p className="text-sm text-muted-foreground">
                  <Trans
                    i18nKey="svgPreview.supportedFormats"
                    values={{ formats: 'SVG' }}
                    components={{ span: <span className="text-primary font-medium" /> }}
                  />
                </p>
                {isDragging && <span className="block text-primary font-medium mt-2">{t('svgPreview.dragMessage')}</span>}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden h-96">
                 <Editor
                  height="100%"
                  language="xml"
                  value={svgCode}
                  onChange={handleEditorChange}
                  options={{ minimap: { enabled: false }, scrollBeyondLastLine: false }}
                 />
              </div>
            )}
          </div>

          <div className="space-y-4">
             {/* <h4 className="text-md font-medium">SVG Preview</h4> */}
             <div
               ref={svgPreviewRef}
               className="border rounded-lg p-4 bg-white dark:bg-gray-800 overflow-auto h-96 flex justify-center items-center"
             >
               {svgCode ? (
                 <div dangerouslySetInnerHTML={{ __html: svgCode }} className="w-full h-full" />
               ) : (
                 <p className="text-muted-foreground">SVG Preview Area</p>
               )}
             </div>
           </div>
        </div>

         {pdfDataUri && (
           <div className="space-y-4 pt-6 border-t mt-6">
             <h4 className="text-md font-medium">PDF Preview</h4>
             <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                <iframe
                  src={pdfDataUri}
                  title="PDF Preview"
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                />
             </div>
           </div>
         )}
      </div>
    </ToolLayout>
  );
};

export default SVGToPDF; 
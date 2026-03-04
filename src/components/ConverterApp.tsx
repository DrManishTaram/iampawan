import { useState, useCallback, useEffect } from 'react';
import { transliterateToHindi } from '@/lib/transliterate';
import { unicodeToKrutiDev } from '@/lib/krutidev-converter';
import { translateToHindi } from '@/lib/translate';
import { downloadAsDoc, downloadAsPdf, copyToClipboard } from '@/lib/download-utils';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, FileText, Trash2, FileDown, Loader2, Zap, ZapOff } from 'lucide-react';

type ConversionMode = 'hinglish-unicode' | 'hinglish-krutidev' | 'english-unicode' | 'english-krutidev';

interface ConverterAppProps {
  mode: ConversionMode;
}

const MODE_INPUT_LABELS: Record<ConversionMode, string> = {
  'hinglish-unicode': 'Hinglish Input',
  'hinglish-krutidev': 'Hinglish Input',
  'english-unicode': 'English Input',
  'english-krutidev': 'English Input',
};

const MODE_PLACEHOLDERS: Record<ConversionMode, string> = {
  'hinglish-unicode': 'mera naam manish hai...',
  'hinglish-krutidev': 'mera naam manish hai...',
  'english-unicode': 'Type in English to translate...',
  'english-krutidev': 'Type in English to translate...',
};

export default function ConverterApp({ mode }: ConverterAppProps) {
  const [input, setInput] = useState('');
  const [unicodeOutput, setUnicodeOutput] = useState('');
  const [krutiDevOutput, setKrutiDevOutput] = useState('');
  const [liveConvert, setLiveConvert] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isEnglishMode = mode.startsWith('english');
  const showKrutiDev = mode.endsWith('krutidev');

  // Reset outputs on mode change
  useEffect(() => {
    setUnicodeOutput('');
    setKrutiDevOutput('');
  }, [mode]);

  const performConversion = useCallback(async (text: string) => {
    if (!text.trim()) {
      setUnicodeOutput('');
      setKrutiDevOutput('');
      return;
    }
    try {
      let hindi = '';
      if (isEnglishMode) {
        setIsLoading(true);
        hindi = await translateToHindi(text);
      } else {
        hindi = transliterateToHindi(text);
      }
      setUnicodeOutput(hindi);
      if (showKrutiDev) {
        setKrutiDevOutput(unicodeToKrutiDev(hindi));
      }
    } catch (error) {
      toast({
        title: 'Conversion Error',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isEnglishMode, showKrutiDev, toast]);

  useEffect(() => {
    if (liveConvert && !isEnglishMode && input) {
      const timer = setTimeout(() => performConversion(input), 150);
      return () => clearTimeout(timer);
    }
  }, [input, liveConvert, isEnglishMode, performConversion]);

  const handleConvert = () => performConversion(input);
  const handleClear = () => { setInput(''); setUnicodeOutput(''); setKrutiDevOutput(''); };

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) toast({ title: `${label} copied!` });
  };

  const handleDownloadDoc = async (text: string, isKruti: boolean) => {
    try {
      await downloadAsDoc(text, 'hindi-document', isKruti);
      toast({ title: 'DOCX downloaded!' });
    } catch {
      toast({ title: 'Download error', variant: 'destructive' });
    }
  };

  const handleDownloadPdf = (text: string, isKruti: boolean) => {
    try {
      downloadAsPdf(text, 'hindi-document', isKruti);
      toast({ title: 'PDF downloaded!' });
    } catch {
      toast({ title: 'Download error', variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card/50">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground">
            Mode: <span className="text-primary font-semibold">{mode.replace('-', ' → ').replace('hinglish', 'Hinglish').replace('english', 'English').replace('unicode', 'Unicode').replace('krutidev', 'Kruti Dev')}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLiveConvert(!liveConvert)}
            disabled={isEnglishMode}
            className={`action-btn ${liveConvert && !isEnglishMode ? 'text-primary' : ''}`}
            title={liveConvert ? 'Live mode ON' : 'Live mode OFF'}
          >
            {liveConvert && !isEnglishMode ? <Zap className="h-3.5 w-3.5" /> : <ZapOff className="h-3.5 w-3.5" />}
            Live
          </button>
          <button onClick={handleClear} className="action-btn">
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
          {(!liveConvert || isEnglishMode) && (
            <button
              onClick={handleConvert}
              disabled={!input.trim() || isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Convert
            </button>
          )}
        </div>
      </div>

      {/* Panels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
        {/* Input Panel */}
        <div className="panel-editor flex flex-col border-0 rounded-none lg:border-r">
          <div className="panel-header rounded-none">
            <span className="panel-header-title">{MODE_INPUT_LABELS[mode]}</span>
            <span className="text-[10px] text-muted-foreground font-mono">{input.length} chars</span>
          </div>
          <div className="panel-body flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={MODE_PLACEHOLDERS[mode]}
              className="w-full h-full min-h-[300px] lg:min-h-0 resize-none bg-transparent p-4 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Panel(s) */}
        <div className="flex flex-col overflow-hidden">
          {/* Unicode Output */}
          <div className={`panel-editor flex flex-col border-0 rounded-none ${showKrutiDev ? 'flex-1 border-b' : 'flex-1'}`}>
            <div className="panel-header rounded-none">
              <span className="panel-header-title">Unicode Hindi</span>
              <div className="flex gap-1">
                <button onClick={() => handleCopy(unicodeOutput, 'Unicode')} disabled={!unicodeOutput} className="action-btn">
                  <Copy className="h-3 w-3" />
                </button>
                <button onClick={() => handleDownloadDoc(unicodeOutput, false)} disabled={!unicodeOutput} className="action-btn">
                  <FileText className="h-3 w-3" /> .DOC
                </button>
                <button onClick={() => handleDownloadPdf(unicodeOutput, false)} disabled={!unicodeOutput} className="action-btn">
                  <FileDown className="h-3 w-3" /> .PDF
                </button>
              </div>
            </div>
            <div className="panel-body flex-1 p-4 overflow-auto">
              {unicodeOutput ? (
                <p className="text-base leading-relaxed whitespace-pre-wrap">{unicodeOutput}</p>
              ) : (
                <p className="text-sm text-muted-foreground/40 italic">Output will appear here...</p>
              )}
            </div>
          </div>

          {/* Kruti Dev Output */}
          {showKrutiDev && (
            <div className="panel-editor flex flex-col border-0 rounded-none flex-1">
              <div className="panel-header rounded-none">
                <span className="panel-header-title" style={{ color: 'hsl(280, 80%, 60%)' }}>Kruti Dev 010</span>
                <div className="flex gap-1">
                  <button onClick={() => handleCopy(krutiDevOutput, 'Kruti Dev')} disabled={!krutiDevOutput} className="action-btn">
                    <Copy className="h-3 w-3" />
                  </button>
                  <button onClick={() => handleDownloadDoc(krutiDevOutput, true)} disabled={!krutiDevOutput} className="action-btn">
                    <FileText className="h-3 w-3" /> .DOC
                  </button>
                  <button onClick={() => handleDownloadPdf(krutiDevOutput, true)} disabled={!krutiDevOutput} className="action-btn">
                    <FileDown className="h-3 w-3" /> .PDF
                  </button>
                </div>
              </div>
              <div className="panel-body flex-1 p-4 overflow-auto">
                {krutiDevOutput ? (
                  <p className="krutidev-text whitespace-pre-wrap">{krutiDevOutput}</p>
                ) : (
                  <p className="text-sm text-muted-foreground/40 italic">Kruti Dev output will appear here...</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Glow line at bottom */}
      <div className="glow-line" />
    </div>
  );
}

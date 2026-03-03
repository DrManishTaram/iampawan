import { useState, useCallback, useEffect } from 'react';
import { transliterateToHindi } from '@/lib/transliterate';
import { unicodeToKrutiDev } from '@/lib/krutidev-converter';
import { translateToHindi } from '@/lib/translate';
import { downloadAsDoc, downloadAsPdf, copyToClipboard } from '@/lib/download-utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, FileText, Trash2, FileDown, Loader2 } from 'lucide-react';

type ConversionMode = 'hinglish-unicode' | 'hinglish-krutidev' | 'english-unicode' | 'english-krutidev';

const MODE_LABELS: Record<ConversionMode, string> = {
  'hinglish-unicode': 'Hinglish → Unicode Hindi',
  'hinglish-krutidev': 'Hinglish → Kruti Dev 010',
  'english-unicode': 'English → Hindi (Unicode)',
  'english-krutidev': 'English → Hindi (Kruti Dev 010)',
};

const MODE_DESCRIPTIONS: Record<ConversionMode, string> = {
  'hinglish-unicode': 'Type in Roman Hindi (e.g., "mera naam manish hai") to get Unicode Hindi',
  'hinglish-krutidev': 'Type in Roman Hindi to get Kruti Dev 010 encoded text',
  'english-unicode': 'Type in English to translate to Hindi (Unicode)',
  'english-krutidev': 'Type in English to translate to Hindi (Kruti Dev 010)',
};

export default function ConverterApp() {
  const [input, setInput] = useState('');
  const [unicodeOutput, setUnicodeOutput] = useState('');
  const [krutiDevOutput, setKrutiDevOutput] = useState('');
  const [mode, setMode] = useState<ConversionMode>('hinglish-unicode');
  const [liveConvert, setLiveConvert] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isEnglishMode = mode.startsWith('english');
  const showKrutiDev = mode.endsWith('krutidev');
  const showUnicode = mode.endsWith('unicode') || mode === 'hinglish-krutidev' || mode === 'english-krutidev';

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
        title: 'रूपांतरण में त्रुटि',
        description: error instanceof Error ? error.message : 'कृपया पुनः प्रयास करें',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isEnglishMode, showKrutiDev, toast]);

  // Live conversion for transliteration modes
  useEffect(() => {
    if (liveConvert && !isEnglishMode && input) {
      const timer = setTimeout(() => performConversion(input), 150);
      return () => clearTimeout(timer);
    }
  }, [input, liveConvert, isEnglishMode, performConversion]);

  const handleConvert = () => {
    performConversion(input);
  };

  const handleClear = () => {
    setInput('');
    setUnicodeOutput('');
    setKrutiDevOutput('');
  };

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast({ title: `${label} कॉपी किया गया`, description: 'टेक्स्ट क्लिपबोर्ड में कॉपी हो गया है।' });
    }
  };

  const handleDownloadDoc = async (text: string, isKruti: boolean) => {
    try {
      await downloadAsDoc(text, 'hindi-document', isKruti);
      toast({ title: 'डाउनलोड सफल', description: '.DOCX फ़ाइल डाउनलोड हो गई।' });
    } catch {
      toast({ title: 'डाउनलोड त्रुटि', variant: 'destructive' });
    }
  };

  const handleDownloadPdf = (text: string, isKruti: boolean) => {
    try {
      downloadAsPdf(text, 'hindi-document', isKruti);
      toast({ title: 'डाउनलोड सफल', description: '.PDF फ़ाइल डाउनलोड हो गई।' });
    } catch {
      toast({ title: 'डाउनलोड त्रुटि', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Mode Selector & Controls */}
      <div className="bg-card rounded-lg border p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <Label className="text-sm font-semibold text-foreground mb-1.5 block">
              रूपांतरण मोड (Conversion Mode)
            </Label>
            <Select value={mode} onValueChange={(v) => { setMode(v as ConversionMode); setUnicodeOutput(''); setKrutiDevOutput(''); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MODE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{MODE_DESCRIPTIONS[mode]}</p>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="live" checked={liveConvert} onCheckedChange={setLiveConvert} disabled={isEnglishMode} />
            <Label htmlFor="live" className="text-sm">लाइव रूपांतरण</Label>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">
            इनपुट (Input) — {isEnglishMode ? 'English' : 'Hinglish'}
          </Label>
          <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 gap-1.5 text-muted-foreground">
            <Trash2 className="h-3.5 w-3.5" />
            साफ़ करें
          </Button>
        </div>
        <Textarea
          placeholder={isEnglishMode ? 'Type in English...' : 'Type in Hinglish... (e.g., mera naam manish hai)'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[140px] text-base"
        />
        {(!liveConvert || isEnglishMode) && (
          <Button onClick={handleConvert} disabled={!input.trim() || isLoading} className="gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            रूपांतरण करें (Convert)
          </Button>
        )}
      </div>

      {/* Unicode Output */}
      {(unicodeOutput || showUnicode) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">यूनिकोड हिन्दी (Unicode Hindi)</Label>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => handleCopy(unicodeOutput, 'Unicode')} disabled={!unicodeOutput} className="h-8 gap-1.5">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDownloadDoc(unicodeOutput, false)} disabled={!unicodeOutput} className="h-8 gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                .DOC
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDownloadPdf(unicodeOutput, false)} disabled={!unicodeOutput} className="h-8 gap-1.5">
                <FileDown className="h-3.5 w-3.5" />
                .PDF
              </Button>
            </div>
          </div>
          <div className="preview-box">
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {unicodeOutput || <span className="text-muted-foreground text-sm">रूपांतरित टेक्स्ट यहाँ दिखेगा...</span>}
            </p>
          </div>
        </div>
      )}

      {/* Kruti Dev Output */}
      {showKrutiDev && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">कृतिदेव 010 (Kruti Dev 010)</Label>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => handleCopy(krutiDevOutput, 'Kruti Dev')} disabled={!krutiDevOutput} className="h-8 gap-1.5">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDownloadDoc(krutiDevOutput, true)} disabled={!krutiDevOutput} className="h-8 gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                .DOC
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDownloadPdf(krutiDevOutput, true)} disabled={!krutiDevOutput} className="h-8 gap-1.5">
                <FileDown className="h-3.5 w-3.5" />
                .PDF
              </Button>
            </div>
          </div>
          <div className="preview-box">
            <p className="krutidev-text whitespace-pre-wrap">
              {krutiDevOutput || <span className="text-muted-foreground text-sm" style={{ fontFamily: 'inherit' }}>कृतिदेव टेक्स्ट यहाँ दिखेगा...</span>}
            </p>
          </div>
        </div>
      )}

      {/* Download All */}
      {(unicodeOutput || krutiDevOutput) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleDownloadDoc(showKrutiDev ? krutiDevOutput : unicodeOutput, showKrutiDev)}
          >
            <Download className="h-4 w-4" />
            DOCX डाउनलोड करें
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleDownloadPdf(showKrutiDev ? krutiDevOutput : unicodeOutput, showKrutiDev)}
          >
            <Download className="h-4 w-4" />
            PDF डाउनलोड करें
          </Button>
        </div>
      )}
    </div>
  );
}

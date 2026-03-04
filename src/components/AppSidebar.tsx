import { Languages, FileText, ArrowRightLeft, Globe, Keyboard, Info, Zap } from 'lucide-react';

type ConversionMode = 'hinglish-unicode' | 'hinglish-krutidev' | 'english-unicode' | 'english-krutidev';

interface AppSidebarProps {
  mode: ConversionMode;
  onModeChange: (mode: ConversionMode) => void;
}

const MODES: { key: ConversionMode; label: string; shortLabel: string; icon: React.ElementType; description: string }[] = [
  { key: 'hinglish-unicode', label: 'Hinglish → Unicode', shortLabel: 'HIN → UNI', icon: Keyboard, description: 'Roman Hindi to Unicode' },
  { key: 'hinglish-krutidev', label: 'Hinglish → Kruti Dev', shortLabel: 'HIN → KD', icon: ArrowRightLeft, description: 'Roman Hindi to Kruti Dev 010' },
  { key: 'english-unicode', label: 'English → Unicode', shortLabel: 'ENG → UNI', icon: Globe, description: 'Translate English to Hindi' },
  { key: 'english-krutidev', label: 'English → Kruti Dev', shortLabel: 'ENG → KD', icon: FileText, description: 'Translate & convert to Kruti Dev' },
];

export default function AppSidebar({ mode, onModeChange }: AppSidebarProps) {
  return (
    <aside className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Languages className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">Hindi Converter</h1>
            <p className="text-[10px] text-muted-foreground font-mono">Kruti Dev 010</p>
          </div>
        </div>
      </div>

      {/* Modes */}
      <div className="px-3 py-4 flex-1">
        <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          Conversion Modes
        </p>
        <nav className="space-y-1">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => onModeChange(m.key)}
              className={`sidebar-mode-btn flex items-center gap-2.5 ${mode === m.key ? 'active' : ''}`}
            >
              <m.icon className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <div className="font-medium text-xs">{m.label}</div>
                <div className="text-[10px] text-muted-foreground truncate">{m.description}</div>
              </div>
            </button>
          ))}
        </nav>

        <div className="mt-6 px-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Quick Info</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <Zap className="h-3 w-3 mt-0.5 text-primary shrink-0" />
              <span>All processing happens in your browser. No data sent to any server.</span>
            </div>
            <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5 text-accent shrink-0" />
              <span>Kruti Dev 010 font is embedded for accurate preview & export.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground text-center">
          शासकीय हिन्दी पत्राचार रूपांतरक
        </p>
      </div>
    </aside>
  );
}

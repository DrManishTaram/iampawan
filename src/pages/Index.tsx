import { useState } from 'react';
import ConverterApp from '@/components/ConverterApp';
import AppSidebar from '@/components/AppSidebar';
import { Menu, X } from 'lucide-react';

type ConversionMode = 'hinglish-unicode' | 'hinglish-krutidev' | 'english-unicode' | 'english-krutidev';

const Index = () => {
  const [mode, setMode] = useState<ConversionMode>('hinglish-unicode');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AppSidebar mode={mode} onModeChange={(m) => { setMode(m); setSidebarOpen(false); }} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top glow line */}
        <div className="glow-line" />

        {/* Mobile header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="action-btn">
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold gradient-text">Hindi Converter</span>
        </div>

        <ConverterApp mode={mode} />
      </div>
    </div>
  );
};

export default Index;

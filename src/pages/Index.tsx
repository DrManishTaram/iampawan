import ConverterApp from '@/components/ConverterApp';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Tricolor Stripe */}
      <div className="gov-stripe" />

      {/* Header */}
      <header className="gov-header py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-foreground/10 flex items-center justify-center text-2xl font-bold border-2 border-primary-foreground/20">
              हि
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Official Hindi Correspondence Converter
              </h1>
              <p className="text-sm opacity-80 mt-0.5">
                कृतिदेव 010 — शासकीय हिन्दी पत्राचार रूपांतरक
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="gov-stripe" />

      {/* Main Content */}
      <main>
        <ConverterApp />
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 px-4">
        <div className="max-w-5xl mx-auto text-center text-sm text-muted-foreground space-y-1">
          <p>शासकीय उपयोग हेतु — कृतिदेव 010 फ़ॉन्ट आधारित रूपांतरण प्रणाली</p>
          <p className="text-xs">सम्पूर्ण प्रसंस्करण आपके ब्राउज़र में होता है। कोई डेटा सर्वर पर नहीं भेजा जाता।</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

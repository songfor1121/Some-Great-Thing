import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { CurrentTime } from './components/CurrentTime';
import { Stopwatch } from './components/Stopwatch';
import { WebsiteTime } from './components/WebsiteTime';

type Tab = 'current' | 'stopwatch' | 'website';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('current');

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center selection:bg-primary-accent selection:text-white">
      <header className="w-full max-w-4xl pt-8 pb-4">
        <h1 className="text-center text-2xl font-bold tracking-widest text-secondary-accent/80 uppercase mb-8">
          Timer
        </h1>
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </header>

      <main className="flex-grow w-full max-w-4xl flex flex-col items-center justify-center py-12">
        <div className="w-full transition-opacity duration-300 animate-in fade-in zoom-in-95">
          {activeTab === 'current' && <CurrentTime />}
          {activeTab === 'stopwatch' && <Stopwatch />}
          {activeTab === 'website' && <WebsiteTime />}
        </div>
      </main>

      <footer className="w-full text-center py-6 text-sm text-text-main/40">
        <p>A modern time utility.</p>
      </footer>
    </div>
  );
}

export default App;

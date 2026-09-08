import { useState } from 'react';
import { Navigation, type Tab } from './components/Navigation';
import { Clock } from './components/Clock';
import { Timer } from './components/Timer';
import { Stopwatch } from './components/Stopwatch';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('clock');

  return (
    <div className="min-h-screen flex flex-col items-center selection:bg-primary-accent selection:text-primary-bg overflow-x-hidden">
      <header className="w-full max-w-5xl pt-12 pb-6 px-4">
        <h1 className="text-center text-3xl md:text-4xl font-light tracking-[0.3em] text-text-main mb-12">
          JECADOVE
        </h1>
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </header>

      <main className="flex-grow w-full max-w-5xl flex flex-col items-center justify-start px-4 pb-12">
        <div className="w-full transition-opacity duration-500 animate-in fade-in">
          {activeTab === 'clock' && <Clock />}
          {activeTab === 'timer' && <Timer />}
          {activeTab === 'stopwatch' && <Stopwatch />}
        </div>
      </main>

      <footer className="w-full text-center py-8 text-xs tracking-widest text-secondary-text uppercase">
        <p>&copy; {new Date().getFullYear()} Jecadove Precision Time</p>
      </footer>
    </div>
  );
}

export default App;

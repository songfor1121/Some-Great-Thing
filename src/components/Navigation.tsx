export type Tab = 'clock' | 'timer' | 'stopwatch';

interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  return (
    <nav className="flex justify-center gap-6 md:gap-12 mb-12 p-4 flex-wrap text-sm md:text-base tracking-[0.2em] font-medium uppercase text-secondary-text">
      <button
        onClick={() => setActiveTab('clock')}
        className={`transition-colors duration-300 focus:outline-none hover:text-text-main ${
          activeTab === 'clock'
            ? 'text-primary-accent border-b-2 border-primary-accent pb-1'
            : 'border-b-2 border-transparent pb-1'
        }`}
        aria-label="Show Clock"
      >
        Clock
      </button>
      <button
        onClick={() => setActiveTab('timer')}
        className={`transition-colors duration-300 focus:outline-none hover:text-text-main ${
          activeTab === 'timer'
            ? 'text-primary-accent border-b-2 border-primary-accent pb-1'
            : 'border-b-2 border-transparent pb-1'
        }`}
        aria-label="Show Timer"
      >
        Timer
      </button>
      <button
        onClick={() => setActiveTab('stopwatch')}
        className={`transition-colors duration-300 focus:outline-none hover:text-text-main ${
          activeTab === 'stopwatch'
            ? 'text-primary-accent border-b-2 border-primary-accent pb-1'
            : 'border-b-2 border-transparent pb-1'
        }`}
        aria-label="Show Stopwatch"
      >
        Stopwatch
      </button>
    </nav>
  );
}

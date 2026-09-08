type Tab = 'current' | 'stopwatch' | 'website';

interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  return (
    <nav className="flex justify-center gap-4 mb-12 p-4 flex-wrap">
      <button
        onClick={() => setActiveTab('current')}
        className={`px-6 py-2 rounded-full font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-accent ${
          activeTab === 'current'
            ? 'bg-primary-accent text-white shadow-sm'
            : 'bg-transparent text-text-main hover:bg-black/5'
        }`}
        aria-label="Show Current Time"
      >
        Current Time
      </button>
      <button
        onClick={() => setActiveTab('stopwatch')}
        className={`px-6 py-2 rounded-full font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-accent ${
          activeTab === 'stopwatch'
            ? 'bg-primary-accent text-white shadow-sm'
            : 'bg-transparent text-text-main hover:bg-black/5'
        }`}
        aria-label="Show Stopwatch"
      >
        Stopwatch
      </button>
      <button
        onClick={() => setActiveTab('website')}
        className={`px-6 py-2 rounded-full font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-accent ${
          activeTab === 'website'
            ? 'bg-primary-accent text-white shadow-sm'
            : 'bg-transparent text-text-main hover:bg-black/5'
        }`}
        aria-label="Show Website Server Time"
      >
        Website Time
      </button>
    </nav>
  );
}

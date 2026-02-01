import React, { useState } from 'react';
import { ImageIcon, Search, GitBranch, Sparkles, Settings, Database, Menu, X, History } from 'lucide-react';
import UserMenu from '../UserMenu';
import AnalysisHistory from '../AnalysisHistory/AnalysisHistory';
import { Analysis } from '../../services/api';

type Section = 'analyze' | 'plan' | 'create';

interface MainLayoutProps {
  children: React.ReactNode;
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  onShowSettings: () => void;
  onShowImportExport: () => void;
  onSelectAnalysis?: (analysis: Analysis, imageData: string | null) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeSection,
  onSectionChange,
  onShowSettings,
  onShowImportExport,
  onSelectAnalysis,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const sections: { id: Section; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'analyze', label: 'ANALYZE', icon: Search, color: 'brutal-cyan' },
    { id: 'plan', label: 'PLAN', icon: GitBranch, color: 'brutal-yellow' },
    { id: 'create', label: 'CREATE', icon: Sparkles, color: 'brutal-magenta' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Neo Brutalism Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-24 h-24 sm:w-32 sm:h-32 bg-brutal-yellow border-4 border-brutal-black rotate-12" style={{boxShadow: '4px 4px 0px 0px #000000'}}></div>
        <div className="absolute top-1/4 right-5 sm:right-10 w-28 h-28 sm:w-40 sm:h-40 bg-brutal-cyan border-4 border-brutal-black -rotate-6" style={{boxShadow: '4px 4px 0px 0px #000000'}}></div>
        <div className="absolute bottom-40 left-1/4 w-16 h-16 sm:w-24 sm:h-24 bg-brutal-magenta border-4 border-brutal-black rotate-45" style={{boxShadow: '4px 4px 0px 0px #000000'}}></div>
        <div className="absolute top-2/3 right-1/4 w-14 h-14 sm:w-20 sm:h-20 bg-brutal-lime border-4 border-brutal-black -rotate-12" style={{boxShadow: '4px 4px 0px 0px #000000'}}></div>
      </div>

      {/* Header */}
      <header className="relative z-20 bg-brutal-white border-b-4 border-brutal-black" style={{boxShadow: '0 4px 0px 0px #000000'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative p-2 bg-brutal-yellow border-3 border-brutal-black" style={{boxShadow: '3px 3px 0px 0px #000000'}}>
                <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-brutal-black" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">FLUX <span className="text-brutal-magenta">Studio</span></h1>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">AI-Powered Content Creation</span>
              </div>
              <div className="sm:hidden">
                <h1 className="text-xl font-black uppercase">FLUX <span className="text-brutal-magenta">Studio</span></h1>
              </div>
            </div>

            {/* Main Section Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => onSectionChange(section.id)}
                    className={`px-4 py-2 font-bold uppercase text-sm border-3 border-brutal-black transition-all ${
                      isActive
                        ? `bg-${section.color} translate-x-0.5 translate-y-0.5`
                        : 'bg-brutal-white hover:bg-gray-100'
                    }`}
                    style={{
                      boxShadow: isActive ? 'none' : '3px 3px 0px 0px #000000',
                    }}
                  >
                    <Icon className="h-4 w-4 inline-block mr-2" />
                    {section.label}
                  </button>
                );
              })}
            </nav>

            {/* Desktop Menu */}
            <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
              <button
                onClick={() => setShowHistory(true)}
                className="btn btn-ghost btn-sm group"
                title="Analysis History"
              >
                <History className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={onShowSettings}
                className="btn btn-ghost btn-sm group"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-spin transition-transform" />
              </button>
              <button
                onClick={onShowImportExport}
                className="btn btn-ghost btn-sm group"
                title="Import/Export"
              >
                <Database className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <UserMenu />
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden flex items-center space-x-2">
              <UserMenu />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn btn-ghost btn-sm"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t-3 border-brutal-black py-4 space-y-2 bg-brutal-white">
              {/* Mobile Section Navigation */}
              <div className="flex flex-col space-y-2 mb-4">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        onSectionChange(section.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full px-4 py-3 font-bold uppercase text-sm border-3 border-brutal-black transition-all flex items-center ${
                        isActive
                          ? `bg-${section.color}`
                          : 'bg-brutal-white'
                      }`}
                      style={{
                        boxShadow: isActive ? '2px 2px 0px 0px #000000' : '3px 3px 0px 0px #000000',
                      }}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {section.label}
                    </button>
                  );
                })}
              </div>

              <div className="border-t-2 border-brutal-black pt-4 space-y-2">
                <button
                  onClick={() => {
                    setShowHistory(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full btn btn-outline btn-sm justify-start"
                >
                  <History className="h-4 w-4 mr-2" />
                  HISTORY
                </button>
                <button
                  onClick={() => {
                    onShowSettings();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full btn btn-outline btn-sm justify-start"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  SETTINGS
                </button>
                <button
                  onClick={() => {
                    onShowImportExport();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full btn btn-outline btn-sm justify-start"
                >
                  <Database className="h-4 w-4 mr-2" />
                  IMPORT/EXPORT
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Analysis History Sidebar */}
      <AnalysisHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectAnalysis={onSelectAnalysis || (() => {})}
      />

      {/* Main Content */}
      <main className="relative z-10 flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-brutal-black text-brutal-white py-6 border-t-4 border-brutal-yellow mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-brutal-yellow border-3 border-brutal-white" style={{boxShadow: '3px 3px 0px 0px #FFFFFF'}}>
                <ImageIcon className="h-5 w-5 text-brutal-black" />
              </div>
              <span className="font-black uppercase text-lg">FLUX <span className="text-brutal-magenta">Studio</span></span>
            </div>

            <div className="flex items-center space-x-2 text-sm font-bold">
              <span>Made with</span>
              <span className="text-brutal-red text-lg">♥</span>
              <span>by</span>
              <a
                href="https://portafolio-centurion.pages.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-brutal-cyan text-brutal-black border-2 border-brutal-white font-black uppercase hover:bg-brutal-yellow transition-colors"
                style={{boxShadow: '2px 2px 0px 0px #FFFFFF'}}
              >
                Charly
              </a>
            </div>

            <div className="text-xs font-medium opacity-70">
              © {new Date().getFullYear()} All rights reserved
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

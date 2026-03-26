import React from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Search,
  Sparkles,
  FileText,
  BarChart3,
  Fingerprint
} from 'lucide-react';

export default function Settings({ settings, setSettings }) {
  const sections = [
    {
      id: 'scan',
      title: 'Scan Configuration',
      icon: Search,
      items: [
        {
          id: 'scanDepth',
          label: 'Scan Depth',
          description: 'Maximum number of pages to crawl (1-50)',
          type: 'range',
          min: 1,
          max: 50,
          value: settings.scanDepth,
        },
        {
          id: 'wcagLevel',
          label: 'WCAG Level',
          description: 'Accessibility compliance standard',
          type: 'select',
          options: ['A', 'AA', 'AAA'],
          value: settings.wcagLevel,
        },
        {
          id: 'followSubdomains',
          label: 'Follow Subdomains',
          description: 'Include subdomains in the multi-page crawl',
          type: 'toggle',
          value: settings.followSubdomains,
        }
      ]
    },
    {
      id: 'ai',
      title: 'AI Intelligence',
      icon: Sparkles,
      items: [
        {
          id: 'aiExplanations',
          label: 'AI Explanations',
          description: 'Generate plain-English descriptions of violations',
          type: 'toggle',
          value: settings.aiExplanations,
        },
        {
          id: 'aiFixSuggestions',
          label: 'AI Fix Suggestions',
          description: 'Smart code remediations for identified issues',
          type: 'toggle',
          value: settings.aiFixSuggestions,
        }
      ]
    },
    {
      id: 'reports',
      title: 'Export & Reports',
      icon: FileText,
      items: [
        {
          id: 'emailReport',
          label: 'Email Report',
          description: 'Automatically send a summary after each scan',
          type: 'toggle',
          value: settings.emailReport,
        }
      ],
      actions: [
        { id: 'pdf', label: 'PDF Report', icon: FileText },
        { id: 'csv', label: 'CSV Data', icon: BarChart3 },
        { id: 'json', label: 'Raw JSON', icon: Fingerprint }
      ]
    }
  ];

  // Helper for Export icons since I missed importing some
  const getActionIcon = (id) => {
    if (id === 'pdf') return <FileText size={16} />;
    if (id === 'csv') return <BarChart3 size={16} />;
    if (id === 'json') return <Fingerprint size={16} />;
    return <Sparkles size={16} />;
  };

  const handleToggle = (id) => {
    setSettings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleChange = (id, val) => {
    setSettings(prev => ({ ...prev, [id]: val }));
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-accent">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="font-display text-3xl text-text">Workspace Settings</h1>
          <p className="text-text-muted text-sm">Configure your auditing engine and AI features</p>
        </div>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-3xl p-8 relative overflow-hidden noise"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <section.icon size={18} />
              </div>
              <h2 className="font-display text-xl text-text">{section.title}</h2>
            </div>

            <div className="space-y-8">
              {section.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-6">
                  <div className="max-w-md">
                    <div className="text-[15px] font-semibold text-text mb-1">{item.label}</div>
                    <div className="text-xs text-text-subtle leading-relaxed">{item.description}</div>
                  </div>

                  {item.type === 'toggle' && (
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${item.value ? 'bg-accent' : 'bg-black/15'}`}
                      aria-pressed={item.value}
                      aria-label={item.label}
                    >
                      <motion.div
                        animate={{ x: item.value ? 22 : 4 }}
                        className={`absolute top-1 w-4 h-4 rounded-full ${item.value ? 'bg-bg' : 'bg-text-subtle'}`}
                      />
                    </button>
                  )}

                  {item.type === 'select' && (
                    <div className="flex bg-black/5 p-1 rounded-xl glass border border-black/10">
                      {item.options.map((opt) => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => handleChange(item.id, opt)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${item.value === opt ? 'bg-accent text-black shadow-lg shadow-accent/20' : 'text-text-muted hover:text-text'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {item.type === 'range' && (
                    <div className="flex items-center gap-4 w-48">
                      <input
                        type="range"
                        min={item.min}
                        max={item.max}
                        value={item.value}
                        onChange={(e) => handleChange(item.id, parseInt(e.target.value))}
                        className="flex-1 accent-accent"
                      />
                      <span className="w-8 text-right font-mono text-xs text-accent">{item.value}</span>
                    </div>
                  )}
                </div>
              ))}

              {section.actions && (
                <div className="pt-6 border-t border-black/10">
                  <div className="text-xs text-text-subtle font-mono uppercase tracking-wider mb-4">On-Demand Exports</div>
                  <div className="flex flex-wrap gap-3">
                    {section.actions.map((action) => (
                      <button
                        type="button"
                        key={action.id}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass hover:bg-black/5 transition-all text-xs text-text border border-black/10 hover:border-accent/30"
                      >
                        {getActionIcon(action.id)}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

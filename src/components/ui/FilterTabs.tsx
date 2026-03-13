import React from 'react';

export interface TabOption {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

export interface FilterTabsProps {
    tabs: TabOption[];
    activeTab: string;
    onChange: (tabId: string) => void;
    className?: string; // Optional wrapper class names
}

export default function FilterTabs({ tabs, activeTab, onChange, className = '' }: FilterTabsProps) {
    return (
        <div className={`flex bg-white p-1 rounded-lg w-full shadow-sm overflow-x-auto ${className} no-scrollbar`}>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  CreditCard,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keep this palette limited to navigation until a real search endpoint exists.
  const allItems: SearchItem[] = useMemo(() => {
    return [
      {
        id: 'act-new-cust',
        category: 'Quick Actions',
        title: 'Create new Customer',
        subtitle: 'Add a new enterprise or individual account',
        href: '/app/customers',
        icon: Users,
      },
      {
        id: 'act-new-sub',
        category: 'Quick Actions',
        title: 'New Subscription',
        subtitle: 'Enroll a customer in a plan',
        href: '/app/subscriptions',
        icon: CreditCard,
      },
      {
        id: 'act-reports',
        category: 'Quick Actions',
        title: 'View Revenue Reports',
        subtitle: 'MRR, collection and churn metrics',
        href: '/app/reports',
        icon: DollarSign,
      }
    ];
  }, []);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 8);
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  const handleSelect = (item: SearchItem) => {
    navigate(item.href);
    onClose();
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]!);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Palette Card */}
      <div className="relative mx-auto max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-100 overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center border-b border-slate-200 px-4">
          <Search className="h-4 w-4 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search customers, subscriptions, invoices, plans..."
            className="h-12 w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-700">No matching results found</p>
              <p className="text-xs text-slate-400 mt-1">Try searching by business number, customer name, or action</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer',
                    isSelected ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('rounded p-1.5', isSelected ? 'bg-white shadow-xs' : 'bg-slate-100')}>
                      <Icon className="h-4 w-4 text-slate-600 shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">{item.title}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-600">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-slate-500 truncate text-[11px] mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight
                    className={cn(
                      'h-3.5 w-3.5 text-slate-400 shrink-0 transition-opacity',
                      isSelected ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-2 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Navigate <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-mono text-[10px]">↑</kbd> <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-mono text-[10px]">↓</kbd></span>
            <span>Select <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-mono text-[10px]">↵</kbd></span>
          </div>
          <span>RevOps Command Palette</span>
        </div>
      </div>
    </div>
  );
}

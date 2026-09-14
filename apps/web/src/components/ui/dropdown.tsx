import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  checked?: boolean;
}

export interface DropdownSection {
  title?: string;
  items: DropdownItem[];
}

export interface DropdownProps {
  trigger: React.ReactNode;
  sections?: DropdownSection[];
  children?: React.ReactNode;
  align?: 'left' | 'right';
  width?: string;
  className?: string;
}

export function Dropdown({
  trigger,
  sections,
  children,
  align = 'right',
  width = 'w-56',
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={cn('relative inline-block text-left', className)}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1.5 rounded-lg border border-slate-200 bg-white p-1 shadow-lg animate-in fade-in zoom-in-95 duration-100',
            align === 'right' ? 'right-0' : 'left-0',
            width
          )}
        >
          {children ? (
            <div onClick={() => setIsOpen(false)}>{children}</div>
          ) : (
            sections?.map((section, idx) => (
              <div key={idx} className={idx > 0 ? 'border-t border-slate-100 mt-1 pt-1' : ''}>
                {section.title && (
                  <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    disabled={item.disabled}
                    onClick={() => {
                      if (!item.disabled) {
                        item.onClick?.();
                        setIsOpen(false);
                      }
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors cursor-pointer text-left',
                      item.destructive
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                      item.disabled && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon && <span className="h-4 w-4 shrink-0 text-slate-400">{item.icon}</span>}
                      <span>{item.label}</span>
                    </div>
                    {item.checked && (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-900 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

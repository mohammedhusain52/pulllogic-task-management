'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  format,
  parse,
  isValid,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addDays,
} from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
  value: string | Date | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  minDate?: string | Date;
  maxDate?: string | Date;
  className?: string;
  inputClassName?: string;
  align?: 'left' | 'right';
  showPresets?: boolean;
}

// Helper to normalize input into YYYY-MM-DD string
function toDateString(val: string | Date | null | undefined): string {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return format(val, 'yyyy-MM-dd');
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return '';
    // If it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    // Try parsing ISO or Date string
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return format(d, 'yyyy-MM-dd');
    }
    return trimmed;
  }
  return '';
}

// Try parsing user typed string with various common formats
function parseUserDateInput(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Direct YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split(/[-/.]/);
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (isValid(d) && d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
      return d;
    }
  }

  // 2. DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(trimmed)) {
    const parts = trimmed.split(/[-/.]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (isValid(d) && d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
      return d;
    }
  }

  // 3. Fallback standard parse
  const fallback = new Date(trimmed);
  if (isValid(fallback) && !isNaN(fallback.getTime())) {
    return fallback;
  }

  return null;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'YYYY-MM-DD',
  label,
  disabled = false,
  minDate,
  maxDate,
  className,
  inputClassName,
  align = 'left',
  showPresets = true,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedValue = toDateString(value);
  const [textInput, setTextInput] = useState(normalizedValue);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const initial = parseUserDateInput(normalizedValue);
    return initial || new Date();
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize internal text input when external value changes
  useEffect(() => {
    setTextInput(normalizedValue);
    const parsed = parseUserDateInput(normalizedValue);
    if (parsed) {
      setCurrentMonth(parsed);
    }
  }, [normalizedValue]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // On blur / outside click, commit or format the typed text
        handleCommitText(textInput);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, textInput]);

  const handleCommitText = (text: string) => {
    if (!text.trim()) {
      onChange('');
      return;
    }
    const parsed = parseUserDateInput(text);
    if (parsed) {
      const formatted = format(parsed, 'yyyy-MM-dd');
      setTextInput(formatted);
      onChange(formatted);
      setCurrentMonth(parsed);
    } else {
      // If invalid, revert to previously committed value
      setTextInput(normalizedValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextInput(val);

    // If completely cleared, trigger onChange immediately
    if (!val.trim()) {
      onChange('');
      return;
    }

    // If user typed a full valid format (e.g. 10 chars YYYY-MM-DD), sync immediately
    if (val.length === 10) {
      const parsed = parseUserDateInput(val);
      if (parsed) {
        const formatted = format(parsed, 'yyyy-MM-dd');
        onChange(formatted);
        setCurrentMonth(parsed);
      }
    }
  };

  const handleInputBlur = () => {
    handleCommitText(textInput);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommitText(textInput);
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const handleSelectDay = (day: Date) => {
    const formatted = format(day, 'yyyy-MM-dd');
    setTextInput(formatted);
    onChange(formatted);
    setCurrentMonth(day);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTextInput('');
    onChange('');
  };

  const handleToday = () => {
    const today = new Date();
    handleSelectDay(today);
  };

  const handleTomorrow = () => {
    const tomorrow = addDays(new Date(), 1);
    handleSelectDay(tomorrow);
  };

  const handleNextWeek = () => {
    const nextWeek = addDays(new Date(), 7);
    handleSelectDay(nextWeek);
  };

  // Calendar generation helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const selectedDate = parseUserDateInput(normalizedValue);

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          {label}
        </label>
      )}

      {/* Input Field Container */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={textInput}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'w-full pl-3.5 pr-16 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors',
            disabled && 'opacity-50 cursor-not-allowed',
            inputClassName
          )}
        />

        {/* Action icons right-aligned */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {textInput && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={cn(
              'p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors',
              isOpen && 'bg-indigo-600/20 text-indigo-400'
            )}
            title="Open calendar"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Calendar Popover */}
      {isOpen && !disabled && (
        <div
          className={cn(
            'absolute top-full mt-1.5 z-50 w-72 p-3.5 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ring-1 ring-black/50 animate-in fade-in zoom-in-95 duration-150',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {/* Quick Presets */}
          {showPresets && (
            <div className="flex items-center gap-1.5 mb-3 pb-2.5 border-b border-white/10">
              <button
                type="button"
                onClick={handleToday}
                className="flex-1 py-1 px-2 text-[11px] font-medium bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-lg transition-colors text-center"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleTomorrow}
                className="flex-1 py-1 px-2 text-[11px] font-medium bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-lg transition-colors text-center"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                className="flex-1 py-1 px-2 text-[11px] font-medium bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-lg transition-colors text-center"
              >
                +1 Week
              </button>
            </div>
          )}

          {/* Month / Year Navigation */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-bold text-white tracking-wide">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d, i) => (
              <div key={i} className="text-[10px] font-bold text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isDayToday = isToday(day);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    'h-8 w-8 text-xs rounded-lg flex items-center justify-center transition-all relative font-medium',
                    !isCurrentMonth && 'text-slate-600 hover:text-slate-400',
                    isCurrentMonth && !isSelected && 'text-slate-200 hover:bg-indigo-600/30 hover:text-white',
                    isDayToday && !isSelected && 'border border-indigo-500/50 text-indigo-300 font-bold',
                    isSelected && 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/40'
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/10 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setTextInput('');
                onChange('');
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

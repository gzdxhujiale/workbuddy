import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Sunrise,
  Calendar as CalendarIcon,
  Moon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Bell,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';

export type ReminderOption = 'none' | 'sameDay' | '1day' | '3days' | '7days' | 'custom';

export interface DateAndReminderValue {
  deadline: number | null;
  remindAt: number | null;
  reminderOption?: ReminderOption;
}

interface DateTimePickerProps {
  value: number | null; // Timestamp in ms or null
  onChange: (timestamp: number | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  allowClear?: boolean;
}

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

/**
 * 辅助函数：根据截止日期与提醒选项计算提醒时间戳
 */
export function calculateRemindAt(
  deadline: number | null,
  option: ReminderOption,
  customTs?: number | null
): number | null {
  if (option === 'none' || !deadline) return null;
  if (option === 'custom') return customTs ?? null;

  const d = new Date(deadline);
  if (option === 'sameDay') {
    // 当天早上 09:00 提醒
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0).getTime();
  }
  if (option === '1day') {
    // 提前 1 天 09:00
    const prev = new Date(d);
    prev.setDate(d.getDate() - 1);
    return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), 9, 0, 0).getTime();
  }
  if (option === '3days') {
    // 提前 3 天 09:00
    const prev = new Date(d);
    prev.setDate(d.getDate() - 3);
    return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), 9, 0, 0).getTime();
  }
  if (option === '7days') {
    // 提前 7 天 09:00
    const prev = new Date(d);
    prev.setDate(d.getDate() - 7);
    return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), 9, 0, 0).getTime();
  }
  return null;
}

/**
 * 单独立项日期/时间选择器 (集成 23:59:59 默认逻辑及提醒菜单)
 */
export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = '未设置（默认为空）',
  className = '',
  icon,
  allowClear = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const initialDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState<Date>(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  
  // 是否自定义了具体时间（若未开启/未设置，默认为当天最后一秒 23:59:59）
  const [hasCustomTime, setHasCustomTime] = useState<boolean>(() => {
    if (!value) return false;
    const d = new Date(value);
    return !(d.getHours() === 23 && d.getMinutes() === 59 && d.getSeconds() === 59);
  });

  const [timeStr, setTimeStr] = useState<string>(() => {
    if (value && hasCustomTime) {
      const d = new Date(value);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return '09:00';
  });

  const [tab, setTab] = useState<'date' | 'timeRange'>('date');

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setSelectedDate(d);
      setViewDate(d);
      const isLastSec = d.getHours() === 23 && d.getMinutes() === 59 && d.getSeconds() === 59;
      setHasCustomTime(!isLastSec);
      if (!isLastSec) {
        setTimeStr(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      }
    } else {
      setSelectedDate(null);
      setHasCustomTime(false);
    }
  }, [value]);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 320;
      const popoverHeight = 440;
      let top = rect.bottom + 6;
      let left = rect.left;

      if (top + popoverHeight > window.innerHeight) {
        top = Math.max(10, rect.top - popoverHeight - 6);
      }
      if (left + popoverWidth > window.innerWidth) {
        left = Math.max(10, window.innerWidth - popoverWidth - 16);
      }
      setPos({ top, left });
    }
  };

  const toggleOpen = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = (e: MouseEvent) => {
      const el = e.target as Element | null;
      if (el && (el.closest('.datetime-picker-content') || el.closest('.datetime-picker-trigger'))) {
        return;
      }
      setIsOpen(false);
    };
    const handleScrollOrResize = () => updatePosition();

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    document.addEventListener('mousedown', handleClose);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleClose);
    };
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  const calendarCells = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const buildTimestamp = (d: Date, customTime: boolean, timeString: string) => {
    if (customTime) {
      const [h, m] = timeString.split(':').map(Number);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h || 0, m || 0, 0).getTime();
    }
    // 默认为当天最后一秒 23:59:59
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime();
  };

  const handleSelectDay = (dayNum: number) => {
    const baseDate = new Date(year, month, dayNum);
    setSelectedDate(baseDate);
    const ts = buildTimestamp(baseDate, hasCustomTime, timeStr);
    onChange(ts);
  };

  const handleQuickPreset = (preset: 'today' | 'tomorrow' | 'nextWeek' | 'none') => {
    if (preset === 'none') {
      setSelectedDate(null);
      onChange(null);
      setIsOpen(false);
      return;
    }

    const now = new Date();
    let target = new Date();
    if (preset === 'today') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (preset === 'tomorrow') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (preset === 'nextWeek') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
    }

    setSelectedDate(target);
    setViewDate(target);
    const ts = buildTimestamp(target, hasCustomTime, timeStr);
    onChange(ts);
  };

  const handleTimeToggle = (enableCustom: boolean) => {
    setHasCustomTime(enableCustom);
    if (selectedDate) {
      const ts = buildTimestamp(selectedDate, enableCustom, timeStr);
      onChange(ts);
    }
  };

  const handleTimeChange = (newTimeStr: string) => {
    setTimeStr(newTimeStr);
    setHasCustomTime(true);
    if (selectedDate) {
      const ts = buildTimestamp(selectedDate, true, newTimeStr);
      onChange(ts);
    }
  };

  const formatDisplay = () => {
    if (!value) return placeholder;
    const d = new Date(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    const isLastSec = d.getHours() === 23 && d.getMinutes() === 59 && d.getSeconds() === 59;
    if (isLastSec) {
      return `${y}-${m}-${day} (全天 23:59:59)`;
    }
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  };

  return (
    <div className={`relative inline-block w-full ${className}`}>
      {label && <label className="text-[11px] text-white/40 mb-1 block">{label}</label>}

      <div className="flex items-center gap-1.5 w-full">
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleOpen}
          className={`datetime-picker-trigger w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-[12px] transition-all ${
            value
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200 hover:border-emerald-400/50'
              : 'liquid-input text-white/40 hover:text-white/60'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {icon || <CalendarIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            <span className={`truncate font-mono ${value ? 'text-white' : 'text-white/40'}`}>
              {formatDisplay()}
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
        </button>

        {allowClear && value != null && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="p-2 rounded-xl border border-white/[0.08] bg-black/20 text-white/40 hover:text-rose-300 hover:border-rose-500/30 transition-colors shrink-0"
            title="清除时间"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'fixed',
                  top: pos.top,
                  left: pos.left,
                  zIndex: 9999,
                }}
                className="datetime-picker-content w-[320px] p-3.5 rounded-2xl bg-[#141a23]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.75)] text-white select-none"
              >
                {/* 顶部 Tab 切换 */}
                <div className="grid grid-cols-2 p-0.5 rounded-xl bg-white/5 text-[11px] font-semibold mb-3">
                  <button
                    type="button"
                    onClick={() => setTab('date')}
                    className={`py-1.5 rounded-lg transition-all ${
                      tab === 'date' ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    日期
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('timeRange')}
                    className={`py-1.5 rounded-lg transition-all ${
                      tab === 'timeRange' ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    时间段
                  </button>
                </div>

                {/* 快捷图标栏 (☀️ 🌅 📅 🌙) */}
                <div className="flex items-center justify-around py-1 mb-3 border-b border-white/[0.06] text-white/60">
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('today')}
                    className="p-2 rounded-xl hover:bg-white/10 hover:text-amber-300 transition-colors flex flex-col items-center gap-1"
                    title="今天"
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('tomorrow')}
                    className="p-2 rounded-xl hover:bg-white/10 hover:text-emerald-300 transition-colors flex flex-col items-center gap-1"
                    title="明天"
                  >
                    <Sunrise className="w-4 h-4 text-emerald-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('nextWeek')}
                    className="p-2 rounded-xl hover:bg-white/10 hover:text-cyan-300 transition-colors flex flex-col items-center gap-1"
                    title="下周"
                  >
                    <CalendarIcon className="w-4 h-4 text-cyan-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('none')}
                    className="p-2 rounded-xl hover:bg-white/10 hover:text-rose-300 transition-colors flex flex-col items-center gap-1"
                    title="无日期 / 清除"
                  >
                    <Moon className="w-4 h-4 text-indigo-300" />
                  </button>
                </div>

                {/* 月份导航标题 */}
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-[13px] font-bold font-mono">
                    {year}年{month + 1}月
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewDate(new Date(year, month - 1, 1))}
                      className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewDate(new Date())}
                      className="w-2 h-2 rounded-full bg-emerald-400"
                      title="重置到本月"
                    />
                    <button
                      type="button"
                      onClick={() => setViewDate(new Date(year, month + 1, 1))}
                      className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 日历表 */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-white/40 mb-1">
                  {WEEKDAY_LABELS.map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-3">
                  {calendarCells.map((dayNum, idx) => {
                    if (dayNum === null) return <div key={`empty-${idx}`} />;
                    const isSelected =
                      selectedDate &&
                      selectedDate.getFullYear() === year &&
                      selectedDate.getMonth() === month &&
                      selectedDate.getDate() === dayNum;
                    const isToday =
                      new Date().getFullYear() === year &&
                      new Date().getMonth() === month &&
                      new Date().getDate() === dayNum;

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => handleSelectDay(dayNum)}
                        className={`h-8 rounded-full text-[12px] font-mono font-medium flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-white font-bold shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                            : isToday
                            ? 'border border-emerald-400 text-emerald-300 hover:bg-emerald-500/20'
                            : 'hover:bg-white/10 text-white/80'
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>

                {/* 底部 时间与提醒 (点击时间选择那一天的具体时间，不设置默认为当天最后一秒 23:59:59) */}
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between text-[11px] px-1 text-white/80">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>时间</span>
                      <span className="text-[9px] text-white/35">
                        ({hasCustomTime ? '自定义具体时间' : '默认当天23:59:59'})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!hasCustomTime ? (
                        <button
                          type="button"
                          onClick={() => handleTimeToggle(true)}
                          className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-emerald-300 text-[10px]"
                        >
                          设置时间
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <input
                            type="time"
                            value={timeStr}
                            onChange={(e) => handleTimeChange(e.target.value)}
                            className="bg-black/40 border border-emerald-400/40 rounded px-1.5 py-0.5 text-[11px] font-mono text-emerald-300 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleTimeToggle(false)}
                            className="text-[10px] text-white/40 hover:text-white"
                            title="恢复全天 (23:59:59)"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 底部确认与清除 */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('none')}
                    className="text-[11px] text-rose-300 hover:text-rose-200 transition-colors"
                  >
                    无日期
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3.5 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold flex items-center gap-1 shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" /> 确认
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

/**
 * 集成“日期与提醒”二级侧边浮动菜单组件 (参考 Humanmanual 侧边展开的二级菜单)
 */
export const DateAndReminderPickerModal: React.FC<{
  open: boolean;
  onClose: () => void;
  deadline: number | null;
  remindAt: number | null;
  onConfirm: (val: { deadline: number | null; remindAt: number | null; reminderOption: ReminderOption }) => void;
  pos?: { top: number; left: number };
}> = ({ open, onClose, deadline, remindAt, onConfirm, pos }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const initialDate = deadline ? new Date(deadline) : new Date();
  const [viewDate, setViewDate] = useState<Date>(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(deadline ? new Date(deadline) : null);

  const [hasCustomTime, setHasCustomTime] = useState<boolean>(() => {
    if (!deadline) return false;
    const d = new Date(deadline);
    return !(d.getHours() === 23 && d.getMinutes() === 59 && d.getSeconds() === 59);
  });

  const [timeStr, setTimeStr] = useState<string>(() => {
    if (deadline && hasCustomTime) {
      const d = new Date(deadline);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return '09:00';
  });

  const [reminderOption, setReminderOption] = useState<ReminderOption>(() => {
    if (!remindAt) return 'none';
    if (!deadline) return 'custom';
    const diffMs = deadline - remindAt;
    const diffDays = Math.round(diffMs / (1000 * 3600 * 24));
    if (diffDays === 0) return 'sameDay';
    if (diffDays === 1) return '1day';
    if (diffDays === 3) return '3days';
    if (diffDays === 7) return '7days';
    return 'custom';
  });

  const [showReminderMenu, setShowReminderMenu] = useState(false);
  const [customRemindTs, setCustomRemindTs] = useState<number | null>(remindAt);

  useEffect(() => {
    if (deadline) {
      const d = new Date(deadline);
      setSelectedDate(d);
      setViewDate(d);
      const isLastSec = d.getHours() === 23 && d.getMinutes() === 59 && d.getSeconds() === 59;
      setHasCustomTime(!isLastSec);
      if (!isLastSec) {
        setTimeStr(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      }
    } else {
      setSelectedDate(null);
    }
  }, [deadline]);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const el = e.target as Element | null;
      if (el && (el.closest('.date-reminder-popover-content') || el.closest('.datetime-picker-trigger'))) {
        return;
      }
      onClose();
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open, onClose]);

  // 侧边定位逻辑 (优先展开在卡片左侧，空间不足展开在右侧)
  const computedPos = useMemo(() => {
    if (!pos) return { top: 100, left: 100 };
    const popWidth = 320;
    const popHeight = 440;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = pos.left - popWidth - 12; // 优先卡片左侧
    if (left < 12) {
      left = Math.min(vw - popWidth - 12, pos.left + 380 + 12); // 卡片右侧
    }
    let top = Math.min(vh - popHeight - 12, Math.max(12, pos.top));
    return { top, left };
  }, [pos]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  const calendarCells = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const buildDeadlineTimestamp = (d: Date | null, customTime: boolean, timeString: string) => {
    if (!d) return null;
    if (customTime) {
      const [h, m] = timeString.split(':').map(Number);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h || 0, m || 0, 0).getTime();
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime();
  };

  const handleSelectDay = (dayNum: number) => {
    const baseDate = new Date(year, month, dayNum);
    setSelectedDate(baseDate);
  };

  const handleQuickPreset = (preset: 'today' | 'tomorrow' | 'nextWeek' | 'none') => {
    if (preset === 'none') {
      setSelectedDate(null);
      return;
    }
    const now = new Date();
    let target = new Date();
    if (preset === 'today') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (preset === 'tomorrow') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (preset === 'nextWeek') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
    }
    setSelectedDate(target);
    setViewDate(target);
  };

  const handleConfirm = () => {
    const finalDeadline = buildDeadlineTimestamp(selectedDate, hasCustomTime, timeStr);
    const finalRemindAt = calculateRemindAt(finalDeadline, reminderOption, customRemindTs);
    onConfirm({
      deadline: finalDeadline,
      remindAt: finalRemindAt,
      reminderOption,
    });
    onClose();
  };

  const getReminderLabel = (opt: ReminderOption) => {
    switch (opt) {
      case 'none':
        return '不提醒';
      case 'sameDay':
        return '当天 (09:00)';
      case '1day':
        return '提前一天 (09:00)';
      case '3days':
        return '提前三天 (09:00)';
      case '7days':
        return '提前七天 (09:00)';
      case 'custom':
        return customRemindTs ? `自定义: ${new Date(customRemindTs).toLocaleDateString()}` : '自定义';
    }
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          top: computedPos.top,
          left: computedPos.left,
          zIndex: 10000,
        }}
        className="date-reminder-popover-content w-[320px] p-3.5 rounded-2xl bg-[#141a23]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white select-none relative"
      >
          {/* Header Tab 切换 */}
          <div className="grid grid-cols-2 p-0.5 rounded-xl bg-white/5 text-[11px] font-semibold mb-3">
            <button type="button" className="py-1.5 rounded-lg bg-white/15 text-white shadow-sm">
              日期
            </button>
            <button type="button" className="py-1.5 rounded-lg text-white/40 hover:text-white/70">
              时间段
            </button>
          </div>

          {/* 快捷图标栏 (☀️ 🌅 📅 🌙) */}
          <div className="flex items-center justify-around py-1 mb-3 border-b border-white/[0.06] text-white/60">
            <button
              type="button"
              onClick={() => handleQuickPreset('today')}
              className="p-2 rounded-xl hover:bg-white/10 hover:text-amber-300 transition-colors flex flex-col items-center"
              title="今天"
            >
              <Sun className="w-4 h-4 text-amber-400" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('tomorrow')}
              className="p-2 rounded-xl hover:bg-white/10 hover:text-emerald-300 transition-colors flex flex-col items-center"
              title="明天"
            >
              <Sunrise className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('nextWeek')}
              className="p-2 rounded-xl hover:bg-white/10 hover:text-cyan-300 transition-colors flex flex-col items-center"
              title="下周"
            >
              <CalendarIcon className="w-4 h-4 text-cyan-400" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('none')}
              className="p-2 rounded-xl hover:bg-white/10 hover:text-rose-300 transition-colors flex flex-col items-center"
              title="无日期 / 清除"
            >
              <Moon className="w-4 h-4 text-indigo-300" />
            </button>
          </div>

          {/* 月份导航标题 */}
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[13px] font-bold font-mono">
              {year}年{month + 1}月
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewDate(new Date())}
                className="w-2 h-2 rounded-full bg-emerald-400"
              />
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 日历格子 */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-white/40 mb-1">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {calendarCells.map((dayNum, idx) => {
              if (dayNum === null) return <div key={`empty-${idx}`} />;
              const isSelected =
                selectedDate &&
                selectedDate.getFullYear() === year &&
                selectedDate.getMonth() === month &&
                selectedDate.getDate() === dayNum;
              const isToday =
                new Date().getFullYear() === year &&
                new Date().getMonth() === month &&
                new Date().getDate() === dayNum;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 rounded-full text-[12px] font-mono font-medium flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-white font-bold shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : isToday
                      ? 'border border-emerald-400 text-emerald-300 hover:bg-emerald-500/20'
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* 底部 时间 与 提醒设置 (满足用户要求: 点击时间选择具体时间，不设置默认为当天最后一秒 23:59:59) */}
          <div className="pt-2.5 border-t border-white/[0.08] space-y-2">
            {/* 时间选择条 */}
            <div className="flex items-center justify-between text-[11px] px-1 text-white/80">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>时间</span>
              </div>

              {!hasCustomTime ? (
                <button
                  type="button"
                  onClick={() => setHasCustomTime(true)}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-emerald-300 text-[10px]"
                >
                  未设置（默认当天23:59:59）
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="bg-black/40 border border-emerald-400/40 rounded px-1.5 py-0.5 text-[11px] font-mono text-emerald-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setHasCustomTime(false)}
                    className="text-[10px] text-white/40 hover:text-white"
                    title="恢复默认 23:59:59"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* 提醒新菜单 (当天、提前一天、提前三天、提前七天、自定义) */}
            <div className="relative">
              <div className="flex items-center justify-between text-[11px] px-1 text-white/80">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>提醒</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReminderMenu(!showReminderMenu)}
                  className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 hover:border-amber-400/40 text-[10px] text-amber-300 flex items-center gap-1 font-mono transition-colors"
                >
                  <span>{getReminderLabel(reminderOption)}</span>
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>
              </div>

              {/* 提醒下拉二级菜单 */}
              <AnimatePresence>
                {showReminderMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 bottom-7 z-10 w-[160px] p-1 rounded-xl bg-[#1c2430] border border-white/15 shadow-xl text-[11px] space-y-0.5"
                  >
                    {[
                      { key: 'none', label: '不提醒' },
                      { key: 'sameDay', label: '当天 (09:00)' },
                      { key: '1day', label: '提前一天' },
                      { key: '3days', label: '提前三天' },
                      { key: '7days', label: '提前七天' },
                      { key: 'custom', label: '自定义...' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setReminderOption(item.key as ReminderOption);
                          setShowReminderMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                          reminderOption === item.key
                            ? 'bg-amber-500/20 text-amber-300 font-semibold'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span>{item.label}</span>
                        {reminderOption === item.key && <Check className="w-3 h-3 text-amber-400" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 确认与取消 */}
          <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] text-white/50 hover:text-white transition-colors"
            >
              取消
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold flex items-center gap-1 shadow-md transition-all"
            >
              <Check className="w-3.5 h-3.5" /> 确认保存
            </button>
          </div>
        </motion.div>
    </AnimatePresence>,
    document.body
  );
};

import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useScheduleEvents, useAddScheduleEvent, useUpdateScheduleEvent, useDeleteScheduleEvent } from '@/lib/queries';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  MapPin,
  Users,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { useToast } from '@/components/ui/Toast';
import { ViewTransition } from '@/components/ui/PageTransition';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import { getEventStartHourDecimal, getEventEndHourDecimal, buildEventTimestamp } from '@/utils/date';
import { ScheduleEvent } from '@/lib/queries';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

export const ScheduleManagementPage: React.FC = () => {
  const { show, ToastEl } = useToast();
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [viewDir, setViewDir] = useState(1);
  const viewOrder = { month: 0, week: 1, day: 2 } as const;

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [priorityFilter, setPriorityFilter] = useState<'all' | '高' | '中' | '低'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [menuId, setMenuId] = useState<number | string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (menuId === null) return;
    const handleClose = (e: MouseEvent) => {
      const el = e.target as Element | null;
      if (el && el.closest && (el.closest('.action-menu-trigger') || el.closest('.action-menu-content'))) {
        return;
      }
      setMenuId(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuId(null);
    };
    const handleScrollOrResize = () => setMenuId(null);

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuId]);

  const [form, setForm] = useState({
    title: '',
    time: '10:00 - 11:00',
    startHour: 10,
    endHour: 11,
    room: '线上会议室 Alpha',
    priority: '高' as '高' | '中' | '低',
    day: currentDate.getDate(),
    attendees: 'Brandon',
  });

  const { data: events = [] } = useScheduleEvents();
  const activeMenuEvt = useMemo(() => events.find((e) => String(e.id) === String(menuId)), [events, menuId]);
  const addEventMutation = useAddScheduleEvent();
  const updateEventMutation = useUpdateScheduleEvent();
  const deleteEventMutation = useDeleteScheduleEvent();

  const monthLabel = `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`;
  const prevTitle = view === 'month' ? '上一月' : view === 'week' ? '上一周' : '上一天';
  const nextTitle = view === 'month' ? '下一月' : view === 'week' ? '下一周' : '下一天';

  const handlePrev = () => {
    if (view === 'month') {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, Math.min(prev.getDate(), new Date(prev.getFullYear(), prev.getMonth(), 0).getDate())));
    } else if (view === 'week') {
      setCurrentDate((prev) => {
        const next = new Date(prev);
        next.setDate(prev.getDate() - 7);
        return next;
      });
    } else if (view === 'day') {
      setCurrentDate((prev) => {
        const next = new Date(prev);
        next.setDate(prev.getDate() - 1);
        return next;
      });
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, Math.min(prev.getDate(), new Date(prev.getFullYear(), prev.getMonth() + 2, 0).getDate())));
    } else if (view === 'week') {
      setCurrentDate((prev) => {
        const next = new Date(prev);
        next.setDate(prev.getDate() + 7);
        return next;
      });
    } else if (view === 'day') {
      setCurrentDate((prev) => {
        const next = new Date(prev);
        next.setDate(prev.getDate() + 1);
        return next;
      });
    }
  };

  const goToday = () => {
    setCurrentDate(new Date());
    show('已回到今天');
  };

  const filteredEvents = useMemo(
    () => events.filter((e) => priorityFilter === 'all' || e.priority === priorityFilter),
    [events, priorityFilter]
  );

  const dayEvents = useMemo(() => {
    return filteredEvents
      .filter((e) => {
        const d = new Date(e.startTime);
        return (
          d.getFullYear() === currentDate.getFullYear() &&
          d.getMonth() === currentDate.getMonth() &&
          d.getDate() === currentDate.getDate()
        );
      })
      .sort((a, b) => a.startTime - b.startTime);
  }, [filteredEvents, currentDate]);

  const openEdit = (evt: ScheduleEvent) => {
    setEditing(evt);
    const evtDate = new Date(evt.startTime);
    setForm({
      title: evt.title,
      time: `${fmtHour(getEventStartHourDecimal(evt.startTime))} - ${fmtHour(getEventEndHourDecimal(evt.endTime))}`,
      startHour: getEventStartHourDecimal(evt.startTime),
      endHour: getEventEndHourDecimal(evt.endTime),
      room: evt.room,
      priority: evt.priority,
      day: evtDate.getDate(),
      attendees: evt.attendees.join(', '),
    });
    setShowCreate(true);
    setMenuId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload: ScheduleEvent = {
      id: editing?.id ?? Date.now(),
      title: form.title.trim(),
      startTime: buildEventTimestamp(form.day, form.startHour, currentDate.getFullYear(), currentDate.getMonth()),
      endTime: buildEventTimestamp(form.day, form.endHour, currentDate.getFullYear(), currentDate.getMonth()),
      room: form.room,
      priority: form.priority,
      attendees: form.attendees.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      status: editing?.status ?? '待开始',
    };
    if (editing) {
      updateEventMutation.mutate({ id: editing.id, updates: payload }, {
        onSuccess: () => show('日程已更新')
      });
    } else {
      addEventMutation.mutate(payload, {
        onSuccess: () => show('日程已创建')
      });
    }
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), form.day));
    setShowCreate(false);
    setEditing(null);
  };

  const deleteEvent = (id: number) => {
    deleteEventMutation.mutate(id, {
      onSuccess: () => {
        setMenuId(null);
        show('日程已删除');
      }
    });
  };

  const field = 'liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white';

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-3 pb-1">
      {ToastEl}

      {/* 顶栏工具 — 单行 */}
      <div className="flex items-center justify-end gap-3 flex-nowrap shrink-0 min-w-0 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div className="liquid-pill p-1 flex items-center gap-0.5 whitespace-nowrap relative">
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => {
                  setViewDir(viewOrder[v] >= viewOrder[view] ? 1 : -1);
                  setView(v);
                }}
                className={`relative px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap z-10 ${
                  view === v ? 'text-white' : 'text-white/40 hover:text-white/75'
                }`}
              >
                {view === v && (
                  <motion.span
                    layoutId="schedule-view-pill"
                    className="absolute inset-0 rounded-full bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{v === 'month' ? '月视图' : v === 'week' ? '周视图' : '日视图'}</span>
              </button>
            ))}
          </div>

          <LiquidSelect
            variant="pill"
            value={priorityFilter}
            onChange={(v) => setPriorityFilter(v as typeof priorityFilter)}
            aria-label="优先级筛选"
            options={[
              { value: 'all', label: '优先级: 全部' },
              { value: '高', label: '高' },
              { value: '中', label: '中' },
              { value: '低', label: '低' },
            ]}
          />
        </div>
      </div>

      {/* 主体：通高下对齐 */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-3.5 items-stretch">
        <GlassCard className="p-4 sm:p-5 flex flex-col min-h-0 h-full overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] shrink-0 gap-2 flex-nowrap">
            <div className="text-[13px] font-bold text-white whitespace-nowrap">
              {monthLabel}
              <span className="text-white/35 font-medium ml-2 text-[11px]">
                · {view === 'month' ? '月视图' : view === 'week' ? '周视图' : '日视图'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-white/50 shrink-0">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                title={prevTitle}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={goToday} className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold border border-emerald-400/30">
                今天
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                title={nextTitle}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 pt-3 overflow-hidden">
            <ViewTransition viewKey={view} direction={viewDir} className="h-full min-h-0 overflow-auto">
              {view === 'month' ? (
                <MonthView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onSelectDay={(d) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))}
                  onDayDoubleCreate={() => {}}
                />
              ) : view === 'week' ? (
                <WeekView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onSelectDate={(d) => setCurrentDate(d)}
                  onSelectEvent={openEdit}
                />
              ) : (
                <DayView
                  currentDate={currentDate}
                  events={dayEvents}
                  onSelectEvent={openEdit}
                  onEmptySlot={() => {}}
                />
              )}
            </ViewTransition>
          </div>
        </GlassCard>

        {/* 右侧详情 — 通高，底对齐操作 */}
        <GlassCard className="p-4 sm:p-5 flex flex-col min-h-0 h-full overflow-hidden">
          <div className="flex items-center justify-between shrink-0 pb-3 border-b border-white/[0.06]">
            <h3 className="text-[13px] font-bold text-white">{currentDate.getMonth() + 1}月{currentDate.getDate()}日 · 日程</h3>
            <span className="text-[11px] text-emerald-300 font-mono">{dayEvents.length} 项</span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 py-3">
            <ViewTransition viewKey={currentDate.toISOString()} className="space-y-2.5">
              {dayEvents.length === 0 && (
                <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-[12px] text-white/35 gap-3">
                  <p>当日暂无日程</p>
                </div>
              )}
              {dayEvents.map((evt) => (
                <div key={evt.id} className="p-3 rounded-2xl bg-black/25 border border-white/[0.06] space-y-2 relative group">
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => openEdit(evt)} className="text-left min-w-0">
                      <div className="text-[12px] font-bold text-white leading-snug">{evt.title}</div>
                      <div className="text-[10px] text-white/35 mt-0.5">{evt.status}</div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-400/25">
                        {evt.priority}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (String(menuId) === String(evt.id)) {
                            setMenuId(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPos({
                              top: rect.bottom + 4,
                              right: Math.max(8, window.innerWidth - rect.right),
                            });
                            setMenuId(evt.id);
                          }
                        }}
                        className="p-1 rounded-lg text-white/35 hover:text-white hover:bg-white/5 action-menu-trigger relative z-10 cursor-pointer"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-white/45 space-y-1">
                    <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-300" />{fmtHour(getEventStartHourDecimal(evt.startTime))} - {fmtHour(getEventEndHourDecimal(evt.endTime))}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-white/30" />{evt.room}</div>
                    <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-white/30" />{evt.attendees.join('、')}</div>
                  </div>
                </div>
              ))}
            </ViewTransition>
          </div>
        </GlassCard>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {menuId !== null && activeMenuEvt && (
              <motion.div
                key={activeMenuEvt.id}
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: menuPos.top,
                  right: menuPos.right,
                  zIndex: 9999,
                }}
                className="p-1.5 liquid-glass min-w-[120px] action-menu-content shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
              >
                <button
                  onClick={() => {
                    setMenuId(null);
                    openEdit(activeMenuEvt);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-white/75 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-emerald-300" /> 编辑
                </button>
                <button
                  onClick={() => {
                    setMenuId(null);
                    deleteEvent(activeMenuEvt.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-rose-300 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 删除
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* 编辑 — 液态玻璃弹窗 */}
      <LiquidModal
        open={Boolean(editing)}
        onClose={() => {
          setShowCreate(false);
          setEditing(null);
        }}
        title="编辑日程"
        subtitle={editing ? `ID · ${editing.id}` : ''}
        icon={<CalendarIcon className="w-5 h-5" />}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setEditing(null);
              }}
              className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60"
            >
              取消
            </button>
            <button type="submit" form="schedule-form" className="h-10 px-5 rounded-full liquid-btn-primary text-[12px] font-bold">
              保存修改
            </button>
          </div>
        }
      >
        <form id="schedule-form" onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">会议主题 <span className="text-emerald-300">*</span></label>
            <input required className={field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="请输入会议主题" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/40 mb-1.5 block">日期 ({currentDate.getMonth() + 1}月)</label>
              <input type="number" min={1} max={31} className={field} value={form.day} onChange={(e) => setForm({ ...form, day: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-[11px] text-white/40 mb-1.5 block">优先级</label>
              <LiquidSelect
                value={form.priority}
                onChange={(v) => setForm({ ...form, priority: v as '高' | '中' | '低' })}
                options={[
                  { value: '高', label: '高' },
                  { value: '中', label: '中' },
                  { value: '低', label: '低' },
                ]}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/40 mb-1.5 block">开始小时</label>
              <input type="number" min={8} max={19} step={0.5} className={field} value={form.startHour} onChange={(e) => {
                const startHour = Number(e.target.value);
                const endHour = Math.max(startHour + 0.5, form.endHour);
                setForm({
                  ...form,
                  startHour,
                  endHour,
                  time: `${fmtHour(startHour)} - ${fmtHour(endHour)}`,
                });
              }} />
            </div>
            <div>
              <label className="text-[11px] text-white/40 mb-1.5 block">结束小时</label>
              <input type="number" min={8} max={20} step={0.5} className={field} value={form.endHour} onChange={(e) => {
                const endHour = Number(e.target.value);
                setForm({
                  ...form,
                  endHour,
                  time: `${fmtHour(form.startHour)} - ${fmtHour(endHour)}`,
                });
              }} />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">时间展示</label>
            <input className={field} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">地点 / 会议室</label>
            <input className={field} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">参会人（逗号分隔）</label>
            <input className={field} value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} />
          </div>
        </form>
      </LiquidModal>
    </div>
  );
};

function fmtHour(h: number) {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  return `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function MonthView({
  currentDate,
  events,
  onSelectDay,
  onDayDoubleCreate,
}: {
  currentDate: Date;
  events: ScheduleEvent[];
  onSelectDay: (d: number) => void;
  onDayDoubleCreate: (d: number) => void;
}) {
  const now = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const selectedDay = currentDate.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = [...Array.from({ length: firstDayOfWeek }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="h-full min-h-[420px] flex flex-col">
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-white/40 pb-2 shrink-0">
        {WEEKDAY_LABELS.map((d, i) => (
          <div key={d} className={i >= 5 ? 'text-emerald-300/70' : ''}>{`周${d}`}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 flex-1 auto-rows-fr min-h-0">
        {cells.map((dayNum, idx) => {
          if (dayNum == null) return <div key={`e-${idx}`} className="rounded-xl bg-transparent" />;
          const isSelected = dayNum === selectedDay;
          const isToday = dayNum === now.getDate() && month === now.getMonth() && year === now.getFullYear();
          const dayEvts = events.filter((e) => {
            const ed = new Date(e.startTime);
            return ed.getFullYear() === year && ed.getMonth() === month && ed.getDate() === dayNum;
          });
          return (
            <button
              key={dayNum}
              onClick={() => onSelectDay(dayNum)}
              onDoubleClick={() => onDayDoubleCreate(dayNum)}
              className={`min-h-[72px] rounded-xl p-2 border text-left flex flex-col gap-1 transition-all ${
                isSelected
                  ? 'bg-emerald-950/45 border-emerald-500/55 shadow-[0_0_16px_rgba(16,185,129,0.18)]'
                  : 'bg-black/20 border-white/[0.05] hover:border-emerald-500/35'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono text-[12px] font-bold ${isToday || isSelected ? 'text-emerald-300' : 'text-white/70'}`}>
                  {dayNum}
                </span>
                {isToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              </div>
              <div className="space-y-0.5 min-h-0 overflow-hidden flex-1">
                {dayEvts.slice(0, 2).map((e) => (
                  <div key={e.id} className="px-1 py-0.5 rounded text-[9px] truncate bg-emerald-500/15 text-emerald-200 border border-emerald-400/20">
                    {e.title}
                  </div>
                ))}
                {dayEvts.length > 2 && <div className="text-[9px] text-white/30">+{dayEvts.length - 2}</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  currentDate,
  events,
  onSelectDate,
  onSelectEvent,
}: {
  currentDate: Date;
  events: ScheduleEvent[];
  onSelectDate: (d: Date) => void;
  onSelectEvent: (e: ScheduleEvent) => void;
}) {
  const weekDays = useMemo(() => {
    const dayOfWeek = (currentDate.getDay() + 6) % 7;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [currentDate]);

  return (
    <div className="h-full min-h-[420px] overflow-auto">
      <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))] gap-1 min-w-[640px]">
        <div />
        {weekDays.map((dateObj, i) => {
          const isSelected =
            dateObj.getFullYear() === currentDate.getFullYear() &&
            dateObj.getMonth() === currentDate.getMonth() &&
            dateObj.getDate() === currentDate.getDate();
          return (
            <button
              key={dateObj.toISOString()}
              onClick={() => onSelectDate(dateObj)}
              className={`text-center py-2 rounded-xl text-[11px] font-semibold border ${
                isSelected
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                  : 'text-white/45 border-transparent hover:bg-white/[0.03]'
              }`}
            >
              <div>周{WEEKDAY_LABELS[i]}</div>
              <div className="font-mono text-[13px] mt-0.5">
                {dateObj.getMonth() !== currentDate.getMonth() ? `${dateObj.getMonth() + 1}/` : ''}{dateObj.getDate()}
              </div>
            </button>
          );
        })}
        {HOURS.map((hour) => (
          <React.Fragment key={hour}>
            <div className="text-[10px] font-mono text-white/30 py-2 pr-1 text-right">{fmtHour(hour)}</div>
            {weekDays.map((dateObj) => {
              const cellEvents = events.filter((e) => {
                const ed = new Date(e.startTime);
                return (
                  ed.getFullYear() === dateObj.getFullYear() &&
                  ed.getMonth() === dateObj.getMonth() &&
                  ed.getDate() === dateObj.getDate() &&
                  Math.floor(getEventStartHourDecimal(e.startTime)) === hour
                );
              });
              return (
                <div
                  key={`${dateObj.toISOString()}-${hour}`}
                  className="min-h-[44px] border border-white/[0.04] rounded-lg bg-black/15 p-0.5"
                >
                  {cellEvents.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => onSelectEvent(e)}
                      className="w-full text-left px-1.5 py-1 rounded-md text-[9px] bg-emerald-500/20 text-emerald-100 border border-emerald-400/25 truncate hover:brightness-110"
                    >
                      {e.title}
                    </button>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function DayView({
  currentDate,
  events,
  onSelectEvent,
  onEmptySlot,
}: {
  currentDate: Date;
  events: ScheduleEvent[];
  onSelectEvent: (e: ScheduleEvent) => void;
  onEmptySlot: (hour: number) => void;
}) {
  return (
    <div className="h-full min-h-[420px] space-y-1 overflow-auto">
      <div className="text-[12px] text-white/40 mb-2">{currentDate.getMonth() + 1}月{currentDate.getDate()}日 · 时间轴（点击空白时段可预约）</div>
      {HOURS.map((hour) => {
        const slotEvents = events.filter((e) => Math.floor(getEventStartHourDecimal(e.startTime)) === hour);
        return (
          <div key={hour} className="grid grid-cols-[56px_1fr] gap-2 items-stretch min-h-[52px]">
            <div className="text-[11px] font-mono text-white/35 pt-2 text-right">{fmtHour(hour)}</div>
            <button
              type="button"
              onClick={() => {
                if (slotEvents.length === 0) onEmptySlot(hour);
              }}
              className="rounded-xl border border-white/[0.05] bg-black/20 p-1.5 text-left hover:border-emerald-400/30 transition-colors min-h-[52px]"
            >
              {slotEvents.length === 0 && (
                <span className="text-[10px] text-white/20 px-2">空闲 · 点击预约</span>
              )}
              {slotEvents.map((e) => (
                <div
                  key={e.id}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onSelectEvent(e);
                  }}
                  className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500/25 to-teal-500/15 border border-emerald-400/30 mb-1 last:mb-0 cursor-pointer"
                >
                  <div className="text-[12px] font-semibold text-white">{e.title}</div>
                  <div className="text-[10px] text-white/45 mt-0.5">{fmtHour(getEventStartHourDecimal(e.startTime))} - {fmtHour(getEventEndHourDecimal(e.endTime))} · {e.room}</div>
                </div>
              ))}
            </button>
          </div>
        );
      })}
    </div>
  );
}

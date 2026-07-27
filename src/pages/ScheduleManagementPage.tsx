import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Video,
  MoreHorizontal,
  Pencil,
  Trash2,
  MapPin,
  Users,
  Filter,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { useToast } from '@/components/ui/Toast';
import { springSoft } from '@/lib/motion';
import { ViewTransition } from '@/components/ui/PageTransition';
import { LiquidSelect } from '@/components/ui/LiquidSelect';

interface ScheduleEvent {
  id: number;
  title: string;
  time: string;
  startHour: number;
  endHour: number;
  room: string;
  priority: '高' | '中' | '低';
  day: number; // 1-31 May
  attendees: string[];
  status: '待开始' | '进行中' | '已结束';
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00
const WEEK_DAYS = [19, 20, 21, 22, 23, 24, 25]; // sample week containing 24
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

const initialEvents: ScheduleEvent[] = [
  { id: 1, title: 'WXB-2025-001 需求评审会', time: '10:00 - 11:30', startHour: 10, endHour: 11.5, room: '线上会议室 Alpha', priority: '高', day: 24, attendees: ['Brandon', 'Elena'], status: '进行中' },
  { id: 2, title: 'Q2 架构设计演进讨论', time: '14:00 - 15:30', startHour: 14, endHour: 15.5, room: '302 脑暴研讨室', priority: '中', day: 24, attendees: ['David', 'Alex'], status: '待开始' },
  { id: 3, title: '前端 3D CoverFlow 走查', time: '16:30 - 17:30', startHour: 16.5, endHour: 17.5, room: '线上演示', priority: '高', day: 24, attendees: ['David', 'Brandon'], status: '待开始' },
  { id: 4, title: '原型评审', time: '15:00 - 16:00', startHour: 15, endHour: 16, room: '设计中心', priority: '中', day: 28, attendees: ['Elena', 'Sarah'], status: '待开始' },
  { id: 5, title: 'Sprint 计划会', time: '09:30 - 10:30', startHour: 9.5, endHour: 10.5, room: '会议室 B', priority: '高', day: 20, attendees: ['Team'], status: '已结束' },
  { id: 6, title: 'API 联调同步', time: '11:00 - 12:00', startHour: 11, endHour: 12, room: '线上', priority: '中', day: 22, attendees: ['David', 'Michael'], status: '已结束' },
  { id: 7, title: '用户访谈复盘', time: '14:00 - 15:00', startHour: 14, endHour: 15, room: 'UX Lab', priority: '低', day: 21, attendees: ['Sarah'], status: '已结束' },
];

export const ScheduleManagementPage: React.FC = () => {
  const { show, ToastEl } = useToast();
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [viewDir, setViewDir] = useState(1);
  const viewOrder = { month: 0, week: 1, day: 2 } as const;
  const [monthOffset, setMonthOffset] = useState(0); // 0 = May 2025 demo
  const [selectedDay, setSelectedDay] = useState(24);
  const [priorityFilter, setPriorityFilter] = useState<'all' | '高' | '中' | '低'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: '',
    time: '10:00 - 11:00',
    startHour: 10,
    endHour: 11,
    room: '线上会议室 Alpha',
    priority: '高' as '高' | '中' | '低',
    day: 24,
    attendees: 'Brandon',
  });
  const [events, setEvents] = useState<ScheduleEvent[]>(initialEvents);

  const monthLabel = monthOffset === 0 ? '2025年 5月' : monthOffset > 0 ? `2025年 ${5 + monthOffset}月` : `2025年 ${5 + monthOffset}月`;

  const filteredEvents = useMemo(
    () => events.filter((e) => priorityFilter === 'all' || e.priority === priorityFilter),
    [events, priorityFilter]
  );

  const dayEvents = filteredEvents
    .filter((e) => e.day === selectedDay)
    .sort((a, b) => a.startHour - b.startHour);

  const openCreate = (day = selectedDay) => {
    setForm({
      title: '',
      time: '10:00 - 11:00',
      startHour: 10,
      endHour: 11,
      room: '线上会议室 Alpha',
      priority: '高',
      day,
      attendees: 'Brandon',
    });
    setEditing(null);
    setShowCreate(true);
  };

  const openEdit = (evt: ScheduleEvent) => {
    setEditing(evt);
    setForm({
      title: evt.title,
      time: evt.time,
      startHour: evt.startHour,
      endHour: evt.endHour,
      room: evt.room,
      priority: evt.priority,
      day: evt.day,
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
      time: form.time,
      startHour: form.startHour,
      endHour: form.endHour,
      room: form.room,
      priority: form.priority,
      day: form.day,
      attendees: form.attendees.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      status: editing?.status ?? '待开始',
    };
    if (editing) {
      setEvents((prev) => prev.map((x) => (x.id === editing.id ? payload : x)));
      show('日程已更新');
    } else {
      setEvents((prev) => [...prev, payload]);
      show('日程已创建');
    }
    setSelectedDay(form.day);
    setShowCreate(false);
    setEditing(null);
  };

  const deleteEvent = (id: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setMenuId(null);
    show('日程已删除');
  };

  const goToday = () => {
    setMonthOffset(0);
    setSelectedDay(24);
    show('已回到今天');
  };

  const field = 'liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white';

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-3 pb-1">
      {ToastEl}

      {/* 顶栏工具 — 单行 */}
      <div className="flex items-center justify-between gap-3 flex-nowrap shrink-0 min-w-0 overflow-x-auto">
        <div className="flex items-center gap-3 shrink-0">
          <div className="liquid-icon-well w-10 h-10 rounded-2xl flex items-center justify-center text-emerald-300">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold text-white tracking-tight whitespace-nowrap">日程与会议管理</h2>
            <p className="text-[11px] text-white/40 whitespace-nowrap">月 / 周 / 日视图 · 预约 · 编辑 · 筛选</p>
          </div>
        </div>

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

          <button
            onClick={() => openCreate()}
            className="h-9 px-3.5 rounded-full liquid-btn-primary text-[12px] font-bold flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            预约新日程
          </button>
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
                onClick={() => setMonthOffset((v) => v - 1)}
                className="p-1.5 rounded-lg hover:bg-white/5 hover:text-white"
                title="上一月"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={goToday} className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold border border-emerald-400/30">
                今天
              </button>
              <button
                onClick={() => setMonthOffset((v) => v + 1)}
                className="p-1.5 rounded-lg hover:bg-white/5 hover:text-white"
                title="下一月"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 pt-3 overflow-hidden">
            <ViewTransition viewKey={view} direction={viewDir} className="h-full min-h-0 overflow-auto">
              {view === 'month' ? (
                <MonthView
                  selectedDay={selectedDay}
                  events={filteredEvents}
                  onSelectDay={setSelectedDay}
                  onDayDoubleCreate={(d) => openCreate(d)}
                />
              ) : view === 'week' ? (
                <WeekView
                  selectedDay={selectedDay}
                  events={filteredEvents}
                  onSelectDay={setSelectedDay}
                  onSelectEvent={openEdit}
                />
              ) : (
                <DayView
                  day={selectedDay}
                  events={dayEvents}
                  onSelectEvent={openEdit}
                  onEmptySlot={(hour) => {
                    setForm((f) => ({
                      ...f,
                      day: selectedDay,
                      startHour: hour,
                      endHour: hour + 1,
                      time: `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`,
                    }));
                    setEditing(null);
                    setShowCreate(true);
                  }}
                />
              )}
            </ViewTransition>
          </div>
        </GlassCard>

        {/* 右侧详情 — 通高，底对齐操作 */}
        <GlassCard className="p-4 sm:p-5 flex flex-col min-h-0 h-full overflow-hidden">
          <div className="flex items-center justify-between shrink-0 pb-3 border-b border-white/[0.06]">
            <h3 className="text-[13px] font-bold text-white">5月{selectedDay}日 · 日程</h3>
            <span className="text-[11px] text-emerald-300 font-mono">{dayEvents.length} 项</span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 py-3">
            <ViewTransition viewKey={selectedDay} className="space-y-2.5">
            {dayEvents.length === 0 && (
              <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-[12px] text-white/35 gap-3">
                <p>当日暂无日程</p>
                <button onClick={() => openCreate(selectedDay)} className="h-9 px-3 rounded-full liquid-btn-ghost text-[11px] text-white/60">
                  + 在此日预约
                </button>
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
                      onClick={() => setMenuId(menuId === evt.id ? null : evt.id)}
                      className="p-1 rounded-lg text-white/35 hover:text-white hover:bg-white/5"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-white/45 space-y-1">
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-300" />{evt.time}</div>
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-white/30" />{evt.room}</div>
                  <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-white/30" />{evt.attendees.join('、')}</div>
                </div>
                <AnimatePresence>
                  {menuId === evt.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="absolute right-2 top-10 z-20 p-1 liquid-glass min-w-[120px]"
                    >
                      <button onClick={() => openEdit(evt)} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-white/70 hover:bg-white/5">
                        <Pencil className="w-3 h-3" /> 编辑
                      </button>
                      <button onClick={() => deleteEvent(evt.id)} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-rose-300 hover:bg-rose-500/10">
                        <Trash2 className="w-3 h-3" /> 删除
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            </ViewTransition>
          </div>

          <div className="pt-3 mt-auto border-t border-white/[0.06] shrink-0 flex gap-2">
            <button onClick={() => openCreate(selectedDay)} className="flex-1 h-10 rounded-full liquid-btn-primary text-[12px] font-bold flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              预约新日程
            </button>
          </div>
        </GlassCard>
      </div>

      {/* 预约/编辑 — 液态玻璃弹窗 */}
      <LiquidModal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setEditing(null);
        }}
        title={editing ? '编辑日程' : '预约新日程'}
        subtitle={editing ? `ID · ${editing.id}` : '高效排期 · 冲突预警'}
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
              {editing ? '保存修改' : '确认创建'}
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
              <label className="text-[11px] text-white/40 mb-1.5 block">日期 (5月)</label>
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
  selectedDay,
  events,
  onSelectDay,
  onDayDoubleCreate,
}: {
  selectedDay: number;
  events: ScheduleEvent[];
  onSelectDay: (d: number) => void;
  onDayDoubleCreate: (d: number) => void;
}) {
  // May 2025 starts on Thursday → pad 3 empty cells (Mon-start calendar: pad 3)
  const pad = 3;
  const cells = [...Array.from({ length: pad }, () => null), ...Array.from({ length: 31 }, (_, i) => i + 1)];

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
          const isToday = dayNum === 24;
          const dayEvts = events.filter((e) => e.day === dayNum);
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
  selectedDay,
  events,
  onSelectDay,
  onSelectEvent,
}: {
  selectedDay: number;
  events: ScheduleEvent[];
  onSelectDay: (d: number) => void;
  onSelectEvent: (e: ScheduleEvent) => void;
}) {
  return (
    <div className="h-full min-h-[420px] overflow-auto">
      <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))] gap-1 min-w-[640px]">
        <div />
        {WEEK_DAYS.map((d, i) => (
          <button
            key={d}
            onClick={() => onSelectDay(d)}
            className={`text-center py-2 rounded-xl text-[11px] font-semibold border ${
              selectedDay === d
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                : 'text-white/45 border-transparent hover:bg-white/[0.03]'
            }`}
          >
            <div>周{WEEKDAY_LABELS[i]}</div>
            <div className="font-mono text-[13px] mt-0.5">{d}</div>
          </button>
        ))}
        {HOURS.map((hour) => (
          <React.Fragment key={hour}>
            <div className="text-[10px] font-mono text-white/30 py-2 pr-1 text-right">{fmtHour(hour)}</div>
            {WEEK_DAYS.map((d) => {
              const cellEvents = events.filter((e) => e.day === d && Math.floor(e.startHour) === hour);
              return (
                <div
                  key={`${d}-${hour}`}
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
  day,
  events,
  onSelectEvent,
  onEmptySlot,
}: {
  day: number;
  events: ScheduleEvent[];
  onSelectEvent: (e: ScheduleEvent) => void;
  onEmptySlot: (hour: number) => void;
}) {
  return (
    <div className="h-full min-h-[420px] space-y-1 overflow-auto">
      <div className="text-[12px] text-white/40 mb-2">5月{day}日 · 时间轴（点击空白时段可预约）</div>
      {HOURS.map((hour) => {
        const slotEvents = events.filter((e) => Math.floor(e.startHour) === hour);
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
                  <div className="text-[10px] text-white/45 mt-0.5">{e.time} · {e.room}</div>
                </div>
              ))}
            </button>
          </div>
        );
      })}
    </div>
  );
}

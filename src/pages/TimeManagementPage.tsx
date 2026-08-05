import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useTimeTasks,
  useAddTimeTask,
  useUpdateTimeTask,
  useDeleteTimeTask,
} from '@/lib/queries';
import { TimeTask, TimeTaskPriority, TimeTaskStatus } from '@/types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  Timer,
  Bell,
  CheckCheck,
  Plus,
  AlignLeft,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { useToast } from '@/components/ui/Toast';
import { ViewTransition } from '@/components/ui/PageTransition';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import { formatDateFull, formatForInput } from '@/utils/date';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

export const TimeManagementPage: React.FC = () => {
  const { show, ToastEl } = useToast();
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [viewDir, setViewDir] = useState(1);
  const viewOrder = { month: 0, week: 1, day: 2 } as const;

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [priorityFilter, setPriorityFilter] = useState<'all' | TimeTaskPriority>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TimeTaskStatus>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<TimeTask | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const { data: tasks = [] } = useTimeTasks();
  const addMutation = useAddTimeTask();
  const updateMutation = useUpdateTimeTask();
  const deleteMutation = useDeleteTimeTask();

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

  const nowMs = Date.now();
  const [form, setForm] = useState({
    id: '',
    title: '',
    priority: '中' as TimeTaskPriority,
    status: '进行中' as TimeTaskStatus,
    description: '',
    deadlineStr: formatForInput(nowMs + 3600000 * 2),
    remindAtStr: formatForInput(nowMs + 3600000),
    completedAtStr: '',
  });

  const activeMenuTask = useMemo(() => tasks.find((t) => t.id === menuId), [tasks, menuId]);

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

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchPriority && matchStatus;
    });
  }, [tasks, priorityFilter, statusFilter]);

  const dayTasks = useMemo(() => {
    return filteredTasks
      .filter((t) => {
        const d = new Date(t.deadline);
        return (
          d.getFullYear() === currentDate.getFullYear() &&
          d.getMonth() === currentDate.getMonth() &&
          d.getDate() === currentDate.getDate()
        );
      })
      .sort((a, b) => a.deadline - b.deadline);
  }, [filteredTasks, currentDate]);

  const openCreate = (defaultDate = currentDate) => {
    setEditing(null);
    const deadlineMs = defaultDate.getTime();
    setForm({
      id: '',
      title: '',
      priority: '中',
      status: '进行中',
      description: '',
      deadlineStr: formatForInput(deadlineMs),
      remindAtStr: formatForInput(deadlineMs - 3600000),
      completedAtStr: '',
    });
    setShowCreate(true);
  };

  const openEdit = (task: TimeTask) => {
    setEditing(task);
    setForm({
      id: task.id,
      title: task.title,
      priority: task.priority,
      status: task.status,
      description: task.description,
      deadlineStr: formatForInput(task.deadline),
      remindAtStr: task.remindAt ? formatForInput(task.remindAt) : '',
      completedAtStr: task.completedAt ? formatForInput(task.completedAt) : '',
    });
    setShowCreate(true);
    setMenuId(null);
  };

  const toggleTaskStatus = (task: TimeTask) => {
    const isCompleted = task.status === '已完成';
    const nextStatus: TimeTaskStatus = isCompleted ? '进行中' : '已完成';
    const nextCompletedAt = isCompleted ? null : Date.now();

    updateMutation.mutate(
      {
        id: task.id,
        updates: {
          status: nextStatus,
          completedAt: nextCompletedAt,
        },
      },
      {
        onSuccess: () => {
          show(isCompleted ? '已切换为进行中' : '已标记为完成');
        },
      }
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const deadlineMs = form.deadlineStr ? new Date(form.deadlineStr).getTime() : Date.now();
    const remindAtMs = form.remindAtStr ? new Date(form.remindAtStr).getTime() : null;
    let completedAtMs = form.completedAtStr ? new Date(form.completedAtStr).getTime() : null;

    if (form.status === '已完成' && !completedAtMs) {
      completedAtMs = Date.now();
    } else if (form.status === '进行中') {
      completedAtMs = null;
    }

    const payload = {
      id: form.id || undefined,
      title: form.title.trim(),
      priority: form.priority,
      status: form.status,
      description: form.description.trim(),
      deadline: deadlineMs,
      remindAt: remindAtMs,
      completedAt: completedAtMs,
    };

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, updates: payload },
        {
          onSuccess: () => show('时间任务已更新'),
        }
      );
    } else {
      addMutation.mutate(payload, {
        onSuccess: () => show('时间任务已新建'),
      });
    }

    setCurrentDate(new Date(deadlineMs));
    setShowCreate(false);
    setEditing(null);
  };

  const deleteTask = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setMenuId(null);
        show('时间任务已删除');
      },
    });
  };

  const field = 'liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white';

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-3 pb-1">
      {ToastEl}

      {/* 顶栏工具 — 单行 */}
      <div className="flex items-center justify-between gap-3 flex-nowrap shrink-0 min-w-0">
        <div className="flex items-center gap-2 text-[12px] text-white/50">
          <Timer className="w-4 h-4 text-emerald-300" />
          <span>时间管理表 · 截止与提醒追踪</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => openCreate()}
            className="h-8 px-3 rounded-full liquid-btn-primary text-[11px] font-bold flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建时间任务</span>
          </button>

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
                    layoutId="time-view-pill"
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
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
            aria-label="状态筛选"
            options={[
              { value: 'all', label: '状态: 全部' },
              { value: '进行中', label: '进行中' },
              { value: '已完成', label: '已完成' },
            ]}
          />

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
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-3.5 items-stretch">
        <GlassCard className="p-4 sm:p-5 flex flex-col min-h-0 h-full overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] shrink-0 gap-2 flex-nowrap">
            <div className="text-[13px] font-bold text-white whitespace-nowrap">
              {monthLabel}
              <span className="text-white/35 font-medium ml-2 text-[11px]">
                · {view === 'month' ? '月度任务截止表' : view === 'week' ? '周度任务视图' : '日任务时间轴'}
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
                  tasks={filteredTasks}
                  onSelectDay={(d) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))}
                />
              ) : view === 'week' ? (
                <WeekView
                  currentDate={currentDate}
                  tasks={filteredTasks}
                  onSelectDate={(d) => setCurrentDate(d)}
                  onSelectTask={openEdit}
                />
              ) : (
                <DayView
                  currentDate={currentDate}
                  tasks={dayTasks}
                  onSelectTask={openEdit}
                  onEmptySlot={() => openCreate(currentDate)}
                />
              )}
            </ViewTransition>
          </div>
        </GlassCard>

        {/* 右侧详情 — 任务表8字段列表 */}
        <GlassCard className="p-4 sm:p-5 flex flex-col min-h-0 h-full overflow-hidden">
          <div className="flex items-center justify-between shrink-0 pb-3 border-b border-white/[0.06]">
            <h3 className="text-[13px] font-bold text-white">
              {currentDate.getMonth() + 1}月{currentDate.getDate()}日 · 任务列表
            </h3>
            <span className="text-[11px] text-emerald-300 font-mono">{dayTasks.length} 项</span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 py-3">
            <ViewTransition viewKey={currentDate.toISOString()} className="space-y-2.5">
              {dayTasks.length === 0 && (
                <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-[12px] text-white/35 gap-3">
                  <p>当日暂无时间任务</p>
                  <button
                    onClick={() => openCreate(currentDate)}
                    className="px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold border border-emerald-400/30 hover:bg-emerald-500/25 transition-colors"
                  >
                    + 添加任务
                  </button>
                </div>
              )}
              {dayTasks.map((t) => {
                const isCompleted = t.status === '已完成';
                return (
                  <div
                    key={t.id}
                    className={`p-3 rounded-2xl border transition-all space-y-2 relative group ${
                      isCompleted
                        ? 'bg-black/15 border-white/[0.04] opacity-75'
                        : 'bg-black/30 border-white/[0.08] hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleTaskStatus(t)}
                          className="mt-0.5 text-white/40 hover:text-emerald-400 transition-colors shrink-0"
                          title={isCompleted ? '设为进行中' : '标记为已完成'}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <button onClick={() => openEdit(t)} className="text-left min-w-0">
                          <div
                            className={`text-[12px] font-bold leading-snug break-words ${
                              isCompleted ? 'line-through text-white/40' : 'text-white'
                            }`}
                          >
                            {t.title}
                          </div>
                          <div className="text-[10px] text-white/30 font-mono mt-0.5">ID: {t.id}</div>
                        </button>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] border ${
                            t.priority === '高'
                              ? 'bg-rose-500/15 text-rose-300 border-rose-400/25'
                              : t.priority === '中'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-400/25'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (menuId === t.id) {
                              setMenuId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPos({
                                top: rect.bottom + 4,
                                right: Math.max(8, window.innerWidth - rect.right),
                              });
                              setMenuId(t.id);
                            }
                          }}
                          className="p-1 rounded-lg text-white/35 hover:text-white hover:bg-white/5 action-menu-trigger relative z-10 cursor-pointer"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {t.description && (
                      <p className="text-[11px] text-white/50 line-clamp-2 pl-6">{t.description}</p>
                    )}

                    <div className="pl-6 space-y-1 text-[10px] font-mono text-white/40">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>截止时间: {formatDateFull(t.deadline)}</span>
                      </div>
                      {t.remindAt && (
                        <div className="flex items-center gap-1.5">
                          <Bell className="w-3 h-3 text-amber-300" />
                          <span>提醒时间: {formatDateFull(t.remindAt)}</span>
                        </div>
                      )}
                      {t.completedAt && (
                        <div className="flex items-center gap-1.5">
                          <CheckCheck className="w-3 h-3 text-teal-300" />
                          <span>完成时间: {formatDateFull(t.completedAt)} ({t.completedAt}ms)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </ViewTransition>
          </div>
        </GlassCard>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {menuId !== null && activeMenuTask && (
              <motion.div
                key={activeMenuTask.id}
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
                className="p-1.5 liquid-glass min-w-[130px] action-menu-content shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
              >
                <button
                  onClick={() => {
                    setMenuId(null);
                    toggleTaskStatus(activeMenuTask);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-white/75 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  {activeMenuTask.status === '已完成' ? '标记为进行中' : '标记为已完成'}
                </button>
                <button
                  onClick={() => {
                    setMenuId(null);
                    openEdit(activeMenuTask);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-white/75 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-cyan-300" /> 编辑任务
                </button>
                <button
                  onClick={() => {
                    setMenuId(null);
                    deleteTask(activeMenuTask.id);
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

      {/* 编辑 / 新建 — 8 字段液态玻璃弹窗 */}
      <LiquidModal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setEditing(null);
        }}
        title={editing ? '编辑时间任务' : '新建时间任务'}
        subtitle={editing ? `ID · ${editing.id}` : '包含 ID、标题、优先级、状态、详情、截止/提醒/完成时间'}
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
            <button
              type="submit"
              form="time-task-form"
              className="h-10 px-5 rounded-full liquid-btn-primary text-[12px] font-bold"
            >
              {editing ? '保存修改' : '确认创建'}
            </button>
          </div>
        }
      >
        <form id="time-task-form" onSubmit={handleSave} className="space-y-3.5">
          {editing && (
            <div>
              <label className="text-[11px] text-white/40 mb-1.5 block font-mono">任务 ID</label>
              <input readOnly disabled className={`${field} opacity-50 font-mono`} value={form.id} />
            </div>
          )}

          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">
              任务标题 <span className="text-emerald-300">*</span>
            </label>
            <input
              required
              className={field}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="请输入时间任务标题"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/40 mb-1.5 block">优先级</label>
              <LiquidSelect
                value={form.priority}
                onChange={(v) => setForm({ ...form, priority: v as TimeTaskPriority })}
                options={[
                  { value: '高', label: '高' },
                  { value: '中', label: '中' },
                  { value: '低', label: '低' },
                ]}
              />
            </div>
            <div>
              <label className="text-[11px] text-white/40 mb-1.5 block">任务状态</label>
              <LiquidSelect
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as TimeTaskStatus })}
                options={[
                  { value: '进行中', label: '进行中' },
                  { value: '已完成', label: '已完成' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block flex items-center gap-1">
              <AlignLeft className="w-3 h-3" /> 任务详情
            </label>
            <textarea
              rows={3}
              className={`${field} resize-none`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="输入任务具体要求或详细说明..."
            />
          </div>

          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-300" /> 截止时间 <span className="text-emerald-300">*</span>
            </label>
            <input
              type="datetime-local"
              required
              className={field}
              value={form.deadlineStr}
              onChange={(e) => setForm({ ...form, deadlineStr: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/40 mb-1.5 block flex items-center gap-1">
                <Bell className="w-3 h-3 text-amber-300" /> 提醒时间
              </label>
              <input
                type="datetime-local"
                className={field}
                value={form.remindAtStr}
                onChange={(e) => setForm({ ...form, remindAtStr: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[11px] text-white/40 mb-1.5 block flex items-center gap-1">
                <CheckCheck className="w-3 h-3 text-teal-300" /> 完成时间 (毫秒时间戳)
              </label>
              <input
                type="datetime-local"
                className={field}
                value={form.completedAtStr}
                onChange={(e) => setForm({ ...form, completedAtStr: e.target.value })}
              />
            </div>
          </div>
        </form>
      </LiquidModal>
    </div>
  );
};

function MonthView({
  currentDate,
  tasks,
  onSelectDay,
}: {
  currentDate: Date;
  tasks: TimeTask[];
  onSelectDay: (d: number) => void;
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
          const dayTasks = tasks.filter((t) => {
            const ed = new Date(t.deadline);
            return ed.getFullYear() === year && ed.getMonth() === month && ed.getDate() === dayNum;
          });
          return (
            <button
              key={dayNum}
              onClick={() => onSelectDay(dayNum)}
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
                {dayTasks.slice(0, 2).map((t) => (
                  <div
                    key={t.id}
                    className={`px-1 py-0.5 rounded text-[9px] truncate border ${
                      t.status === '已完成'
                        ? 'bg-white/5 text-white/40 border-white/10 line-through'
                        : 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20'
                    }`}
                  >
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 2 && <div className="text-[9px] text-white/30">+{dayTasks.length - 2}</div>}
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
  tasks,
  onSelectDate,
  onSelectTask,
}: {
  currentDate: Date;
  tasks: TimeTask[];
  onSelectDate: (d: Date) => void;
  onSelectTask: (t: TimeTask) => void;
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
            <div className="text-[10px] font-mono text-white/30 py-2 pr-1 text-right">{String(hour).padStart(2, '0')}:00</div>
            {weekDays.map((dateObj) => {
              const cellTasks = tasks.filter((t) => {
                const ed = new Date(t.deadline);
                return (
                  ed.getFullYear() === dateObj.getFullYear() &&
                  ed.getMonth() === dateObj.getMonth() &&
                  ed.getDate() === dateObj.getDate() &&
                  ed.getHours() === hour
                );
              });
              return (
                <div
                  key={`${dateObj.toISOString()}-${hour}`}
                  className="min-h-[44px] border border-white/[0.04] rounded-lg bg-black/15 p-0.5 space-y-0.5"
                >
                  {cellTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className={`w-full text-left px-1.5 py-1 rounded-md text-[9px] border truncate hover:brightness-110 ${
                        t.status === '已完成'
                          ? 'bg-white/5 text-white/40 border-white/10 line-through'
                          : 'bg-emerald-500/20 text-emerald-100 border-emerald-400/25'
                      }`}
                    >
                      {t.title}
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
  tasks,
  onSelectTask,
  onEmptySlot,
}: {
  currentDate: Date;
  tasks: TimeTask[];
  onSelectTask: (t: TimeTask) => void;
  onEmptySlot: (hour: number) => void;
}) {
  return (
    <div className="h-full min-h-[420px] space-y-1 overflow-auto">
      <div className="text-[12px] text-white/40 mb-2">
        {currentDate.getMonth() + 1}月{currentDate.getDate()}日 · 截止任务轴（点击空白可新建）
      </div>
      {HOURS.map((hour) => {
        const slotTasks = tasks.filter((t) => new Date(t.deadline).getHours() === hour);
        return (
          <div key={hour} className="grid grid-cols-[56px_1fr] gap-2 items-stretch min-h-[52px]">
            <div className="text-[11px] font-mono text-white/35 pt-2 text-right">{String(hour).padStart(2, '0')}:00</div>
            <button
              type="button"
              onClick={() => {
                if (slotTasks.length === 0) onEmptySlot(hour);
              }}
              className="rounded-xl border border-white/[0.05] bg-black/20 p-1.5 text-left hover:border-emerald-400/30 transition-colors min-h-[52px]"
            >
              {slotTasks.length === 0 && (
                <span className="text-[10px] text-white/20 px-2">空闲 · 点击创建任务</span>
              )}
              {slotTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onSelectTask(t);
                  }}
                  className={`px-3 py-2 rounded-lg border mb-1 last:mb-0 cursor-pointer ${
                    t.status === '已完成'
                      ? 'bg-white/5 border-white/10 opacity-60'
                      : 'bg-gradient-to-r from-emerald-500/25 to-teal-500/15 border-emerald-400/30'
                  }`}
                >
                  <div className={`text-[12px] font-semibold ${t.status === '已完成' ? 'line-through text-white/50' : 'text-white'}`}>
                    {t.title}
                  </div>
                  <div className="text-[10px] text-white/45 mt-0.5 flex items-center gap-2">
                    <span>优先级: {t.priority}</span>
                    <span>状态: {t.status}</span>
                  </div>
                </div>
              ))}
            </button>
          </div>
        );
      })}
    </div>
  );
}

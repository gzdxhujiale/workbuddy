import React, { useMemo, useState, useEffect, useLayoutEffect, useRef } from 'react';
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
  Flag,
  Menu,
  Sparkles,
  Zap,
  CalendarDays,
  CalendarRange,
  Link2Off,
  X,
  Sun,
  Sunrise,
  CalendarPlus,
  Moon,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { useToast } from '@/components/ui/Toast';
import { ViewTransition } from '@/components/ui/PageTransition';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import { formatDateFull } from '@/utils/date';
import { DateTimePicker, DateAndReminderPickerModal } from '@/components/ui/DateTimePicker';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

export const TimeManagementPage: React.FC = () => {
  const { show, ToastEl } = useToast();
  const [view, setView] = useState<'month' | 'week' | 'day' | 'priority'>('month');
  const [viewDir, setViewDir] = useState(1);
  const viewOrder = { month: 0, week: 1, day: 2, priority: 3 } as const;

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [priorityFilter, setPriorityFilter] = useState<'all' | TimeTaskPriority>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TimeTaskStatus>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<TimeTask | null>(null);

  // Quick edit popover menu task (referencing Image 1 design)
  const [popoverTask, setPopoverTask] = useState<TimeTask | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  // Menu action state for context menu
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

  // Modal form state
  const [form, setForm] = useState<{
    id: string;
    title: string;
    priority: TimeTaskPriority;
    status: TimeTaskStatus;
    description: string;
    deadline: number | null;
    remindAt: number | null;
    completedAt: number | null;
  }>({
    id: '',
    title: '',
    priority: '中',
    status: '进行中',
    description: '',
    deadline: null,
    remindAt: null,
    completedAt: null,
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
        if (!t.deadline) return false;
        const d = new Date(t.deadline);
        return (
          d.getFullYear() === currentDate.getFullYear() &&
          d.getMonth() === currentDate.getMonth() &&
          d.getDate() === currentDate.getDate()
        );
      })
      .sort((a, b) => (a.deadline || 0) - (b.deadline || 0));
  }, [filteredTasks, currentDate]);

  const openCreate = (defaultDate?: Date) => {
    setEditing(null);
    setForm({
      id: '',
      title: '',
      priority: '中',
      status: '进行中',
      description: '',
      deadline: defaultDate ? defaultDate.getTime() : null, // 默认均可为空
      remindAt: null,
      completedAt: null,
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
      deadline: task.deadline,
      remindAt: task.remindAt,
      completedAt: task.completedAt,
    });
    setShowCreate(true);
    setMenuId(null);
  };

  const openQuickPopover = (task: TimeTask, e: React.MouseEvent) => {
    e.stopPropagation();
    if (popoverTask?.id === task.id) return; // 避免已打开同任务时重新触发动画闪烁

    const rect = e.currentTarget.getBoundingClientRect();
    const popoverWidth = 400;
    const popoverHeight = 260;
    let top = rect.bottom + 8;
    let left = rect.left;

    if (top + popoverHeight > window.innerHeight) {
      top = Math.max(12, rect.top - popoverHeight - 8);
    }
    if (left + popoverWidth > window.innerWidth) {
      left = Math.max(12, window.innerWidth - popoverWidth - 16);
    }

    setPopoverPos({ top, left });
    setPopoverTask(task);
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

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    let completedAtMs = form.completedAt;
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
      deadline: form.deadline,
      remindAt: form.remindAt,
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

    if (form.deadline) {
      setCurrentDate(new Date(form.deadline));
    }
    setShowCreate(false);
    setEditing(null);
  };

  const deleteTask = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setMenuId(null);
        if (popoverTask?.id === id) setPopoverTask(null);
        show('时间任务已删除');
      },
    });
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-3 pb-1">
      {ToastEl}

      {/* 顶栏工具 — 单行 */}
      <div className="flex items-center justify-between gap-3 flex-nowrap shrink-0 min-w-0">
        <div className="flex items-center gap-2 text-[12px] text-white/50">
          <Timer className="w-4 h-4 text-emerald-300" />
          <span>时间管理表 · 截止与提醒追踪</span>
        </div>

        {/* 导航与筛选工具组 (新建按钮放置在优先级的右边) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="liquid-pill p-1 flex items-center gap-0.5 whitespace-nowrap relative">
            {(['month', 'week', 'day', 'priority'] as const).map((v) => (
              <button
                key={v}
                onClick={() => {
                  setViewDir(viewOrder[v] >= viewOrder[view] ? 1 : -1);
                  setView(v);
                }}
                className={`relative px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap z-10 ${view === v ? 'text-white' : 'text-white/40 hover:text-white/75'
                  }`}
              >
                {view === v && (
                  <motion.span
                    layoutId="time-view-pill"
                    className="absolute inset-0 rounded-full bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  {v === 'month'
                    ? '月视图'
                    : v === 'week'
                      ? '周视图'
                      : v === 'day'
                        ? '日视图'
                        : '优先级视图'}
                </span>
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

          {/* 新建时间任务按钮位于优先级的右边 */}
          <button
            onClick={() => openCreate()}
            className="h-8 px-3.5 rounded-full liquid-btn-primary text-[11px] font-bold flex items-center gap-1.5 shadow-md ml-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建时间任务</span>
          </button>
        </div>
      </div>

      {/* 主体布局 */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-3.5 items-stretch">
        <GlassCard className="p-4 sm:p-5 flex flex-col min-h-0 h-full overflow-hidden">
          {view !== 'priority' && (
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
                <button
                  onClick={goToday}
                  className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold border border-emerald-400/30"
                >
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
          )}

          <div className="flex-1 min-h-0 pt-3 overflow-hidden">
            <ViewTransition viewKey={view} direction={viewDir} className="h-full min-h-0 overflow-auto">
              {view === 'month' ? (
                <MonthView
                  currentDate={currentDate}
                  tasks={filteredTasks}
                  onSelectDay={(d) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))}
                  onSelectTask={openEdit}
                />
              ) : view === 'week' ? (
                <WeekView
                  currentDate={currentDate}
                  tasks={filteredTasks}
                  onSelectDate={(d) => setCurrentDate(d)}
                  onSelectTask={openEdit}
                />
              ) : view === 'day' ? (
                <DayView
                  currentDate={currentDate}
                  tasks={dayTasks}
                  onSelectTask={openEdit}
                  onEmptySlot={() => openCreate(currentDate)}
                />
              ) : (
                <PriorityView
                  tasks={filteredTasks}
                  onTaskClick={(t, e) => openQuickPopover(t, e)}
                  onTaskEdit={(t) => openEdit(t)}
                  onToggleStatus={toggleTaskStatus}
                />
              )}
            </ViewTransition>
          </div>
        </GlassCard>

        {/* 右侧 任务列表概览 */}
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
                  <p>当日暂无具有截止时间的任务</p>
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
                    onClick={() => openEdit(t)}
                    className={`p-3 rounded-2xl border transition-all space-y-2 relative group cursor-pointer ${isCompleted
                      ? 'bg-black/15 border-white/[0.04] opacity-75'
                      : 'bg-black/30 border-white/[0.08] hover:border-emerald-500/40'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskStatus(t);
                          }}
                          className="mt-0.5 text-white/40 hover:text-emerald-400 transition-colors shrink-0"
                          title={isCompleted ? '设为进行中' : '标记为已完成'}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div className="text-left min-w-0">
                          <div
                            className={`text-[12px] font-bold leading-snug break-words ${isCompleted ? 'line-through text-white/40' : 'text-white'
                              }`}
                          >
                            {t.title}
                          </div>
                          <div className="text-[10px] text-white/30 font-mono mt-0.5">ID: {t.id}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] border ${t.priority === '高'
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
                        <span>截止时间: {t.deadline ? formatDateFull(t.deadline) : '未设置 (为空)'}</span>
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
                          <span>完成时间: {formatDateFull(t.completedAt)}</span>
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

      {/* 右键菜单 / 操作菜单 Context Menu Portal */}
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

      {/* Quick Edit Popover (Requirement 4 & Image 1 Design) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {popoverTask && (
              <QuickEditPopover
                task={tasks.find((t) => t.id === popoverTask.id) || popoverTask}
                pos={popoverPos}
                onClose={() => setPopoverTask(null)}
                onUpdate={(updates) => {
                  updateMutation.mutate({ id: popoverTask.id, updates });
                  show('任务已更新');
                }}
              />
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* 编辑 / 新建 — 时间任务弹窗 (LiquidModal) */}
      <LiquidModal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setEditing(null);
        }}
        title={editing ? '编辑时间任务' : '新建时间任务'}
        subtitle={editing ? `ID · ${editing.id}` : '截止与提醒时间默认可为空，完成时间由系统自动记录'}
        icon={<CalendarIcon className="w-5 h-5 text-emerald-400" />}
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
        <form id="time-task-form" onSubmit={handleSaveModal} className="space-y-3.5">
          {editing && (
            <div>
              <label className="text-[11px] text-white/40 mb-1.5 block font-mono">任务 ID</label>
              <input readOnly disabled className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white opacity-50 font-mono" value={form.id} />
            </div>
          )}

          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">
              任务标题 <span className="text-emerald-300">*</span>
            </label>
            <input
              required
              className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="准备做什么？"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/40 mb-1.5 block">优先级</label>
              <LiquidSelect
                value={form.priority}
                onChange={(v) => setForm({ ...form, priority: v as TimeTaskPriority })}
                options={[
                  { value: '高', label: '高优先级' },
                  { value: '中', label: '中优先级' },
                  { value: '低', label: '低优先级' },
                ]}
              />
            </div>
            <div>
              <label className="text-[11px] text-white/40 mb-1.5 block">任务状态</label>
              <LiquidSelect
                value={form.status}
                onChange={(v) => {
                  const nextStatus = v as TimeTaskStatus;
                  const nextCompletedAt = nextStatus === '已完成' ? (form.completedAt || Date.now()) : null;
                  setForm({ ...form, status: nextStatus, completedAt: nextCompletedAt });
                }}
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
              className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="输入任务具体要求或详细说明..."
            />
          </div>

          {/* 截止时间 (选择器) — 默认为空 */}
          <div>
            <DateTimePicker
              label="截止时间"
              value={form.deadline}
              onChange={(ts) => setForm({ ...form, deadline: ts })}
              placeholder="点击选择截止日期与时间"
              icon={<Clock className="w-3.5 h-3.5 text-emerald-400" />}
            />
          </div>

          {/* 提醒时间 (选择器) — 默认为空 */}
          <div>
            <DateTimePicker
              label="提醒时间"
              value={form.remindAt}
              onChange={(ts) => setForm({ ...form, remindAt: ts })}
              placeholder="点击选择提醒日期与时间"
              icon={<Bell className="w-3.5 h-3.5 text-amber-400" />}
            />
          </div>

          {/* 完成时间 (Requirement 2: 不可编辑，未完成时为空，完成时自动记录变更时间) */}
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block flex items-center gap-1">
              <CheckCheck className="w-3 h-3 text-teal-300" /> 完成时间
            </label>
            <div className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white/60 bg-black/30 border border-white/5 font-mono cursor-not-allowed select-none flex items-center justify-between">
              <span>
                {form.status === '已完成' && form.completedAt
                  ? formatDateFull(form.completedAt)
                  : '- - -'}
              </span>

            </div>
          </div>
        </form>
      </LiquidModal>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                视图组件定义                                  */
/* -------------------------------------------------------------------------- */

// 1. 月视图
function MonthView({
  currentDate,
  tasks,
  onSelectDay,
  onSelectTask,
}: {
  currentDate: Date;
  tasks: TimeTask[];
  onSelectDay: (d: number) => void;
  onSelectTask?: (t: TimeTask) => void;
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
            if (!t.deadline) return false;
            const ed = new Date(t.deadline);
            return ed.getFullYear() === year && ed.getMonth() === month && ed.getDate() === dayNum;
          });
          return (
            <button
              key={dayNum}
              onClick={() => onSelectDay(dayNum)}
              className={`min-h-[72px] rounded-xl p-2 border text-left flex flex-col gap-1 transition-all ${isSelected
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
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onSelectTask?.(t);
                    }}
                    className={`px-1 py-0.5 rounded text-[9px] truncate border cursor-pointer ${t.status === '已完成'
                      ? 'bg-white/5 text-white/40 border-white/10 line-through'
                      : 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20 hover:border-emerald-400/50'
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

// 2. 周视图
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
              className={`text-center py-2 rounded-xl text-[11px] font-semibold border ${isSelected
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
                if (!t.deadline) return false;
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
                      className={`w-full text-left px-1.5 py-1 rounded-md text-[9px] border truncate hover:brightness-110 ${t.status === '已完成'
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

// 3. 日视图
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
        const slotTasks = tasks.filter((t) => t.deadline && new Date(t.deadline).getHours() === hour);
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
                  className={`px-3 py-2 rounded-lg border mb-1 last:mb-0 cursor-pointer ${t.status === '已完成'
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

// 4. 新增: 优先级视图 (Requirement 4)
// 按 高 / 中 / 低 优先级划分为 3 列，每列内根据: 一天内、三天内、七天内、无日期 分类
function PriorityView({
  tasks,
  onTaskClick,
  onTaskEdit,
  onToggleStatus,
}: {
  tasks: TimeTask[];
  onTaskClick: (t: TimeTask, e: React.MouseEvent) => void;
  onTaskEdit: (t: TimeTask) => void;
  onToggleStatus: (t: TimeTask) => void;
}) {
  const priorities: TimeTaskPriority[] = ['高', '中', '低'];
  const now = Date.now();

  const categorizeTask = (t: TimeTask) => {
    if (!t.deadline) return 'noDate';
    const diffDays = (t.deadline - now) / (1000 * 3600 * 24);
    if (diffDays <= 1) return 'within1Day'; // 1天内 (包括已到期/今天)
    if (diffDays <= 3) return 'within3Days'; // 3天内
    if (diffDays <= 7) return 'within7Days'; // 7天内
    return 'within7Days'; // 超过7天亦计入此类
  };

  const categories = [
    { key: 'within1Day', label: '一天内', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-400/20' },
    { key: 'within3Days', label: '三天内', icon: CalendarDays, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-400/20' },
    { key: 'within7Days', label: '七天内', icon: CalendarRange, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-400/20' },
    { key: 'noDate', label: '无日期', icon: Link2Off, color: 'text-slate-400 bg-slate-500/10 border-slate-400/20' },
  ] as const;

  return (
    <div className="h-full min-h-[440px] grid grid-cols-1 md:grid-cols-3 gap-3 overflow-y-auto pr-1">
      {priorities.map((prio) => {
        const prioTasks = tasks.filter((t) => t.priority === prio);

        return (
          <div
            key={prio}
            className="flex flex-col rounded-2xl border border-white/[0.08] bg-black/25 p-3 min-h-0 overflow-hidden"
          >
            {/* 优先级列头 */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${prio === '高' ? 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : prio === '中' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                    }`}
                />
                <span className="text-[13px] font-bold text-white">{prio}优先级</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/50">
                {prioTasks.length} 项
              </span>
            </div>

            {/* 分类子容器 (无任务的分类不显示) */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-0.5">
              {prioTasks.length === 0 ? (
                <div className="h-full min-h-[140px] flex items-center justify-center text-[11px] text-white/30 border border-dashed border-white/[0.05] rounded-xl">
                  该优先级暂无任务
                </div>
              ) : (
                categories.map((cat) => {
                  const subTasks = prioTasks.filter((t) => categorizeTask(t) === cat.key);
                  if (subTasks.length === 0) return null; // 当分类无任务时不显示
                  const IconComp = cat.icon;

                  return (
                    <div key={cat.key} className="space-y-1.5">
                      <div className="flex items-center justify-between px-1 text-[11px]">
                        <div className="flex items-center gap-1.5 font-semibold text-white/70">
                          <IconComp className="w-3.5 h-3.5 text-white/50" />
                          <span>{cat.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-white/30">{subTasks.length}</span>
                      </div>

                      <div className="space-y-1.5 min-h-[32px]">
                        {subTasks.map((t) => {
                          const isCompleted = t.status === '已完成';

                          return (
                            <div
                              key={t.id}
                              onClick={(e) => onTaskClick(t, e)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative group ${isCompleted
                                ? 'bg-black/20 border-white/[0.04] opacity-60'
                                : 'bg-white/[0.03] border-white/[0.08] hover:border-emerald-400/40 hover:bg-white/[0.06]'
                                }`}
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="flex items-start gap-1.5 min-w-0">
                                  <button
                                    type="button"
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      onToggleStatus(t);
                                    }}
                                    className="mt-0.5 text-white/40 hover:text-emerald-400 transition-colors shrink-0"
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Circle className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <div className="min-w-0">
                                    <div
                                      className={`text-[12px] font-medium leading-snug break-words ${isCompleted ? 'line-through text-white/40' : 'text-white'
                                        }`}
                                    >
                                      {t.title}
                                    </div>
                                    {t.description && (
                                      <p className="text-[10px] text-white/40 line-clamp-1 mt-0.5">
                                        {t.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    onTaskEdit(t);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-white transition-opacity"
                                  title="编辑"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="mt-1.5 pt-1.5 border-t border-white/[0.04] flex items-center justify-between text-[9px] font-mono text-white/35">
                                <span>{t.deadline ? formatDateFull(t.deadline) : '无日期'}</span>
                                {t.remindAt && <Bell className="w-2.5 h-2.5 text-amber-400" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 5. 点击任务弹出的快捷编辑卡片 Popover (复刻 Humanmanual TaskQuickEdit 浮层，支持自动保存)
const QUADRANT_META: Record<TimeTaskPriority, { name: string; color: string }> = {
  高: { name: '高优先级 (重要且紧急)', color: '#f43f5e' },
  中: { name: '中优先级 (重要不紧急)', color: '#f59e0b' },
  低: { name: '低优先级 (不重要/顺延)', color: '#10b981' },
};

const L1_WIDTH = 400;
const L2_WIDTH = 316;
const L3_WIDTH = 288;
const MARGIN = 8;

function QuickEditPopover({
  task,
  pos,
  onClose,
  onUpdate,
}: {
  task: TimeTask;
  pos: { top: number; left: number };
  onClose: () => void;
  onUpdate: (updates: Partial<TimeTask>) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<TimeTaskPriority>(task.priority);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  // 拆解 deadline
  const splitDeadline = (deadlineTs?: number | null) => {
    if (!deadlineTs) return null;
    const d = new Date(deadlineTs);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const composeDeadline = (dateYMD: string): number => {
    const [y, m, d] = dateYMD.split('-').map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  };

  const initDate = splitDeadline(task.deadline);
  const [dateSel, setDateSel] = useState<string | null>(initDate);

  // 提醒配置
  const parseReminder = (deadlineTs: number | null, remindTs: number | null) => {
    if (!remindTs) return null;
    if (!deadlineTs) return { offsetDays: 0, time: '09:00', repeat: false };
    const diffMs = deadlineTs - remindTs;
    const offsetDays = Math.max(0, Math.round(diffMs / (1000 * 3600 * 24)));
    const rd = new Date(remindTs);
    const time = `${String(rd.getHours()).padStart(2, '0')}:${String(rd.getMinutes()).padStart(2, '0')}`;
    return { offsetDays, time, repeat: false };
  };

  const [appliedReminder, setAppliedReminder] = useState<{ offsetDays: number; time: string; repeat: boolean } | null>(
    () => parseReminder(task.deadline, task.remindAt)
  );

  // 监听 task 变化（解决编辑后再次打开或数据更新前端未刷新的问题）
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    const newDate = splitDeadline(task.deadline);
    setDateSel(newDate);
    setAppliedReminder(parseReminder(task.deadline, task.remindAt));
    lastSavedRef.current = {
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      deadline: task.deadline,
      remindAt: task.remindAt,
    };
  }, [task.id, task.title, task.description, task.priority, task.deadline, task.remindAt]);

  const calculateRemindAt = (deadlineDateYMD: string | null, offsetDays: number, timeString: string) => {
    if (!deadlineDateYMD) return null;
    const [y, m, d] = deadlineDateYMD.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d - offsetDays);
    const [h, min] = timeString.split(':').map(Number);
    targetDate.setHours(h || 9, min || 0, 0, 0);
    return targetDate.getTime();
  };

  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  const [viewYM, setViewYM] = useState(() => {
    const now = initDate ? new Date(initDate) : new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });

  const [dateOpen, setDateOpen] = useState(false);
  const [third, setThird] = useState<'remind' | null>(null);

  // 定位计算
  const popRef = useRef<HTMLDivElement>(null);
  const datePopRef = useRef<HTMLDivElement>(null);
  const dateFieldRef = useRef<HTMLButtonElement>(null);
  const remindRowRef = useRef<HTMLButtonElement>(null);
  const remindPopRef = useRef<HTMLDivElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [l1Pos, setL1Pos] = useState<{ top: number; left: number }>({ top: pos.top, left: pos.left });
  const [l2Pos, setL2Pos] = useState<{ top: number; left: number } | null>(null);
  const [l3Pos, setL3Pos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const h = popRef.current?.offsetHeight || 260;
    const left = Math.min(Math.max(pos.left, MARGIN), vw - L1_WIDTH - MARGIN);
    let top = Math.min(Math.max(pos.top, MARGIN), vh - h - MARGIN);
    setL1Pos({ top, left });
  }, [pos]);

  useLayoutEffect(() => {
    if (!dateOpen) {
      setL2Pos(null);
      return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const h = datePopRef.current?.offsetHeight || 320;
    let left = l1Pos.left - 12 - L2_WIDTH;
    if (left < MARGIN) {
      left = Math.min(l1Pos.left + L1_WIDTH + 12, vw - L2_WIDTH - MARGIN);
    }
    const top = Math.min(Math.max(l1Pos.top, MARGIN), vh - h - MARGIN);
    setL2Pos({ top, left });
  }, [dateOpen, l1Pos, viewYM]);

  useLayoutEffect(() => {
    if (!third) {
      setL3Pos(null);
      return;
    }
    const anchor = remindRowRef.current;
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const h = remindPopRef.current?.offsetHeight || 240;
    const left = Math.min(Math.max(r.left, MARGIN), vw - L3_WIDTH - MARGIN);
    const top = Math.min(Math.max(r.bottom - h, MARGIN), vh - h - MARGIN);
    setL3Pos({ top, left });
  }, [third]);

  // 自动保存驱动与去重控制
  const currentTaskStateRef = useRef({ title, description, priority, dateSel, appliedReminder });
  useEffect(() => {
    currentTaskStateRef.current = { title, description, priority, dateSel, appliedReminder };
  });

  const lastSavedRef = useRef<{
    title: string;
    description: string;
    priority: TimeTaskPriority;
    deadline: number | null;
    remindAt: number | null;
  }>({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    deadline: task.deadline,
    remindAt: task.remindAt,
  });

  const saveTaskUpdates = (overrides?: Partial<{ title: string; description: string; priority: TimeTaskPriority; dateSel: string | null; appliedReminder: any }>) => {
    const st = { ...currentTaskStateRef.current, ...overrides };
    const finalDeadline = st.dateSel ? composeDeadline(st.dateSel) : null;
    const finalRemindAt = st.appliedReminder ? calculateRemindAt(st.dateSel, st.appliedReminder.offsetDays, st.appliedReminder.time) : null;

    const newTitle = st.title.trim() || task.title;
    const newDesc = st.description.trim();

    const prev = lastSavedRef.current;
    if (
      prev.title === newTitle &&
      prev.description === newDesc &&
      prev.priority === st.priority &&
      prev.deadline === finalDeadline &&
      prev.remindAt === finalRemindAt
    ) {
      return; // 内容无变更，跳过静默保存请求
    }

    lastSavedRef.current = {
      title: newTitle,
      description: newDesc,
      priority: st.priority,
      deadline: finalDeadline,
      remindAt: finalRemindAt,
    };

    onUpdate({
      title: newTitle,
      description: newDesc,
      priority: st.priority,
      deadline: finalDeadline,
      remindAt: finalRemindAt,
    });
  };

  // 第三层草稿提醒状态
  const [draftOffset, setDraftOffset] = useState<number | null>(appliedReminder ? appliedReminder.offsetDays : null);
  const [draftTime, setDraftTime] = useState(appliedReminder?.time || '09:00');
  const [draftRepeat, setDraftRepeat] = useState(appliedReminder?.repeat || false);
  const [customMode, setCustomMode] = useState(false);

  const openRemind = () => {
    setDraftOffset(appliedReminder ? appliedReminder.offsetDays : null);
    setDraftTime(appliedReminder?.time || '09:00');
    setDraftRepeat(appliedReminder?.repeat || false);
    setCustomMode(!!appliedReminder && ![0, 1, 2, 3, 7].includes(appliedReminder.offsetDays));
    setThird('remind');
  };

  const saveRemind = () => {
    const next =
      draftOffset === null ? null : { offsetDays: draftOffset, time: draftTime || '09:00', repeat: draftRepeat };
    setAppliedReminder(next);
    setThird(null);
    saveTaskUpdates({ appliedReminder: next });
  };

  // 分层关闭
  const closeOneLayer = () => {
    if (third) {
      setThird(null);
      return;
    }
    if (dateOpen) {
      setDateOpen(false);
      return;
    }
    saveTaskUpdates();
    onClose();
  };

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!t || !document.body.contains(t)) return;

      // 1. 点击在第三层提醒设置弹窗内 -> 不收起
      if (remindPopRef.current?.contains(t)) return;

      // 2. 第三层开启中，但点击在第三层以外
      if (third) {
        setThird(null);
        if (datePopRef.current?.contains(t) || popRef.current?.contains(t) || dateFieldRef.current?.contains(t)) {
          return;
        }
      }

      // 3. 点击在第二层日期弹窗或日期按钮内 -> 不收起
      if (datePopRef.current?.contains(t) || dateFieldRef.current?.contains(t)) return;

      // 4. 第二层开启中，但点击在第二层以外
      if (dateOpen) {
        setDateOpen(false);
        if (popRef.current?.contains(t)) return; // 仅收起第二层，不关闭主浮层
      }

      // 5. 点击在第一层浮层内部 -> 绝不关闭主浮层！
      if (popRef.current?.contains(t)) return;

      // 6. 点击三层卡片全部以外的外部区域 -> 保存并关闭整体浮层
      saveTaskUpdates();
      onClose();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeOneLayer();
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [third, dateOpen]);

  // 顶部字段回显文本
  const fieldText = useMemo(() => {
    if (!dateSel) return '日期与提醒';
    const [y, m, d] = dateSel.split('-').map(Number);
    let text = `${m}月${d}日`;
    if (appliedReminder) {
      const label = appliedReminder.offsetDays === 0 ? '当天' : `提前${appliedReminder.offsetDays}天`;
      text += ` · ${label}提醒`;
    }
    return text;
  }, [dateSel, appliedReminder]);

  // 日历格子生成
  const calendarCells = useMemo(() => {
    const first = new Date(viewYM.y, viewYM.m, 1);
    const offset = (first.getDay() + 6) % 7;
    const startDate = new Date(viewYM.y, viewYM.m, 1 - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { ymd, label: d.getDate(), dim: d.getMonth() !== viewYM.m };
    });
  }, [viewYM]);

  const quickPick = (daysFromToday: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromToday);
    const ymd = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    setDateSel(ymd);
    setViewYM({ y: target.getFullYear(), m: target.getMonth() });
    saveTaskUpdates({ dateSel: ymd });
  };

  return createPortal(
    <>
      {/* ===== 第一层：任务快捷编辑浮层 (tqe-popover) ===== */}
      <div
        ref={popRef}
        className="tqe-popover"
        style={{ top: l1Pos.top, left: l1Pos.left, width: L1_WIDTH }}
      >
        <div className="tqe-toprow">
          <button
            ref={dateFieldRef}
            type="button"
            className={`tqe-date-field ${dateSel ? 'has-value' : ''}`}
            onClick={() => {
              setThird(null);
              setDateOpen((v) => !v);
            }}
          >
            <CalendarDays size={16} />
            <span className="txt">{fieldText}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              className="tqe-flag"
              title={`优先级: ${priority}`}
              style={{ color: QUADRANT_META[priority].color }}
              onClick={() => setShowPriorityMenu((v) => !v)}
            >
              <Flag size={16} fill="currentColor" />
            </button>

            {showPriorityMenu && (
              <div className="absolute right-0 top-8 z-20 p-1.5 rounded-xl bg-[#1c2430] border border-white/15 shadow-xl flex flex-col gap-1 w-32">
                {(['高', '中', '低'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPriority(p);
                      setShowPriorityMenu(false);
                      saveTaskUpdates({ priority: p });
                    }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] transition-colors ${
                      priority === p ? 'bg-white/15 font-bold' : 'hover:bg-white/10 text-white/70'
                    }`}
                    style={{ color: QUADRANT_META[p].color }}
                  >
                    <Flag size={14} fill="currentColor" />
                    <span>{p}优先级</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="tqe-body">
          <div className="tqe-title-row">
            <input
              className="tqe-title"
              type="text"
              placeholder="准备做什么？"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => saveTaskUpdates({ title })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveTaskUpdates({ title });
                  (e.currentTarget as HTMLInputElement).blur();
                }
              }}
            />
            <button
              type="button"
              className="tqe-desc-icon"
              title="聚焦任务描述"
              onClick={() => descTextareaRef.current?.focus()}
            >
              <AlignLeft size={16} />
            </button>
          </div>

          <div className="tqe-desc-editor">
            <textarea
              ref={descTextareaRef}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => saveTaskUpdates({ description })}
              placeholder="添加详细描述..."
            />
          </div>
        </div>
      </div>

      {/* ===== 第二层：日期与提醒 (tqe-date-popover) ===== */}
      {dateOpen && l2Pos && (
        <div
          ref={datePopRef}
          className="tqe-date-popover"
          style={{ top: l2Pos.top, left: l2Pos.left, width: L2_WIDTH }}
        >
          <div className="tqe-quick">
            <button type="button" title="今天" onClick={() => quickPick(0)}>
              <Sun size={18} className="text-amber-400" />
            </button>
            <button type="button" title="明天" onClick={() => quickPick(1)}>
              <Sunrise size={18} className="text-emerald-400" />
            </button>
            <button type="button" title="下周 (+7 天)" onClick={() => quickPick(7)}>
              <CalendarPlus size={18} className="text-cyan-400" />
            </button>
            <button type="button" title="清除日期" onClick={() => {
              setDateSel(null);
              setAppliedReminder(null);
              saveTaskUpdates({ dateSel: null, appliedReminder: null });
            }}>
              <Moon size={18} className="text-rose-400" />
            </button>
          </div>

          <div className="tqe-month">
            {viewYM.y}年{viewYM.m + 1}月
            <span className="nav">
              <button
                type="button"
                onClick={() => {
                  const prev = new Date(viewYM.y, viewYM.m - 1, 1);
                  setViewYM({ y: prev.getFullYear(), m: prev.getMonth() });
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setViewYM({ y: now.getFullYear(), m: now.getMonth() });
                }}
              >
                <Circle size={6} fill="currentColor" className="text-emerald-400" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = new Date(viewYM.y, viewYM.m + 1, 1);
                  setViewYM({ y: next.getFullYear(), m: next.getMonth() });
                }}
              >
                <ChevronRight size={14} />
              </button>
            </span>
          </div>

          <div className="tqe-grid">
            {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
              <span key={w} className="wd">{w}</span>
            ))}
            {calendarCells.map((cell) => (
              <button
                key={cell.ymd}
                type="button"
                className={
                  'day' +
                  (cell.dim ? ' dim' : '') +
                  (cell.ymd === dateSel ? ' sel' : '') +
                  (cell.ymd === todayStr && cell.ymd !== dateSel ? ' today' : '')
                }
                onClick={() => {
                  setDateSel(cell.ymd);
                  if (cell.dim) {
                    const d = new Date(cell.ymd);
                    setViewYM({ y: d.getFullYear(), m: d.getMonth() });
                  }
                  saveTaskUpdates({ dateSel: cell.ymd });
                }}
              >
                {cell.label}
              </button>
            ))}
          </div>

          <div className="tqe-rows">
            <button
              ref={remindRowRef}
              type="button"
              className="tqe-row"
              onClick={() => (third === 'remind' ? setThird(null) : openRemind())}
            >
              <Bell size={15} />
              提醒
              <span className={`val ${appliedReminder ? '' : 'empty'}`}>
                {appliedReminder ? (appliedReminder.offsetDays === 0 ? '当天' : `提前${appliedReminder.offsetDays}天`) : '未设置'}
              </span>
              <span className="chev">›</span>
            </button>
          </div>
        </div>
      )}

      {/* ===== 第三层：提醒设置 (tqe-remind-pop) ===== */}
      {third === 'remind' && l3Pos && (
        <div
          ref={remindPopRef}
          className="tqe-remind-pop"
          style={{ top: l3Pos.top, left: l3Pos.left, width: L3_WIDTH }}
        >
          {[0, 1, 2, 3, 7].map((off) => (
            <button
              key={off}
              type="button"
              className={`opt ${!customMode && draftOffset === off ? 'sel' : ''}`}
              onClick={() => {
                setCustomMode(false);
                setDraftOffset((prev) => (prev === off && !customMode ? null : off));
              }}
            >
              {off === 0 ? '当天' : `提前 ${off} 天`} <span className="at">({draftTime})</span>
            </button>
          ))}
          <button
            type="button"
            className={`opt ${customMode ? 'sel' : ''}`}
            onClick={() => {
              setCustomMode((v) => !v);
              setDraftOffset((prev) => (customMode ? null : prev ?? 0));
            }}
          >
            自定义
          </button>

          {customMode && (
            <div className="tqe-remind-custom">
              <label>
                提前
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={draftOffset ?? 0}
                  onChange={(e) => setDraftOffset(Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
                />
                天
              </label>
              <input
                type="time"
                value={draftTime}
                onChange={(e) => setDraftTime(e.target.value || '09:00')}
              />
            </div>
          )}

          <div className="tqe-remind-repeat">
            持续提醒
            <button
              type="button"
              className={`tqe-switch ${draftRepeat ? 'on' : ''}`}
              onClick={() => setDraftRepeat((v) => !v)}
            />
          </div>

          <div className="tqe-remind-actions">
            <button type="button" className="btn-cancel" onClick={() => setThird(null)}>取消</button>
            <button type="button" className="btn-save" onClick={saveRemind}>保存</button>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

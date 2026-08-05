import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Bell, Mail, Plus, ChevronDown, Command, FilePlus2, CalendarPlus, BookOpen, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/useUIStore';
import { useTasks } from '@/lib/queries';
import { NotificationsModal } from '@/components/modals/NotificationsModal';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { TitleTransition } from '@/components/ui/PageTransition';
import { clsx } from 'clsx';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  titleKey?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  title = '任务管理',
  subtitle = '高效规划 · 智能协同 · 结果驱动',
  titleKey = title,
}) => {
  const setIsNewTaskOpen = useUIStore((s) => s.setIsNewTaskOpen);
  const setIsCreateDocOpen = useUIStore((s) => s.setIsCreateDocOpen);
  const setIsCreateScheduleOpen = useUIStore((s) => s.setIsCreateScheduleOpen);
  const setIsInviteMemberOpen = useUIStore((s) => s.setIsInviteMemberOpen);
  const setSelectedTask = useUIStore((s) => s.setSelectedTask);
  const { data: tasks = [] } = useTasks();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMail, setShowMail] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [quickMsg, setQuickMsg] = useState('');

  const createBtnRef = useRef<HTMLDivElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const [createMenuPos, setCreateMenuPos] = useState({ top: 0, right: 0 });

  const updateCreateMenuPos = () => {
    if (createBtnRef.current) {
      const rect = createBtnRef.current.getBoundingClientRect();
      setCreateMenuPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  };

  useEffect(() => {
    if (!showCreateMenu) return;
    updateCreateMenuPos();

    const handleResizeOrScroll = () => updateCreateMenuPos();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        createBtnRef.current?.contains(target) ||
        createMenuRef.current?.contains(target)
      ) {
        return;
      }
      setShowCreateMenu(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCreateMenu(false);
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCreateMenu]);

  const searchResults = searchQuery
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const getActionConfig = () => {
    if (titleKey === 'knowledge') {
      return {
        label: '创建文档',
        onClick: () => setIsCreateDocOpen(true),
      };
    }
    if (titleKey === 'schedule') {
      return {
        label: '预约日程',
        onClick: () => setIsCreateScheduleOpen(true),
      };
    }
    if (titleKey === 'collaboration' || titleKey === 'team' || title === '团队协作') {
      return {
        label: '邀请新成员',
        onClick: () => setIsInviteMemberOpen(true),
      };
    }
    return {
      label: '新增任务',
      onClick: () => setIsNewTaskOpen(true),
    };
  };

  const actionConfig = getActionConfig();

  return (
    <>
      <header className="w-full flex items-center justify-between gap-3 sm:gap-4 shrink-0 select-none px-0.5">
        <div className="min-w-0 shrink-0 max-w-[min(28%,320px)] sm:max-w-[34%]">
          <TitleTransition titleKey={titleKey}>
            <h1 className="text-[20px] sm:text-[22px] font-bold text-white tracking-tight leading-none truncate">{title}</h1>
            <p className="text-[11px] text-white/35 font-medium mt-1 tracking-wide truncate">{subtitle}</p>
          </TitleTransition>
        </div>

        <div className="relative flex-1 max-w-[min(560px,42vw)] mx-auto hidden sm:block min-w-0">
          <div className="liquid-pill flex items-center h-10 px-3.5 gap-2">
            <Search className="w-3.5 h-3.5 text-white/35 shrink-0" />
            <input
              type="text"
              placeholder="搜索任务、项目或文件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-[12px] text-white/90 placeholder:text-white/30 min-w-0"
            />
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/35 font-mono shrink-0">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </div>

          <AnimatePresence>
            {searchQuery.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute top-full left-0 right-0 mt-2 p-2 liquid-glass z-50 max-h-64 overflow-y-auto space-y-1"
              >
                {searchResults.length > 0 ? (
                  searchResults.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTask(t);
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="text-[12px] font-semibold text-white">{t.title}</div>
                      <div className="text-[10px] font-mono text-emerald-300/80 mt-0.5">
                        {t.id} · {t.phase}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-white/35 text-[12px]">无匹配结果</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowNotifications(true)}
            className="liquid-btn-ghost w-9 h-9 rounded-full flex items-center justify-center text-white/55 hover:text-white relative"
            title="消息通知"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            )}
          </button>

          <button
            onClick={() => setShowMail(true)}
            className="liquid-btn-ghost w-9 h-9 rounded-full flex items-center justify-center text-white/55 hover:text-white"
            title="站内信"
          >
            <Mail className="w-4 h-4" />
          </button>

          <div className="relative flex items-center">
            <div
              ref={createBtnRef}
              className="liquid-btn-primary h-9 rounded-full text-[12px] font-bold flex items-center p-0 overflow-hidden shadow-lg"
            >
              <button
                type="button"
                onClick={actionConfig.onClick}
                className="h-full px-3.5 flex items-center gap-1.5 hover:bg-white/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">{actionConfig.label}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!showCreateMenu) {
                    updateCreateMenuPos();
                  }
                  setShowCreateMenu((v) => !v);
                }}
                className="h-full px-2 border-l border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                title="更多新建选项"
              >
                <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform duration-200', showCreateMenu && 'rotate-180')} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showCreateMenu && (
              <motion.div
                ref={createMenuRef}
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4 }}
                style={{
                  position: 'fixed',
                  top: createMenuPos.top,
                  right: createMenuPos.right,
                  zIndex: 100,
                }}
                className="w-48 p-1.5 liquid-glass space-y-0.5 shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
              >
                <button
                  onClick={() => {
                    setShowCreateMenu(false);
                    setIsNewTaskOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] text-white/75 hover:bg-white/5 hover:text-white"
                >
                  <FilePlus2 className="w-3.5 h-3.5 text-emerald-300" /> 新建任务
                </button>
                <button
                  onClick={() => {
                    setShowCreateMenu(false);
                    setIsCreateDocOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] text-white/75 hover:bg-white/5 hover:text-white"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-300" /> 创建文档
                </button>
                <button
                  onClick={() => {
                    setShowCreateMenu(false);
                    setIsCreateScheduleOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] text-white/75 hover:bg-white/5 hover:text-white"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-violet-300" /> 预约日程
                </button>
                <button
                  onClick={() => {
                    setShowCreateMenu(false);
                    setIsInviteMemberOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] text-white/75 hover:bg-white/5 hover:text-white"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-300" /> 邀请新成员
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      <AnimatePresence>
        {quickMsg && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 right-6 z-[90] px-4 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/35 text-emerald-100 text-[12px] backdrop-blur-xl"
          >
            {quickMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <NotificationsModal
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        onUnreadChange={setUnreadCount}
      />

      <LiquidModal
        open={showMail}
        onClose={() => setShowMail(false)}
        title="站内信"
        subtitle="协作消息与系统邮件"
        icon={<Mail className="w-5 h-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowMail(false)} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">关闭</button>
            <button
              onClick={() => {
                setQuickMsg('已全部标为已读');
                setShowMail(false);
                window.setTimeout(() => setQuickMsg(''), 1600);
              }}
              className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold"
            >
              全部已读
            </button>
          </div>
        }
      >
        <div className="space-y-2">
          {[
            { from: '系统', subject: 'Q2 里程碑进度周报已就绪', time: '今天 09:12', body: '本周吞吐 +12%，风险 2 项待处理，点击可查看完整报告。' },
            { from: 'Elena', subject: '请查收交互流程设计 v3', body: '已上传 Figma 链接与走查纪要，请在今日 18:00 前反馈。', time: '昨天 16:40' },
            { from: 'David', subject: 'CoverFlow 性能优化合并请求', body: 'MR !128 待你 Review，包含 will-change 与数量裁剪。', time: '昨天 11:05' },
          ].map((m) => (
            <button
              key={m.subject}
              type="button"
              onClick={() => setQuickMsg(`已打开邮件：${m.subject}`)}
              className="w-full text-left p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/12 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 text-[11px] text-white/35 mb-1">
                <span>{m.from}</span>
                <span className="font-mono">{m.time}</span>
              </div>
              <div className="text-[12px] font-medium text-white">{m.subject}</div>
              <p className="text-[11px] text-white/40 mt-1 line-clamp-2">{m.body}</p>
            </button>
          ))}
        </div>
      </LiquidModal>
    </>
  );
};

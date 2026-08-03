import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  BarChart3,
  FileText,
  Calendar,
  Users,
  Sparkles,
  BookOpen,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  UserCheck,
  LogOut,
  User,
} from 'lucide-react';
import { NavTab } from '@/types';
import { clsx } from 'clsx';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { useToast } from '@/components/ui/Toast';
import { useUIStore } from '@/store/useUIStore';
import { useWorkspaces, useAddWorkspace } from '@/lib/queries';

interface SidebarProps {
  onNewWorkspace?: () => void;
}

const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'tasks', label: '任务管理', icon: Target },
  { id: 'overview', label: '项目总览', icon: BarChart3 },
  { id: 'files', label: '文件归档', icon: FileText },
  { id: 'schedule', label: '日程管理', icon: Calendar },
  { id: 'collaboration', label: '团队协作', icon: Users },
  { id: 'analytics', label: '智能分析', icon: Sparkles, badge: 'AI' },
  { id: 'knowledge', label: '知识库', icon: BookOpen },
  { id: 'settings', label: '设置中心', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ onNewWorkspace }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.replace('/', '') || 'tasks';
  const { show, ToastEl } = useToast();
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);
  const { data: workspaces = [] } = useWorkspaces();
  const addWorkspaceMutation = useAddWorkspace();
  const currentWorkspace = useUIStore(s => s.currentWorkspace);
  const setCurrentWorkspace = useUIStore(s => s.setCurrentWorkspace);
  const [createWsOpen, setCreateWsOpen] = useState(false);
  const [wsName, setWsName] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState({ name: 'Brandon', role: '产品经理', email: 'brandon@wenxi.buddy' });

  const wsBtnRef = useRef<HTMLButtonElement>(null);
  const wsMenuRef = useRef<HTMLDivElement>(null);
  const [wsMenuPos, setWsMenuPos] = useState({ bottom: 0, left: 0, width: 0 });

  const updateWsMenuPos = () => {
    if (wsBtnRef.current) {
      const rect = wsBtnRef.current.getBoundingClientRect();
      setWsMenuPos({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (!workspaceExpanded) return;
    updateWsMenuPos();

    const handleResizeOrScroll = () => updateWsMenuPos();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        wsBtnRef.current?.contains(target) ||
        wsMenuRef.current?.contains(target)
      ) {
        return;
      }
      setWorkspaceExpanded(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWorkspaceExpanded(false);
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
  }, [workspaceExpanded]);

  const createWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    addWorkspaceMutation.mutate(wsName.trim(), {
      onSuccess: () => {
        setCurrentWorkspace(wsName.trim());
        setWsName('');
        setCreateWsOpen(false);
        onNewWorkspace?.();
        show(`工作区「${wsName.trim()}」已创建`);
      }
    });
  };

  return (
    <>
      {ToastEl}
      <aside className="liquid-glass liquid-nav-glass h-full w-full min-w-0 min-h-0 flex flex-col justify-between p-3 sm:p-3.5 select-none overflow-hidden">
        <div className="space-y-5 min-h-0 overflow-y-auto pr-0.5">
          <div className="flex items-center gap-2.5 px-1.5 pt-1">
            <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-500 flex items-center justify-center font-extrabold text-[#04120c] text-[13px] shadow-[0_0_24px_rgba(16,185,129,0.45)] border border-white/40">
              WB
            </div>
            <span className="text-[15px] font-bold text-white tracking-wide">WenXiBuddy</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  to={`/${item.id}`}
                  className={clsx(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-300 relative group',
                    isActive ? 'text-white font-semibold' : 'text-white/45 hover:text-white/80'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-liquid"
                      className="absolute inset-0 rounded-2xl liquid-glass-active"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  {!isActive && <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-white/[0.04]" />}
                  <span className="relative z-10 flex items-center gap-2.5">
                    <Icon className={clsx('w-[15px] h-[15px]', isActive ? 'text-emerald-300' : 'text-white/40 group-hover:text-white/70')} strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </span>
                  <span className="relative z-10 flex items-center gap-1">
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-400/15 text-emerald-300 border border-emerald-400/25">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-300/80" />}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2.5 pt-3 mt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between px-2 text-[11px] font-medium text-white/35">
            <span>我的工作区</span>
            <button
              onClick={() => setCreateWsOpen(true)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              title="新建工作区"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative">
            <button
              ref={wsBtnRef}
              onClick={() => {
                if (!workspaceExpanded) {
                  updateWsMenuPos();
                }
                setWorkspaceExpanded((v) => !v);
              }}
              className="w-full liquid-pill flex items-center justify-between px-3 py-2.5 text-[12px] font-medium text-white/85"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="truncate">{currentWorkspace}</span>
              </span>
              <ChevronDown className={clsx('w-3.5 h-3.5 text-white/40 transition-transform', workspaceExpanded && 'rotate-180')} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="w-full liquid-pill flex items-center justify-between px-2.5 py-2 hover:border-white/20 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full liquid-icon-well flex items-center justify-center text-[11px] font-bold text-white/90 shrink-0">
                {profile.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 text-left">
                <div className="text-[12px] font-semibold text-white leading-tight truncate">{profile.name}</div>
                <div className="text-[10px] text-white/35 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {profile.role}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
          </button>
        </div>
      </aside>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {workspaceExpanded && (
              <motion.div
                ref={wsMenuRef}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                style={{
                  position: 'fixed',
                  bottom: wsMenuPos.bottom,
                  left: wsMenuPos.left,
                  width: wsMenuPos.width,
                  zIndex: 100,
                }}
                className="p-1.5 liquid-glass space-y-0.5 shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
              >
                {workspaces.map((ws) => (
                  <button
                    key={ws}
                    type="button"
                    onClick={() => {
                      setCurrentWorkspace(ws);
                      setWorkspaceExpanded(false);
                      show(`已切换到「${ws}」`);
                    }}
                    className={clsx(
                      'w-full text-left px-3 py-2 rounded-xl text-[12px] flex items-center justify-between transition-colors',
                      currentWorkspace === ws ? 'bg-emerald-400/15 text-emerald-200' : 'text-white/60 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <span className="truncate">{ws}</span>
                    {currentWorkspace === ws && <UserCheck className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      <LiquidModal
        open={createWsOpen}
        onClose={() => setCreateWsOpen(false)}
        title="新建工作区"
        subtitle="为团队开辟独立协作空间"
        icon={<Plus className="w-5 h-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setCreateWsOpen(false)} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">取消</button>
            <button form="ws-form" type="submit" className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold">创建</button>
          </div>
        }
      >
        <form id="ws-form" onSubmit={createWorkspace} className="space-y-3">
          <input
            required
            value={wsName}
            onChange={(e) => setWsName(e.target.value)}
            placeholder="工作区名称"
            className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white"
          />
        </form>
      </LiquidModal>

      <LiquidModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="个人资料"
        subtitle={profile.email}
        icon={<User className="w-5 h-5" />}
        footer={
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                show('已退出登录（演示）');
                setProfileOpen(false);
              }}
              className="h-10 px-3 rounded-full liquid-btn-ghost text-[12px] text-rose-300 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> 退出
            </button>
            <div className="flex gap-2">
              <button onClick={() => setProfileOpen(false)} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">关闭</button>
              <button
                onClick={() => {
                  show('资料已保存');
                  setProfileOpen(false);
                }}
                className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold"
              >
                保存
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">显示名称</label>
            <input className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">职位</label>
            <input className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white" value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">邮箱</label>
            <input className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          </div>
          <button
            type="button"
            onClick={() => {
              setProfileOpen(false);
              navigate({ to: '/settings' });
            }}
            className="w-full h-10 rounded-full liquid-btn-ghost text-[12px] text-white/70"
          >
            打开设置中心
          </button>
        </div>
      </LiquidModal>
    </>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Search,
  Calendar,
  Edit3,
  MoreHorizontal,
  ArrowUpRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { springSoft } from '@/lib/motion';
import { LiquidModal } from '@/components/ui/LiquidModal';

export const AISmartDetailPanel: React.FC = () => {
  const { selectedTask, completeTask, setEditingTask } = useApp();
  const [showAiDetail, setShowAiDetail] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [toast, setToast] = useState('');
  const task = selectedTask;

  if (!task) {
    return (
      <div className="liquid-glass h-full p-5 flex items-center justify-center text-[12px] text-white/35">
        选择左侧任务以查看智能详情
      </div>
    );
  }

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2000);
  };

  return (
    <>
      {/* 通高 flex：内容可滚，底部操作条永远贴底 → 与时间线下沿对齐 */}
      <motion.div
        className="liquid-glass h-full min-h-0 p-4 sm:p-5 flex flex-col overflow-hidden relative z-10"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={springSoft}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(3px)' }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col h-full min-h-0"
          >
            {/* 可滚动主体 */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <h3 className="text-[13px] font-bold text-white tracking-wide">智能详情</h3>
                </div>
                <button
                  onClick={() => flash(`已聚焦搜索：${task.id}`)}
                  className="liquid-btn-ghost w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white"
                  title="搜索此任务"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="text-[11px] font-mono text-white/35 tracking-wider">{task.id}</div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-[18px] font-bold text-white tracking-tight leading-snug">{task.title}</h2>
                  <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                    {task.priority === '高' ? '高优先级' : task.priority}
                  </span>
                </div>
                <p className="text-[12px] text-white/55 leading-relaxed p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                  {task.description || '暂无详细描述信息。'}
                </p>
              </div>

              <div className="mt-5 space-y-3 text-[12px]">
                <Meta label="负责人">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full liquid-icon-well text-[9px] font-bold flex items-center justify-center">
                      {task.assignee?.avatar || 'BR'}
                    </span>
                    <span className="text-white/85 font-medium">{task.assignee?.name}</span>
                  </span>
                </Meta>
                <Meta label="所属项目">
                  <span className="flex items-center gap-1.5 text-white/85 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    {task.project}
                  </span>
                </Meta>
                <Meta label="截止时间">
                  <span className="flex items-center gap-1.5 font-mono text-white/70">
                    <Calendar className="w-3.5 h-3.5 text-white/35" />
                    {task.deadline}
                  </span>
                </Meta>
                <Meta label="当前状态">
                  <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {task.status}
                  </span>
                </Meta>
                <Meta label="优先级">
                  <span className="flex items-center gap-1.5 text-rose-300 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    {task.priority}
                  </span>
                </Meta>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-white/35 pt-0.5">标签</span>
                  <div className="flex flex-wrap justify-end gap-1.5 max-w-[210px]">
                    {task.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.04] border border-white/10 text-white/60">
                        {tag}
                      </span>
                    ))}
                    <button
                      onClick={() => setEditingTask(task)}
                      className="px-1.5 py-0.5 rounded-md border border-dashed border-white/15 text-white/35 text-[10px] hover:text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3.5 rounded-2xl bg-black/25 border border-white/[0.07] space-y-2.5 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-400/10 blur-2xl rounded-full pointer-events-none" />
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-white relative z-10">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  AI 助手建议
                </div>
                <ul className="space-y-2 text-[11px] text-white/60 relative z-10">
                  {(task.aiSuggestions?.length
                    ? task.aiSuggestions
                    : ['建议关联相似历史评审文档 3 份', '检测到潜在风险：需求范围可能变更']
                  ).map((sug, i) => (
                    <li key={i} className="flex gap-1.5 leading-relaxed">
                      <span className="text-emerald-400">•</span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setShowAiDetail(true)}
                  className="w-full mt-1 py-2 rounded-xl liquid-btn-ghost text-[11px] font-medium text-white/70 flex items-center justify-center gap-1 relative z-10"
                >
                  查看建议详情
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/35" />
                </button>
              </div>
            </div>

            {/* 底部操作条：始终贴底，与项目时间线下沿对齐 */}
            <div className="pt-3 mt-auto border-t border-white/[0.06] flex items-center gap-2 shrink-0 relative z-20">
              <button
                onClick={() => setEditingTask(task)}
                className="flex-1 h-10 rounded-full liquid-btn-ghost text-[12px] font-semibold text-white/80 flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-white/40" />
                编辑任务
              </button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  completeTask(task.id);
                  flash('任务已标记完成');
                }}
                className="flex-[1.35] h-10 rounded-full liquid-btn-primary text-[12px] font-bold flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.75]" />
                {task.status === '已完成' ? '已完成' : '完成任务'}
              </motion.button>
              <div className="relative">
                <button
                  onClick={() => setShowMore((v) => !v)}
                  className="w-10 h-10 rounded-full liquid-btn-ghost flex items-center justify-center text-white/40 hover:text-white"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showMore && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      className="absolute bottom-full right-0 mb-2 w-40 p-1.5 liquid-glass z-30 space-y-0.5"
                    >
                      {[
                        {
                          label: '复制任务 ID',
                          action: () => {
                            navigator.clipboard?.writeText(task.id);
                            flash('已复制任务 ID');
                          },
                        },
                        { label: '编辑任务', action: () => setEditingTask(task) },
                        { label: '标记延期', action: () => flash('已标记为延期（演示）') },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            item.action();
                            setShowMore(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-[11px] text-white/70 hover:bg-white/5 hover:text-white"
                        >
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute left-4 right-4 bottom-[4.5rem] z-20 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-[11px] text-emerald-200 text-center backdrop-blur-xl"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <LiquidModal
        open={showAiDetail}
        onClose={() => setShowAiDetail(false)}
        title="AI 建议详情"
        subtitle={task.id}
        icon={<Sparkles className="w-5 h-5" />}
        footer={
          <div className="flex justify-end">
            <button onClick={() => setShowAiDetail(false)} className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold">
              知道了
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-[12px] text-white/65 leading-relaxed">
          {(task.aiSuggestions?.length
            ? task.aiSuggestions
            : ['建议关联相似历史评审文档 3 份', '检测到潜在风险：需求范围可能变更']
          ).map((s, i) => (
            <div key={i} className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-emerald-300 font-semibold mb-1">建议 {i + 1}</div>
              <p>{s}</p>
              <p className="text-[11px] text-white/35 mt-2">置信度 {(92 - i * 7).toFixed(0)}% · 基于历史任务流转</p>
            </div>
          ))}
        </div>
      </LiquidModal>
    </>
  );
};

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/35">{label}</span>
      {children}
    </div>
  );
}

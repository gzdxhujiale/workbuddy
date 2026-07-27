import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { springSoft } from '@/lib/motion';
import { LiquidModal } from '@/components/ui/LiquidModal';

export const KPICardsRow: React.FC<{ onCardClick?: (t: string) => void }> = ({ onCardClick }) => {
  const { tasks, setSelectedTask } = useApp();
  const liveCompleted = tasks.filter((t) => t.status === '已完成').length;
  const [open, setOpen] = useState<string | null>(null);

  const cards = [
    { title: '今日待办', count: 12, unit: '项任务', tip: '较昨日', delta: '↑ 20%', up: true, icon: ClipboardList, overdue: false, filter: 'all' as const },
    { title: '进行中', count: 28, unit: '项任务', tip: '较昨日', delta: '↑ 8%', up: true, icon: Activity, overdue: false, filter: '进行中' as const },
    { title: '已完成', count: 56 + liveCompleted, unit: '项任务', tip: '较昨日', delta: '↑ 15%', up: true, icon: CheckCircle2, overdue: false, filter: '已完成' as const },
    { title: '逾期任务', count: 3, unit: '项任务', tip: '较昨日', delta: '↓ 40%', up: false, icon: AlertCircle, overdue: true, filter: '已延期' as const },
  ];

  const list =
    open === '今日待办'
      ? tasks
      : open === '进行中'
        ? tasks.filter((t) => t.status === '进行中')
        : open === '已完成'
          ? tasks.filter((t) => t.status === '已完成')
          : open === '逾期任务'
            ? tasks.filter((t) => t.status === '已延期' || t.priority === '高')
            : [];

  return (
    <>
      <div className="kpi-row">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.title}
              type="button"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...springSoft, delay: i * 0.05 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.985 }}
              onClick={() => {
                onCardClick?.(card.title);
                setOpen(card.title);
              }}
              className={`liquid-glass text-left p-3.5 flex items-center justify-between gap-3 min-h-[88px] ${
                card.overdue ? 'shadow-[0_0_28px_rgba(244,63,94,0.12)]' : ''
              }`}
            >
              <div className="min-w-0 space-y-1">
                <div className="text-[12px] text-white/45 font-medium">{card.title}</div>
                <div className="flex items-baseline gap-1.5">
                  <motion.span
                    key={card.count}
                    initial={{ opacity: 0.4, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[28px] font-extrabold text-white leading-none tracking-tight tabular-nums"
                  >
                    {card.count}
                  </motion.span>
                  <span className="text-[11px] text-white/35">{card.unit}</span>
                </div>
                <div className="text-[11px] flex items-center gap-1 pt-0.5">
                  <span className="text-white/30">{card.tip}</span>
                  <span className={card.up ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>{card.delta}</span>
                </div>
              </div>

              <motion.div
                whileHover={{ rotate: card.overdue ? -8 : 6, scale: 1.05 }}
                className={`liquid-icon-well w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  card.overdue ? 'text-rose-400 border-rose-400/30 shadow-[0_0_18px_rgba(244,63,94,0.25)]' : 'text-white/75'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={1.6} />
              </motion.div>
            </motion.button>
          );
        })}
      </div>

      <LiquidModal
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ?? ''}
        subtitle="点击任务可定位到智能详情"
        icon={<Activity className="w-5 h-5" />}
        footer={
          <div className="flex justify-end">
            <button onClick={() => setOpen(null)} className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold">关闭</button>
          </div>
        }
      >
        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {list.length === 0 && <div className="py-8 text-center text-[12px] text-white/35">当前列表为空（演示基线数字含历史任务）</div>}
          {list.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setSelectedTask(t);
                setOpen(null);
              }}
              className="w-full text-left p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-400/25"
            >
              <div className="text-[12px] font-semibold text-white">{t.title}</div>
              <div className="text-[10px] font-mono text-white/35 mt-1">{t.id} · {t.status} · {t.priority}</div>
            </button>
          ))}
        </div>
      </LiquidModal>
    </>
  );
};

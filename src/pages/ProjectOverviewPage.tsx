import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, CheckCircle2, AlertTriangle, Users, Zap, ShieldCheck, PieChart, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { useToast } from '@/components/ui/Toast';
import { springSoft } from '@/lib/motion';
import { ViewTransition } from '@/components/ui/PageTransition';

const modules = [
  { name: '需求与规格定义', progress: 95, color: 'bg-emerald-500' },
  { name: 'UI / UX 交互图纸', progress: 88, color: 'bg-teal-400' },
  { name: '前端 Glass UI 组件库', progress: 90, color: 'bg-cyan-400' },
  { name: '后端 GraphQL 服务', progress: 82, color: 'bg-indigo-400' },
  { name: 'AI 引擎与推演服务', progress: 75, color: 'bg-purple-400' },
];

export const ProjectOverviewPage: React.FC = () => {
  const { show, ToastEl } = useToast();
  const [selectedModule, setSelectedModule] = useState<(typeof modules)[0] | null>(null);
  const [tab, setTab] = useState<'health' | 'risk' | 'team'>('health');

  return (
    <div className="w-full min-h-full space-y-4 pb-4">
      {ToastEl}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springSoft}
        className="liquid-glass p-5 sm:p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-16 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              WenXiBuddy 2.0 旗舰版
            </div>
            <h2 className="text-[22px] font-extrabold text-white tracking-tight">项目整体健康度: 94 / 100</h2>
            <p className="text-[12px] text-white/50 max-w-xl leading-relaxed">
              当前研发进度符合 Q2 预期，需求收敛率 92%，测试通过率 98.5%，按期交付概率极高。
            </p>
            <div className="flex gap-2 pt-1">
              {(['health', 'risk', 'team'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                    tab === t
                      ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30'
                      : 'liquid-btn-ghost text-white/45 border-transparent'
                  }`}
                >
                  {t === 'health' ? '健康度' : t === 'risk' ? '风险' : '团队'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-[28px] font-extrabold text-emerald-300 font-mono">87.5%</div>
              <div className="text-[11px] text-white/40">总体完成度</div>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className="w-[72px] h-[72px] rounded-full border-4 border-emerald-400/80 border-t-transparent flex items-center justify-center font-extrabold text-sm text-white shadow-[0_0_24px_rgba(16,185,129,0.35)]"
            >
              Q2
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { title: '里程碑节点', value: '14 / 16', tip: '已完成 87.5%', icon: CheckCircle2, color: 'text-emerald-300' },
          { title: '研发代码提交', value: '1,248', tip: '较上周 +18%', icon: Zap, color: 'text-cyan-300' },
          { title: '团队成员负荷', value: '82%', tip: '处于健康区间', icon: Users, color: 'text-violet-300' },
          { title: '潜在阻塞点', value: '2 项', tip: '已安排 AI 跟进', icon: AlertTriangle, color: 'text-rose-300' },
        ].map((c, i) => (
          <motion.button
            key={c.title}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, ...springSoft }}
            whileHover={{ y: -2 }}
            onClick={() => show(`已打开：${c.title}`)}
            className="liquid-glass liquid-glass-hover p-4 text-left space-y-2"
          >
            <div className="flex items-center justify-between text-[11px] text-white/40">
              <span>{c.title}</span>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div className="text-[22px] font-extrabold text-white">{c.value}</div>
            <div className={`text-[11px] font-medium ${c.color}`}>{c.tip}</div>
          </motion.button>
        ))}
      </div>

      <ViewTransition viewKey={tab}>
      {tab === 'health' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard className="p-5 space-y-4">
            <h3 className="text-[13px] font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-300" />
              模块进度看板
            </h3>
            <div className="space-y-3">
              {modules.map((item, idx) => (
                <button
                  key={item.name}
                  onClick={() => setSelectedModule(item)}
                  className="w-full text-left space-y-1.5 group"
                >
                  <div className="flex justify-between text-[12px] text-white/70 group-hover:text-white">
                    <span className="flex items-center gap-1">
                      {item.name}
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </span>
                    <span className="font-mono text-emerald-300 font-bold">{item.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ delay: 0.05 * idx, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5 space-y-4">
            <h3 className="text-[13px] font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-300" />
              团队资源投入占比
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { role: '前端研发', count: '6 人', ratio: '35%', ring: 'border-emerald-400/50 text-emerald-200' },
                { role: '后端与云架构', count: '5 人', ratio: '29%', ring: 'border-cyan-400/50 text-cyan-200' },
                { role: 'AI 算法专家', count: '3 人', ratio: '18%', ring: 'border-violet-400/50 text-violet-200' },
                { role: 'UI/UX 体验设计', count: '3 人', ratio: '18%', ring: 'border-amber-400/50 text-amber-200' },
              ].map((r) => (
                <button
                  key={r.role}
                  onClick={() => show(`${r.role}：${r.count} · 占比 ${r.ratio}`)}
                  className={`p-3 rounded-2xl bg-black/25 border text-left hover:bg-white/[0.04] transition-colors ${r.ring}`}
                >
                  <div className="text-[11px] text-white/40">{r.role}</div>
                  <div className="text-[18px] font-bold text-white mt-1">{r.count}</div>
                  <div className="text-[10px] font-mono opacity-80 mt-0.5">占比 {r.ratio}</div>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === 'risk' && (
        <GlassCard className="p-5 space-y-3">
          <h3 className="text-[13px] font-bold text-white">风险清单</h3>
          {[
            { title: '需求范围蔓延', level: '高', desc: 'WXB-2025-001 新增 4 项次要功能' },
            { title: '设计交付时延', level: '中', desc: '原型评审节点可能延后 0.5 天' },
          ].map((r) => (
            <button
              key={r.title}
              onClick={() => show(`已创建风险跟进：${r.title}`)}
              className="w-full text-left p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-rose-400/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-white">{r.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-400/30">{r.level}</span>
              </div>
              <p className="text-[11px] text-white/45 mt-1">{r.desc}</p>
            </button>
          ))}
        </GlassCard>
      )}

      {tab === 'team' && (
        <GlassCard className="p-5">
          <h3 className="text-[13px] font-bold text-white mb-3">核心成员负荷</h3>
          <div className="space-y-2">
            {['Brandon 85%', 'David 92%', 'Elena 78%', 'Alex 80%'].map((row) => (
              <button
                key={row}
                onClick={() => show(`查看成员：${row}`)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-[12px] text-white/70 hover:text-white"
              >
                <span>{row.split(' ')[0]}</span>
                <span className="font-mono text-emerald-300">{row.split(' ')[1]}</span>
              </button>
            ))}
          </div>
        </GlassCard>
      )}
      </ViewTransition>

      <LiquidModal
        open={!!selectedModule}
        onClose={() => setSelectedModule(null)}
        title={selectedModule?.name ?? ''}
        subtitle="模块详情"
        icon={<BarChart3 className="w-5 h-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setSelectedModule(null)} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">关闭</button>
            <button
              onClick={() => {
                show(`已订阅模块进度：${selectedModule?.name}`);
                setSelectedModule(null);
              }}
              className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold"
            >
              订阅进度
            </button>
          </div>
        }
      >
        {selectedModule && (
          <div className="space-y-3 text-[12px] text-white/65">
            <p>当前完成度 <span className="text-emerald-300 font-mono font-bold">{selectedModule.progress}%</span></p>
            <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/10">
              <div className={`h-full ${selectedModule.color}`} style={{ width: `${selectedModule.progress}%` }} />
            </div>
            <p>点击「订阅进度」后，该模块变更将推送到消息中心。</p>
          </div>
        )}
      </LiquidModal>
    </div>
  );
};

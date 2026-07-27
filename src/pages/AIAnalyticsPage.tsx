import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Zap,
  TrendingUp,
  AlertTriangle,
  Brain,
  Activity,
  Users,
  Target,
  Clock,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Filter,
  ChevronRight,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { useToast } from '@/components/ui/Toast';
import { springSoft } from '@/lib/motion';
import { ViewTransition } from '@/components/ui/PageTransition';

type Range = '7d' | '30d' | 'q2';

export const AIAnalyticsPage: React.FC = () => {
  const { show, ToastEl } = useToast();
  const [range, setRange] = useState<Range>('7d');
  const [detail, setDetail] = useState<{ title: string; body: string; actions?: string[] } | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);

  const bars = useMemo(() => {
    if (range === '7d') return [40, 65, 55, 80, 95, 85, 110];
    if (range === '30d') return [32, 48, 60, 52, 70, 88, 76, 90, 84, 95, 100, 92];
    return [50, 62, 70, 78, 85, 90, 96];
  }, [range]);

  const kpis = [
    { label: '综合效率', value: '+34.2%', tip: '较上周期', icon: TrendingUp, color: 'text-emerald-300' },
    { label: '平均交付周期', value: '4.2 天', tip: '↓ 0.8 天', icon: Clock, color: 'text-cyan-300' },
    { label: '瓶颈阶段', value: '需求→设计', tip: '占比 28%', icon: Target, color: 'text-amber-300' },
    { label: 'AI 采纳率', value: '76%', tip: '本周建议', icon: Brain, color: 'text-violet-300' },
  ];

  const suggestions = [
    { title: '需求文档自动关联历史标准', gain: '+12% 速度', body: '可自动将 3 份相近项目的 UI 规则注入 PRD 校验器，减少重复对齐。', actions: ['启用自动关联', '查看匹配文档'] },
    { title: '优化开发阶段并行粒度', gain: '+8% 吞吐', body: '建议将 3D Stack Deck 模块拆分为两个独立 CI 管道，降低主分支阻塞。', actions: ['生成拆分方案', '通知前端组'] },
    { title: '评审会时长短于行业基准', gain: '+6% 质量', body: '当前评审均值 48 分钟，建议引入会前 AI 摘要，把讨论聚焦到风险点。', actions: ['开启会前摘要'] },
  ];

  const risks = [
    { title: '需求范围蔓延风险', level: '高', body: 'WXB-2025-001 增加 4 项次要功能，建议重估截止时间并拆分里程碑。', score: 86 },
    { title: '跨部门协同时延', level: '中', body: '设计稿交付测试节点比计划拖延 0.5 天，已提示相关负责人。', score: 62 },
    { title: 'CoverFlow 大屏性能', level: '中', body: '高 DPR 设备上 3D 堆叠可能掉帧，建议启用 will-change 与数量裁剪。', score: 55 },
  ];

  const members = [
    { name: 'Brandon', role: '产品', load: 85, output: 92 },
    { name: 'David', role: '前端', load: 92, output: 88 },
    { name: 'Elena', role: '设计', load: 78, output: 90 },
    { name: 'Sarah', role: '研究', load: 60, output: 74 },
    { name: 'Alex', role: '产品', load: 80, output: 81 },
    { name: 'Michael', role: '后端', load: 88, output: 86 },
  ];

  const funnel = [
    { stage: '需求评审', count: 18, rate: 100 },
    { stage: '产品设计', count: 14, rate: 78 },
    { stage: '开发实现', count: 11, rate: 61 },
    { stage: '测试验证', count: 8, rate: 44 },
    { stage: '已发布', count: 6, rate: 33 },
  ];

  const recompute = () => {
    setRecomputing(true);
    show('AI 全量重算中…');
    window.setTimeout(() => {
      setRecomputing(false);
      show('重算完成 · 模型版本 wenxi-reasoner-3');
    }, 1200);
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-3.5 pb-1">
      {ToastEl}

      {/* Header — 单行工具 */}
      <div className="flex items-center justify-between gap-3 flex-nowrap shrink-0 min-w-0 overflow-x-auto">
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <div className="liquid-icon-well w-10 h-10 rounded-2xl flex items-center justify-center text-violet-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold text-white tracking-tight whitespace-nowrap">智能分析</h2>
            <p className="text-[11px] text-white/40 whitespace-nowrap truncate">AI 效能推演 · 链路瓶颈 · 风险与成员矩阵</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div className="liquid-pill p-1 flex items-center gap-0.5 whitespace-nowrap">
            {([
              ['7d', '近 7 天'],
              ['30d', '近 30 天'],
              ['q2', 'Q2 累计'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setRange(id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                  range === id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/75'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => show('分析报告已导出 CSV（演示）')} className="liquid-pill h-9 px-3 text-[11px] text-white/60 flex items-center gap-1.5 whitespace-nowrap">
            <Download className="w-3.5 h-3.5" /> 导出
          </button>
          <button
            onClick={recompute}
            disabled={recomputing}
            className="h-9 px-3.5 rounded-full liquid-btn-primary text-[12px] font-bold flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recomputing ? 'animate-spin' : ''}`} />
            {recomputing ? '重算中' : '立即重算'}
          </button>
        </div>
      </div>

      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springSoft}
        className="liquid-glass p-4 sm:p-5 relative overflow-hidden shrink-0"
      >
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-violet-500/15 blur-3xl rounded-full pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-400/30 text-violet-200 text-[11px] font-semibold">
              <Flame className="w-3.5 h-3.5" />
              AI 智能效能引擎 3.0 · {range === '7d' ? '近 7 天' : range === '30d' ? '近 30 天' : 'Q2'}
            </div>
            <h3 className="text-[22px] font-extrabold text-white tracking-tight">团队综合效率提高 34.2%</h3>
            <p className="text-[12px] text-white/50 max-w-2xl leading-relaxed">
              基于 12,000+ 次任务流转推演：瓶颈集中于「需求评审 → 原型设计」过渡。点击卡片可展开完整建议并采纳。
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-400/25 text-center shrink-0 min-w-[120px]">
            <Brain className={`w-10 h-10 text-violet-300 mx-auto mb-1 ${recomputing ? 'animate-pulse' : ''}`} />
            <div className="text-[11px] font-mono text-violet-200 font-bold">{recomputing ? '推理重算中' : 'AI 实时在线'}</div>
          </div>
        </div>
      </motion.div>

      {/* KPI + 主体随 range 切换带动效 */}
      <ViewTransition viewKey={range} className="flex flex-col gap-3.5 flex-1 min-h-0">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
        {kpis.map((k, i) => (
          <motion.button
            key={k.label}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, ...springSoft }}
            whileHover={{ y: -2 }}
            onClick={() => setDetail({ title: k.label, body: `${k.value}（${k.tip}）。可下钻查看分阶段贡献与异常波动。` })}
            className="liquid-glass liquid-glass-hover p-4 text-left space-y-1"
          >
            <div className="flex items-center justify-between text-[11px] text-white/40">
              <span>{k.label}</span>
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <div className="text-[22px] font-extrabold text-white tracking-tight">{k.value}</div>
            <div className={`text-[11px] font-medium ${k.color}`}>{k.tip}</div>
          </motion.button>
        ))}
      </div>

      {/* Main grids — fill remaining height */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-3 gap-3.5 overflow-y-auto xl:overflow-hidden">
        {/* 提效建议 */}
        <GlassCard className="p-4 sm:p-5 space-y-3 min-h-0 xl:overflow-y-auto" glowColor="purple">
          <h3 className="text-[13px] font-bold text-white flex items-center gap-2 shrink-0">
            <Zap className="w-4 h-4 text-violet-300" />
            智能提效建议
          </h3>
          <div className="space-y-2.5">
            {suggestions.map((item) => (
              <button
                key={item.title}
                onClick={() => setDetail({ title: item.title, body: item.body, actions: item.actions })}
                className="w-full text-left p-3 rounded-xl bg-black/25 border border-white/[0.05] hover:border-violet-400/30 transition-colors space-y-1.5"
              >
                <div className="font-bold text-white text-[12px] flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">{item.title}</span>
                  <span className="text-emerald-300 font-mono text-[10px] shrink-0">{item.gain}</span>
                </div>
                <p className="text-[11px] text-white/40 line-clamp-2">{item.body}</p>
                <span className="text-[10px] text-violet-300 inline-flex items-center gap-0.5">
                  查看详情 <ChevronRight className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* 吞吐趋势 */}
        <GlassCard className="p-4 sm:p-5 space-y-3 min-h-0 flex flex-col" glowColor="emerald">
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-[13px] font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              吞吐量趋势
            </h3>
            <span className="text-[10px] text-white/35 font-mono">{bars.length} pts</span>
          </div>
          <div className="flex-1 min-h-[180px] flex items-end justify-between gap-1.5 px-1">
            {bars.map((h, i) => (
              <button
                key={i}
                onClick={() => show(`采样点 #${i + 1} 吞吐指数：${h}`)}
                className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end"
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min(100, (h / 120) * 100)}%` }}
                  transition={{ delay: i * 0.03, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full max-h-full rounded-t-lg bg-gradient-to-t from-emerald-700 to-teal-300 shadow-[0_0_12px_rgba(16,185,129,0.22)] group-hover:brightness-125 min-h-[8px]"
                />
                <span className="text-[9px] font-mono text-white/30">{i + 1}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 shrink-0">
            {[
              { l: '峰值', v: `${Math.max(...bars)}` },
              { l: '均值', v: `${Math.round(bars.reduce((a, b) => a + b, 0) / bars.length)}` },
              { l: '波动', v: '±12%' },
            ].map((x) => (
              <div key={x.l} className="p-2 rounded-xl bg-black/25 border border-white/[0.05] text-center">
                <div className="text-[10px] text-white/35">{x.l}</div>
                <div className="text-[13px] font-bold text-white font-mono">{x.v}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* 风险 */}
        <GlassCard className="p-4 sm:p-5 space-y-3 min-h-0 xl:overflow-y-auto" glowColor="red">
          <h3 className="text-[13px] font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-300" />
            风险排查矩阵
          </h3>
          <div className="space-y-2.5">
            {risks.map((r) => (
              <button
                key={r.title}
                onClick={() => setDetail({ title: r.title, body: r.body, actions: ['创建跟进任务', '通知负责人'] })}
                className={`w-full text-left p-3 rounded-xl border space-y-1.5 ${
                  r.level === '高'
                    ? 'bg-rose-500/10 border-rose-400/25'
                    : 'bg-amber-500/10 border-amber-400/25'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white text-[12px]">{r.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/30 text-white/70 border border-white/10">
                    {r.level} · {r.score}
                  </span>
                </div>
                <p className="text-[11px] text-white/55 line-clamp-2">{r.body}</p>
                <div className="h-1.5 rounded-full bg-black/40 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${r.level === '高' ? 'bg-rose-400' : 'bg-amber-400'}`}
                    style={{ width: `${r.score}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Bottom row: funnel + members */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5 shrink-0 min-h-[200px]">
        <GlassCard className="p-4 sm:p-5 space-y-3">
          <h3 className="text-[13px] font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-300" />
            交付漏斗
          </h3>
          <div className="space-y-2.5">
            {funnel.map((f, i) => (
              <button
                key={f.stage}
                onClick={() => show(`${f.stage}：${f.count} 项 · 转化 ${f.rate}%`)}
                className="w-full text-left space-y-1"
              >
                <div className="flex justify-between text-[11px] text-white/55">
                  <span>{f.stage}</span>
                  <span className="font-mono text-cyan-300">{f.count} · {f.rate}%</span>
                </div>
                <div className="h-2 rounded-full bg-black/35 border border-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${f.rate}%` }}
                    transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                  />
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5 space-y-3">
          <h3 className="text-[13px] font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-300" />
            成员效能矩阵
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {members.map((m) => (
              <button
                key={m.name}
                onClick={() => setSelectedMember(m.name)}
                className="p-3 rounded-xl bg-black/25 border border-white/[0.05] text-left hover:border-emerald-400/30 transition-colors"
              >
                <div className="text-[12px] font-bold text-white">{m.name}</div>
                <div className="text-[10px] text-white/35 mb-2">{m.role}</div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-amber-300">负荷 {m.load}%</span>
                  <span className="text-emerald-300">产出 {m.output}</span>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>
      </ViewTransition>

      <LiquidModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title ?? ''}
        subtitle="AI 分析详情"
        icon={<Sparkles className="w-5 h-5" />}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={() => setDetail(null)} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">
              关闭
            </button>
            {(detail?.actions ?? ['采纳建议']).map((a) => (
              <button
                key={a}
                onClick={() => {
                  show(`已执行：${a}`);
                  setDetail(null);
                }}
                className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold"
              >
                {a}
              </button>
            ))}
          </div>
        }
      >
        <p className="text-[13px] text-white/65 leading-relaxed">{detail?.body}</p>
      </LiquidModal>

      <LiquidModal
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title={selectedMember ? `${selectedMember} · 效能详情` : ''}
        subtitle="成员下钻"
        icon={<Users className="w-5 h-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setSelectedMember(null)} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">关闭</button>
            <button
              onClick={() => {
                show(`已向 ${selectedMember} 发送协同提醒`);
                setSelectedMember(null);
              }}
              className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold"
            >
              发送提醒
            </button>
          </div>
        }
      >
        {selectedMember && (
          <div className="space-y-3 text-[12px] text-white/65">
            <p>近周期负荷与产出分布如下（演示数据）。</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-black/25 border border-white/10">
                <div className="text-white/40 text-[11px]">在办任务</div>
                <div className="text-[18px] font-bold text-white font-mono mt-1">
                  {members.find((m) => m.name === selectedMember)?.load ? Math.round((members.find((m) => m.name === selectedMember)!.load / 10)) : 0} 项
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/25 border border-white/10">
                <div className="text-white/40 text-[11px]">效能分</div>
                <div className="text-[18px] font-bold text-emerald-300 font-mono mt-1">
                  {members.find((m) => m.name === selectedMember)?.output}
                </div>
              </div>
            </div>
          </div>
        )}
      </LiquidModal>
    </div>
  );
};

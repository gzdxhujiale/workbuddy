import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiquidSelect } from '@/components/ui/LiquidSelect';

interface ProjectTimelineProps {
  onSelectTask?: (taskTitle: string) => void;
}

/** 用「从 5 月 1 日起的序号」统一表达跨月日期：5.x => x，6.x => 31+x */
const toSerial = (month: 5 | 6, day: number) => (month === 5 ? day : 31 + day);

type Scale = '周' | '双周' | '月';

const TASKS = [
  {
    phase: '需求评审',
    title: '需求评审会',
    start: toSerial(5, 18),
    end: toSerial(5, 24),
    range: '5.18 - 5.24',
    tone: 'muted' as const,
  },
  {
    phase: '产品设计',
    title: '交互流程设计',
    start: toSerial(5, 22),
    end: toSerial(6, 5),
    range: '5.22 - 6.05',
    tone: 'soft' as const,
  },
  {
    phase: '开发实现',
    title: '核心功能开发',
    start: toSerial(5, 25),
    end: toSerial(6, 15),
    range: '5.25 - 6.15',
    tone: 'neon' as const,
  },
  {
    phase: '测试验证',
    title: '测试验证',
    start: toSerial(6, 10),
    end: toSerial(6, 20),
    range: '6.10 - 6.20',
    tone: 'ghost' as const,
  },
];

const TODAY = toSerial(5, 24);

/** 生成连续日期轴（序号数组） */
function buildAxis(windowStart: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => windowStart + i);
}

function serialToLabel(serial: number): number {
  // 显示用日号：1–31 为五月，32+ 为六月
  return serial <= 31 ? serial : serial - 31;
}

function barLayout(start: number, end: number, axisStart: number, axisCount: number) {
  const a0 = axisStart;
  const a1 = axisStart + axisCount; // exclusive end of visible window in serial space (approx day steps)
  // axis is consecutive serials of length axisCount
  const visibleStart = Math.max(start, a0);
  const visibleEnd = Math.min(end, a0 + axisCount - 1);
  if (visibleEnd < a0 || visibleStart > a0 + axisCount - 1) {
    return null; // fully outside
  }
  const left = ((visibleStart - a0) / axisCount) * 100;
  const width = ((visibleEnd - visibleStart + 1) / axisCount) * 100;
  return {
    left: `${Math.max(0, left)}%`,
    width: `${Math.max(width, 100 / axisCount)}%`,
  };
}

const toneClass: Record<(typeof TASKS)[number]['tone'], string> = {
  muted: 'bg-white/[0.10] border-white/15 text-white/80',
  soft: 'bg-emerald-400/15 border-emerald-400/35 text-emerald-50',
  neon: 'bg-gradient-to-r from-emerald-400 to-teal-500 border-emerald-200/50 text-[#04120c] font-bold shadow-[0_0_22px_rgba(16,185,129,0.45)]',
  ghost: 'bg-white/[0.05] border-white/10 text-white/45',
};

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ onSelectTask }) => {
  const [scale, setScale] = useState<Scale>('周');
  /** 窗口起点序号：默认 5.18 */
  const [windowStart, setWindowStart] = useState(toSerial(5, 18));
  const [flashToday, setFlashToday] = useState(false);
  const [activeBar, setActiveBar] = useState<string | null>('核心功能开发');
  const [selectedDay, setSelectedDay] = useState(TODAY);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const axisCount = scale === '周' ? 24 : scale === '双周' ? 28 : 31;

  const axis = useMemo(() => buildAxis(windowStart, axisCount), [windowStart, axisCount]);

  const todayIndex = axis.indexOf(TODAY);
  const hasToday = todayIndex >= 0;

  const monthLabel = useMemo(() => {
    const startMonth = windowStart <= 31 ? 5 : 6;
    const endSerial = windowStart + axisCount - 1;
    const endMonth = endSerial <= 31 ? 5 : 6;
    if (startMonth === endMonth) return `2025年${startMonth}月`;
    return `2025年${startMonth}–${endMonth}月`;
  }, [windowStart, axisCount]);

  const jumpToday = () => {
    setFlashToday(true);
    // 周视图：让 24 落在偏左（与设计稿一致，从 18 起）
    if (scale === '周') setWindowStart(toSerial(5, 18));
    else if (scale === '双周') setWindowStart(toSerial(5, 14));
    else setWindowStart(toSerial(5, 1));
    setSelectedDay(TODAY);
    scrollerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
    window.setTimeout(() => setFlashToday(false), 900);
  };

  const shiftWindow = (dir: -1 | 1) => {
    const step = scale === '周' ? 7 : scale === '双周' ? 14 : 30;
    setWindowStart((s) => Math.max(1, s + dir * step));
  };

  // 切换尺度时尽量保持今天或当前窗可见
  useEffect(() => {
    if (scale === '周') setWindowStart(toSerial(5, 18));
    if (scale === '双周') setWindowStart(toSerial(5, 11));
    if (scale === '月') setWindowStart(toSerial(5, 1));
  }, [scale]);

  return (
    <div className="liquid-glass p-3.5 sm:p-4 overflow-hidden">
      {/* 顶栏：单行 */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-1 border-b border-white/[0.06] flex-nowrap min-w-0">
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <h3 className="text-[13px] font-bold text-white whitespace-nowrap">项目时间线</h3>
          </div>
          <div className="liquid-pill px-2.5 py-1 text-[11px] text-white/55 flex items-center gap-1.5 whitespace-nowrap">
            <Calendar className="w-3 h-3 text-emerald-300" />
            {monthLabel}
          </div>
          <div className="hidden sm:flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => shiftWindow(-1)}
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
              title="向前"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => shiftWindow(1)}
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
              title="向后"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <LiquidSelect
            variant="pill"
            value={scale}
            onChange={(v) => setScale(v as Scale)}
            aria-label="时间尺度"
            options={[
              { value: '周', label: '周视图' },
              { value: '双周', label: '双周视图' },
              { value: '月', label: '月视图' },
            ]}
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={jumpToday}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap transition-colors ${
              flashToday
                ? 'bg-emerald-400 text-[#04120c] border-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.55)]'
                : 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30 hover:bg-emerald-400/25'
            }`}
          >
            今天
          </motion.button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-none" ref={scrollerRef}>
        <div className="min-w-[760px]">
          {/* 表头：阶段 + 日期 —— 与下方行同一套列宽，保证对齐 */}
          <div
            className="grid items-center text-[11px] pb-2 gap-0"
            style={{ gridTemplateColumns: `88px repeat(${axisCount}, minmax(0, 1fr))` }}
          >
            <div className="text-white/30 pl-1">阶段</div>
            {axis.map((serial, idx) => {
              const d = serialToLabel(serial);
              const isToday = serial === TODAY;
              const isSelected = serial === selectedDay;
              const isJune = serial > 31;
              return (
                <button
                  key={`h-${serial}-${idx}`}
                  type="button"
                  onClick={() => setSelectedDay(serial)}
                  className="flex justify-center py-0.5"
                >
                  {isToday ? (
                    <motion.span
                      layout
                      animate={{ scale: flashToday ? 1.12 : 1 }}
                      className="w-6 h-6 rounded-full bg-emerald-400 text-[#04120c] font-bold flex items-center justify-center text-[11px] shadow-[0_0_14px_rgba(52,211,153,0.75)]"
                    >
                      {d}
                    </motion.span>
                  ) : (
                    <span
                      className={`text-[10px] font-mono transition-colors ${
                        isSelected ? 'text-emerald-300' : isJune ? 'text-white/25' : 'text-white/40'
                      } hover:text-white/70`}
                    >
                      {d}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 行：同一 grid，甘特条画在日期列合成的 track 上 */}
          <div className="relative space-y-2">
            {/* 今日竖线：只画在日期轨道上，与表头 24 圆心对齐 */}
            {hasToday && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{
                  // 88px 阶段列 + today 单元格中心
                  left: `calc(88px + (100% - 88px) * ${(todayIndex + 0.5) / axisCount})`,
                  width: 1,
                  background:
                    'linear-gradient(to bottom, rgba(52,211,153,0.95), rgba(52,211,153,0.2), transparent)',
                  boxShadow: '0 0 10px rgba(52,211,153,0.75)',
                }}
              />
            )}

            <AnimatePresence mode="popLayout">
              {TASKS.map((row) => {
                const layout = barLayout(row.start, row.end, windowStart, axisCount);
                return (
                  <motion.div
                    key={row.phase}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid items-center text-[11px] gap-0"
                    style={{ gridTemplateColumns: `88px repeat(${axisCount}, minmax(0, 1fr))` }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveBar(row.title);
                        onSelectTask?.(row.title);
                      }}
                      className="text-white/50 font-medium flex items-center gap-1.5 pr-2 truncate text-left hover:text-white pl-1"
                    >
                      <span className="w-1 h-1 rounded-full bg-white/35 shrink-0" />
                      <span className="truncate">{row.phase}</span>
                    </button>

                    {/* 日期轨道：跨所有日期列 */}
                    <div
                      ref={row.phase === TASKS[0].phase ? trackRef : undefined}
                      className="relative h-7 rounded-full bg-black/30 border border-white/[0.05]"
                      style={{ gridColumn: `2 / span ${axisCount}` }}
                    >
                      {layout && (
                        <motion.button
                          type="button"
                          layout
                          initial={false}
                          animate={{ left: layout.left, width: layout.width, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                          whileHover={{ scale: 1.012, y: -0.5 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            setActiveBar(row.title);
                            onSelectTask?.(row.title);
                          }}
                          className={`absolute top-1 bottom-1 rounded-full border px-2.5 sm:px-3 flex items-center justify-between gap-2 text-[10px] cursor-pointer overflow-hidden ${
                            toneClass[row.tone]
                          } ${activeBar === row.title ? 'ring-1 ring-emerald-300/40' : ''}`}
                          style={{ left: layout.left, width: layout.width }}
                          title={`${row.title} · ${row.range}`}
                        >
                          <span className="truncate font-medium">{row.title}</span>
                          <span className="font-mono opacity-80 shrink-0 hidden sm:inline text-[9px]">{row.range}</span>
                        </motion.button>
                      )}
                      {!layout && (
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white/20">
                          不在当前视野
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

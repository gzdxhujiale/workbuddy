import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Palette,
  Sparkles,
  CheckCircle2,
  Bell,
  Shield,
  User,
  Monitor,
  Keyboard,
  Database,
  Lock,
  Mail,
  RefreshCw,
  Download,
  Trash2,
  Cpu,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/ui/Toast';
import { springSoft } from '@/lib/motion';
import { ViewTransition } from '@/components/ui/PageTransition';
import { LiquidSelect } from '@/components/ui/LiquidSelect';

type SettingsTab = 'appearance' | 'ai' | 'notify' | 'account' | 'privacy' | 'system';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'appearance', label: '外观主题', icon: Palette },
  { id: 'ai', label: 'AI 协同', icon: Sparkles },
  { id: 'notify', label: '通知提醒', icon: Bell },
  { id: 'account', label: '账号资料', icon: User },
  { id: 'privacy', label: '安全隐私', icon: Shield },
  { id: 'system', label: '系统与数据', icon: Monitor },
];

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/25 border border-white/[0.05] cursor-pointer hover:border-white/10 transition-colors">
      <div className="min-w-0">
        <div className="text-[12px] font-bold text-white">{label}</div>
        <div className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
          checked ? 'bg-emerald-500/80' : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

export const SettingsCenterPage: React.FC = () => {
  const { glassBlur, setGlassBlur, accentColor, setAccentColor, enableConfetti, setEnableConfetti } = useApp();
  const { show, ToastEl } = useToast();
  const [tab, setTab] = useState<SettingsTab>('appearance');

  // appearance
  const [density, setDensity] = useState<'comfortable' | 'compact' | 'spacious'>('comfortable');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showAmbient, setShowAmbient] = useState(true);
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const [fontScale, setFontScale] = useState(100);

  // ai
  const [aiAutoSuggest, setAiAutoSuggest] = useState(true);
  const [aiRisk, setAiRisk] = useState(true);
  const [aiDocLink, setAiDocLink] = useState(true);
  const [aiVoice, setAiVoice] = useState(false);
  const [aiModel, setAiModel] = useState('wenxi-reasoner-3');
  const [aiTemp, setAiTemp] = useState(0.4);

  // notify
  const [mailNotify, setMailNotify] = useState(true);
  const [desktopNotify, setDesktopNotify] = useState(true);
  const [taskDue, setTaskDue] = useState(true);
  const [mention, setMention] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [quietHours, setQuietHours] = useState(true);
  const [sound, setSound] = useState(true);

  // account
  const [displayName, setDisplayName] = useState('Brandon');
  const [title, setTitle] = useState('产品经理');
  const [email, setEmail] = useState('brandon@wenxi.buddy');
  const [timezone, setTimezone] = useState('Asia/Shanghai');
  const [language, setLanguage] = useState('zh-CN');

  // privacy
  const [twoFA, setTwoFA] = useState(false);
  const [sessionAlert, setSessionAlert] = useState(true);
  const [analyticsShare, setAnalyticsShare] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);

  // system
  const [autoSave, setAutoSave] = useState(true);
  const [cacheSize] = useState('128 MB');
  const [lastSync] = useState('刚刚');

  const applyTheme = () => {
    const root = document.documentElement;
    root.dataset.accent = accentColor;
    root.dataset.blur = glassBlur;
    if (glassBlur === 'standard') root.style.setProperty('--blur-liquid', '24px');
    if (glassBlur === 'ultra') root.style.setProperty('--blur-liquid', '40px');
    if (glassBlur === 'max') root.style.setProperty('--blur-liquid', '56px');
    root.style.setProperty('--font-scale', `${fontScale / 100}`);
    if (reduceMotion) root.dataset.reduceMotion = '1';
    else delete root.dataset.reduceMotion;
    show('设置已保存并生效');
  };

  const resetAll = () => {
    setAccentColor('emerald');
    setGlassBlur('ultra');
    setEnableConfetti(true);
    setDensity('comfortable');
    setReduceMotion(false);
    setShowAmbient(true);
    setFontScale(100);
    setAiAutoSuggest(true);
    setAiRisk(true);
    setAiDocLink(true);
    setAiVoice(false);
    setAiModel('wenxi-reasoner-3');
    setAiTemp(0.4);
    show('已恢复全部默认设置');
  };

  const field = 'liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white';

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-4 pb-2">
      {ToastEl}

      <div className="flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div>
          <h2 className="text-[20px] font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-300" />
            设置中心
          </h2>
          <p className="text-[12px] text-white/40">外观 · AI · 通知 · 账号 · 安全 · 系统 —— 一站式偏好配置</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetAll} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/65 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            恢复默认
          </button>
          <button onClick={applyTheme} className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            保存全部
          </button>
        </div>
      </div>

      <div className="settings-frame flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] gap-3.5">
        {/* 左侧设置导航 */}
        <GlassCard className="p-2.5 h-fit lg:h-full lg:overflow-y-auto">
          <nav className="space-y-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all relative ${
                    active ? 'text-white' : 'text-white/45 hover:text-white/80 hover:bg-white/[0.03]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="settings-nav"
                      className="absolute inset-0 rounded-xl liquid-glass-active"
                      transition={springSoft}
                    />
                  )}
                  <Icon className={`w-4 h-4 relative z-10 ${active ? 'text-emerald-300' : ''}`} />
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </GlassCard>

        {/* 右侧内容区 — 填满 + 切换动效 */}
        <div className="min-h-0 overflow-y-auto pr-0.5">
          <ViewTransition viewKey={tab} className="space-y-3.5">
          {tab === 'appearance' && (
            <>
              <GlassCard className="p-5 space-y-5">
                <SectionTitle icon={Palette} title="液态玻璃主题" />
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-white/45">主强调色</label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ['emerald', '极光翡翠', 'bg-emerald-500'],
                      ['cyan', '赛博电青', 'bg-cyan-500'],
                      ['purple', '暗夜霓紫', 'bg-violet-500'],
                    ] as const).map(([id, name, cls]) => (
                      <button
                        key={id}
                        onClick={() => setAccentColor(id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border text-[11px] font-medium ${
                          accentColor === id ? 'bg-white/10 text-white border-white/25' : 'bg-black/20 text-white/45 border-white/10'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${cls}`} />
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-white/45">毛玻璃模糊强度</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      ['standard', '标准 24px'],
                      ['ultra', '极高清 40px'],
                      ['max', '最大 56px'],
                    ] as const).map(([b, label]) => (
                      <button
                        key={b}
                        onClick={() => setGlassBlur(b)}
                        className={`p-3 rounded-xl border text-[11px] font-semibold ${
                          glassBlur === b
                            ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/35'
                            : 'bg-black/20 text-white/40 border-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-white/45">界面密度</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      ['compact', '紧凑'],
                      ['comfortable', '舒适'],
                      ['spacious', '宽松'],
                    ] as const).map(([id, label]) => (
                      <button
                        key={id}
                        onClick={() => setDensity(id)}
                        className={`p-3 rounded-xl border text-[11px] font-semibold ${
                          density === id
                            ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/35'
                            : 'bg-black/20 text-white/40 border-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-white/45">字体缩放</span>
                    <span className="font-mono text-emerald-300">{fontScale}%</span>
                  </div>
                  <input
                    type="range"
                    min={90}
                    max={120}
                    step={5}
                    value={fontScale}
                    onChange={(e) => setFontScale(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </GlassCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <Toggle checked={showAmbient} onChange={setShowAmbient} label="环境光晕" desc="背景 emerald/cyan 径向光效" />
                <Toggle checked={sidebarCompact} onChange={setSidebarCompact} label="侧栏紧凑模式" desc="仅显示图标，悬停展开文字" />
                <Toggle checked={reduceMotion} onChange={setReduceMotion} label="减弱动效" desc="减少弹簧与模糊过渡，适合低性能设备" />
                <Toggle checked={enableConfetti} onChange={setEnableConfetti} label="完成礼花" desc="创建/完成任务时的 confetti 反馈" />
              </div>
            </>
          )}

          {tab === 'ai' && (
            <>
              <GlassCard className="p-5 space-y-4">
                <SectionTitle icon={Cpu} title="AI 模型与推理" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-white/45 mb-1.5 block">默认推理模型</label>
                    <LiquidSelect
                      value={aiModel}
                      onChange={setAiModel}
                      options={[
                        { value: 'wenxi-reasoner-3', label: 'WenXi Reasoner 3.0' },
                        { value: 'wenxi-fast', label: 'WenXi Fast' },
                        { value: 'wenxi-code', label: 'WenXi Code Assist' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/45 mb-1.5 block flex justify-between">
                      <span>创造性温度</span>
                      <span className="font-mono text-emerald-300">{aiTemp.toFixed(1)}</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={aiTemp}
                      onChange={(e) => setAiTemp(Number(e.target.value))}
                      className="w-full accent-emerald-500 mt-2"
                    />
                  </div>
                </div>
              </GlassCard>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <Toggle checked={aiAutoSuggest} onChange={setAiAutoSuggest} label="智能辅助预判" desc="任务详情实时推送风险与资源建议" />
                <Toggle checked={aiRisk} onChange={setAiRisk} label="风险自动扫描" desc="范围蔓延、时延等风险矩阵自动更新" />
                <Toggle checked={aiDocLink} onChange={setAiDocLink} label="历史文档关联" desc="创建任务时自动匹配相似 PRD / 规范" />
                <Toggle checked={aiVoice} onChange={setAiVoice} label="语音播报建议" desc="关键 AI 建议支持语音朗读（演示）" />
              </div>
              <GlassCard className="p-5 space-y-3">
                <SectionTitle icon={Sparkles} title="AI 使用配额" />
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between text-white/50">
                    <span>本月推理额度</span>
                    <span className="font-mono text-emerald-300">12,480 / 50,000</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/40 border border-white/10 overflow-hidden">
                    <div className="h-full w-[25%] rounded-full bg-gradient-to-r from-emerald-400 to-teal-300" />
                  </div>
                  <button onClick={() => show('已打开配额升级页（演示）')} className="text-[11px] text-emerald-300 hover:underline">
                    升级企业配额 →
                  </button>
                </div>
              </GlassCard>
            </>
          )}

          {tab === 'notify' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <Toggle checked={desktopNotify} onChange={setDesktopNotify} label="桌面通知" desc="浏览器/系统级推送" />
                <Toggle checked={mailNotify} onChange={setMailNotify} label="邮件通知" desc="重要任务与评审结论邮件" />
                <Toggle checked={taskDue} onChange={setTaskDue} label="截止前提醒" desc="任务到期前 24h / 2h 提醒" />
                <Toggle checked={mention} onChange={setMention} label="@ 提及" desc="被协作成员提及时即时通知" />
                <Toggle checked={weeklyReport} onChange={setWeeklyReport} label="周报摘要" desc="每周一汇总上周吞吐与风险" />
                <Toggle checked={quietHours} onChange={setQuietHours} label="免打扰时段" desc="22:00–08:00 仅保留紧急通知" />
                <Toggle checked={sound} onChange={setSound} label="提示音" desc="新消息与完成任务轻提示音" />
              </div>
              <GlassCard className="p-5 space-y-3">
                <SectionTitle icon={Mail} title="通知渠道" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {['站内信', '企业微信', 'Slack'].map((ch) => (
                    <button
                      key={ch}
                      onClick={() => show(`已切换通知渠道偏好：${ch}`)}
                      className="p-3 rounded-xl liquid-btn-ghost text-[12px] text-white/70 hover:text-white"
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </GlassCard>
            </>
          )}

          {tab === 'account' && (
            <GlassCard className="p-5 space-y-4">
              <SectionTitle icon={User} title="账号资料" />
              <div className="flex items-center gap-4 pb-2">
                <div className="w-16 h-16 rounded-2xl liquid-icon-well flex items-center justify-center text-[18px] font-bold text-white">
                  BR
                </div>
                <div className="space-y-1">
                  <button onClick={() => show('头像上传（演示）')} className="h-9 px-3 rounded-full liquid-btn-ghost text-[11px] text-white/70">
                    更换头像
                  </button>
                  <p className="text-[10px] text-white/30">支持 PNG / JPG，最大 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-white/45 mb-1.5 block">显示名称</label>
                  <input className={field} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] text-white/45 mb-1.5 block">职位</label>
                  <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] text-white/45 mb-1.5 block">邮箱</label>
                  <input className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] text-white/45 mb-1.5 block">时区</label>
                  <LiquidSelect
                    value={timezone}
                    onChange={setTimezone}
                    options={[
                      { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)' },
                      { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
                      { value: 'Europe/London', label: 'Europe/London' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/45 mb-1.5 block">界面语言</label>
                  <LiquidSelect
                    value={language}
                    onChange={setLanguage}
                    options={[
                      { value: 'zh-CN', label: '简体中文' },
                      { value: 'zh-TW', label: '繁體中文' },
                      { value: 'en-US', label: 'English' },
                    ]}
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  show(`资料已更新：${displayName} · ${title}`);
                }}
                className="h-10 px-5 rounded-full liquid-btn-primary text-[12px] font-bold"
              >
                更新资料
              </button>
            </GlassCard>
          )}

          {tab === 'privacy' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <Toggle checked={twoFA} onChange={setTwoFA} label="两步验证 (2FA)" desc="登录时需验证器动态码" />
                <Toggle checked={sessionAlert} onChange={setSessionAlert} label="异地登录提醒" desc="新设备/新地区登录即时通知" />
                <Toggle checked={analyticsShare} onChange={setAnalyticsShare} label="匿名使用分析" desc="帮助改进产品体验，不含隐私内容" />
                <Toggle checked={publicProfile} onChange={setPublicProfile} label="公开个人主页" desc="工作区内其他成员可查看完整资料" />
              </div>
              <GlassCard className="p-5 space-y-3">
                <SectionTitle icon={Lock} title="会话与设备" />
                {[
                  { device: 'Windows · Chrome', where: '上海', when: '当前会话' },
                  { device: 'macOS · Safari', where: '远程', when: '3 天前' },
                ].map((s) => (
                  <div key={s.device} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/25 border border-white/[0.05] text-[12px]">
                    <div>
                      <div className="text-white font-medium">{s.device}</div>
                      <div className="text-[11px] text-white/35">{s.where} · {s.when}</div>
                    </div>
                    <button onClick={() => show(`已下线：${s.device}`)} className="text-[11px] text-rose-300 hover:underline">
                      下线
                    </button>
                  </div>
                ))}
              </GlassCard>
            </>
          )}

          {tab === 'system' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <Toggle checked={autoSave} onChange={setAutoSave} label="自动保存草稿" desc="编辑任务/文档时本地自动存档" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <GlassCard className="p-4 space-y-1">
                  <div className="text-[11px] text-white/40 flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> 本地缓存</div>
                  <div className="text-[18px] font-bold text-white font-mono">{cacheSize}</div>
                  <button onClick={() => show('缓存已清理')} className="text-[11px] text-emerald-300 hover:underline pt-1">清理缓存</button>
                </GlassCard>
                <GlassCard className="p-4 space-y-1">
                  <div className="text-[11px] text-white/40 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> 最近同步</div>
                  <div className="text-[18px] font-bold text-white">{lastSync}</div>
                  <button onClick={() => show('已强制同步云端')} className="text-[11px] text-emerald-300 hover:underline pt-1">立即同步</button>
                </GlassCard>
                <GlassCard className="p-4 space-y-1">
                  <div className="text-[11px] text-white/40 flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> 数据导出</div>
                  <div className="text-[18px] font-bold text-white">JSON / CSV</div>
                  <button onClick={() => show('导出任务已排队')} className="text-[11px] text-emerald-300 hover:underline pt-1">导出全部</button>
                </GlassCard>
              </div>
              <GlassCard className="p-5 space-y-3">
                <SectionTitle icon={Keyboard} title="快捷键" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                  {[
                    ['⌘ K', '全局搜索'],
                    ['N', '新建任务'],
                    ['E', '编辑当前任务'],
                    ['⌘ Enter', '完成任务'],
                    ['[ ]', '切换 CoverFlow'],
                    ['?', '快捷键帮助'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between p-2.5 rounded-xl bg-black/25 border border-white/[0.05]">
                      <span className="text-white/55">{v}</span>
                      <kbd className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-mono text-[10px] text-white/70">{k}</kbd>
                    </div>
                  ))}
                </div>
              </GlassCard>
              <GlassCard className="p-5 space-y-3 border border-rose-400/20">
                <SectionTitle icon={Trash2} title="危险操作" />
                <p className="text-[11px] text-white/40">删除工作区数据不可恢复，请谨慎操作。</p>
                <button
                  onClick={() => {
                    if (confirm('确认清空本地演示数据？')) show('本地演示数据已重置');
                  }}
                  className="h-10 px-4 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-300 text-[12px] font-semibold"
                >
                  清空本地演示数据
                </button>
              </GlassCard>
            </>
          )}
          </ViewTransition>
        </div>
      </div>
    </div>
  );
};

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <h3 className="text-[13px] font-bold text-white flex items-center gap-2 pb-2 border-b border-white/[0.06]">
      <Icon className="w-4 h-4 text-emerald-300" />
      {title}
    </h3>
  );
}

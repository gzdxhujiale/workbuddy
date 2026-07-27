import React, { useMemo, useState } from 'react';
import { BookOpen, Search, Folder, FileText, Star, ChevronRight, Plus, Share2, Bookmark } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import { useToast } from '@/components/ui/Toast';

type Article = {
  id: string;
  title: string;
  views: string;
  category: string;
  author: string;
  body: string;
  starred?: boolean;
};

const seed: Article[] = [
  { id: 'a1', title: 'WenXiBuddy 前端 Glassmorphic UI 交互规范指南', views: '2.4k', category: 'UI/UX 规范', author: 'Elena', body: '详细规定了暗黑高透明毛玻璃面板、3D Stack 卡片覆盖流、霓虹亮光与微交互动效的实现标准。', starred: true },
  { id: 'a2', title: 'React 19 + Framer Motion 3D 渲染最佳实践', views: '1.8k', category: '技术架构', author: 'David', body: '覆盖 transform-style、perspective、弹簧参数与性能预算。' },
  { id: 'a3', title: '敏捷研发 2.0 需求评审与流转标准 SOP', views: '3.1k', category: '团队流程', author: 'Brandon', body: '从需求评审到验收的完整 SOP 与 RACI 矩阵。' },
  { id: 'a4', title: 'AI 辅助工程代码走查与自动化单元测试指南', views: '1.2k', category: '质量保障', author: 'Sarah', body: 'AI 走查清单、覆盖率门槛与回归策略。' },
  { id: 'a5', title: '液态玻璃 Design Token 与 DESIGN.md 协作规范', views: '960', category: 'UI/UX 规范', author: 'Elena', body: '颜色、模糊、半径、阴影与 Agent Prompt 统一约定。' },
  { id: 'a6', title: 'GraphQL 网关鉴权与审计日志', views: '1.1k', category: '技术架构', author: 'Michael', body: 'JWT 轮换、字段级权限与审计链路。' },
];

export const KnowledgeBasePage: React.FC = () => {
  const { show, ToastEl } = useToast();
  const [articles, setArticles] = useState(seed);
  const [search, setSearch] = useState('');
  const [openArticle, setOpenArticle] = useState<Article | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'UI/UX 规范', body: '' });

  const folders = [
    { name: 'UI/UX 规范', count: `${articles.filter((a) => a.category.includes('UI')).length} 篇`, color: 'text-emerald-300' },
    { name: '技术架构', count: `${articles.filter((a) => a.category.includes('技术')).length} 篇`, color: 'text-cyan-300' },
    { name: '团队流程', count: `${articles.filter((a) => a.category.includes('流程')).length} 篇`, color: 'text-violet-300' },
    { name: '质量保障', count: `${articles.filter((a) => a.category.includes('质量')).length} 篇`, color: 'text-amber-300' },
  ];

  const filtered = useMemo(
    () =>
      articles.filter((a) => {
        const q = search.toLowerCase();
        const matchQ = !q || a.title.toLowerCase().includes(q) || a.category.includes(search) || a.body.includes(search);
        const matchF = !activeFolder || a.category.includes(activeFolder.replace('规范', '').trim()) || a.category === activeFolder || a.category.includes(activeFolder.slice(0, 2));
        return matchQ && matchF;
      }),
    [articles, search, activeFolder]
  );

  const createArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const article: Article = {
      id: `a-${Date.now()}`,
      title: form.title.trim(),
      category: form.category,
      author: 'Brandon',
      views: '1',
      body: form.body || '暂无正文，待补充。',
    };
    setArticles((prev) => [article, ...prev]);
    setForm({ title: '', category: 'UI/UX 规范', body: '' });
    setCreateOpen(false);
    setOpenArticle(article);
    show('文章已发布到知识库');
  };

  const toggleStar = (id: string) => {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, starred: !a.starred } : a)));
    show('收藏状态已更新');
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-4 pb-1">
      {ToastEl}
      <div className="flex items-center justify-between gap-3 flex-nowrap shrink-0 overflow-x-auto">
        <div className="shrink-0">
          <h2 className="text-[18px] font-bold text-white tracking-tight flex items-center gap-2 whitespace-nowrap">
            <BookOpen className="w-5 h-5 text-emerald-300" />
            企业知识库 Wiki
          </h2>
          <p className="text-[11px] text-white/40 whitespace-nowrap">搜索 · 分类 · 发布 · 收藏 · 分享</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div className="relative w-56 sm:w-72">
            <Search className="w-4 h-4 text-white/35 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="全文搜索知识库..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="liquid-pill w-full h-10 pl-9 pr-4 text-[12px] text-white placeholder:text-white/30 bg-transparent outline-none"
            />
          </div>
          <button onClick={() => setCreateOpen(true)} className="h-10 px-3.5 rounded-full liquid-btn-primary text-[12px] font-bold flex items-center gap-1.5 whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" /> 发布文章
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3.5 overflow-y-auto">
        <GlassCard className="p-5 space-y-4" glowColor="emerald" variant="interactive" onClick={() => setOpenArticle(articles[0])}>
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">置顶推荐</span>
            <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
          </div>
          <h3 className="text-[17px] font-bold text-white leading-snug">{articles[0].title}</h3>
          <p className="text-[12px] text-white/50 leading-relaxed">{articles[0].body}</p>
          <div className="pt-2 flex items-center justify-between text-[11px] text-white/40 border-t border-white/[0.06]">
            <span>作者: {articles[0].author} · 阅览 {articles[0].views}</span>
            <span className="text-emerald-300 font-semibold flex items-center gap-1">阅读全文 <ChevronRight className="w-3.5 h-3.5" /></span>
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 gap-3">
          {folders.map((cat) => (
            <button key={cat.name} onClick={() => setActiveFolder(activeFolder === cat.name ? null : cat.name)} className="text-left">
              <GlassCard variant={activeFolder === cat.name ? 'active' : 'interactive'} className="p-4 space-y-2 h-full">
                <Folder className={`w-6 h-6 ${cat.color}`} />
                <h4 className="text-[13px] font-bold text-white">{cat.name}</h4>
                <p className="text-[11px] text-white/40">{cat.count}</p>
              </GlassCard>
            </button>
          ))}
        </div>

        <GlassCard className="p-5 space-y-3 lg:col-span-2 min-h-0">
          <div className="flex items-center justify-between gap-2 flex-nowrap">
            <h3 className="text-[13px] font-bold text-white flex items-center gap-2 whitespace-nowrap">
              <FileText className="w-4 h-4 text-emerald-300" />
              {activeFolder ? `分类 · ${activeFolder}` : '全部文章'}
            </h3>
            {activeFolder && (
              <button onClick={() => setActiveFolder(null)} className="text-[11px] text-emerald-300 hover:underline whitespace-nowrap">清除筛选</button>
            )}
          </div>
          <div className="divide-y divide-white/[0.05] max-h-[360px] overflow-y-auto">
            {filtered.map((art) => (
              <div key={art.id} className="py-3 flex items-center justify-between gap-3 px-1">
                <button onClick={() => setOpenArticle(art)} className="flex items-center gap-3 min-w-0 text-left flex-1">
                  <FileText className="w-4 h-4 text-white/30 shrink-0" />
                  <span className="text-[12px] font-semibold text-white truncate hover:text-emerald-200">{art.title}</span>
                </button>
                <div className="hidden sm:flex items-center gap-2 text-white/35 text-[10px] shrink-0">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{art.category}</span>
                  <span>{art.author}</span>
                  <button
                    onClick={() => toggleStar(art.id)}
                    className={`p-1.5 rounded-lg hover:bg-white/5 ${art.starred ? 'text-amber-300' : 'text-white/30'}`}
                    title="收藏"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${art.starred ? 'fill-amber-300' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(art.title);
                      show('文章标题已复制，可分享');
                    }}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5"
                    title="分享"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="py-10 text-center text-[12px] text-white/35">无匹配文章</div>}
          </div>
        </GlassCard>
      </div>

      <LiquidModal
        open={!!openArticle}
        onClose={() => setOpenArticle(null)}
        title={openArticle?.title ?? ''}
        subtitle={openArticle ? `${openArticle.category} · ${openArticle.author}` : undefined}
        icon={<BookOpen className="w-5 h-5" />}
        widthClass="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2 flex-wrap">
            <button onClick={() => setOpenArticle(null)} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">关闭</button>
            <button
              onClick={() => openArticle && toggleStar(openArticle.id)}
              className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/70"
            >
              {openArticle?.starred ? '取消收藏' : '收藏'}
            </button>
            <button
              onClick={() => {
                show('已分享文章链接（演示）');
                setOpenArticle(null);
              }}
              className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold"
            >
              分享
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-[13px] text-white/65 leading-relaxed">
          <p>{openArticle?.body}</p>
          <p className="text-[11px] text-white/35">浏览量 {openArticle?.views} · 可在团队 Wiki 协作编辑（演示）。</p>
        </div>
      </LiquidModal>

      <LiquidModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="发布知识库文章"
        subtitle="沉淀最佳实践"
        icon={<Plus className="w-5 h-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setCreateOpen(false)} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">取消</button>
            <button form="kb-form" type="submit" className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold">发布</button>
          </div>
        }
      >
        <form id="kb-form" onSubmit={createArticle} className="space-y-3">
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="文章标题" className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white" />
          <LiquidSelect
            value={form.category}
            onChange={(v) => setForm({ ...form, category: v })}
            options={[
              { value: 'UI/UX 规范', label: 'UI/UX 规范' },
              { value: '技术架构', label: '技术架构' },
              { value: '团队流程', label: '团队流程' },
              { value: '质量保障', label: '质量保障' },
            ]}
          />
          <textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="正文内容" className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white resize-none" />
        </form>
      </LiquidModal>
    </div>
  );
};

export default KnowledgeBasePage;

import React, { useMemo, useState } from 'react';
import { FileText, Search, UploadCloud, Download, Eye, Share2, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/ui/Toast';
import { FileDoc } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';

export const FileDocumentsPage: React.FC = () => {
  const { files, addFile } = useApp();
  const { show, ToastEl } = useToast();
  const [localFiles, setLocalFiles] = useState<FileDoc[]>([]);
  const allFiles = useMemo(() => [...localFiles, ...files], [localFiles, files]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [renameDoc, setRenameDoc] = useState<FileDoc | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('产品文档');

  const categories = ['全部', '产品文档', '设计规范', '技术文档', '测试文档', 'AI 算法', '通用文档'];
  const filteredFiles = useMemo(
    () =>
      allFiles.filter((f) => {
        const matchCategory = selectedCategory === '全部' || f.category === selectedCategory;
        const matchSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
      }),
    [allFiles, selectedCategory, searchQuery]
  );
  const previewFile = allFiles.find((f) => f.id === previewId) ?? null;

  const applyRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameDoc || !renameTitle.trim()) return;
    setLocalFiles((prev) => {
      const exists = prev.find((p) => p.id === renameDoc.id);
      if (exists) return prev.map((p) => (p.id === renameDoc.id ? { ...p, title: renameTitle.trim() } : p));
      return [{ ...renameDoc, title: renameTitle.trim() }, ...prev];
    });
    // also overlay files from context by local override list - simpler: push override
    setRenameDoc(null);
    show('文档已重命名');
  };

  const removeDoc = (doc: FileDoc) => {
    setLocalFiles((prev) => prev.filter((p) => p.id !== doc.id));
    // hide context files by tracking deleted ids
    setDeletedIds((d) => [...d, doc.id]);
    setMenuId(null);
    show('文档已删除');
  };

  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const visible = filteredFiles.filter((f) => !deletedIds.includes(f.id));

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-4 pb-1">
      {ToastEl}
      <div className="flex items-center justify-between gap-3 flex-nowrap shrink-0 overflow-x-auto">
        <div className="shrink-0">
          <h2 className="text-[18px] font-bold text-white tracking-tight flex items-center gap-2 whitespace-nowrap">
            <FileText className="w-5 h-5 text-emerald-300" />
            文件文档归档
          </h2>
          <p className="text-[11px] text-white/40 whitespace-nowrap">上传 · 预览 · 下载 · 重命名 · 分享 · 删除</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 ml-auto"
        >
          <UploadCloud className="w-4 h-4" />
          上传新文档
        </button>
      </div>

      <div className="flex items-center gap-3 flex-nowrap shrink-0 overflow-x-auto">
        <div className="liquid-pill p-1 flex items-center gap-1 shrink-0 whitespace-nowrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-56 sm:w-64 shrink-0 ml-auto">
          <Search className="w-4 h-4 text-white/35 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文档名称..."
            className="liquid-pill w-full h-9 pl-9 pr-3 text-[12px] text-white placeholder:text-white/30 bg-transparent outline-none"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {visible.map((file) => (
            <GlassCard key={file.id} variant="interactive" className="p-5 space-y-4 flex flex-col justify-between relative">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="liquid-icon-well w-10 h-10 rounded-xl flex items-center justify-center text-emerald-300">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-white/40 px-2 py-0.5 rounded-md bg-black/30 border border-white/10">{file.size}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuId(menuId === file.id ? null : file.id);
                      }}
                      className="p-1 rounded-lg text-white/35 hover:text-white hover:bg-white/5"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-white line-clamp-2">{file.title}</h3>
                  <p className="text-[11px] text-white/40 mt-1">分类: {file.category} · {file.author}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {file.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-white/55">{t}</span>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/30">{file.updatedAt}</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPreviewId(file.id)} className="liquid-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white" title="预览">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => show(`已开始下载：${file.title}`)} className="liquid-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-emerald-300" title="下载">
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(file.title);
                      show('分享链接已复制');
                    }}
                    className="liquid-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white"
                    title="分享"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {menuId === file.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-3 top-12 z-20 p-1 liquid-glass min-w-[132px]"
                  >
                    <button
                      onClick={() => {
                        setRenameDoc(file);
                        setRenameTitle(file.title);
                        setMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-white/70 hover:bg-white/5"
                    >
                      <Pencil className="w-3 h-3" /> 重命名
                    </button>
                    <button onClick={() => { setPreviewId(file.id); setMenuId(null); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-white/70 hover:bg-white/5">
                      <Eye className="w-3 h-3" /> 预览
                    </button>
                    <button onClick={() => removeDoc(file)} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-rose-300 hover:bg-rose-500/10">
                      <Trash2 className="w-3 h-3" /> 删除
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          ))}
        </div>
        {visible.length === 0 && <div className="py-16 text-center text-[12px] text-white/35">暂无匹配文档</div>}
      </div>

      <LiquidModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title="上传新文档"
        subtitle="归档到知识资产库"
        icon={<UploadCloud className="w-5 h-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowUpload(false)} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">取消</button>
            <button form="upload-form" type="submit" className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold">确认上传</button>
          </div>
        }
      >
        <form
          id="upload-form"
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!uploadTitle.trim()) return;
            addFile({ title: uploadTitle.trim(), category: uploadCategory, size: `${(Math.random() * 8 + 0.8).toFixed(1)} MB`, author: 'Brandon', tags: ['新增', uploadCategory] });
            setUploadTitle('');
            setShowUpload(false);
            show('文档已上传并归档');
          }}
        >
          <input required value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="文档标题" className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white" />
          <LiquidSelect
            value={uploadCategory}
            onChange={setUploadCategory}
            options={categories.filter((c) => c !== '全部').map((c) => ({ value: c, label: c }))}
          />
        </form>
      </LiquidModal>

      <LiquidModal
        open={!!previewFile}
        onClose={() => setPreviewId(null)}
        title={previewFile?.title ?? ''}
        subtitle={previewFile ? `${previewFile.category} · ${previewFile.size}` : undefined}
        icon={<FileText className="w-5 h-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setPreviewId(null)} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">关闭</button>
            <button onClick={() => { if (previewFile) show(`已开始下载：${previewFile.title}`); }} className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> 下载附件
            </button>
          </div>
        }
      >
        {previewFile && (
          <p className="text-[13px] text-white/65 leading-relaxed">
            文档由 {previewFile.author} 于 {previewFile.updatedAt} 更新。标签：{previewFile.tags.join('、')}。完成度 {previewFile.completion ?? 100}%。
          </p>
        )}
      </LiquidModal>

      <LiquidModal
        open={!!renameDoc}
        onClose={() => setRenameDoc(null)}
        title="重命名文档"
        subtitle={renameDoc?.id}
        icon={<Pencil className="w-5 h-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setRenameDoc(null)} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">取消</button>
            <button form="rename-form" type="submit" className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold">保存</button>
          </div>
        }
      >
        <form id="rename-form" onSubmit={applyRename}>
          <input required value={renameTitle} onChange={(e) => setRenameTitle(e.target.value)} className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white" />
        </form>
      </LiquidModal>
    </div>
  );
};

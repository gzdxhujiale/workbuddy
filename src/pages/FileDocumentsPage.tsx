import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Search, Download, Eye, Share2, Pencil, Trash2, MoreHorizontal, Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import { useFiles, useAddFile } from '@/lib/queries';
import { useToast } from '@/components/ui/Toast';
import { FileDoc } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDateFull } from '@/utils/date';

import { useUIStore } from '@/store/useUIStore';

export const FileDocumentsPage: React.FC = () => {
  const setIsCreateDocOpen = useUIStore((s) => s.setIsCreateDocOpen);
  const { data: files = [] } = useFiles();
  const addFileMutation = useAddFile();
  const addFile = (f: any) => addFileMutation.mutate(f);
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
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const activeMenuFile = useMemo(() => files.find((f) => f.id === menuId), [files, menuId]);

  useEffect(() => {
    if (menuId === null) return;
    const handleClose = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : (e.target as Node)?.parentElement;
      if (el && (el.closest('.action-menu-trigger') || el.closest('.action-menu-content'))) {
        return;
      }
      setMenuId(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuId(null);
    };
    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuId]);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([
    '全部',
    '产品文档',
    '设计规范',
    '技术文档',
    '测试文档',
    'AI 算法',
    '通用文档',
  ]);

  const handleOpenCreateModal = () => {
    setUploadTitle('');
    if (selectedCategory === '全部') {
      setUploadCategory('');
    } else {
      setUploadCategory(selectedCategory);
    }
    setShowUpload(true);
  };

  const handleCreateCategory = (newCat: string) => {
    if (!categories.includes(newCat)) {
      setCategories((prev) => [...prev, newCat]);
      show(`已新建分类：${newCat}`);
    }
  };

  const categoryOptions = useMemo(() => {
    const opts = categories
      .filter((c) => c !== '全部')
      .map((c) => ({ value: c, label: c }));
    return [{ value: '', label: '未分类 (为空)' }, ...opts];
  }, [categories]);

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
    setRenameDoc(null);
    show('文档已重命名');
  };

  const removeDoc = (doc: FileDoc) => {
    setLocalFiles((prev) => prev.filter((p) => p.id !== doc.id));
    setDeletedIds((d) => [...d, doc.id]);
    setMenuId(null);
    show('文档已删除');
  };

  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const visible = filteredFiles.filter((f) => !deletedIds.includes(f.id));

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-4 pb-1">
      {ToastEl}
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap shrink-0">
        <div className="liquid-pill p-1 flex items-center gap-1 shrink-0 whitespace-nowrap overflow-x-auto max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div className="relative w-48 sm:w-60 shrink-0">
            <Search className="w-4 h-4 text-white/35 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文档名称..."
              className="liquid-pill w-full h-9 pl-9 pr-3 text-[12px] text-white placeholder:text-white/30 bg-transparent outline-none"
            />
          </div>
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
                        if (menuId === file.id) {
                          setMenuId(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuPos({
                            top: rect.bottom + 4,
                            right: window.innerWidth - rect.right,
                          });
                          setMenuId(file.id);
                        }
                      }}
                      className="p-1 rounded-lg text-white/35 hover:text-white hover:bg-white/5 action-menu-trigger relative z-10 cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-white line-clamp-2">{file.title}</h3>
                  <p className="text-[11px] text-white/40 mt-1">分类: {file.category || '未分类'} · {file.author}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {file.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-white/55">{t}</span>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/30">{formatDateFull(file.updatedAt)}</span>
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
            </GlassCard>
          ))}
        </div>
        {visible.length === 0 && <div className="py-16 text-center text-[12px] text-white/35">暂无匹配文档</div>}
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {menuId !== null && activeMenuFile && (
              <motion.div
                key={activeMenuFile.id}
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: menuPos.top,
                  right: menuPos.right,
                  zIndex: 9999,
                }}
                className="p-1.5 liquid-glass min-w-[132px] action-menu-content shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
              >
                <button
                  onClick={() => {
                    setRenameDoc(activeMenuFile);
                    setRenameTitle(activeMenuFile.title);
                    setMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-white/75 hover:bg-white/5 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-emerald-300" /> 重命名
                </button>
                <button
                  onClick={() => {
                    setPreviewId(activeMenuFile.id);
                    setMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-white/75 hover:bg-white/5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> 预览
                </button>
                <button
                  onClick={() => removeDoc(activeMenuFile)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-rose-300 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 删除
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      <LiquidModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title="创建新文档"
        subtitle="沉淀到团队知识库"
        icon={<Plus className="w-5 h-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowUpload(false)} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">取消</button>
            <button form="upload-form" type="submit" className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold">确认创建</button>
          </div>
        }
      >
        <form
          id="upload-form"
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!uploadTitle.trim()) return;
            addFile({
              title: uploadTitle.trim(),
              category: uploadCategory,
              size: `${(Math.random() * 8 + 0.8).toFixed(1)} MB`,
              author: 'Brandon',
              tags: uploadCategory ? ['新增', uploadCategory] : ['新增'],
            });
            setUploadTitle('');
            setShowUpload(false);
            show('知识文档已创建并归档');
          }}
        >
          <input required value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="文档标题" className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white" />
          <LiquidSelect
            value={uploadCategory}
            onChange={setUploadCategory}
            options={categoryOptions}
            allowCreate={true}
            onCreateOption={handleCreateCategory}
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

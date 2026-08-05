import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  Plus,
  ArrowLeft,
  FolderEdit,
  Clock,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import {
  useKnowledgeBases,
  useAddKnowledgeBase,
  useUpdateKnowledgeBase,
  useSoftDeleteKnowledgeBase,
} from '@/lib/queries';
import { useToast } from '@/components/ui/Toast';
import { KnowledgeBase } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDateFull } from '@/utils/date';
import { TiptapEditor } from '@/components/knowledge/TiptapEditor';
import { useUIStore } from '@/store/useUIStore';

function getDocExcerpt(contentStr: string): string {
  if (!contentStr) return '暂无摘要内容...';
  try {
    const json = JSON.parse(contentStr);
    if (json && typeof json === 'object' && Array.isArray(json.content)) {
      const texts: string[] = [];
      const extract = (node: any) => {
        if (node.text) texts.push(node.text);
        if (Array.isArray(node.content)) node.content.forEach(extract);
      };
      json.content.forEach(extract);
      const res = texts.join(' ').trim();
      return res || '暂无摘要内容...';
    }
  } catch (e) {}
  return '暂无摘要内容...';
}

export const KnowledgeBasePage: React.FC = () => {
  const isCreateDocOpen = useUIStore((s) => s.isCreateDocOpen);
  const setIsCreateDocOpen = useUIStore((s) => s.setIsCreateDocOpen);

  const { data: rawKnowledgeBases = [], isLoading } = useKnowledgeBases();
  const addKBMutation = useAddKnowledgeBase();
  const updateKBMutation = useUpdateKnowledgeBase();
  const softDeleteKBMutation = useSoftDeleteKnowledgeBase();

  const { show, ToastEl } = useToast();

  // Optimistic local state cache
  const [localDocs, setLocalDocs] = useState<KnowledgeBase[]>([]);

  // Sync server docs with local docs if server refetched
  useEffect(() => {
    if (rawKnowledgeBases.length > 0) {
      setLocalDocs(rawKnowledgeBases);
    }
  }, [rawKnowledgeBases]);

  const allDocs = useMemo(() => {
    return localDocs.length > 0 ? localDocs : rawKnowledgeBases;
  }, [localDocs, rawKnowledgeBases]);

  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Currently active editing doc ID (null if list mode)
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createCategory, setCreateCategory] = useState<string | null>(null);

  // Category modification modal from dropdown menu
  const [changeCategoryDoc, setChangeCategoryDoc] = useState<KnowledgeBase | null>(null);
  const [targetCategory, setTargetCategory] = useState<string>('');

  // Dropdown menu state
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const activeMenuDoc = useMemo(() => allDocs.find((d) => d.id === menuId), [allDocs, menuId]);

  // Categories collection
  const [categories, setCategories] = useState<string[]>([
    '全部',
    '产品文档',
    '设计规范',
    '技术文档',
    '测试文档',
    '通用文档',
  ]);

  useEffect(() => {
    if (isCreateDocOpen) {
      handleOpenCreateModal();
      setIsCreateDocOpen(false);
    }
  }, [isCreateDocOpen]);

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

  const handleOpenCreateModal = () => {
    setCreateTitle('');
    if (selectedCategory === '全部') {
      setCreateCategory(null);
    } else {
      setCreateCategory(selectedCategory);
    }
    setShowCreateModal(true);
  };

  const handleCreateCategory = (newCat: string) => {
    if (!categories.includes(newCat)) {
      setCategories((prev) => [...prev, newCat]);
      show(`已新建知识分类：${newCat}`);
    }
  };

  const categoryOptions = useMemo(() => {
    const opts = categories
      .filter((c) => c !== '全部')
      .map((c) => ({ value: c, label: c }));
    return [{ value: '', label: '全部 / 未分类 (null)' }, ...opts];
  }, [categories]);

  // Filter docs by category and search
  const filteredDocs = useMemo(() => {
    return allDocs.filter((d) => {
      if (d.deletedAt) return false;
      const matchCategory =
        selectedCategory === '全部'
          ? true
          : (d.category || '未分类') === selectedCategory;
      const matchSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.content && d.content.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [allDocs, selectedCategory, searchQuery]);

  // Active document being edited in editor view
  const editingDoc = useMemo(
    () => allDocs.find((d) => d.id === editingDocId) || null,
    [allDocs, editingDocId]
  );

  // Debounced auto-save logic for editor
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | undefined>(undefined);
  const saveTimerRef = useRef<any>(null);

  const performAutoSave = useCallback(
    (id: string, newTitle: string, newCategory: string | null, newContent: string) => {
      setIsSaving(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(() => {
        updateKBMutation.mutate(
          { id, title: newTitle, category: newCategory, content: newContent },
          {
            onSuccess: () => {
              setIsSaving(false);
              setLastSavedAt(Date.now());
            },
            onError: (err) => {
              setIsSaving(false);
              show(`自动保存失败: ${err.message}`);
            },
          }
        );
      }, 600);
    },
    [updateKBMutation, show]
  );

  // Handle Optimistic Title Change
  const handleTitleChange = (newTitle: string) => {
    if (!editingDoc) return;
    setLocalDocs((prev) =>
      prev.map((d) => (d.id === editingDoc.id ? { ...d, title: newTitle, updatedAt: Date.now() } : d))
    );
    performAutoSave(editingDoc.id, newTitle, editingDoc.category, editingDoc.content);
  };

  // Handle Optimistic Category Change
  const handleCategoryChange = (newCat: string | null) => {
    if (!editingDoc) return;
    setLocalDocs((prev) =>
      prev.map((d) => (d.id === editingDoc.id ? { ...d, category: newCat, updatedAt: Date.now() } : d))
    );
    performAutoSave(editingDoc.id, editingDoc.title, newCat, editingDoc.content);
  };

  // Handle Optimistic Tiptap Content Change
  const handleContentChange = (newContent: string) => {
    if (!editingDoc) return;
    setLocalDocs((prev) =>
      prev.map((d) => (d.id === editingDoc.id ? { ...d, content: newContent, updatedAt: Date.now() } : d))
    );
    performAutoSave(editingDoc.id, editingDoc.title, editingDoc.category, newContent);
  };

  // Submit Create Knowledge Base
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) return;

    const newCategoryVal = createCategory && createCategory.trim() ? createCategory.trim() : null;

    const initialDocJson = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: createTitle.trim() }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '在此处开始撰写团队知识库内容，可使用顶部块级菜单插入各种节点...' }],
        },
      ],
    });

    addKBMutation.mutate(
      {
        title: createTitle.trim(),
        category: newCategoryVal,
        content: initialDocJson,
      },
      {
        onSuccess: (newId) => {
          show('知识库文档创建成功');
          setShowCreateModal(false);
          if (newId) {
            setEditingDocId(newId);
          }
        },
      }
    );
  };

  // Handle Soft Delete
  const handleSoftDelete = (doc: KnowledgeBase) => {
    setLocalDocs((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, deletedAt: Date.now() } : d))
    );
    softDeleteKBMutation.mutate(doc.id, {
      onSuccess: () => {
        show(`文档《${doc.title}》已移入回收站 (软删除)`);
        setMenuId(null);
        if (editingDocId === doc.id) {
          setEditingDocId(null);
        }
      },
    });
  };

  // Submit Category Change from Dropdown Modal
  const handleApplyCategoryChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeCategoryDoc) return;

    const catVal = targetCategory && targetCategory.trim() ? targetCategory.trim() : null;
    setLocalDocs((prev) =>
      prev.map((d) => (d.id === changeCategoryDoc.id ? { ...d, category: catVal, updatedAt: Date.now() } : d))
    );

    updateKBMutation.mutate(
      {
        id: changeCategoryDoc.id,
        category: catVal,
      },
      {
        onSuccess: () => {
          show('文档分类变更成功');
          setChangeCategoryDoc(null);
        },
      }
    );
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-4 pb-1">
      {ToastEl}

      {/* Editor View */}
      {editingDoc ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          className="w-full h-full flex flex-col gap-3 min-h-0"
        >
          {/* Editor Header Bar */}
          <div className="liquid-glass p-3 flex items-center justify-between gap-3 shrink-0 rounded-2xl flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => setEditingDocId(null)}
                className="liquid-btn-ghost px-3 py-1.5 rounded-xl text-[12px] text-white/70 hover:text-white flex items-center gap-1.5 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回知识库列表</span>
              </button>

              <div className="h-4 w-px bg-white/10 shrink-0 hidden sm:block" />

              <input
                value={editingDoc.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="输入知识文档标题..."
                className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-emerald-400 outline-none text-[15px] sm:text-[17px] font-bold text-white transition-all min-w-0 flex-1"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="w-44">
                <LiquidSelect
                  value={editingDoc.category || ''}
                  onChange={(val) => handleCategoryChange(val ? val : null)}
                  options={categoryOptions}
                  allowCreate={true}
                  onCreateOption={handleCreateCategory}
                />
              </div>

              <button
                onClick={() => handleSoftDelete(editingDoc)}
                className="liquid-btn-ghost w-9 h-9 rounded-xl flex items-center justify-center text-rose-400 hover:bg-rose-500/10"
                title="软删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tiptap Editor Canvas */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <TiptapEditor
              content={editingDoc.content}
              onChange={handleContentChange}
              isSaving={isSaving}
              lastSavedAt={lastSavedAt}
            />
          </div>
        </motion.div>
      ) : (
        /* List View */
        <>
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap shrink-0">
            <div className="liquid-pill p-1 flex items-center gap-1 shrink-0 whitespace-nowrap overflow-x-auto max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-white/15 text-emerald-300 shadow-sm border border-emerald-400/20'
                      : 'text-white/45 hover:text-white/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <div className="relative w-44 sm:w-60 shrink-0">
                <Search className="w-4 h-4 text-white/35 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索知识库文档内容..."
                  className="liquid-pill w-full h-9 pl-9 pr-3 text-[12px] text-white placeholder:text-white/30 bg-transparent outline-none"
                />
              </div>

              <button
                onClick={handleOpenCreateModal}
                className="liquid-btn-primary h-9 px-3.5 rounded-full text-[12px] font-bold flex items-center gap-1.5 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>新建知识文档</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
            {isLoading ? (
              <div className="py-20 text-center text-[12px] text-white/35">
                正在同步团队知识库...
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="py-20 text-center text-[12px] text-white/35 flex flex-col items-center justify-center gap-2">
                <BookOpen className="w-8 h-8 text-white/20" />
                <span>暂无符合条件的知识库文档</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {filteredDocs.map((doc) => (
                  <GlassCard
                    key={doc.id}
                    variant="interactive"
                    onClick={() => setEditingDocId(doc.id)}
                    className="p-5 space-y-4 flex flex-col justify-between relative group cursor-pointer border border-white/[0.08] hover:border-emerald-400/30 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="liquid-icon-well w-10 h-10 rounded-xl flex items-center justify-center text-cyan-300">
                          <BookOpen className="w-5 h-5" />
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono text-emerald-300/80 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-400/20">
                            {doc.category || '全部 / 未分类'}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (menuId === doc.id) {
                                setMenuId(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuPos({
                                  top: rect.bottom + 4,
                                  right: window.innerWidth - rect.right,
                                });
                                setMenuId(doc.id);
                              }
                            }}
                            className="p-1 rounded-lg text-white/35 hover:text-white hover:bg-white/10 action-menu-trigger relative z-10 cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-[14px] font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                          {doc.title}
                        </h3>
                        <p className="text-[11px] text-white/40 mt-1 line-clamp-2 leading-relaxed">
                          {getDocExcerpt(doc.content)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateFull(doc.updatedAt)}
                      </span>

                      <span className="text-[11px] font-semibold text-emerald-300/90 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        进入编辑 <Pencil className="w-3 h-3" />
                      </span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Action Menu Portal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {menuId !== null && activeMenuDoc && (
              <motion.div
                key={activeMenuDoc.id}
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
                className="p-1.5 liquid-glass min-w-[145px] action-menu-content shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
              >
                <button
                  onClick={() => {
                    setEditingDocId(activeMenuDoc.id);
                    setMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-white/75 hover:bg-white/5 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-emerald-300" /> 编辑文档
                </button>

                <button
                  onClick={() => {
                    setChangeCategoryDoc(activeMenuDoc);
                    setTargetCategory(activeMenuDoc.category || '');
                    setMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-cyan-300 hover:bg-white/5 transition-colors"
                >
                  <FolderEdit className="w-3.5 h-3.5" /> 修改分类
                </button>

                <button
                  onClick={() => handleSoftDelete(activeMenuDoc)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-rose-300 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 软删除
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Modal: Create Knowledge Base */}
      <LiquidModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建知识库文档"
        subtitle={
          selectedCategory !== '全部'
            ? `默认将归档至分类：${selectedCategory}`
            : '默认放置于【全部】分类下 (NULL)'
        }
        icon={<BookOpen className="w-5 h-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreateModal(false)}
              className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60"
            >
              取消
            </button>
            <button
              form="create-kb-form"
              type="submit"
              className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold"
            >
              立即创建
            </button>
          </div>
        }
      >
        <form id="create-kb-form" className="space-y-3" onSubmit={handleCreateSubmit}>
          <input
            required
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            placeholder="知识库文档标题"
            className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white"
          />

          <div>
            <label className="text-[11px] text-white/40 mb-1 block">归属分类 (可选):</label>
            <LiquidSelect
              value={createCategory || ''}
              onChange={(val) => setCreateCategory(val ? val : null)}
              options={categoryOptions}
              allowCreate={true}
              onCreateOption={handleCreateCategory}
            />
          </div>
        </form>
      </LiquidModal>

      {/* Modal: Change Category */}
      <LiquidModal
        open={!!changeCategoryDoc}
        onClose={() => setChangeCategoryDoc(null)}
        title="修改文档分类"
        subtitle={changeCategoryDoc?.title}
        icon={<FolderEdit className="w-5 h-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setChangeCategoryDoc(null)}
              className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60"
            >
              取消
            </button>
            <button
              form="change-category-form"
              type="submit"
              className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold"
            >
              保存修改
            </button>
          </div>
        }
      >
        <form id="change-category-form" onSubmit={handleApplyCategoryChange} className="space-y-3">
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">请选择新的分类：</label>
            <LiquidSelect
              value={targetCategory}
              onChange={setTargetCategory}
              options={categoryOptions}
              allowCreate={true}
              onCreateOption={handleCreateCategory}
            />
          </div>
        </form>
      </LiquidModal>
    </div>
  );
};

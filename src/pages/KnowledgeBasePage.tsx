import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  MoreVertical,
  Edit3,
  Plus,
  ChevronDown,
  Upload,
  Download,
  FileText,
  Check,
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
import { clsx } from 'clsx';
import { marked } from 'marked';

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

function parseMarkdownToTiptapJson(mdText: string): string {
  if (!mdText || !mdText.trim()) {
    return JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    });
  }

  try {
    const tokens = marked.lexer(mdText);
    const contentNodes: any[] = [];

    const parseInlineTokens = (inlines: any[]): any[] => {
      if (!inlines) return [];
      const res: any[] = [];
      inlines.forEach((t) => {
        if (!t) return;
        const textVal = typeof t.text === 'string' ? t.text : typeof t.raw === 'string' ? t.raw : '';
        if (t.type === 'text') {
          if (textVal) res.push({ type: 'text', text: textVal });
        } else if (t.type === 'strong') {
          if (textVal) {
            res.push({
              type: 'text',
              text: textVal,
              marks: [{ type: 'bold' }],
            });
          }
        } else if (t.type === 'em') {
          if (textVal) {
            res.push({
              type: 'text',
              text: textVal,
              marks: [{ type: 'italic' }],
            });
          }
        } else if (t.type === 'codespan') {
          if (textVal) {
            res.push({
              type: 'text',
              text: textVal,
              marks: [{ type: 'code' }],
            });
          }
        } else if (t.type === 'del') {
          if (textVal) {
            res.push({
              type: 'text',
              text: textVal,
              marks: [{ type: 'strike' }],
            });
          }
        } else if (t.tokens && t.tokens.length > 0) {
          res.push(...parseInlineTokens(t.tokens));
        } else if (textVal) {
          res.push({ type: 'text', text: textVal });
        }
      });
      return res;
    };

    const makeNode = (type: string, content: any[], attrs?: any) => {
      const node: any = { type };
      if (attrs) node.attrs = attrs;
      if (content && content.length > 0) {
        node.content = content;
      }
      return node;
    };

    tokens.forEach((token) => {
      if (token.type === 'heading') {
        const inlines = parseInlineTokens(token.tokens || (token.text ? [{ type: 'text', text: token.text }] : []));
        contentNodes.push(makeNode('heading', inlines, { level: Math.min(3, token.depth || 1) }));
      } else if (token.type === 'paragraph') {
        const inlines = parseInlineTokens(token.tokens || (token.text ? [{ type: 'text', text: token.text }] : []));
        contentNodes.push(makeNode('paragraph', inlines));
      } else if (token.type === 'blockquote') {
        const subParagraphs = token.tokens?.map((sub: any) => {
          const inlines = parseInlineTokens(sub.tokens || (sub.text ? [{ type: 'text', text: sub.text }] : []));
          return makeNode('paragraph', inlines);
        }) || [makeNode('paragraph', parseInlineTokens(token.text ? [{ type: 'text', text: token.text }] : []))];

        contentNodes.push(makeNode('blockquote', subParagraphs));
      } else if (token.type === 'code') {
        const codeText = token.text || '';
        contentNodes.push(makeNode('codeBlock', codeText ? [{ type: 'text', text: codeText }] : []));
      } else if (token.type === 'hr') {
        contentNodes.push({ type: 'horizontalRule' });
      } else if (token.type === 'table') {
        const headerRow = makeNode(
          'tableRow',
          (token.header || []).map((cell: any) => {
            const inlines = parseInlineTokens(cell.tokens || (cell.text ? [{ type: 'text', text: cell.text }] : []));
            return makeNode('tableHeader', [makeNode('paragraph', inlines)]);
          })
        );
        const rows = (token.rows || []).map((row: any[]) =>
          makeNode(
            'tableRow',
            row.map((cell: any) => {
              const inlines = parseInlineTokens(cell.tokens || (cell.text ? [{ type: 'text', text: cell.text }] : []));
              return makeNode('tableCell', [makeNode('paragraph', inlines)]);
            })
          )
        );

        contentNodes.push(makeNode('table', [headerRow, ...rows]));
      } else if (token.type === 'list') {
        const isTask = (token.items || []).some((item: any) => item.task);
        if (isTask) {
          const taskItems = (token.items || []).map((item: any) => {
            const inlines = parseInlineTokens(item.tokens || (item.text ? [{ type: 'text', text: item.text }] : []));
            return makeNode('taskItem', [makeNode('paragraph', inlines)], { checked: !!item.checked });
          });
          contentNodes.push(makeNode('taskList', taskItems));
        } else {
          const listItems = (token.items || []).map((item: any) => {
            const inlines = parseInlineTokens(item.tokens || (item.text ? [{ type: 'text', text: item.text }] : []));
            return makeNode('listItem', [makeNode('paragraph', inlines)]);
          });
          contentNodes.push(makeNode(token.ordered ? 'orderedList' : 'bulletList', listItems));
        }
      }
    });

    if (contentNodes.length === 0) {
      contentNodes.push({
        type: 'paragraph',
        content: [{ type: 'text', text: mdText.trim() }],
      });
    }

    return JSON.stringify({
      type: 'doc',
      content: contentNodes,
    });
  } catch (e) {
    return JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: mdText.trim() }] }],
    });
  }
}

function convertTiptapJsonToMarkdown(jsonStr: string): string {
  if (!jsonStr) return '';
  try {
    const json = JSON.parse(jsonStr);
    if (!json || !Array.isArray(json.content)) return jsonStr;

    const lines: string[] = [];
    const parseNode = (node: any) => {
      if (!node) return;
      if (node.type === 'heading') {
        const prefix = '#'.repeat(node.attrs?.level || 1);
        const text = node.content?.map((c: any) => c.text).join('') || '';
        lines.push(`${prefix} ${text}\n`);
      } else if (node.type === 'paragraph') {
        const text = node.content?.map((c: any) => c.text).join('') || '';
        lines.push(`${text}\n`);
      } else if (node.type === 'blockquote') {
        const text = node.content?.map((c: any) => c.content?.map((x: any) => x.text).join('')).join('\n') || '';
        lines.push(`> ${text}\n`);
      } else if (node.type === 'codeBlock') {
        const text = node.content?.map((c: any) => c.text).join('') || '';
        lines.push(`\`\`\`\n${text}\n\`\`\`\n`);
      } else if (node.type === 'horizontalRule') {
        lines.push('---\n');
      } else if (node.type === 'taskList') {
        node.content?.forEach((item: any) => {
          const checked = item.attrs?.checked ? '[x]' : '[ ]';
          const text = item.content?.map((p: any) => p.content?.map((x: any) => x.text).join('')).join(' ') || '';
          lines.push(`- ${checked} ${text}`);
        });
        lines.push('');
      } else if (Array.isArray(node.content)) {
        node.content.forEach(parseNode);
      }
    };

    json.content.forEach(parseNode);
    return lines.join('\n');
  } catch (e) {
    return jsonStr;
  }
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
  
  // Category context menu and renaming state
  const [categoryMenu, setCategoryMenu] = useState<{ catName: string; x: number; y: number } | null>(null);
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameInputVal, setRenameInputVal] = useState('');

  // Batch Import / Export State
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [createDropdownPos, setCreateDropdownPos] = useState({ top: 0, left: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch Export Modal State
  const [showBatchExportModal, setShowBatchExportModal] = useState(false);
  const [exportSelectedDocIds, setExportSelectedDocIds] = useState<string[]>([]);

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
    const handleClose = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : (e.target as Node)?.parentElement;
      if (
        el &&
        (el.closest('.action-menu-trigger') ||
          el.closest('.action-menu-content') ||
          el.closest('.category-menu-trigger') ||
          el.closest('.category-menu-portal') ||
          el.closest('.create-dropdown-trigger') ||
          el.closest('.create-dropdown-portal'))
      ) {
        return;
      }
      setMenuId(null);
      setCategoryMenu(null);
      setShowCreateDropdown(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuId(null);
        setCategoryMenu(null);
        setShowCreateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  // Delete category and reset all its docs' category to null (Move to "全部")
  const handleDeleteCategory = (catName: string) => {
    if (catName === '全部') return;

    const docsInCat = allDocs.filter((d) => d.category === catName);

    // Optimistically set category to null for all documents in this category
    setLocalDocs((prev) =>
      prev.map((d) => (d.category === catName ? { ...d, category: null } : d))
    );

    docsInCat.forEach((d) => {
      updateKBMutation.mutate({
        id: d.id,
        title: d.title,
        category: null,
        content: d.content,
      });
    });

    setCategories((prev) => prev.filter((c) => c !== catName));

    if (selectedCategory === catName) {
      setSelectedCategory('全部');
    }

    setCategoryMenu(null);
    show(`已删除分类《${catName}》，属下 ${docsInCat.length} 篇文档已重置归属于【全部】`);
  };

  // Rename category and update all docs under this category
  const handleRenameCategorySubmit = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setRenamingCategory(null);
      return;
    }

    setLocalDocs((prev) =>
      prev.map((d) => (d.category === oldName ? { ...d, category: trimmed } : d))
    );

    const docsInCat = allDocs.filter((d) => d.category === oldName);
    docsInCat.forEach((d) => {
      updateKBMutation.mutate({
        id: d.id,
        title: d.title,
        category: trimmed,
        content: d.content,
      });
    });

    setCategories((prev) => prev.map((c) => (c === oldName ? trimmed : c)));

    if (selectedCategory === oldName) {
      setSelectedCategory(trimmed);
    }

    setRenamingCategory(null);
    show(`分类《${oldName}》已重命名为《${trimmed}》`);
  };

  // Batch Import Markdown Files Handler
  const handleBatchImportFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const targetCat = selectedCategory === '全部' ? null : selectedCategory;
    let importedCount = 0;

    for (const file of files) {
      try {
        const text = await file.text();
        const docTitle = file.name.replace(/\.[^/.]+$/, '');
        const jsonString = parseMarkdownToTiptapJson(text);

        addKBMutation.mutate({
          title: docTitle,
          category: targetCat,
          content: jsonString,
        });
        importedCount++;
      } catch (err) {}
    }

    show(`成功批量导入 ${importedCount} 个 Markdown 文档至分类【${selectedCategory}】`);
    setShowCreateDropdown(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Open Batch Export Modal (Preset all filtered docs checked)
  const handleOpenBatchExportModal = () => {
    setExportSelectedDocIds(filteredDocs.map((d) => d.id));
    setShowBatchExportModal(true);
    setShowCreateDropdown(false);
  };

  // Execute Export Selected Documents as .md files
  const handleExecuteBatchExport = () => {
    const docsToExport = filteredDocs.filter((d) => exportSelectedDocIds.includes(d.id));
    if (docsToExport.length === 0) {
      show('请勾选至少一个知识文档以导出！');
      return;
    }

    docsToExport.forEach((doc) => {
      const mdContent = convertTiptapJsonToMarkdown(doc.content);
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });

    show(`成功导出 ${docsToExport.length} 个 Markdown 文档！`);
    setShowBatchExportModal(false);
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
                <div key={cat} className="relative flex items-center group">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    onContextMenu={(e) => {
                      if (cat === '全部') return;
                      e.preventDefault();
                      setCategoryMenu({
                        catName: cat,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                      selectedCategory === cat
                        ? 'bg-white/15 text-emerald-300 shadow-sm border border-emerald-400/20'
                        : 'text-white/45 hover:text-white/80'
                    }`}
                  >
                    <span>{cat}</span>
                    {cat !== '全部' && (
                      <MoreVertical
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setCategoryMenu({
                            catName: cat,
                            x: rect.left,
                            y: rect.bottom + 4,
                          });
                        }}
                        className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:text-emerald-300 transition-all cursor-pointer"
                      />
                    )}
                  </button>
                </div>
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

              {/* Hidden File Input for Batch Importing Markdown Files */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".md,.markdown,.txt"
                multiple
                className="hidden"
                onChange={handleBatchImportFiles}
              />

              {/* Split Dropdown Create Button (Matches TopBar Capsule Style) */}
              <div className="relative flex items-center shrink-0">
                <div className="liquid-btn-primary h-9 pl-4 pr-1 rounded-full text-[12px] font-bold flex items-center gap-1 shadow-lg cursor-pointer">
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-1.5 py-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>新建知识文档</span>
                  </button>
                  <div className="w-px h-3.5 bg-black/20 mx-0.5" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setCreateDropdownPos({
                        top: rect.bottom + 8,
                        left: Math.min(rect.left, window.innerWidth - 220),
                      });
                      setShowCreateDropdown((v) => !v);
                    }}
                    className="create-dropdown-trigger p-1 rounded-full hover:bg-black/10 transition-colors"
                    title="批量导入 / 导出 Markdown 文档"
                  >
                    <ChevronDown
                      className={clsx('w-3.5 h-3.5 transition-transform duration-200', showCreateDropdown && 'rotate-180')}
                    />
                  </button>
                </div>
              </div>
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
                className="p-1.5 liquid-glass bg-[#0c101c]/95 min-w-[145px] action-menu-content shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
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

      {/* Category Right-Click Context Menu Portal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {categoryMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'fixed',
                  top: categoryMenu.y,
                  left: categoryMenu.x,
                  zIndex: 9999,
                }}
                className="w-44 p-1.5 liquid-glass bg-[#0c101c]/95 category-menu-portal shadow-2xl space-y-0.5 border border-white/15"
              >
                <div className="px-2 py-1 text-[10px] font-mono text-emerald-300/80 border-b border-white/10 mb-1 line-clamp-1">
                  分类: {categoryMenu.catName}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRenamingCategory(categoryMenu.catName);
                    setRenameInputVal(categoryMenu.catName);
                    setCategoryMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-white/85 hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cyan-300" /> 重命名分类
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteCategory(categoryMenu.catName)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-rose-300 hover:bg-rose-500/20 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 删除此分类
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Modal: Rename Category */}
      <LiquidModal
        open={!!renamingCategory}
        onClose={() => setRenamingCategory(null)}
        title="重命名知识分类"
        subtitle={`原分类名称: ${renamingCategory}`}
        icon={<Edit3 className="w-5 h-5 text-cyan-300" />}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRenamingCategory(null)}
              className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60"
            >
              取消
            </button>
            <button
              onClick={() =>
                renamingCategory && handleRenameCategorySubmit(renamingCategory, renameInputVal)
              }
              className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold"
            >
              保存修改
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="text-[11px] text-white/50 block">输入新分类名称：</label>
          <input
            value={renameInputVal}
            onChange={(e) => setRenameInputVal(e.target.value)}
            placeholder="如: 架构指南、产品周报..."
            className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-[13px] outline-none focus:border-emerald-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && renamingCategory) {
                handleRenameCategorySubmit(renamingCategory, renameInputVal);
              }
            }}
          />
        </div>
      </LiquidModal>

      {/* Create Button Split Dropdown Menu Portal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showCreateDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'fixed',
                  top: createDropdownPos.top,
                  left: createDropdownPos.left,
                  zIndex: 9999,
                }}
                className="w-52 p-1.5 liquid-glass bg-[#0c101c]/95 create-dropdown-portal shadow-2xl space-y-0.5 border border-white/15"
              >
                <div className="px-2 py-1 text-[10px] font-mono text-emerald-300/80 border-b border-white/10 mb-1">
                  当前分类: 【{selectedCategory}】
                </div>

                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-white/85 hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-300" /> 批量导入 Markdown (.md)
                </button>

                <button
                  type="button"
                  onClick={handleOpenBatchExportModal}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-white/85 hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-300" /> 批量导出 Markdown (.md)
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Modal: Batch Export Documents */}
      <LiquidModal
        open={showBatchExportModal}
        onClose={() => setShowBatchExportModal(false)}
        title="批量导出知识文档"
        subtitle={`分类【${selectedCategory}】下的文档导出清单`}
        icon={<Download className="w-5 h-5 text-cyan-300" />}
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => {
                if (exportSelectedDocIds.length === filteredDocs.length) {
                  setExportSelectedDocIds([]);
                } else {
                  setExportSelectedDocIds(filteredDocs.map((d) => d.id));
                }
              }}
              className="liquid-btn-ghost px-3 py-1.5 rounded-full text-[11px] text-white/70"
            >
              {exportSelectedDocIds.length === filteredDocs.length ? '取消全选' : '全选文档'}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setShowBatchExportModal(false)}
                className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60"
              >
                取消
              </button>
              <button
                onClick={handleExecuteBatchExport}
                className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold"
              >
                导出勾选的 ({exportSelectedDocIds.length}) 篇文档
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {filteredDocs.length === 0 ? (
            <div className="text-[12px] text-white/40 text-center py-6">
              当前分类下暂无文档可导出
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isChecked = exportSelectedDocIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setExportSelectedDocIds((prev) =>
                      isChecked ? prev.filter((id) => id !== doc.id) : [...prev, doc.id]
                    );
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-emerald-500/15 border-emerald-400/30 text-white'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[12px] font-semibold truncate">{doc.title}</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-emerald-400 border-emerald-400 text-black'
                        : 'border-white/30'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </LiquidModal>
    </div>
  );
};

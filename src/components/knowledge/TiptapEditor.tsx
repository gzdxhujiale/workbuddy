import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { DragHandle } from '@tiptap/extension-drag-handle-react';
import { Markdown } from '@tiptap/markdown';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Sparkles,
  CheckSquare,
  Minus,
  Table as TableIcon,
  Pilcrow,
  Plus,
  ChevronDown,
  GripVertical,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

interface TiptapEditorProps {
  content: string; // Stored JSON string
  onChange: (jsonStr: string) => void;
  editable?: boolean;
  isSaving?: boolean;
  lastSavedAt?: number;
}

// Parse Tiptap JSON AST Content
function parseInitialContent(contentStr: string) {
  if (!contentStr || !contentStr.trim()) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    };
  }

  try {
    return JSON.parse(contentStr);
  } catch (e) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    };
  }
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  editable = true,
  isSaving = false,
  lastSavedAt,
}) => {
  // Toolbar Block Menu State
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockMenuPos, setBlockMenuPos] = useState({ top: 0, left: 0 });
  const blockBtnRef = useRef<HTMLButtonElement>(null);

  // Drag Handle Menu State
  const [showHandleMenu, setShowHandleMenu] = useState(false);
  const [handleMenuPos, setHandleMenuPos] = useState({ top: 0, left: 0 });

  // Slash Command Menu state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        horizontalRule: false,
      }),
      HorizontalRule,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Markdown,
      Placeholder.configure({
        placeholder: "输入 '/' 快速插入块级节点...",
      }),
    ],
    content: parseInitialContent(content),
    editable,
    onUpdate: ({ editor }) => {
      // Export JSON AST
      const json = editor.getJSON();
      onChange(JSON.stringify(json));

      // Check for Slash Command '/' trigger
      const { selection } = editor.state;
      const parentText = selection.$from.parent.textContent;
      const isSlashTrigger = parentText === '/' || parentText.endsWith(' /');

      if (isSlashTrigger) {
        try {
          const domPos = editor.view.coordsAtPos(selection.from);
          const validLeft = Math.max(16, Math.min(domPos.left, window.innerWidth - 240));
          const validTop = Math.max(16, Math.min(domPos.bottom + 6, window.innerHeight - 300));
          setSlashPos({
            top: validTop,
            left: validLeft,
          });
          setShowSlashMenu(true);
        } catch (e) {
          setShowSlashMenu(true);
        }
      } else {
        if (showSlashMenu) setShowSlashMenu(false);
      }
    },
  });

  const updateBlockMenuPos = () => {
    if (blockBtnRef.current) {
      const rect = blockBtnRef.current.getBoundingClientRect();
      setBlockMenuPos({
        top: rect.bottom + 6,
        left: rect.left,
      });
    }
  };

  // Handle Slash Command Selection Safely
  const applySlashCommand = (action: () => void) => {
    if (!editor) return;
    const { selection } = editor.state;
    const parentText = selection.$from.parent.textContent;

    if (parentText === '/') {
      editor.chain().focus().command(({ tr, dispatch }) => {
        if (dispatch) {
          const start = selection.$from.start();
          const end = selection.$from.end();
          tr.delete(start, end);
        }
        return true;
      }).run();
    } else if (parentText.endsWith(' /')) {
      const from = selection.from - 2;
      const to = selection.from;
      if (from >= 0) {
        editor.chain().focus().deleteRange({ from, to }).run();
      }
    }

    action();
    setShowSlashMenu(false);
  };

  // Open Block Action Menu from DragHandle click
  const openHandleMenuFromBtn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setHandleMenuPos({
      top: rect.bottom + 6,
      left: rect.left,
    });
    setShowHandleMenu((v) => !v);
  };

  const deleteCurrentBlock = () => {
    if (!editor) return;
    const { selection } = editor.state;
    editor.chain().focus().deleteRange({ from: selection.$from.start(), to: selection.$from.end() + 1 }).run();
    setShowHandleMenu(false);
  };

  // Close menus on outside click or ESC
  useEffect(() => {
    const handleClose = (e: MouseEvent) => {
      const target = e.target as Node;
      if (blockBtnRef.current && blockBtnRef.current.contains(target)) return;
      setShowBlockMenu(false);
      if (!(target instanceof Element && target.closest('.drag-handle-menu-portal'))) {
        setShowHandleMenu(false);
      }
      if (!(target instanceof Element && target.closest('.slash-menu-portal'))) {
        setShowSlashMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowBlockMenu(false);
        setShowHandleMenu(false);
        setShowSlashMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync internal editor content if external doc changes
  useEffect(() => {
    if (editor) {
      const currentJson = JSON.stringify(editor.getJSON());
      if (content !== currentJson && !editor.isFocused) {
        editor.commands.setContent(parseInitialContent(content));
      }
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-white/30 text-[12px]">
        加载 JSON 块级智能编辑器...
      </div>
    );
  }

  const blockMenuItems = [
    {
      label: '普通段落 (Paragraph)',
      icon: Pilcrow,
      color: 'text-cyan-300',
      action: () => editor.chain().focus().setParagraph().run(),
    },
    {
      label: '一级标题 (Heading 1)',
      icon: Heading1,
      color: 'text-emerald-300',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: '二级标题 (Heading 2)',
      icon: Heading2,
      color: 'text-emerald-300',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: '三级标题 (Heading 3)',
      icon: Heading3,
      color: 'text-emerald-300',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: '待办清单 (Task List)',
      icon: CheckSquare,
      color: 'text-amber-300',
      action: () => editor.chain().focus().toggleTaskList().run(),
    },
    {
      label: '块级引用 (Blockquote)',
      icon: Quote,
      color: 'text-indigo-300',
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: '代码块 (Code Block)',
      icon: Code,
      color: 'text-teal-300',
      action: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      label: '表格节点 (Table)',
      icon: TableIcon,
      color: 'text-purple-300',
      action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      label: '分割线 (Horizontal Rule)',
      icon: Minus,
      color: 'text-white/50',
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
  ];

  return (
    <div className="w-full flex flex-col h-full rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md relative">
      {/* Editor Fixed Toolbar */}
      {editable && (
        <div className="px-3 py-2 border-b border-white/[0.08] bg-black/20 flex items-center justify-between gap-2 flex-wrap shrink-0 select-none min-h-[44px]">
          <div className="flex items-center gap-1 flex-wrap">
            {/* Block Type Dropdown Trigger */}
            <button
              ref={blockBtnRef}
              type="button"
              onClick={() => {
                updateBlockMenuPos();
                setShowBlockMenu((v) => !v);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-emerald-300 flex items-center gap-1 transition-colors"
              title="选择/转换块级节点"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>插入/转换块</span>
              <ChevronDown className={clsx('w-3 h-3 transition-transform', showBlockMenu && 'rotate-180')} />
            </button>

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Quick Text Formatting */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={clsx(
                'p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors',
                editor.isActive('bold') && 'bg-white/15 text-emerald-300 font-bold'
              )}
              title="加粗"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={clsx(
                'p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors',
                editor.isActive('italic') && 'bg-white/15 text-emerald-300 font-bold'
              )}
              title="斜体"
            >
              <Italic className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Heading Node Triggers */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={clsx(
                'p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors',
                editor.isActive('heading', { level: 1 }) && 'bg-white/15 text-emerald-300 font-bold'
              )}
              title="标题 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={clsx(
                'p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors',
                editor.isActive('heading', { level: 2 }) && 'bg-white/15 text-emerald-300 font-bold'
              )}
              title="标题 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* List and TaskList Nodes */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={clsx(
                'p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors',
                editor.isActive('taskList') && 'bg-white/15 text-emerald-300'
              )}
              title="待办事项块"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={clsx(
                'p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors',
                editor.isActive('bulletList') && 'bg-white/15 text-emerald-300'
              )}
              title="无序列表"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={clsx(
                'p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors',
                editor.isActive('orderedList') && 'bg-white/15 text-emerald-300'
              )}
              title="有序列表"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Blockquote and CodeBlock Nodes */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={clsx(
                'p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors',
                editor.isActive('blockquote') && 'bg-white/15 text-emerald-300'
              )}
              title="块引用"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={clsx(
                'p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors',
                editor.isActive('codeBlock') && 'bg-white/15 text-emerald-300'
              )}
              title="代码块"
            >
              <Code className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Undo / Redo */}
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded-lg text-white/40 hover:text-white disabled:opacity-30 transition-colors"
              title="撤销"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded-lg text-white/40 hover:text-white disabled:opacity-30 transition-colors"
              title="重做"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Sync Status Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/40 ml-auto">
            {isSaving ? (
              <span className="flex items-center gap-1 text-amber-300 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> JSON 同步中...
              </span>
            ) : lastSavedAt ? (
              <span className="text-emerald-400/80">
                JSON 已写出至云端 ({new Date(lastSavedAt).toLocaleTimeString()})
              </span>
            ) : (
              <span className="text-white/30">JSON 结构已就绪</span>
            )}
          </div>
        </div>
      )}

      {/* Official Tiptap Open-Source DragHandle Component Integration */}
      {editable && (
        <DragHandle editor={editor}>
          <button
            type="button"
            onClick={openHandleMenuFromBtn}
            className="p-1 rounded-lg bg-black/60 border border-white/20 text-white/70 hover:text-emerald-300 hover:border-emerald-400/50 hover:bg-emerald-500/20 backdrop-blur-md shadow-2xl cursor-grab active:cursor-grabbing transition-all"
            title="按住拖拽重排块 / 单击打开【插入/转换块】控制菜单"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        </DragHandle>
      )}

      {/* Editor Content Canvas */}
      <div
        onClick={() => {
          if (editor && !editor.isFocused) editor.commands.focus();
        }}
        className="flex-1 px-8 py-5 min-h-[340px] overflow-y-auto cursor-text tiptap-content-wrapper"
      >
        <EditorContent
          editor={editor}
          className="tiptap prose prose-invert max-w-none focus:outline-none min-h-[300px] caret-emerald-400"
        />
      </div>

      {/* Portal: DragHandle Click Menu */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showHandleMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'fixed',
                  top: handleMenuPos.top,
                  left: handleMenuPos.left,
                  zIndex: 9999,
                }}
                className="w-56 p-1.5 liquid-glass bg-[#0c101c]/95 drag-handle-menu-portal shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-1 border border-emerald-400/30"
              >
                <div className="px-2 py-1 text-[10px] font-mono text-emerald-300/80 border-b border-white/10 mb-1 flex items-center justify-between">
                  <span>转换此块节点为...</span>
                  <GripVertical className="w-3 h-3" />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
                  {blockMenuItems.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        item.action();
                        setShowHandleMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-white/85 hover:bg-emerald-500/20 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <item.icon className={clsx('w-3.5 h-3.5', item.color)} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-1 mt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={deleteCurrentBlock}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-rose-300 hover:bg-rose-500/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 删除此块节点
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Portal: Block Menu Fixed Portal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showBlockMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'fixed',
                  top: blockMenuPos.top,
                  left: blockMenuPos.left,
                  zIndex: 9999,
                }}
                className="w-52 p-1.5 liquid-glass bg-[#0c101c]/95 shadow-[0_20px_50px_rgba(0,0,0,0.65)] space-y-0.5 border border-white/10"
              >
                {blockMenuItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.action();
                      setShowBlockMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-white/80 hover:bg-white/10 flex items-center gap-2 transition-colors"
                  >
                    <item.icon className={clsx('w-3.5 h-3.5', item.color)} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Portal: Slash Command Menu Portal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showSlashMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'fixed',
                  top: slashPos.top,
                  left: slashPos.left,
                  zIndex: 9999,
                }}
                className="w-56 p-1.5 liquid-glass bg-[#0c101c]/95 slash-menu-portal shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-0.5 border border-emerald-400/30"
              >
                <div className="px-2 py-1 text-[10px] font-mono text-emerald-300/80 border-b border-white/10 mb-1">
                  快捷插入块级节点 (Slash Command)
                </div>
                {blockMenuItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => applySlashCommand(item.action)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-white/85 hover:bg-emerald-500/20 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <item.icon className={clsx('w-3.5 h-3.5', item.color)} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

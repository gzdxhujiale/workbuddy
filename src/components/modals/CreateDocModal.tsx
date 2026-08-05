import React, { useState } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import { useAddKnowledgeBase } from '@/lib/queries';
import { useToast } from '@/components/ui/Toast';
import { motion } from 'framer-motion';

interface CreateDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

export const CreateDocModal: React.FC<CreateDocModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = '',
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [categories, setCategories] = useState<string[]>([
    '产品文档',
    '设计规范',
    '技术文档',
    '测试文档',
    'AI 算法',
    '通用文档',
  ]);
  const addKBMutation = useAddKnowledgeBase();
  const { show, ToastEl } = useToast();

  const handleCreateCategory = (newCat: string) => {
    if (!categories.includes(newCat)) {
      setCategories((prev) => [...prev, newCat]);
      show(`已新建分类：${newCat}`);
    }
  };

  const categoryOptions = [
    { value: '', label: '未分类 (为空)' },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addKBMutation.mutate({
      title: title.trim(),
      category: category ? category : null,
      content: `<h2>${title.trim()}</h2><p>点击此处开始撰写知识文档内容...</p>`,
    });

    setTitle('');
    show('知识文档已创建并归档');
    onClose();
  };

  return (
    <>
      {ToastEl}
      <LiquidModal
        open={isOpen}
        onClose={onClose}
        title="创建新文档"
        subtitle="沉淀到团队知识库"
        icon={<Plus className="w-5 h-5" />}
        footer={
          <div className="flex items-center justify-end gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60"
            >
              取消
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="submit"
              form="create-doc-form"
              className="h-10 px-5 rounded-full liquid-btn-primary text-[12px] font-bold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              确认创建
            </motion.button>
          </div>
        }
      >
        <form id="create-doc-form" onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">
              文档标题 <span className="text-emerald-300">*</span>
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入文档标题..."
              className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white placeholder:text-white/30"
            />
          </div>
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">所属分类</label>
            <LiquidSelect
              value={category}
              onChange={setCategory}
              options={categoryOptions}
              allowCreate={true}
              onCreateOption={handleCreateCategory}
            />
          </div>
        </form>
      </LiquidModal>
    </>
  );
};

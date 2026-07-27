import React, { useState } from 'react';
import { Plus, CheckCircle2, Sparkles } from 'lucide-react';
import { Priority, TaskItem } from '@/types';
import confetti from 'canvas-confetti';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import { motion } from 'framer-motion';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Partial<TaskItem>) => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, onAddTask }) => {
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<'需求评审' | '产品设计' | '开发实现' | '测试验证'>('需求评审');
  const [priority, setPriority] = useState<Priority>('高');
  const [deadline, setDeadline] = useState('2025-05-30 18:00');
  const [assignee, setAssignee] = useState('Brandon');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('评审, 需求, 关键路径');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      id: `WXB-2025-0${Math.floor(Math.random() * 900) + 100}`,
      title,
      phase,
      priority,
      status: '进行中',
      time: '今天 ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      assignee: { name: assignee, avatar: assignee.slice(0, 2).toUpperCase(), role: '产品经理' },
      project: 'WenXiBuddy 2.0',
      deadline,
      description: description || '暂无详细描述信息。',
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      aiSuggestions: ['建议关联历史类似项目文档', '根据历时数据推算，建议预留 15% 缓冲时间'],
    });

    confetti({ particleCount: 55, spread: 62, origin: { y: 0.62 }, colors: ['#34d399', '#6ee7b7', '#a7f3d0', '#ffffff'] });
    setTitle('');
    setDescription('');
    onClose();
  };

  const field = 'liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white placeholder:text-white/30';

  return (
    <LiquidModal
      open={isOpen}
      onClose={onClose}
      title="新增任务"
      subtitle="高效规划 · 智能协同 · 结果驱动"
      icon={<Plus className="w-5 h-5" />}
      footer={
        <div className="flex items-center justify-end gap-2">
          <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={onClose} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">
            取消
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="submit"
            form="new-task-form"
            className="h-10 px-5 rounded-full liquid-btn-primary text-[12px] font-bold flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            立即创建
          </motion.button>
        </div>
      }
    >
      <form id="new-task-form" onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[11px] text-white/40 mb-1.5">任务名称 <span className="text-emerald-300">*</span></label>
          <input className={field} required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="请输入任务标题..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">所属阶段</label>
            <LiquidSelect
              value={phase}
              onChange={(v) => setPhase(v as typeof phase)}
              options={[
                { value: '需求评审', label: '需求评审' },
                { value: '产品设计', label: '产品设计' },
                { value: '开发实现', label: '开发实现' },
                { value: '测试验证', label: '测试验证' },
              ]}
            />
          </div>
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">优先级</label>
            <LiquidSelect
              value={priority}
              onChange={(v) => setPriority(v as Priority)}
              options={[
                { value: '高', label: '高' },
                { value: '中', label: '中' },
                { value: '低', label: '低' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">负责人</label>
            <input className={field} value={assignee} onChange={(e) => setAssignee(e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">截止时间</label>
            <input className={field} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-white/40 mb-1.5">任务描述</label>
          <textarea className={`${field} resize-none`} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="输入更详细的需求说明..." />
        </div>

        <div>
          <label className="block text-[11px] text-white/40 mb-1.5">标签（逗号分隔）</label>
          <input className={field} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
        </div>

        <div className="p-3 rounded-2xl bg-emerald-400/[0.06] border border-emerald-400/20 text-[11px] text-emerald-100/80 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
          <span>AI 助手将在任务创建后自动分配协同资源与智能风险预警。</span>
        </div>
      </form>
    </LiquidModal>
  );
};

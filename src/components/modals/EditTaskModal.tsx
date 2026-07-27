import React, { useEffect, useState } from 'react';
import { Edit3, CheckCircle2, Trash2 } from 'lucide-react';
import { Priority, TaskStatus } from '@/types';
import { useApp } from '@/context/AppContext';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import { motion } from 'framer-motion';

export const EditTaskModal: React.FC = () => {
  const { editingTask, setEditingTask, updateTask, deleteTask } = useApp();
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<'需求评审' | '产品设计' | '开发实现' | '测试验证'>('需求评审');
  const [priority, setPriority] = useState<Priority>('高');
  const [status, setStatus] = useState<TaskStatus>('进行中');
  const [deadline, setDeadline] = useState('');
  const [assignee, setAssignee] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (!editingTask) return;
    setTitle(editingTask.title);
    setPhase(editingTask.phase);
    setPriority(editingTask.priority);
    setStatus(editingTask.status);
    setDeadline(editingTask.deadline);
    setAssignee(editingTask.assignee.name);
    setDescription(editingTask.description);
    setTagsInput(editingTask.tags.join(', '));
  }, [editingTask]);

  const open = !!editingTask;
  const field = 'liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    updateTask(editingTask.id, {
      title,
      phase,
      priority,
      status,
      deadline,
      assignee: { ...editingTask.assignee, name: assignee },
      description,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setEditingTask(null);
  };

  const handleDelete = () => {
    if (!editingTask) return;
    if (confirm(`确认删除任务 ${editingTask.id}（${editingTask.title}）吗？`)) {
      deleteTask(editingTask.id);
      setEditingTask(null);
    }
  };

  return (
    <LiquidModal
      open={open}
      onClose={() => setEditingTask(null)}
      title="编辑任务详情"
      subtitle={editingTask ? <span className="font-mono text-emerald-300/80">{editingTask.id}</span> : undefined}
      icon={<Edit3 className="w-5 h-5" />}
      footer={
        <div className="flex items-center justify-between gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={handleDelete}
            className="h-10 px-3 rounded-full bg-rose-500/10 border border-rose-400/30 text-rose-300 text-[12px] font-semibold flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            删除
          </motion.button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setEditingTask(null)} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">
              取消
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="submit"
              form="edit-task-form"
              className="h-10 px-5 rounded-full liquid-btn-primary text-[12px] font-bold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              保存修改
            </motion.button>
          </div>
        </div>
      }
    >
      <form id="edit-task-form" onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[11px] text-white/40 mb-1.5">任务名称</label>
          <input className={field} required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">阶段</label>
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
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">状态</label>
            <LiquidSelect
              value={status}
              onChange={(v) => setStatus(v as TaskStatus)}
              options={[
                { value: '进行中', label: '进行中' },
                { value: '已完成', label: '已完成' },
                { value: '待处理', label: '待处理' },
                { value: '已延期', label: '已延期' },
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
          <label className="block text-[11px] text-white/40 mb-1.5">详细描述</label>
          <textarea className={`${field} resize-none`} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="block text-[11px] text-white/40 mb-1.5">标签</label>
          <input className={field} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
        </div>
      </form>
    </LiquidModal>
  );
};

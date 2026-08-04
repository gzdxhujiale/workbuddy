import React, { useState } from 'react';
import { CalendarPlus, CheckCircle2 } from 'lucide-react';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import { useAddScheduleEvent } from '@/lib/queries';
import { useToast } from '@/components/ui/Toast';
import { motion } from 'framer-motion';

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateScheduleModal: React.FC<CreateScheduleModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('线上会议室 Alpha');
  const [priority, setPriority] = useState<'高' | '中' | '低'>('高');
  const [attendees, setAttendees] = useState('Brandon, Elena, David');
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(11);

  const addEventMutation = useAddScheduleEvent();
  const { show, ToastEl } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addEventMutation.mutate({
      title: title.trim(),
      room,
      priority,
      startTime: Date.now(),
      endTime: Date.now() + 3600000,
      attendees: attendees.split(',').map((a) => a.trim()).filter(Boolean),
      status: '待开始',
    });

    setTitle('');
    show('日程预约成功');
    onClose();
  };

  const field = 'liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white placeholder:text-white/30';

  return (
    <>
      {ToastEl}
      <LiquidModal
        open={isOpen}
        onClose={onClose}
        title="预约新日程"
        subtitle="智能日历 · 会议排期与冲突预警"
        icon={<CalendarPlus className="w-5 h-5 text-emerald-300" />}
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
              form="create-schedule-form"
              className="h-10 px-5 rounded-full liquid-btn-primary text-[12px] font-bold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              确认预约
            </motion.button>
          </div>
        }
      >
        <form id="create-schedule-form" onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">
              会议 / 日程主题 <span className="text-emerald-300">*</span>
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入日程主题..."
              className={field}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-white/40 mb-1.5">会议地点 / 链接</label>
              <input value={room} onChange={(e) => setRoom(e.target.value)} className={field} />
            </div>
            <div>
              <label className="block text-[11px] text-white/40 mb-1.5">优先级</label>
              <LiquidSelect
                value={priority}
                onChange={(v) => setPriority(v as any)}
                options={[
                  { value: '高', label: '高优先级' },
                  { value: '中', label: '中优先级' },
                  { value: '低', label: '低优先级' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-white/40 mb-1.5">开始时间</label>
              <LiquidSelect
                value={String(startHour)}
                onChange={(v) => setStartHour(Number(v))}
                options={Array.from({ length: 12 }, (_, i) => i + 8).map((h) => ({
                  value: String(h),
                  label: `${h}:00`,
                }))}
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/40 mb-1.5">结束时间</label>
              <LiquidSelect
                value={String(endHour)}
                onChange={(v) => setEndHour(Number(v))}
                options={Array.from({ length: 12 }, (_, i) => i + 8).map((h) => ({
                  value: String(h),
                  label: `${h}:00`,
                }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">参会人（逗号分隔）</label>
            <input value={attendees} onChange={(e) => setAttendees(e.target.value)} className={field} />
          </div>
        </form>
      </LiquidModal>
    </>
  );
};

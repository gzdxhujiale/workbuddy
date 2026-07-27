import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, MessageSquare, Mail } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import { useToast } from '@/components/ui/Toast';
import { springSoft } from '@/lib/motion';

const initialMembers = [
  { name: 'Brandon', avatar: 'BR', role: '产品经理', tasks: 12, status: '在线', workload: '85%' },
  { name: 'David', avatar: 'DV', role: '前端架构师', tasks: 8, status: '忙碌中', workload: '92%' },
  { name: 'Elena', avatar: 'EL', role: 'UI/UX设计师', tasks: 6, status: '在线', workload: '78%' },
  { name: 'Sarah', avatar: 'SR', role: 'UX研究员', tasks: 5, status: '离线', workload: '60%' },
  { name: 'Alex', avatar: 'AX', role: '产品助理', tasks: 9, status: '在线', workload: '80%' },
  { name: 'Michael', avatar: 'MC', role: '后端工程师', tasks: 11, status: '在线', workload: '88%' },
];

export const TeamCollaborationPage: React.FC = () => {
  const { show, ToastEl } = useToast();
  const [members, setMembers] = useState(initialMembers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState<(typeof initialMembers)[0] | null>(null);
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('产品助理');
  const [msgText, setMsgText] = useState('');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) return;
    setMembers((prev) => [
      {
        name: inviteName.trim(),
        avatar: inviteName.trim().slice(0, 2).toUpperCase(),
        role: inviteRole,
        tasks: 0,
        status: '在线',
        workload: '10%',
      },
      ...prev,
    ]);
    setInviteName('');
    setInviteOpen(false);
    show(`已邀请 ${inviteName.trim()} 加入协作`);
  };

  return (
    <div className="w-full min-h-full space-y-5 pb-4">
      {ToastEl}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[20px] font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-300" />
            团队协作矩阵
          </h2>
          <p className="text-[12px] text-white/40">实时协同状态 · 成员负载把控与任务协同流</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold flex items-center gap-1.5"
        >
          <UserCheck className="w-4 h-4" />
          邀请新成员
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {members.map((member, idx) => (
          <motion.div
            key={`${member.name}-${idx}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, ...springSoft }}
          >
            <GlassCard variant="interactive" className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl liquid-icon-well font-bold text-[12px] text-white flex items-center justify-center shrink-0">
                    {member.avatar}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-bold text-white truncate">{member.name}</h3>
                    <p className="text-[11px] text-white/40">{member.role}</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                    member.status === '在线'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : member.status === '忙碌中'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-white/5 text-white/40 border border-white/10'
                  }`}
                >
                  {member.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-black/25 border border-white/[0.05]">
                  <div className="text-white/40">在办任务</div>
                  <div className="text-[16px] font-bold text-white font-mono mt-0.5">{member.tasks} 项</div>
                </div>
                <div className="p-2.5 rounded-xl bg-black/25 border border-white/[0.05]">
                  <div className="text-white/40">负荷饱和度</div>
                  <div className="text-[16px] font-bold text-emerald-300 font-mono mt-0.5">{member.workload}</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setMsgOpen(member);
                    setMsgText('');
                  }}
                  className="liquid-btn-ghost w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white"
                  title="发消息"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => show(`已向 ${member.name} 发送邮件邀请协同`)}
                  className="liquid-btn-ghost w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white"
                  title="发邮件"
                >
                  <Mail className="w-3.5 h-3.5" />
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <LiquidModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="邀请新成员"
        subtitle="加入当前工作区协作"
        icon={<UserCheck className="w-5 h-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setInviteOpen(false)} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">取消</button>
            <button form="invite-form" type="submit" className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold">发送邀请</button>
          </div>
        }
      >
        <form id="invite-form" onSubmit={handleInvite} className="space-y-3">
          <input
            required
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="成员姓名"
            className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white"
          />
          <LiquidSelect
            value={inviteRole}
            onChange={setInviteRole}
            options={[
              { value: '产品助理', label: '产品助理' },
              { value: '前端工程师', label: '前端工程师' },
              { value: '后端工程师', label: '后端工程师' },
              { value: '设计师', label: '设计师' },
            ]}
          />
        </form>
      </LiquidModal>

      <LiquidModal
        open={!!msgOpen}
        onClose={() => setMsgOpen(null)}
        title={msgOpen ? `消息 · ${msgOpen.name}` : '消息'}
        subtitle={msgOpen?.role}
        icon={<MessageSquare className="w-5 h-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setMsgOpen(null)} className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60">取消</button>
            <button
              onClick={() => {
                if (!msgText.trim()) return;
                show(`已发送给 ${msgOpen?.name}`);
                setMsgOpen(null);
              }}
              className="h-10 px-4 rounded-full liquid-btn-primary text-[12px] font-bold"
            >
              发送
            </button>
          </div>
        }
      >
        <textarea
          rows={4}
          value={msgText}
          onChange={(e) => setMsgText(e.target.value)}
          placeholder="输入协同消息..."
          className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white resize-none"
        />
      </LiquidModal>
    </div>
  );
};

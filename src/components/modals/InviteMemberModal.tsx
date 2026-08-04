import React, { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { LiquidModal } from '@/components/ui/LiquidModal';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import { useToast } from '@/components/ui/Toast';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite?: (name: string, role: string) => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, onInvite }) => {
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('产品助理');
  const { show, ToastEl } = useToast();

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) return;

    if (onInvite) {
      onInvite(inviteName.trim(), inviteRole);
    }
    show(`已邀请 ${inviteName.trim()} 加入协作`);
    setInviteName('');
    onClose();
  };

  return (
    <>
      {ToastEl}
      <LiquidModal
        open={isOpen}
        onClose={onClose}
        title="邀请新成员"
        subtitle="加入当前工作区协作"
        icon={<UserCheck className="w-5 h-5 text-emerald-300" />}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-full liquid-btn-ghost text-[12px] text-white/60"
            >
              取消
            </button>
            <button
              form="invite-member-form"
              type="submit"
              className="h-10 px-5 rounded-full liquid-btn-primary text-[12px] font-bold"
            >
              发送邀请
            </button>
          </div>
        }
      >
        <form id="invite-member-form" onSubmit={handleInvite} className="space-y-3.5">
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">
              成员姓名 <span className="text-emerald-300">*</span>
            </label>
            <input
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="请输入成员姓名..."
              className="liquid-input w-full px-3.5 py-2.5 rounded-xl text-[12px] text-white placeholder:text-white/30"
            />
          </div>
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">担任角色</label>
            <LiquidSelect
              value={inviteRole}
              onChange={setInviteRole}
              options={[
                { value: '产品助理', label: '产品助理' },
                { value: '前端工程师', label: '前端工程师' },
                { value: '后端工程师', label: '后端工程师' },
                { value: '设计师', label: '设计师' },
                { value: '测试工程师', label: '测试工程师' },
              ]}
            />
          </div>
        </form>
      </LiquidModal>
    </>
  );
};

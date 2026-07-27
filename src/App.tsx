import React, { useRef, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { TaskManagementPage } from '@/pages/TaskManagementPage';
import { ProjectOverviewPage } from '@/pages/ProjectOverviewPage';
import { FileDocumentsPage } from '@/pages/FileDocumentsPage';
import { ScheduleManagementPage } from '@/pages/ScheduleManagementPage';
import { TeamCollaborationPage } from '@/pages/TeamCollaborationPage';
import { AIAnalyticsPage } from '@/pages/AIAnalyticsPage';
import { KnowledgeBasePage } from '@/pages/KnowledgeBasePage';
import { SettingsCenterPage } from '@/pages/SettingsCenterPage';
import { NewTaskModal } from '@/components/modals/NewTaskModal';
import { EditTaskModal } from '@/components/modals/EditTaskModal';
import { NavTab } from '@/types';
import { AppProvider, useApp } from '@/context/AppContext';
import { RouteTransition } from '@/components/ui/PageTransition';

const TAB_ORDER: NavTab[] = [
  'tasks',
  'overview',
  'files',
  'schedule',
  'collaboration',
  'analytics',
  'knowledge',
  'settings',
];

function MainLayout() {
  const [activeTab, setActiveTab] = useState<NavTab>('tasks');
  const { isNewTaskOpen, setIsNewTaskOpen, addTask } = useApp();
  const prevTab = useRef<NavTab>(activeTab);
  const [direction, setDirection] = useState(1);

  const handleTabChange = (tab: NavTab) => {
    const from = TAB_ORDER.indexOf(prevTab.current);
    const to = TAB_ORDER.indexOf(tab);
    setDirection(to >= from ? 1 : -1);
    prevTab.current = tab;
    setActiveTab(tab);
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'tasks':
        return <TaskManagementPage />;
      case 'overview':
        return <ProjectOverviewPage />;
      case 'files':
        return <FileDocumentsPage />;
      case 'schedule':
        return <ScheduleManagementPage />;
      case 'collaboration':
        return <TeamCollaborationPage />;
      case 'analytics':
        return <AIAnalyticsPage />;
      case 'knowledge':
        return <KnowledgeBasePage />;
      case 'settings':
        return <SettingsCenterPage />;
      default:
        return <TaskManagementPage />;
    }
  };

  const getPageTitle = (tab: NavTab) => {
    switch (tab) {
      case 'tasks':
        return { title: '任务管理', subtitle: '高效规划 · 智能协同 · 结果驱动' };
      case 'overview':
        return { title: '项目总览', subtitle: '全景里程碑 · 研发健康度与进度跟进' };
      case 'files':
        return { title: '文件归档', subtitle: '归档沉淀 · 多维搜索与历史版本可溯' };
      case 'schedule':
        return { title: '日程管理', subtitle: '智能日历 · 会议排期与冲突预警' };
      case 'collaboration':
        return { title: '团队协作', subtitle: '实时矩阵 · 成员负载与任务指派' };
      case 'analytics':
        return { title: '智能分析', subtitle: 'AI 效能推演 · 链路瓶颈与风险评估' };
      case 'knowledge':
        return { title: '知识库', subtitle: '沉淀最佳实践 · 团队 SOP 规格标准' };
      case 'settings':
        return { title: '设置中心', subtitle: '自定义液态玻璃视觉与协同偏好' };
    }
  };

  const pageInfo = getPageTitle(activeTab);

  return (
    <div className="w-full h-screen liquid-shell text-white overflow-hidden font-sans">
      <div className="app-frame relative z-10">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="main-stack min-h-0">
          <TopBar title={pageInfo.title} subtitle={pageInfo.subtitle} titleKey={activeTab} />

          <main className="flex-1 min-h-0 overflow-hidden relative">
            {/* 页面切换遮罩光效 */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
              <div className="absolute -top-20 left-1/3 w-72 h-72 bg-emerald-500/5 blur-[100px] rounded-full" />
            </div>

            <RouteTransition
              routeKey={activeTab}
              direction={direction}
              className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden"
            >
              {renderActivePage()}
            </RouteTransition>
          </main>
        </div>
      </div>

      <NewTaskModal isOpen={isNewTaskOpen} onClose={() => setIsNewTaskOpen(false)} onAddTask={addTask} />
      <EditTaskModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

# 用户编程操作手册 (User Programming Manual)

> **版本**: V9 (Current)
> **更新日期**: 2026-01-28
> **状态**: 现行有效

本文档旨在指导开发者如何使用 AIGen-UI 的 **V9 配置系统** 快速构建和维护页面功能。

---

## 核心架构变革：从 "代码驱动" 到 "配置驱动"

在旧版 (V1) 中，开发一个带有筛选和表格的页面需要编写大量的 TypeScript 代码来定义常量、状态和逻辑。
在 **V9 架构** 中，我们引入了可视化的 **配置模式 (Edit Mode)**。大部分页面元素（筛选条件、表格列、操作按钮、卡片）都可以直接通过 UI 进行增删改查，配置会自动同步到云端数据库 (Supabase)。

### 适用场景
本手册适用于基于通用模板 (如 `Page1.vue`) 构建的页面。

---

## 1. 开启编辑模式 (Edit Mode)

要配置当前页面，首先需要进入编辑模式。

1.  **方法 A (通过顶部菜单)**:
    - 点击右上角的用户头像。
    - 在下拉菜单中选择 **"编辑模式"** (Toggle Edit Mode)。
    
2.  **方法 B (快捷键)**:
    - (如果已配置快捷键/开发环境下) 通常在 `ShadcnLayout` 或 `ArcoLayout` 中有相应的 Developer Mode 开关。

进入编辑模式后，页面上会出现蓝色的虚线框和编辑图标 (Pencil Icon)，表示各个区域现在是可配置的。

---

## 2. 配置筛选区域 (Filter Area)

### 2.1 新增筛选条件
1.  找到筛选区域（页面顶部），点击 **"添加筛选"** (+ Add Filter) 按钮。
2.  在弹出的表单中填写配置：
    - **Key**: 字段名 (对应 API 查询参数，如 `status`, `created_at`)。
    - **标签 (Label)**: 显示在界面上的名称 (如 "订单状态")。
    - **类型 (Type)**:
        - `Input`: 文本输入框。
        - `Select`: 下拉选择框。
        - `DateRange`: 日期范围选择。
        - `TreeSelect`: 树形选择（支持层级数据）。
    - **占位符 (Placeholder)**: 输入框提示语。
    - **选项 (Options)**: (仅 Select) 以逗号分隔的字符串，如 `全部,启用,禁用`。
    - **树形选项 (Tree Options JSON)**: (仅 TreeSelect) 符合 JSON 格式的树形数据结构。
    
3.  点击 **"确认"** 保存。

### 2.2 编辑/删除筛选
- **编辑**: 鼠标悬停在某个筛选项上，点击出现的 **编辑 (Pencil)** 图标。
- **删除**: 鼠标悬停在筛选项上，点击出现的 **删除 (Trash)** 图标。
- **排序**: 在编辑模式下，直接拖拽筛选项即可调整顺序。

---

## 3. 配置表格列 (Table Columns)

### 3.1 新增列
1.  在表格区域顶部，点击 **"添加列"** (+ Add Column) 按钮。
2.  填写列配置：
    - **Key**: 数据源字段名 (如 `id`, `amount`)。
    - **表头 (Label)**: 列显示名称。
    - **宽度 (Width)**: CSS 宽度 (如 `120px` 或 `auto`)。
    - **类型 (Type)**:
        - `Text`: 普通文本。
        - `Tag`: 标签样式 (常用于状态)。
        - `Button`: 操作按钮组。
        - `Image`: 图片展示。
    - **Mock 格式**: 选择生成模拟数据的规则 (如 `name`, `date`, `money`, `conditional`)。
    
### 3.2 动态模拟数据 (Smart Mock Data)
V9 系统内置了强大的 Mock 引擎。当你配置好列的 `Mock 格式` 后，系统会自动为每一行生成逼真的测试数据，无需后端接口即可预览页面效果。
- **Conditional Mock**: 可以配置根据其他列的值生成不同的数据（例如：当 Status=Failed 时，Remark 显示错误原因）。

---

## 4. 配置操作按钮 (Action Buttons)

### 4.1 按钮类型与效果
在筛选区右侧或表格行内，我们可以添加操作按钮。

1.  **Variant (样式)**: `Solid` (实心), `Outline` (描边), `Text` (仅文字)。
2.  **Effect Type (交互效果)**:
    - `None`: 无内置效果 (仅触发事件，供代码调用)。
    - `Modal`: 弹出一个信息/表单弹窗。
    - `Table`: (嵌套表格) 弹出一个包含另一个页面表格数据的弹窗。
    
### 4.2 配置联动 (Linking)
如果是 `Table` 类型的按钮，你可以指定 **Target Page ID**。点击该按钮时，会加载目标页面的表格配置并展示在模态框中，实现 "查看详情 -> 关联列表" 的钻取交互。

---

## 5. 高级：自定义代码扩展

虽然 UI 配置能覆盖 90% 的需求，但有时我们需要特殊的逻辑。

### 5.1 获取配置数据
在代码中，你可以通过 Pinia Store 获取当前页面的完整配置：

```typescript
import { useConfigStore } from '@/stores/configStore'
import { useConfigPageStore } from '@/stores/config_page_Store'

const pageStore = useConfigPageStore()
// 获取特定页面的配置
const config = pageStore.getSubPageConfig(navTitle, navId)
```

### 5.2 监听事件
在 `Page1.vue` 或其他模板中，所有 UI 配置的按钮点击都会派发统一的事件，你可以在组件中拦截这些事件处理自定义业务逻辑（如调用特殊 API）。

```typescript
// 在 actions 对象中扩展 custom handlers
const actions = {
  handleAction(key: string, record?: any) {
    if (key === 'btn_export') {
      // 处理导出逻辑
      exportService.download(...)
    }
    // ... default handler
  }
}
```

---

## 附录：配置文件结构 (TypeScript Interface)

参见 `src/types/page-config.ts` 获取最新的类型定义。

- `Page1Config`
    - `filterArea`: `FilterAreaConfig`
    - `tableArea`: `TableAreaConfig`
    - `actionsArea`: `ActionsAreaConfig`
    - `cardArea`: `CardAreaConfig`

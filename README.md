# 智能待办事项应用 (Smart Todo App)

一个功能完善的待办事项管理应用，使用原生 JavaScript 开发，展示现代前端开发技能。

## ✨ 功能特性

- 📊 **实时统计面板** - 总任务、已完成、待完成、完成率实时展示
- 🎯 **优先级管理** - 支持高、中、低三种优先级，颜色区分
- 🔍 **智能过滤** - 按全部、待完成、已完成、高优先级筛选任务
- 💾 **本地存储** - 使用 LocalStorage 持久化数据，关闭浏览器不丢失
- 📱 **响应式设计** - 完美适配手机、平板、电脑
- 🎨 **精美 UI** - 现代化渐变设计，流畅动画效果
- ⌨️ **快捷键支持** - Enter 键快速添加任务

## 🚀 技术栈

- **HTML5** - 语义化标签
- **CSS3** - Flexbox、Grid、渐变、动画
- **JavaScript (ES6+)** - 模块化、箭头函数、模板字符串
- **LocalStorage API** - 数据持久化
- **响应式设计** - 移动优先

## 📦 安装和使用

1. 克隆项目
```bash
git clone <your-repo-url>
cd smart-todo-app
```

2. 直接在浏览器打开
```bash
# 方式 1：直接打开
open index.html

# 方式 2：使用本地服务器
npx http-server
# 访问 http://localhost:8080
```

## 🎯 核心功能代码示例

### 任务数据结构
```javascript
{
    id: "unique-id",
    text: "任务内容",
    priority: "high|medium|low",
    completed: false,
    createdAt: "2026-03-22T..."
}
```

### LocalStorage 持久化
```javascript
// 保存
localStorage.setItem('smartTodoTasks', JSON.stringify(tasks));

// 加载
const tasks = JSON.parse(localStorage.getItem('smartTodoTasks'));
```

## 📱 项目截图

（添加项目截图）

## 🔧 功能扩展建议

- [ ] 添加任务分类/标签
- [ ] 添加任务截止日期和提醒
- [ ] 添加任务搜索功能
- [ ] 添加数据导出/导入
- [ ] 添加深色模式
- [ ] 添加任务拖拽排序

## 📄 License

MIT

## 👤 作者

你的姓名 - [GitHub 链接]

---

**适合简历的技能点：**
- ✅ JavaScript ES6+ 语法
- ✅ DOM 操作和事件处理
- ✅ LocalStorage 数据持久化
- ✅ 响应式 Web 设计
- ✅ CSS 动画和过渡效果
- ✅ 代码组织和模块化思维

# 任务看板 Task Board

一个纯前端任务管理项目，用来展示表单录入、状态管理、本地持久化、筛选搜索和数据导出能力。

## 在线演示

[访问项目](https://aur0ra333.github.io/smart-todo-app/)

## 功能

- 任务字段：标题、优先级、状态、分类、截止日期和备注
- 状态流转：待处理、进行中、已完成
- 搜索与筛选：支持按关键字、状态、今日到期、逾期和高优先级过滤
- 数据统计：总任务、进行中、今日到期、完成率、分类进度和近期截止
- 本地持久化：使用 LocalStorage 保存任务数据
- 数据导出：一键导出 CSV，方便继续整理或汇报

## 技术点

- HTML5 语义化结构
- CSS Grid / Flexbox 响应式布局
- 原生 JavaScript 状态管理和 DOM 渲染
- LocalStorage 数据持久化
- Blob API 生成 CSV 下载

## 本地运行

```bash
git clone https://github.com/aur0ra333/smart-todo-app.git
cd smart-todo-app
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

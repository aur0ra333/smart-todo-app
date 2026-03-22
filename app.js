// 任务数据结构
let tasks = [];
let currentFilter = 'all';

// 从 LocalStorage 加载任务
function loadTasks() {
    const savedTasks = localStorage.getItem('smartTodoTasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
}

// 保存任务到 LocalStorage
function saveTasks() {
    localStorage.setItem('smartTodoTasks', JSON.stringify(tasks));
}

// 生成唯一 ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 添加任务
function addTask(text, priority) {
    if (!text.trim()) return;
    
    const task = {
        id: generateId(),
        text: text.trim(),
        priority: priority,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(task);
    saveTasks();
    renderTasks();
    updateStats();
}

// 删除任务
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
}

// 切换任务状态
function toggleTask(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// 过滤任务
function filterTasks(filter) {
    currentFilter = filter;
    
    switch (filter) {
        case 'pending':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        case 'high':
            return tasks.filter(task => task.priority === 'high' && !task.completed);
        default:
            return tasks;
    }
}

// 更新统计信息
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('total-tasks').textContent = total;
    document.getElementById('completed-tasks').textContent = completed;
    document.getElementById('pending-tasks').textContent = pending;
    document.getElementById('completion-rate').textContent = `${rate}%`;
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        return '今天';
    } else if (days === 1) {
        return '昨天';
    } else if (days < 7) {
        return `${days}天前`;
    } else {
        return date.toLocaleDateString('zh-CN');
    }
}

// 渲染任务列表
function renderTasks() {
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const filteredTasks = filterTasks(currentFilter);
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    taskList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''} priority-${task.priority}">
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''}
                onchange="toggleTask('${task.id}')"
            />
            <div class="task-content">
                <div class="task-text">${escapeHtml(task.text)}</div>
                <div class="task-meta">
                    <span class="task-priority ${task.priority}">${getPriorityText(task.priority)}</span>
                    <span>${formatDate(task.createdAt)}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-delete" onclick="deleteTask('${task.id}')">删除</button>
            </div>
        </div>
    `).join('');
}

// 获取优先级文本
function getPriorityText(priority) {
    const texts = {
        'high': '高优先级',
        'medium': '中优先级',
        'low': '低优先级'
    };
    return texts[priority] || priority;
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderTasks();
    updateStats();
    
    // 添加任务
    const addBtn = document.getElementById('add-btn');
    const taskInput = document.getElementById('task-input');
    const prioritySelect = document.getElementById('priority-select');
    
    addBtn.addEventListener('click', () => {
        addTask(taskInput.value, prioritySelect.value);
        taskInput.value = '';
        taskInput.focus();
    });
    
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask(taskInput.value, prioritySelect.value);
            taskInput.value = '';
        }
    });
    
    // 过滤标签
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks();
        });
    });
});

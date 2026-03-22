// ====================
// Smart Todo App - 增强版 JavaScript
// ====================

// 任务数据
let tasks = [];
let currentFilter = 'all';
let currentSort = 'default';
let isDarkTheme = true;

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
function addTask(text, priority, category = '其他') {
    if (!text.trim()) return;
    
    const task = {
        id: generateId(),
        text: text.trim(),
        priority: priority,
        category: category || '其他',
        completed: false,
        createdAt: new Date().toISOString(),
        order: tasks.length
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

// 清除已完成任务
function clearCompleted() {
    if (confirm('确定要清除所有已完成的任务吗？')) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// 导出任务
function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// 过滤任务
function filterTasks() {
    let filtered = [...tasks];
    
    switch (currentFilter) {
        case 'pending':
            filtered = tasks.filter(task => !task.completed);
            break;
        case 'completed':
            filtered = tasks.filter(task => task.completed);
            break;
        case 'high':
            filtered = tasks.filter(task => task.priority === 'high' && !task.completed);
            break;
        case 'today':
            const today = new Date().toDateString();
            filtered = tasks.filter(task => new Date(task.createdAt).toDateString() === today);
            break;
    }
    
    return sortTasks(filtered);
}

// 排序任务
function sortTasks(taskList) {
    switch (currentSort) {
        case 'priority':
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            taskList.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            break;
        case 'date':
            taskList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'category':
            taskList.sort((a, b) => a.category.localeCompare(b.category));
            break;
        case 'default':
        default:
            taskList.sort((a, b) => a.order - b.order);
    }
    
    return taskList;
}

// 更新统计信息
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    animateNumber('total-tasks', total);
    animateNumber('completed-tasks', completed);
    animateNumber('pending-tasks', pending);
    document.getElementById('completion-rate').textContent = `${rate}%`;
}

// 数字动画
function animateNumber(elementId, target) {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
}

// 获取优先级文本
function getPriorityText(priority) {
    const texts = {
        high: '🔴 高优先级',
        medium: '🟡 中优先级',
        low: '🟢 低优先级'
    };
    return texts[priority] || priority;
}

// 渲染任务列表
function renderTasks() {
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const filteredTasks = filterTasks();
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    taskList.innerHTML = filteredTasks.map((task, index) => `
        <div class="task-item ${task.completed ? 'completed' : ''} priority-${task.priority}" 
             draggable="true" 
             data-id="${task.id}">
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
                    <span class="task-tag">📁 ${escapeHtml(task.category)}</span>
                    <span>📅 ${formatDate(task.createdAt)}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-delete" onclick="deleteTask('${task.id}')">删除</button>
            </div>
        </div>
    `).join('');
    
    // 添加拖拽事件
    initDragAndDrop();
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 拖拽排序
let draggedItem = null;

function initDragAndDrop() {
    const items = document.querySelectorAll('.task-item');
    
    items.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            this.classList.add('dragging');
        });
        
        item.addEventListener('dragend', function(e) {
            this.classList.remove('dragging');
            draggedItem = null;
        });
        
        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            const afterElement = getDragAfterElement(taskList, e.clientY);
            if (afterElement == null) {
                taskList.appendChild(draggedItem);
            } else {
                taskList.insertBefore(draggedItem, afterElement);
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
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
    const categoryInput = document.getElementById('category-input');
    
    addBtn.addEventListener('click', () => {
        addTask(taskInput.value, prioritySelect.value, categoryInput.value);
        taskInput.value = '';
        categoryInput.value = '';
        taskInput.focus();
    });
    
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask(taskInput.value, prioritySelect.value, categoryInput.value);
            taskInput.value = '';
            categoryInput.value = '';
        }
    });
    
    // 过滤标签
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    // 排序选项
    const sortSelect = document.getElementById('sort-select');
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        renderTasks();
    });
    
    // 主题切换
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        isDarkTheme = !isDarkTheme;
        const icon = themeToggle.querySelector('.icon');
        
        if (isDarkTheme) {
            document.body.style.setProperty('--bg-dark', '#0f172a');
            document.body.style.setProperty('--text-primary', '#f1f5f9');
            icon.textContent = '🌙';
        } else {
            document.body.style.setProperty('--bg-dark', '#f8fafc');
            document.body.style.setProperty('--text-primary', '#1e293b');
            icon.textContent = '☀️';
        }
    });
});

// 使函数全局可用
window.clearCompleted = clearCompleted;
window.exportTasks = exportTasks;

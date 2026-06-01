const STORAGE_KEY = 'taskBoardTasksV2';

const priorityMap = {
    high: { label: '高优先级', weight: 1 },
    medium: { label: '中优先级', weight: 2 },
    low: { label: '低优先级', weight: 3 }
};

const statusMap = {
    todo: { label: '待处理', next: 'doing', action: '开始处理' },
    doing: { label: '进行中', next: 'done', action: '标记完成' },
    done: { label: '已完成', next: 'todo', action: '重新打开' }
};

const sampleTasks = [
    {
        title: '完善在线作品集项目介绍',
        priority: 'high',
        status: 'doing',
        category: '项目',
        dueDate: offsetDate(0),
        note: '把主项目和练习项目分层，补充在线演示和 GitHub 链接。'
    },
    {
        title: '整理数据看板的业务说明',
        priority: 'high',
        status: 'todo',
        category: '简历',
        dueDate: offsetDate(1),
        note: '强调筛选、图表联动、CSV 导出和订单明细。'
    },
    {
        title: '复盘 Spring Boot 毕设接口设计',
        priority: 'medium',
        status: 'todo',
        category: '学习',
        dueDate: offsetDate(3),
        note: '梳理用户、影片、评论、收藏和播放记录模块。'
    },
    {
        title: '检查 GitHub Pages 部署状态',
        priority: 'low',
        status: 'done',
        category: '项目',
        dueDate: offsetDate(-1),
        note: '确认每个静态项目能直接打开。'
    }
];

let tasks = [];
let currentFilter = 'all';
let currentSort = 'due';
let searchText = '';

const $ = (selector) => document.querySelector(selector);

function offsetDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}

function createTask(data) {
    return {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        title: data.title.trim(),
        priority: data.priority || 'medium',
        status: data.status || 'todo',
        category: data.category.trim() || '未分类',
        dueDate: data.dueDate || '',
        note: data.note.trim(),
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function normalizeTask(task) {
    return {
        id: task.id || `${Date.now()}-${Math.random()}`,
        title: task.title || task.text || '未命名任务',
        priority: task.priority || 'medium',
        status: task.status || (task.completed ? 'done' : 'todo'),
        category: task.category || '未分类',
        dueDate: task.dueDate || '',
        note: task.note || '',
        createdAt: task.createdAt || new Date().toISOString(),
        updatedAt: task.updatedAt || task.createdAt || new Date().toISOString()
    };
}

function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('smartTodoTasks');
    if (!stored) {
        tasks = sampleTasks.map(createTask);
        saveTasks();
        return;
    }

    try {
        tasks = JSON.parse(stored).map(normalizeTask);
    } catch (error) {
        tasks = sampleTasks.map(createTask);
        saveTasks();
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function isToday(dateString) {
    return dateString === new Date().toISOString().slice(0, 10);
}

function isOverdue(task) {
    return task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== 'done';
}

function formatDate(dateString) {
    if (!dateString) return '未设置截止';
    const today = new Date().toISOString().slice(0, 10);
    if (dateString === today) return '今天到期';
    if (dateString < today) return '已逾期';
    return dateString.replaceAll('-', '.');
}

function getFilteredTasks() {
    const keyword = searchText.toLowerCase();

    return tasks
        .filter((task) => {
            const matchKeyword = [task.title, task.category, task.note]
                .join(' ')
                .toLowerCase()
                .includes(keyword);

            if (!matchKeyword) return false;
            if (currentFilter === 'all') return true;
            if (currentFilter === 'today') return isToday(task.dueDate);
            if (currentFilter === 'overdue') return isOverdue(task);
            if (currentFilter === 'high') return task.priority === 'high';
            return task.status === currentFilter;
        })
        .sort((a, b) => {
            if (currentSort === 'priority') {
                return priorityMap[a.priority].weight - priorityMap[b.priority].weight;
            }
            if (currentSort === 'created') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            if (currentSort === 'category') {
                return a.category.localeCompare(b.category, 'zh-CN');
            }
            return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
        });
}

function renderTasks() {
    const list = $('#task-list');
    const empty = $('#empty-state');
    const template = $('#task-card-template');
    const filtered = getFilteredTasks();

    list.innerHTML = '';
    empty.classList.toggle('show', filtered.length === 0);

    filtered.forEach((task) => {
        const node = template.content.firstElementChild.cloneNode(true);
        node.classList.add(`priority-${task.priority}`, `status-${task.status}`);
        if (isOverdue(task)) node.classList.add('overdue');

        node.querySelector('h3').textContent = task.title;
        node.querySelector('.task-note').textContent = task.note || '暂无备注';
        node.querySelector('.priority-pill').textContent = priorityMap[task.priority].label;
        node.querySelector('.due-pill').textContent = formatDate(task.dueDate);
        node.querySelector('.category').textContent = task.category;
        node.querySelector('.created').textContent = `创建于 ${new Date(task.createdAt).toLocaleDateString('zh-CN')}`;

        const statusBtn = node.querySelector('.status-btn');
        statusBtn.textContent = statusMap[task.status].action;
        statusBtn.addEventListener('click', () => moveTask(task.id));

        node.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
        list.appendChild(node);
    });
}

function updateMetrics() {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === 'done').length;
    const doing = tasks.filter((task) => task.status === 'doing').length;
    const today = tasks.filter((task) => isToday(task.dueDate) && task.status !== 'done').length;
    const rate = total ? Math.round((done / total) * 100) : 0;

    $('#total-tasks').textContent = total;
    $('#doing-tasks').textContent = doing;
    $('#today-tasks').textContent = today;
    $('#completion-rate').textContent = `${rate}%`;
    $('#progress-label').textContent = `${rate}%`;
    $('#progress-bar').style.width = `${rate}%`;

    renderCategorySummary();
    renderTimeline();
}

function renderCategorySummary() {
    const container = $('#category-summary');
    const groups = tasks.reduce((acc, task) => {
        acc[task.category] = acc[task.category] || { total: 0, done: 0 };
        acc[task.category].total += 1;
        if (task.status === 'done') acc[task.category].done += 1;
        return acc;
    }, {});

    container.innerHTML = Object.entries(groups)
        .map(([category, value]) => {
            const percent = Math.round((value.done / value.total) * 100);
            return `
                <div class="category-row">
                    <div>
                        <strong>${escapeHtml(category)}</strong>
                        <span>${value.done}/${value.total} 完成</span>
                    </div>
                    <div class="mini-track"><span style="width:${percent}%"></span></div>
                </div>
            `;
        })
        .join('');
}

function renderTimeline() {
    const upcoming = tasks
        .filter((task) => task.status !== 'done' && task.dueDate)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 4);

    $('#timeline-list').innerHTML = upcoming.length
        ? upcoming.map((task) => `
            <div class="timeline-item ${isOverdue(task) ? 'late' : ''}">
                <span>${formatDate(task.dueDate)}</span>
                <strong>${escapeHtml(task.title)}</strong>
            </div>
        `).join('')
        : '<p class="muted">暂无临近截止任务。</p>';
}

function moveTask(id) {
    tasks = tasks.map((task) => {
        if (task.id !== id) return task;
        return {
            ...task,
            status: statusMap[task.status].next,
            updatedAt: new Date().toISOString()
        };
    });
    persistAndRender();
}

function deleteTask(id) {
    tasks = tasks.filter((task) => task.id !== id);
    persistAndRender();
}

function clearDone() {
    tasks = tasks.filter((task) => task.status !== 'done');
    persistAndRender();
}

function resetSamples() {
    tasks = sampleTasks.map(createTask);
    persistAndRender();
}

function exportCsv() {
    const header = ['标题', '优先级', '状态', '分类', '截止日期', '备注'];
    const rows = tasks.map((task) => [
        task.title,
        priorityMap[task.priority].label,
        statusMap[task.status].label,
        task.category,
        task.dueDate,
        task.note
    ]);

    const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `task-board-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

function escapeHtml(text) {
    const element = document.createElement('span');
    element.textContent = text;
    return element.innerHTML;
}

function persistAndRender() {
    saveTasks();
    renderTasks();
    updateMetrics();
}

function bindEvents() {
    $('#task-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const task = createTask({
            title: $('#task-title').value,
            priority: $('#task-priority').value,
            status: $('#task-status').value,
            category: $('#task-category').value,
            dueDate: $('#task-due').value,
            note: $('#task-note').value
        });

        tasks.unshift(task);
        event.currentTarget.reset();
        $('#task-status').value = 'doing';
        $('#task-priority').value = 'medium';
        persistAndRender();
    });

    $('#task-search').addEventListener('input', (event) => {
        searchText = event.target.value.trim();
        renderTasks();
    });

    $('#filter-select').addEventListener('change', (event) => {
        currentFilter = event.target.value;
        renderTasks();
    });

    $('#sort-select').addEventListener('change', (event) => {
        currentSort = event.target.value;
        renderTasks();
    });

    $('#clear-done-btn').addEventListener('click', clearDone);
    $('#seed-btn').addEventListener('click', resetSamples);
    $('#export-btn').addEventListener('click', exportCsv);
}

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    bindEvents();
    renderTasks();
    updateMetrics();
});

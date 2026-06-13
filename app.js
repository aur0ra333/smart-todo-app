/* ============================================================
   Task Board — app.js (v2 Enhanced)
   ============================================================ */

const STORAGE_KEY = 'taskBoardTasksV2';

const priorityMap = {
    high: { label: '高优先级', weight: 1 },
    medium: { label: '中优先级', weight: 2 },
    low: { label: '低优先级', weight: 3 }
};

const priorityCssClass = {
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low'
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
        note: '把主项目和工具项目分层，补充在线演示和 GitHub 链接。'
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

// ---- State ----
let tasks = [];
let currentFilter = 'all';
let currentSort = 'due';
let searchText = '';
let currentView = 'list';
let selectedIds = new Set();
let editingTaskId = null;
let confirmCallback = null;
let dragTaskId = null;

// ---- Shortcut ----
const $ = (selector) => document.querySelector(selector);

// ---- Utility ----
function offsetDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}

function todayStr() {
    return new Date().toISOString().slice(0, 10);
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
        updatedAt: new Date().toISOString(),
        completedAt: data.completedAt || null
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
        updatedAt: task.updatedAt || task.createdAt || new Date().toISOString(),
        completedAt: task.completedAt || null
    };
}

// ---- Persistence ----
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

// ---- Date helpers ----
function isToday(dateString) {
    return dateString === todayStr();
}

function isOverdue(task) {
    return task.dueDate && task.dueDate < todayStr() && task.status !== 'done';
}

function formatDate(dateString) {
    if (!dateString) return '未设置截止';
    if (dateString === todayStr()) return '今天到期';
    if (dateString < todayStr()) return '已逾期';
    return dateString.replaceAll('-', '.');
}

function getDaysDiff(dateString) {
    if (!dateString) return null;
    const due = new Date(dateString + 'T00:00:00');
    const now = new Date(todayStr() + 'T00:00:00');
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

function getCountdownInfo(task) {
    if (task.status === 'done') {
        return { text: '已完成', cssClass: 'countdown-safe' };
    }
    if (!task.dueDate) {
        return { text: '无截止', cssClass: 'countdown-none' };
    }
    const diff = getDaysDiff(task.dueDate);
    if (diff < 0) {
        return { text: `已逾期 ${Math.abs(diff)} 天`, cssClass: 'countdown-danger' };
    }
    if (diff === 0) {
        return { text: '今天到期', cssClass: 'countdown-danger' };
    }
    if (diff === 1) {
        return { text: '明天到期', cssClass: 'countdown-warning' };
    }
    if (diff <= 3) {
        return { text: `${diff} 天后到期`, cssClass: 'countdown-warning' };
    }
    return { text: `${diff} 天后到期`, cssClass: 'countdown-safe' };
}

// ---- Filtering & Sorting ----
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

// ---- List View Rendering ----
function renderTasks() {
    const list = $('#task-list');
    const empty = $('#empty-state');
    const template = $('#task-card-template');
    const filtered = getFilteredTasks();

    list.innerHTML = '';
    empty.classList.toggle('show', filtered.length === 0);

    filtered.forEach((task) => {
        const node = template.content.firstElementChild.cloneNode(true);
        node.dataset.taskId = task.id;
        node.classList.add(`priority-${task.priority}`, `status-${task.status}`);
        if (isOverdue(task)) node.classList.add('overdue');

        // Checkbox
        const checkbox = node.querySelector('.task-checkbox');
        checkbox.checked = selectedIds.has(task.id);
        checkbox.addEventListener('change', () => toggleSelect(task.id, checkbox.checked));

        // Pills
        node.querySelector('.priority-pill').textContent = priorityMap[task.priority].label;
        node.querySelector('.due-pill').textContent = formatDate(task.dueDate);

        // Countdown
        const countdownInfo = getCountdownInfo(task);
        const countdownPill = node.querySelector('.countdown-pill');
        countdownPill.textContent = countdownInfo.text;
        countdownPill.className = `countdown-pill ${countdownInfo.cssClass}`;

        // Content
        node.querySelector('h3').textContent = task.title;
        node.querySelector('.task-note').textContent = task.note || '暂无备注';
        node.querySelector('.category').textContent = task.category;
        node.querySelector('.created').textContent = `创建于 ${new Date(task.createdAt).toLocaleDateString('zh-CN')}`;

        // Edit button
        node.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task.id));

        // Status button
        const statusBtn = node.querySelector('.status-btn');
        statusBtn.textContent = statusMap[task.status].action;
        statusBtn.addEventListener('click', () => moveTask(task.id));

        // Delete button
        node.querySelector('.delete-btn').addEventListener('click', () => {
            openConfirmModal(
                `确定要删除任务「${task.title}」吗？此操作不可恢复。`,
                () => deleteTask(task.id)
            );
        });

        list.appendChild(node);
    });

    updateBatchBar();
}

// ---- Metrics ----
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
        ? upcoming.map((task) => {
            const countdown = getCountdownInfo(task);
            return `
                <div class="timeline-item ${isOverdue(task) ? 'late' : ''}">
                    <span>${formatDate(task.dueDate)}</span>
                    <strong>${escapeHtml(task.title)}</strong>
                    <small class="timeline-countdown ${countdown.cssClass}">${countdown.text}</small>
                </div>
            `;
        }).join('')
        : '<p class="muted">暂无临近截止任务。</p>';
}

// ---- Task Actions ----
function moveTask(id) {
    tasks = tasks.map((task) => {
        if (task.id !== id) return task;
        const updates = {
            ...task,
            status: statusMap[task.status].next,
            updatedAt: new Date().toISOString()
        };
        if (statusMap[task.status].next === 'done') {
            updates.completedAt = todayStr();
        } else {
            updates.completedAt = null;
        }
        return updates;
    });
    persistAndRender();
}

function deleteTask(id) {
    tasks = tasks.filter((task) => task.id !== id);
    selectedIds.delete(id);
    persistAndRender();
}

function clearDone() {
    const doneIds = tasks.filter((t) => t.status === 'done').map((t) => t.id);
    if (doneIds.length === 0) return;
    openConfirmModal(
        `确定要清理全部 ${doneIds.length} 个已完成任务吗？`,
        () => {
            tasks = tasks.filter((task) => task.status !== 'done');
            doneIds.forEach((id) => selectedIds.delete(id));
            persistAndRender();
        }
    );
}

function resetSamples() {
    openConfirmModal(
        '确定要载入演示数据吗？当前任务将被替换。',
        () => {
            tasks = sampleTasks.map(createTask);
            selectedIds.clear();
            persistAndRender();
        }
    );
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
    link.download = `task-board-${todayStr()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

function escapeHtml(text) {
    const element = document.createElement('span');
    element.textContent = text;
    return element.innerHTML;
}

// ---- Edit Modal ----
function openEditModal(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    editingTaskId = taskId;

    $('#edit-title').value = task.title;
    $('#edit-priority').value = task.priority;
    $('#edit-status').value = task.status;
    $('#edit-category').value = task.category;
    $('#edit-due').value = task.dueDate;
    $('#edit-note').value = task.note;

    // Clear errors
    $('#edit-title-error').textContent = '';
    $('#edit-title-error').classList.remove('show');
    $('#edit-title').classList.remove('error');

    $('#edit-modal').style.display = 'flex';
}

function closeEditModal() {
    $('#edit-modal').style.display = 'none';
    editingTaskId = null;
}

function saveEdit() {
    const title = $('#edit-title').value.trim();

    // Validation
    if (!title) {
        $('#edit-title-error').textContent = '任务标题不能为空';
        $('#edit-title-error').classList.add('show');
        $('#edit-title').classList.add('error');
        return;
    }

    tasks = tasks.map((task) => {
        if (task.id !== editingTaskId) return task;

        const newStatus = $('#edit-status').value;
        const oldStatus = task.status;
        const updates = {
            ...task,
            title: title,
            priority: $('#edit-priority').value,
            status: newStatus,
            category: $('#edit-category').value.trim() || '未分类',
            dueDate: $('#edit-due').value,
            note: $('#edit-note').value.trim(),
            updatedAt: new Date().toISOString()
        };

        // Track completion
        if (newStatus === 'done' && oldStatus !== 'done') {
            updates.completedAt = todayStr();
        } else if (newStatus !== 'done') {
            updates.completedAt = null;
        }

        return updates;
    });

    closeEditModal();
    persistAndRender();
}

// ---- Confirm Modal ----
function openConfirmModal(message, onConfirm) {
    $('#confirm-message').textContent = message;
    confirmCallback = onConfirm;
    $('#confirm-modal').style.display = 'flex';
}

function closeConfirmModal() {
    $('#confirm-modal').style.display = 'none';
    confirmCallback = null;
}

function executeConfirm() {
    if (typeof confirmCallback === 'function') {
        confirmCallback();
    }
    closeConfirmModal();
}

// ---- Form Validation ----
function validateNewTaskForm() {
    let valid = true;

    // Title validation
    const title = $('#task-title').value.trim();
    const titleError = $('#title-error');
    const titleInput = $('#task-title');

    if (!title) {
        titleError.textContent = '请填写任务标题';
        titleError.classList.add('show');
        titleInput.classList.add('error');
        valid = false;
    } else {
        titleError.textContent = '';
        titleError.classList.remove('show');
        titleInput.classList.remove('error');
    }

    // Due date validation
    const dueDate = $('#task-due').value;
    const dueError = $('#due-error');
    const dueInput = $('#task-due');

    if (dueDate && dueDate < todayStr()) {
        dueError.textContent = '截止日期不能早于今天';
        dueError.classList.add('show');
        dueInput.classList.add('error');
        valid = false;
    } else {
        dueError.textContent = '';
        dueError.classList.remove('show');
        dueInput.classList.remove('error');
    }

    return valid;
}

function clearFormErrors() {
    ['#title-error', '#due-error'].forEach((sel) => {
        $(sel).textContent = '';
        $(sel).classList.remove('show');
    });
    ['#task-title', '#task-due'].forEach((sel) => {
        $(sel).classList.remove('error');
    });
}

// ---- Kanban View ----
function renderKanban() {
    ['todo', 'doing', 'done'].forEach((status) => {
        const list = $(`#kanban-${status}`);
        const count = $(`#kanban-count-${status}`);
        const statusTasks = tasks.filter((t) => t.status === status);
        count.textContent = statusTasks.length;

        list.innerHTML = statusTasks.map((task, index) => {
            const countdown = getCountdownInfo(task);
            const totalInCol = statusTasks.length;
            const isFirst = index === 0;
            const isLast = index === totalInCol - 1;

            return `
                <div class="kanban-card"
                     draggable="true"
                     data-task-id="${task.id}"
                     data-status="${task.status}"
                     data-index="${index}">
                    <div class="task-topline">
                        <span class="priority-pill ${priorityCssClass[task.priority]}">${priorityMap[task.priority].label}</span>
                        <span class="countdown-pill ${countdown.cssClass}">${countdown.text}</span>
                    </div>
                    <h4>${escapeHtml(task.title)}</h4>
                    <div class="kanban-card-meta">
                        <span class="category-tag">${escapeHtml(task.category)}</span>
                        ${task.dueDate ? `<span class="category-tag">${task.dueDate}</span>` : ''}
                    </div>
                    <div class="kanban-card-actions">
                        <button class="kanban-edit-btn" data-edit="${task.id}" type="button">编辑</button>
                        <div class="kanban-move-btns">
                            <button class="kanban-move-btn" data-move="${task.id}" data-dir="up" type="button" ${isFirst ? 'disabled' : ''}>&#9650;</button>
                            <button class="kanban-move-btn" data-move="${task.id}" data-dir="down" type="button" ${isLast ? 'disabled' : ''}>&#9660;</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    });

    // Bind drag events
    document.querySelectorAll('.kanban-card').forEach((card) => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });

    // Bind column drop events
    document.querySelectorAll('.kanban-column').forEach((col) => {
        col.addEventListener('dragover', handleDragOver);
        col.addEventListener('dragleave', handleDragLeave);
        col.addEventListener('drop', handleDrop);
    });

    // Bind edit buttons
    document.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(btn.dataset.edit);
        });
    });

    // Bind move buttons
    document.querySelectorAll('[data-move]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            moveKanbanTask(btn.dataset.move, btn.dataset.dir);
        });
    });
}

function handleDragStart(e) {
    dragTaskId = e.currentTarget.dataset.taskId;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragTaskId);
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    dragTaskId = null;
    document.querySelectorAll('.kanban-column').forEach((col) => {
        col.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const taskId = e.dataTransfer.getData('text/plain') || dragTaskId;
    if (!taskId) return;

    const newStatus = e.currentTarget.closest('.kanban-column')?.dataset?.status;
    if (!newStatus) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status !== newStatus) {
        // Change status
        tasks = tasks.map((t) => {
            if (t.id !== taskId) return t;
            const updates = {
                ...t,
                status: newStatus,
                updatedAt: new Date().toISOString()
            };
            if (newStatus === 'done') {
                updates.completedAt = todayStr();
            } else {
                updates.completedAt = null;
            }
            return updates;
        });
        persistAndRender();
    }
}

function moveKanbanTask(taskId, direction) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Get all tasks in same status column, preserving order
    const sameStatus = tasks.filter((t) => t.status === task.status);
    const currentIndex = sameStatus.findIndex((t) => t.id === taskId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sameStatus.length) return;

    // Swap in the full tasks array
    const allIndices = sameStatus.map((t) => tasks.findIndex((ft) => ft.id === t.id));
    const fromGlobal = allIndices[currentIndex];
    const toGlobal = allIndices[newIndex];

    // Swap
    const temp = tasks[fromGlobal];
    tasks[fromGlobal] = tasks[toGlobal];
    tasks[toGlobal] = temp;

    persistAndRender();
}

// ---- Batch Operations ----
function toggleSelect(taskId, checked) {
    if (checked) {
        selectedIds.add(taskId);
    } else {
        selectedIds.delete(taskId);
    }
    updateBatchBar();
}

function updateBatchBar() {
    const bar = $('#batch-bar');
    const count = $('#batch-count');
    const selectAll = $('#select-all-checkbox');

    // Only show batch bar in list view
    if (currentView !== 'list') {
        bar.style.display = 'none';
        return;
    }

    const visibleIds = getFilteredTasks().map((t) => t.id);
    const selectedVisible = visibleIds.filter((id) => selectedIds.has(id));

    count.textContent = `已选 ${selectedVisible.length} 项`;
    bar.style.display = 'flex';

    // Update select-all checkbox state
    if (visibleIds.length > 0 && selectedVisible.length === visibleIds.length) {
        selectAll.checked = true;
        selectAll.indeterminate = false;
    } else if (selectedVisible.length > 0) {
        selectAll.checked = false;
        selectAll.indeterminate = true;
    } else {
        selectAll.checked = false;
        selectAll.indeterminate = false;
    }
}

function toggleSelectAll(checked) {
    const visibleIds = getFilteredTasks().map((t) => t.id);
    if (checked) {
        visibleIds.forEach((id) => selectedIds.add(id));
    } else {
        visibleIds.forEach((id) => selectedIds.delete(id));
    }
    renderTasks();
}

function batchDelete() {
    if (selectedIds.size === 0) return;
    openConfirmModal(
        `确定要删除选中的 ${selectedIds.size} 个任务吗？此操作不可恢复。`,
        () => {
            tasks = tasks.filter((t) => !selectedIds.has(t.id));
            selectedIds.clear();
            persistAndRender();
        }
    );
}

function batchComplete() {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    openConfirmModal(
        `确定要将选中的 ${count} 个任务标记为已完成吗？`,
        () => {
            tasks = tasks.map((t) => {
                if (!selectedIds.has(t.id)) return t;
                return {
                    ...t,
                    status: 'done',
                    completedAt: todayStr(),
                    updatedAt: new Date().toISOString()
                };
            });
            selectedIds.clear();
            persistAndRender();
        }
    );
}

// ---- Trend Chart ----
function renderTrendChart() {
    const container = $('#trend-chart');
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }

    const counts = days.map((day) => {
        return tasks.filter((t) => t.completedAt === day && t.status === 'done').length;
    });

    const maxCount = Math.max(...counts, 1);

    const dayLabels = days.map((day) => {
        const d = new Date(day + 'T00:00:00');
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        return `${d.getMonth() + 1}/${d.getDate()} 周${weekdays[d.getDay()]}`;
    });

    container.innerHTML = days.map((day, i) => {
        const height = Math.max(Math.round((counts[i] / maxCount) * 140), 4);
        const barClass = counts[i] === 0 ? 'trend-bar zero' : 'trend-bar';
        return `
            <div class="trend-bar-wrapper">
                <span class="trend-count">${counts[i]}</span>
                <div class="${barClass}" style="height:${height}px;" title="${dayLabels[i]}: ${counts[i]} 个任务"></div>
                <span class="trend-label">${dayLabels[i]}</span>
            </div>
        `;
    }).join('');
}

// ---- View Toggle ----
function switchView(view) {
    currentView = view;
    selectedIds.clear();

    $('#list-view-btn').classList.toggle('active', view === 'list');
    $('#kanban-view-btn').classList.toggle('active', view === 'kanban');

    $('#task-list').style.display = view === 'list' ? '' : 'none';
    $('#kanban-view').style.display = view === 'kanban' ? '' : 'none';
    $('#empty-state').style.display = 'none';
    $('#batch-bar').style.display = 'none';

    if (view === 'list') {
        renderTasks();
    } else {
        renderKanban();
    }
    updateMetrics();
}

// ---- Persist & Render ----
function persistAndRender() {
    saveTasks();
    if (currentView === 'kanban') {
        renderKanban();
    } else {
        renderTasks();
    }
    updateMetrics();
    renderTrendChart();
}

// ---- Event Bindings ----
function bindEvents() {
    // New task form
    $('#task-form').addEventListener('submit', (event) => {
        event.preventDefault();

        if (!validateNewTaskForm()) return;

        const status = $('#task-status').value;
        const task = createTask({
            title: $('#task-title').value,
            priority: $('#task-priority').value,
            status: status,
            category: $('#task-category').value,
            dueDate: $('#task-due').value,
            note: $('#task-note').value,
            completedAt: status === 'done' ? todayStr() : null
        });

        tasks.unshift(task);
        event.currentTarget.reset();
        $('#task-status').value = 'doing';
        $('#task-priority').value = 'medium';
        clearFormErrors();
        persistAndRender();
    });

    // Clear errors on input
    $('#task-title').addEventListener('input', () => {
        $('#title-error').textContent = '';
        $('#title-error').classList.remove('show');
        $('#task-title').classList.remove('error');
    });
    $('#task-due').addEventListener('change', () => {
        $('#due-error').textContent = '';
        $('#due-error').classList.remove('show');
        $('#task-due').classList.remove('error');
    });

    // Search
    $('#task-search').addEventListener('input', (event) => {
        searchText = event.target.value.trim();
        selectedIds.clear();
        if (currentView === 'list') renderTasks();
    });

    // Filter
    $('#filter-select').addEventListener('change', (event) => {
        currentFilter = event.target.value;
        selectedIds.clear();
        if (currentView === 'list') renderTasks();
    });

    // Sort
    $('#sort-select').addEventListener('change', (event) => {
        currentSort = event.target.value;
        if (currentView === 'list') renderTasks();
    });

    // Clear done
    $('#clear-done-btn').addEventListener('click', clearDone);

    // Reset samples
    $('#seed-btn').addEventListener('click', resetSamples);

    // Export CSV
    $('#export-btn').addEventListener('click', exportCsv);

    // View toggle
    $('#list-view-btn').addEventListener('click', () => switchView('list'));
    $('#kanban-view-btn').addEventListener('click', () => switchView('kanban'));

    // Select all
    $('#select-all-checkbox').addEventListener('change', (e) => {
        toggleSelectAll(e.target.checked);
    });

    // Batch actions
    $('#batch-complete-btn').addEventListener('click', batchComplete);
    $('#batch-delete-btn').addEventListener('click', batchDelete);

    // Edit modal
    $('#edit-form').addEventListener('submit', (event) => {
        event.preventDefault();
        saveEdit();
    });
    $('#edit-modal-close').addEventListener('click', closeEditModal);
    $('#edit-cancel-btn').addEventListener('click', closeEditModal);
    $('#edit-modal').addEventListener('click', (e) => {
        if (e.target === $('#edit-modal')) closeEditModal();
    });

    // Clear edit errors on input
    $('#edit-title').addEventListener('input', () => {
        $('#edit-title-error').textContent = '';
        $('#edit-title-error').classList.remove('show');
        $('#edit-title').classList.remove('error');
    });

    // Confirm modal
    $('#confirm-cancel').addEventListener('click', closeConfirmModal);
    $('#confirm-ok').addEventListener('click', executeConfirm);
    $('#confirm-modal').addEventListener('click', (e) => {
        if (e.target === $('#confirm-modal')) closeConfirmModal();
    });

    // Keyboard: Escape closes modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if ($('#edit-modal').style.display === 'flex') {
                closeEditModal();
            } else if ($('#confirm-modal').style.display === 'flex') {
                closeConfirmModal();
            }
        }
    });
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    bindEvents();
    if (currentView === 'kanban') {
        renderKanban();
    } else {
        renderTasks();
    }
    updateMetrics();
    renderTrendChart();
});
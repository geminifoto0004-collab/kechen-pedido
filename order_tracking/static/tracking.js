/**
 * 订单流程追踪系统
 */

/**
/**
 * 订单流程追踪系统 - 完整配置文件
 * 修改这个文件就能控制整个系统的行为
 */



// ==================== UTC时间处理函数（解决时区问题）====================

/**
 * 获取当前UTC日期（Date对象）
 */
function getTodayUTC() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * 解析日期字符串为UTC Date对象（只保留日期，时间设为00:00:00 UTC）
 */
function parseUTCDate(dateStr) {
    if (!dateStr) return null;
    // 只取日期部分 "2026-01-08"，加上UTC时间标记
    const dateOnly = dateStr.substring(0, 10);
    const dt = new Date(dateOnly + 'T00:00:00Z');
    return isNaN(dt.getTime()) ? null : dt;
}

/**
 * 计算两个日期之间的天数差（UTC）
 */
function diffDaysUTC(fromDateStr, toDateStr) {
    const from = parseUTCDate(fromDateStr);
    const to = parseUTCDate(toDateStr);
    
    if (!from || !to) return null;
    
    const diffMs = to - from;
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * 格式化UTC日期为显示字符串
 */
function formatUTCDate(dateStr) {
    const dt = parseUTCDate(dateStr);
    if (!dt) return '-';
    
    const year = dt.getUTCFullYear();
    const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dt.getUTCDate()).padStart(2, '0');
    
    return `${year}/${month}/${day}`;
}

// ==================== 共用工具函數 ====================

// Toast提示
function showToast(title, message, type = 'success', duration = 3000) {
    const existing = document.getElementById('toast');
    let toast = existing;

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-icon" style="font-size: 1.5rem;"></div>
            <div class="toast-content">
                <div class="toast-title" id="toastTitle"></div>
                <div class="toast-message" id="toastMessage"></div>
            </div>
            <button class="modal-close" onclick="this.parentElement.classList.remove('show'); setTimeout(() => this.parentElement.remove(), 300);" style="background: none; border: none; font-size: 1.2rem; color: #6b7280; cursor: pointer; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">✕</button>
        `;
        document.body.appendChild(toast);
    }

    // 移除所有类型类
    toast.classList.remove('toast-success', 'toast-error', 'toast-danger', 'toast-warning');
    
    // 添加对应的类型类
    if (type === 'error' || type === 'danger') {
        toast.classList.add('toast-error');
    } else if (type === 'warning') {
        toast.classList.add('toast-warning');
    } else {
        toast.classList.add('toast-success');
    }

    // 设置图标
    const iconEl = toast.querySelector('.toast-icon');
    if (iconEl) {
        if (type === 'error' || type === 'danger') {
            iconEl.textContent = '❌';
        } else if (type === 'warning') {
            iconEl.textContent = '⚠️';
        } else {
            iconEl.textContent = '✅';
        }
    }

    const titleEl = document.getElementById('toastTitle');
    const msgEl = document.getElementById('toastMessage');
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        if (!existing) {
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// 日期格式化
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

// 获取今天日期
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// 通用确认 Modal（Promise 版本，替换 confirm）
function showConfirmModal(message, title = '确认操作', confirmText = '确认', cancelText = '取消', danger = false) {
    return new Promise((resolve, reject) => {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmModalTitle');
        const messageEl = document.getElementById('confirmModalMessage');
        const confirmBtn = document.getElementById('confirmModalConfirmBtn');
        
        if (!modal) {
            // 如果 modal 不存在，回退到原生的 confirm
            resolve(confirm(message));
            return;
        }
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        confirmBtn.textContent = confirmText;
        confirmBtn.className = danger ? 'modal-btn danger' : 'modal-btn confirm';
        
        // 清除旧的事件监听器
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // 确认按钮
        newConfirmBtn.onclick = () => {
            modal.classList.remove('show');
            resolve(true);
        };
        
        // 显示 modal
        modal.classList.add('show');
        
        // ESC 键关闭
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.classList.remove('show');
                document.removeEventListener('keydown', handleEsc);
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

// 通用提示 Modal（Promise 版本，替换 alert）
function showAlertModal(message, title = '提示', confirmText = '确定', type = 'info') {
    return new Promise((resolve) => {
        const modal = document.getElementById('alertModal');
        const titleEl = document.getElementById('alertModalTitle');
        const messageEl = document.getElementById('alertModalMessage');
        const confirmBtn = document.getElementById('alertModalConfirmBtn');
        
        if (!modal) {
            // 如果 modal 不存在，回退到原生的 alert
            alert(message);
            resolve();
            return;
        }
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        confirmBtn.textContent = confirmText;
        
        // 根据类型设置按钮样式
        if (type === 'error' || type === 'danger') {
            confirmBtn.className = 'modal-btn danger';
        } else if (type === 'warning') {
            confirmBtn.className = 'modal-btn warning';
        } else {
            confirmBtn.className = 'modal-btn confirm';
        }
        
        // 清除旧的事件监听器
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // 确认按钮
        newConfirmBtn.onclick = () => {
            modal.classList.remove('show');
            resolve();
        };
        
        // 显示 modal
        modal.classList.add('show');
        
        // ESC 键关闭
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.classList.remove('show');
                document.removeEventListener('keydown', handleEsc);
                resolve();
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

// 关闭确认 Modal
function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// 关闭提示 Modal
function closeAlertModal() {
    const modal = document.getElementById('alertModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// 確認對話框（保留兼容性，但使用新的 modal）
function confirmDialog(message, callback) {
    showConfirmModal(message).then(confirmed => {
        if (confirmed && callback) {
        callback();
    }
    });
}

// 导出数据（预留，主页有专用覆写）
function exportData() {
    showToast('提示', '导出功能开发中...');
}

// 初始化：通用表单验证 & Alert 自动关闭
document.addEventListener('DOMContentLoaded', function() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    });
    
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredInputs = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredInputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = 'var(--status-danger)';
                } else {
                    input.style.borderColor = '';
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                showToast('错误', '请填写所有必填项');
            }
        });
    });
});

// 摺疊 / 展開側邊欄（主頁等共用）
function toggleSidebar() {
    const appLayout = document.getElementById('appLayout');
    if (!appLayout) return;
    appLayout.classList.toggle('collapsed');
}

// ==================== 主页：筛选 / 快速更新 / 新增订单 / 时间轴 ====================

// 筛选状态（参考 v10.html 逻辑）
let currentFilter = {
    stageGroup: 'all',  // all, draft, sampling, production, quote, completed, cancelled
    substatus: 'all',   // 子状态筛选
    search: '',
    showCompleted: true,
    showCancelled: false
};

// 阶段映射（用于动态生成阶段筛选按钮）- 统一使用 STATUS_SYSTEM.js
// 等待 STATUS_SYSTEM.js 加载后初始化
let stageMap = {
    'all': ['all', 'new_and_quote', 'draft', 'sampling', 'production']
};

// 初始化阶段映射（从 STATUS_SYSTEM.js 获取）
function initStageMap() {
    if (typeof getStageMap === 'function') {
        const systemMap = getStageMap();
        stageMap = {
            'all': ['all', 'new_and_quote', 'draft', 'sampling', 'production'],
            ...systemMap
        };
    }
}

// 页面加载后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStageMap);
} else {
    // 如果已经加载，延迟一点确保 STATUS_SYSTEM.js 已加载
    setTimeout(initStageMap, 100);
}

const stageNames = {
    '全部': 'all',
    '新订单': '新订单',
    '报价待确认': '报价待确认',
    '图稿待确认': '图稿待确认',
    '图稿修改中': '图稿修改中',
    '待打样': '待打样',
    '打样中': '打样中',
    '打样待确认': '打样待确认',
    '打样修改中': '打样修改中',
    '待生产': '待生产',
    '生产中': '生产中'
};

// 筛选函数（参考 v10.html 逻辑）
function applyFilters() {
    const rows = document.querySelectorAll('#ordersTableBody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const orderNumber = row.dataset.orderNumber || '';
        const customerName = row.dataset.customerName || '';
        const status = row.dataset.status || '';
        const stageGroup = row.dataset.stageGroup || '';
        
        // Stage Group 篩選
        let stageGroupMatch = false;
        if (currentFilter.stageGroup === 'all') {
            // 全部：显示进行中的订单，以及根据checkbox显示已完成/已取消
            if (['completed', 'cancelled'].includes(stageGroup)) {
                // 已完成或已取消的订单，需要根据checkbox决定
                if (stageGroup === 'completed' && currentFilter.showCompleted) {
                    stageGroupMatch = true;
                } else if (stageGroup === 'cancelled' && currentFilter.showCancelled) {
                    stageGroupMatch = true;
                } else {
                    stageGroupMatch = false;
                }
            } else {
                // 进行中的订单，总是显示
                stageGroupMatch = true;
            }
        } else {
            // 特殊处理：等国外确认（waiting_confirm）包含多个状态（虚拟筛选器）
            if (currentFilter.stageGroup === 'waiting_confirm') {
                // 使用新的 isStatusInFilter 函数
                if (typeof isStatusInFilter === 'function') {
                    stageGroupMatch = isStatusInFilter(status, 'waiting_confirm');
                } else if (typeof STAGE_GROUPS !== 'undefined' && STAGE_GROUPS.waiting_confirm) {
                    // 降级方案：直接检查 STAGE_GROUPS
                    const waitingConfirmStatuses = STAGE_GROUPS.waiting_confirm.statuses;
                    stageGroupMatch = waitingConfirmStatuses && waitingConfirmStatuses.includes(status);
                } else {
                    // 最终降级方案：直接匹配状态
                    stageGroupMatch = status === STATUS.QUOTE_CONFIRMING || 
                                     status === STATUS.DRAFT_CONFIRMING || 
                                     status === STATUS.SAMPLE_CONFIRMING;
                }
            } else {
                // 使用 STAGE_GROUPS 直接检查状态是否属于该阶段
                if (typeof STAGE_GROUPS !== 'undefined' && STAGE_GROUPS[currentFilter.stageGroup]) {
                    const groupStatuses = STAGE_GROUPS[currentFilter.stageGroup].statuses;
                    stageGroupMatch = groupStatuses && groupStatuses.includes(status);
                } else if (typeof getStageGroup === 'function') {
                    // 降级方案1：使用 getStageGroup 函数
                    const actualStageGroup = getStageGroup(status);
                    stageGroupMatch = actualStageGroup === currentFilter.stageGroup;
                } else {
                    // 降级方案2：使用 dataset
                    stageGroupMatch = stageGroup === currentFilter.stageGroup;
                }
            }
        }
        
        // 子状态筛选（需要将显示状态转换为简体进行比较）
        let substatusMatch = true;
        if (currentFilter.substatus !== 'all') {
            // currentFilter.substatus 可能是繁体，需要转换为简体比较
            // 由于数据库存储的是简体，直接比较即可
            // 如果 filterStatus 是繁体显示，需要反向查找简体
            const filterStatus = currentFilter.substatus;
            // 检查是否是繁体，如果是则转换为简体
            let filterStatusSimplified = filterStatus;
            if (typeof DISPLAY_MAP !== 'undefined') {
                // 反向查找：从繁体找到简体
                for (const [simp, trad] of Object.entries(DISPLAY_MAP)) {
                    if (trad === filterStatus) {
                        filterStatusSimplified = simp;
                        break;
                    }
                }
            }
            substatusMatch = status === filterStatusSimplified || status === filterStatus;
        }
        
        // 已完成/已取消筛选（当选择了特定阶段时）
        let completedMatch = true;
        if (currentFilter.stageGroup === 'completed' && !currentFilter.showCompleted) {
            completedMatch = false;
        }
        if (currentFilter.stageGroup === 'cancelled' && !currentFilter.showCancelled) {
            completedMatch = false;
        }
        
        // 搜索筛选
        let searchMatch = true;
        if (currentFilter.search) {
            const search = currentFilter.search.toLowerCase();
            searchMatch = orderNumber.toLowerCase().includes(search) || 
                         customerName.toLowerCase().includes(search);
        }
        
        // 显示或隐藏
        if (stageGroupMatch && substatusMatch && completedMatch && searchMatch) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // 更新空状态显示
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

// 更新筛选提示（目前未在模板中使用，但保留）
function updateFilterHint(count) {
    const tabNames = {
        'all': '全部进行中',
        'waiting_confirm': '等国外确认/询价',
        'draft': '图稿阶段',
        'sampling': '打样阶段',
        'production': '生产阶段',
        'completed': '已完成',
        'cancelled': '已取消'
    };
    
    const stageNamesMap = {
        'all': '全部流程',
        '新订单': '新订单',
        '图稿待确认': '图稿待确认',
        '图稿修改中': '图稿修改中',
        '待打样': '待打样',
        '打样中': '打样中',
        '打样待确认': '打样待确认',
        '打样修改中': '打样修改中',
        '待生产': '待生产',
        '生产中': '生产中'
    };
    
    const lightNames = {
        'all': '全部状态',
        'red': '逾期',
        'yellow': '需注意',
        'green': '正常'
    };
    
    const tabName = tabNames[currentFilter.tab] || '全部进行中';
    const stageName = stageNamesMap[currentFilter.stage] || '全部流程';
    const lightName = lightNames[currentFilter.light] || '全部状态';
    
    const hintEl = document.getElementById('filterHint');
    if (hintEl) {
        hintEl.innerHTML = `
        当前显示: <strong>${tabName}</strong> · <strong>${stageName}</strong> · <strong>${lightName}</strong> · 共 <strong id="filterCount">${count}</strong> 个订单
        <span style="color: var(--text-muted); margin-left: 2rem;">
            💡 提示：悬停在订单行上可以看到快速操作按钮 · 按住 <strong>Shift</strong> + 点击快捷按钮可填写日期和备注
        </span>
    `;
    }
}

// Stage Group 筛选（参考 v10.html）
function filterByStageGroup(stageGroup, button) {
    if (button) {
        event?.preventDefault();
        currentFilter.stageGroup = stageGroup;
        currentFilter.substatus = 'all';
        
        // 更新按钮状态
        document.querySelectorAll('.stage-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // 关闭所有下拉菜单
        document.querySelectorAll('.substatus-dropdown').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        
        applyFilters();
        saveFilterState(); // 保存状态
    }
}

// 切换子状态下拉菜单
function toggleSubstatus(stageGroup, button) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const dropdown = document.getElementById(`dropdown-${stageGroup}`);
    
    // 如果下拉菜单已经展开，就收起
    if (dropdown && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        return;
    }
    
    // 否则，先筛选该阶段的全部订单
    currentFilter.stageGroup = stageGroup;
    currentFilter.substatus = 'all';
    
    // 更新按钮状态
    document.querySelectorAll('.stage-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (button) {
        button.classList.add('active');
    }
    
    // 应用筛选
    applyFilters();
    
    // 然后展开下拉菜单（如果需要细选）
    const allDropdowns = document.querySelectorAll('.substatus-dropdown');
    allDropdowns.forEach(d => {
        if (d !== dropdown) {
            d.classList.remove('show');
        }
    });
    
    if (dropdown) {
        dropdown.classList.add('show');
        // 重置下拉菜单的「全部」为选中状态
        dropdown.querySelectorAll('.substatus-option').forEach(opt => {
            opt.classList.remove('active');
        });
        const allOption = dropdown.querySelector('.substatus-option[onclick*="\'all\'"]');
        if (allOption) {
            allOption.classList.add('active');
        }
    }
}

// 子状态筛选
function filterBySubstatus(stageGroup, substatus, option) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    currentFilter.stageGroup = stageGroup;
    currentFilter.substatus = substatus;
    
    const dropdown = document.getElementById(`dropdown-${stageGroup}`);
    if (dropdown) {
        dropdown.querySelectorAll('.substatus-option').forEach(opt => {
            opt.classList.remove('active');
        });
        if (option) {
            option.classList.add('active');
        }
    }
    
    document.querySelectorAll('.stage-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const mainBtn = dropdown?.previousElementSibling;
    if (mainBtn) {
        mainBtn.classList.add('active');
    }
    
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    
    applyFilters();
}

// 保留阶段 / 灯号筛选接口（目前未在 UI 使用）
function filterByStage(stage, event) {
    event.preventDefault();
    currentFilter.stage = stage;
    applyFilters();
}

function filterByLight(light, event) {
    event.preventDefault();
    currentFilter.light = light;
    applyFilters();
}

// 更新阶段筛选按钮
function updateStageFilters(tab) {
    const stageBar = document.getElementById('stageFilterBar');
    if (!stageBar) return;
    
    let html = '<span class="filter-label">细分流程:</span>';
    html += '<a href="#" class="filter-btn ' + (currentFilter.stage === 'all' ? 'active' : '') + '" data-stage="all" onclick="filterByStage(\'all\', event)">全部</a>';
    
    if (tab === 'all' || tab === 'quote') {
        // 使用 STATUS 常量和 displayStatus 函数（与 STATUS_SYSTEM.js 保持一致）
        const quoteStatus = typeof STATUS !== 'undefined' ? STATUS.QUOTE_CONFIRMING : '报价待确认';
        const displayQuote = typeof displayStatus !== 'undefined' ? displayStatus(quoteStatus) : quoteStatus;
        html += '<a href="#" class="filter-btn ' + (currentFilter.stage === quoteStatus ? 'active' : '') + '" data-stage="' + quoteStatus + '" onclick="filterByStage(\'' + quoteStatus + '\', event)">🎨 ' + displayQuote + '</a>';
    }
    if (tab === 'all' || tab === 'draft') {
        if (typeof STATUS !== 'undefined' && typeof displayStatus !== 'undefined') {
            const newOrderStatus = STATUS.NEW_ORDER;
            const draftConfirmStatus = STATUS.DRAFT_CONFIRMING;
            const draftRevisingStatus = STATUS.DRAFT_REVISING;
            html += '<a href="#" class="filter-btn ' + (currentFilter.stage === newOrderStatus ? 'active' : '') + '" data-stage="' + newOrderStatus + '" onclick="filterByStage(\'' + newOrderStatus + '\', event)">' + displayStatus(newOrderStatus) + '</a>';
            html += '<a href="#" class="filter-btn ' + (currentFilter.stage === draftConfirmStatus ? 'active' : '') + '" data-stage="' + draftConfirmStatus + '" onclick="filterByStage(\'' + draftConfirmStatus + '\', event)">' + displayStatus(draftConfirmStatus) + '</a>';
            html += '<a href="#" class="filter-btn ' + (currentFilter.stage === draftRevisingStatus ? 'active' : '') + '" data-stage="' + draftRevisingStatus + '" onclick="filterByStage(\'' + draftRevisingStatus + '\', event)">' + displayStatus(draftRevisingStatus) + '</a>';
        }
    }
    if (tab === 'all' || tab === 'sampling') {
        if (typeof STATUS !== 'undefined' && typeof displayStatus !== 'undefined') {
            const pendingSampleStatus = STATUS.PENDING_SAMPLE;
            const samplingStatus = STATUS.SAMPLING;
            const sampleConfirmStatus = STATUS.SAMPLE_CONFIRMING;
            const sampleRevisingStatus = STATUS.SAMPLE_REVISING;
            html += '<a href="#" class="filter-btn ' + (currentFilter.stage === pendingSampleStatus ? 'active' : '') + '" data-stage="' + pendingSampleStatus + '" onclick="filterByStage(\'' + pendingSampleStatus + '\', event)">' + displayStatus(pendingSampleStatus) + '</a>';
            html += '<a href="#" class="filter-btn ' + (currentFilter.stage === samplingStatus ? 'active' : '') + '" data-stage="' + samplingStatus + '" onclick="filterByStage(\'' + samplingStatus + '\', event)">' + displayStatus(samplingStatus) + '</a>';
            html += '<a href="#" class="filter-btn ' + (currentFilter.stage === sampleConfirmStatus ? 'active' : '') + '" data-stage="' + sampleConfirmStatus + '" onclick="filterByStage(\'' + sampleConfirmStatus + '\', event)">' + displayStatus(sampleConfirmStatus) + '</a>';
            html += '<a href="#" class="filter-btn ' + (currentFilter.stage === sampleRevisingStatus ? 'active' : '') + '" data-stage="' + sampleRevisingStatus + '" onclick="filterByStage(\'' + sampleRevisingStatus + '\', event)">' + displayStatus(sampleRevisingStatus) + '</a>';
        }
    }
    if (tab === 'all' || tab === 'production') {
        if (typeof STATUS !== 'undefined' && typeof displayStatus !== 'undefined') {
            const pendingProductionStatus = STATUS.PENDING_PRODUCTION;
            const producingStatus = STATUS.PRODUCING;
            html += '<a href="#" class="filter-btn ' + (currentFilter.stage === pendingProductionStatus ? 'active' : '') + '" data-stage="' + pendingProductionStatus + '" onclick="filterByStage(\'' + pendingProductionStatus + '\', event)">' + displayStatus(pendingProductionStatus) + '</a>';
            html += '<a href="#" class="filter-btn ' + (currentFilter.stage === producingStatus ? 'active' : '') + '" data-stage="' + producingStatus + '" onclick="filterByStage(\'' + producingStatus + '\', event)">' + displayStatus(producingStatus) + '</a>';
        }
    }
    
    stageBar.innerHTML = html;
}

let currentUpdateData = {};

// 快速更新相关
function setToday() {
    const dateInput = document.getElementById('updateDate');
    if (dateInput) {
        dateInput.value = getTodayDate();
    }
}

function handleQuickUpdate(event, button) {
    event.stopPropagation();
    
    const orderNumber = button.dataset.order;
    const action = button.dataset.action;
    const current = button.dataset.current;
    const next = button.dataset.next;

    // 特殊处理：询价转为订单
    if (action === 'quote_to_order') {
        const newOrderNumber = prompt('请输入订单号：');
        if (!newOrderNumber) {
            return;
        }
        // 立即禁用按钮
        const originalText = button.textContent;
        button.disabled = true;
        button.style.opacity = '0.5';
        button.textContent = '处理中...';
        updateOrderNumber(orderNumber, newOrderNumber, action, button, originalText);
        return;
    }

    // 所有其他操作都显示 Modal（除了已完成状态）
    // 已完成状态不会有下一步，所以不需要 Modal
    if (next && next !== '已完成' && next !== '已取消') {
        // 存储操作信息
        currentQuickAction = {
            orderNumber,
            action,
            currentStatus: current,
            nextStatus: next,
            button: button
        };
        
        // 显示 Modal
        showQuickActionModal(orderNumber, current, next);
    } else {
        // 如果是最后一步（已完成），直接执行（但这种情况不应该有按钮）
        const originalText = button.textContent;
        button.disabled = true;
        button.style.opacity = '0.5';
        button.textContent = '处理中...';
        performQuickUpdate(orderNumber, action, current, next, getTodayDate(), '', button, originalText);
    }
}

function showModal(orderNumber, current, next) {
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = `快速更新 #${orderNumber}`;
    const currentStage = document.getElementById('currentStage');
    const nextStage = document.getElementById('nextStage');
    const updateDate = document.getElementById('updateDate');
    const updateNotes = document.getElementById('updateNotes');
    
    if (currentStage) currentStage.textContent = current;
    if (nextStage) nextStage.textContent = next;
    if (updateDate) updateDate.value = getTodayDate();
    if (updateNotes) updateNotes.value = '';
    document.getElementById('updateModal').classList.add('show');
}

function closeUpdateModal() {
    document.getElementById('updateModal').classList.remove('show');
}

function confirmUpdate() {
    const date = document.getElementById('updateDate').value;
    const notes = document.getElementById('updateNotes').value;
    
    performQuickUpdate(
        currentUpdateData.orderNumber,
        currentUpdateData.action,
        currentUpdateData.current,
        currentUpdateData.next,
        date,
        notes
    );
    
    closeUpdateModal();
}

function updateOrderNumber(oldOrderNumber, newOrderNumber, action, button = null, originalText = '') {
    fetch('/tracking/api/orders/update-order-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            old_order_number: oldOrderNumber, 
            new_order_number: newOrderNumber,
            action: action
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('✅ 转换成功', `询价已转为订单 #${newOrderNumber}`);
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast('错误', '转换失败：' + data.error, 'error');
            // 恢复按钮
            if (button) {
                button.disabled = false;
                button.style.opacity = '1';
                button.textContent = originalText;
            }
        }
    })
    .catch(err => {
        showToast('错误', '错误：' + err.message, 'error');
        // 恢复按钮
        if (button) {
            button.disabled = false;
            button.style.opacity = '1';
            button.textContent = originalText;
        }
    });
}

function performQuickUpdate(orderNumber, action, current, next, date, notes, button = null, originalText = '') {
    fetch('/tracking/api/orders/quick-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            order_number: orderNumber, 
            action: action, 
            date: date, 
            notes: notes 
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            let message = `订单 #${orderNumber} · ${current} → ${next}`;
            if (notes) {
                message += ` · ${notes}`;
            }
            message += ` · ${date}`;
            showToast('✅ 更新成功', message);
            
            // 立即更新订单行（使用新的状态）
            const row = document.querySelector(`tr[data-order-number="${orderNumber}"]`);
            if (row) {
                // 先更新状态，立即刷新按钮
                row.dataset.status = next;
                showQuickActionsForRow(row, next);
            }
            
            // 清除缓存，强制重新加载
            if (typeof orderDetailCache !== 'undefined') {
                delete orderDetailCache[orderNumber];
            }
            
            // 统一的刷新函数 - 更新所有相关组件
            refreshAllComponents(orderNumber);
        } else {
            showToast('错误', '更新失败：' + data.error, 'error');
            // 恢复按钮
            if (button) {
                button.disabled = false;
                button.style.opacity = '1';
                button.textContent = originalText;
            }
        }
    })
    .catch(err => {
        showToast('错误', '错误：' + err.message, 'error');
        // 恢复按钮
        if (button) {
            button.disabled = false;
            button.style.opacity = '1';
            button.textContent = originalText;
        }
    });
}

// ==================== 新增订单（分步骤表单） ====================

let currentOrderStep = 1;
const totalOrderSteps = 4;
let productCount = 1;

function showNewOrderModal() {
    // 使用 editOrderModal 来新增订单
    const modal = document.getElementById('editOrderModal');
    if (!modal) {
        console.error('editOrderModal not found');
        return;
    }
    
    // 设置标题
    const title = document.getElementById('editOrderModalTitle');
    if (title) title.textContent = '✏️ 新增订单';
    
    // 设置提交按钮文本
    const submitBtn = document.getElementById('editOrderSubmitBtn');
    if (submitBtn) submitBtn.textContent = '保存 💾';
    
    // 清空表单
    const orderNumberInput = document.getElementById('editOrderNumber');
    orderNumberInput.value = '';
    orderNumberInput.readOnly = false;
    orderNumberInput.style.background = '';
    orderNumberInput.removeAttribute('data-original-order-number');
    
    document.getElementById('editCustomerName').value = '';
    document.getElementById('editOrderDate').value = '';
    document.getElementById('editProductCode').value = '';
    document.getElementById('editQuantity').value = '';
    document.getElementById('editFactory').value = '';
    document.getElementById('editExpectedDeliveryDate').value = '';
    document.getElementById('editProductionType').value = '';
    document.getElementById('editNotes').value = '';
    
    // 隐藏所有提示
    document.getElementById('editOrderNumberHint').style.display = 'none';
    document.getElementById('editOrderNumberWarning').style.display = 'none';
    document.getElementById('editOrderNumberError').style.display = 'none';
    document.getElementById('toggleOrderNumberEdit').style.display = 'none';
    
    // 设置默认日期
    const today = new Date();
    document.getElementById('editOrderDate').value = today.toISOString().split('T')[0];
    
    // 设置预计交货日期（30天后）
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 30);
    document.getElementById('editExpectedDeliveryDate').value = deliveryDate.toISOString().split('T')[0];
    
    // 获取下一个询价编号提示
    fetch('/tracking/api/orders/next-quote-number')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const hint = document.getElementById('editOrderNumberHint');
                if (hint) {
                    hint.textContent = `💡 不填订单号将创建询价/修图需求（将自动生成：${data.next_number}）`;
                    hint.style.display = 'block';
                }
            }
        })
        .catch(err => console.error('获取询价编号失败:', err));
    
    // 添加订单号输入监听（新增模式）
    setupOrderNumberValidation(orderNumberInput, true);
    
    // 显示 Modal
    modal.classList.add('show');
    
    // 标记为新增模式
    modal.setAttribute('data-mode', 'new');
}

function nextStep() {
    if (!validateOrderStep(currentOrderStep)) {
        return;
    }
    
    if (currentOrderStep < totalOrderSteps) {
        currentOrderStep++;
        updateOrderStep();
    }
}

function prevStep() {
    if (currentOrderStep > 1) {
        currentOrderStep--;
        updateOrderStep();
    }
}

function updateOrderStep() {
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    const currentStepEl = document.querySelector(`.form-step[data-step="${currentOrderStep}"]`);
    if (currentStepEl) {
        currentStepEl.classList.add('active');
    }
    
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < currentOrderStep) {
            step.classList.add('completed');
        } else if (index + 1 === currentOrderStep) {
            step.classList.add('active');
        }
    });
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (prevBtn) prevBtn.style.display = currentOrderStep > 1 ? 'block' : 'none';
    
    if (currentOrderStep === totalOrderSteps) {
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'block';
        updateOrderSummary();
    } else {
        if (nextBtn) nextBtn.style.display = 'block';
        if (submitBtn) submitBtn.style.display = 'none';
    }
}

function validateOrderStep(step) {
    let isValid = true;
    const currentStepEl = document.querySelector(`.form-step[data-step="${step}"]`);
    if (!currentStepEl) return false;
    
    const requiredInputs = currentStepEl.querySelectorAll('[required]');
    
    requiredInputs.forEach(input => {
        input.classList.remove('error');
        const errorEl = input.parentElement.querySelector('.form-error');
        if (errorEl) errorEl.classList.remove('show');
        
        if (!input.value.trim()) {
            input.classList.add('error');
            if (errorEl) errorEl.classList.add('show');
            isValid = false;
        }
    });
    
    if (step === 1) {
        const customerName = document.getElementById('newCustomerName');
        if (customerName && !customerName.value.trim()) {
            customerName.classList.add('error');
            isValid = false;
        }
    }
    
    if (step === 2) {
        const productItems = document.querySelectorAll('.product-item');
        if (productItems.length === 0) {
            showToast('错误', '至少需要添加一个产品');
            isValid = false;
        } else {
            let hasValidProduct = false;
            productItems.forEach(item => {
                const productType = item.querySelector('select[name="product_type[]"]');
                if (productType && productType.value.trim()) {
                    hasValidProduct = true;
                    productType.classList.remove('error');
                } else if (productType) {
                    productType.classList.add('error');
                    const errorEl = productType.parentElement.querySelector('.form-error');
                    if (errorEl) errorEl.classList.add('show');
                }
            });
            if (!hasValidProduct) {
                showToast('错误', '请为至少一个产品选择产品类型');
                isValid = false;
            }
        }
    }
    
    if (!isValid) {
        showToast('错误', '请填写所有必填项目');
    }
    
    return isValid;
}

function updateOrderSummary() {
    const orderNumber = document.getElementById('newOrderNumber').value.trim();
    const orderDate = document.getElementById('newOrderDate').value;
    const customer = document.getElementById('newCustomerName').value;
    const productionType = document.getElementById('newProductionType').value;
    const patternCode = document.getElementById('newPatternCode').value;
    const deliveryDate = document.getElementById('newExpectedDeliveryDate')?.value || '';
    const needSampling = document.querySelector('input[name="needSampling"]:checked')?.value || 'yes';
    const notes = document.getElementById('newNotes').value;
    
    document.getElementById('summaryOrderNumber').textContent = orderNumber || '自动生成（询价/修图）';
    document.getElementById('summaryOrderDate').textContent = orderDate || '-';
    document.getElementById('summaryCustomer').textContent = customer || '-';
    
    const productItems = document.querySelectorAll('.product-item');
    const summaryProducts = document.getElementById('summaryProducts');
    if (summaryProducts) {
        if (productItems.length === 0) {
            summaryProducts.innerHTML = '<div class="summary-row"><span class="summary-label">无产品信息</span></div>';
        } else {
            summaryProducts.innerHTML = '';
            productItems.forEach((item, index) => {
                const productType = item.querySelector('select[name="product_type[]"]')?.value || '-';
                const productCode = item.querySelector('input[name="product_code[]"]')?.value || '-';
                const quantity = item.querySelector('input[name="quantity[]"]')?.value || '-';
                const unit = item.querySelector('select[name="unit[]"]')?.value || '';
                
                summaryProducts.innerHTML += `
                    <div class="summary-row">
                        <span class="summary-label">产品 ${index + 1}</span>
                        <span class="summary-value">${productType}</span>
                    </div>
                    ${productCode ? `<div class="summary-row">
                        <span class="summary-label">产品编号</span>
                        <span class="summary-value">${productCode}</span>
                    </div>` : ''}
                    ${quantity ? `<div class="summary-row">
                        <span class="summary-label">数量</span>
                        <span class="summary-value">${quantity} ${unit || ''}</span>
                    </div>` : ''}
                    ${index < productItems.length - 1 ? '<div style="margin: 0.5rem 0;"></div>' : ''}
                `;
            });
        }
    }
    
    document.getElementById('summaryProductionType').textContent = productionType || '-';
    document.getElementById('summaryPatternCode').textContent = patternCode || '-';
    document.getElementById('summaryDeliveryDate').textContent = deliveryDate || '-';
    document.getElementById('summarySampling').textContent = needSampling === 'yes' ? '需要打样' : '直接生产';
    document.getElementById('summaryNotes').textContent = notes || '-';
}

function addProduct() {
    productCount++;
    const productList = document.getElementById('productList');
    if (!productList) return;
    
    const newProduct = document.createElement('div');
    newProduct.className = 'product-item';
    newProduct.innerHTML = `
        <div class="product-item-header">
            <div class="product-item-title">产品 #${productCount}</div>
            <button type="button" class="remove-product-btn" onclick="removeProduct(this)">✕ 移除</button>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">产品类型 <span class="required">*</span></label>
                <select name="product_type[]" class="form-select" required>
                    <option value="">请选择</option>
                    <option value="數碼印花">數碼印花</option>
                    <option value="活性印花">活性印花</option>
                    <option value="冰絲印花">冰絲印花</option>
                    <option value="冰絲確剪碼印花">冰絲確剪碼印花</option>
                </select>
                <span class="form-error">请选择产品类型</span>
            </div>
            <div class="form-group">
                <label class="form-label">产品编号</label>
                <input type="text" name="product_code[]" class="form-input" placeholder="PRD-2026-XXX">
            </div>
            <div class="form-group">
                <label class="form-label">数量</label>
                <input type="text" name="quantity[]" class="form-input" placeholder="例如：500 碼">
            </div>
            <div class="form-group">
                <label class="form-label">单位</label>
                <select name="unit[]" class="form-select">
                    <option value="碼">碼</option>
                    <option value="米">米</option>
                    <option value="件">件</option>
                    <option value="打">打</option>
                </select>
            </div>
            <div class="form-group full-width">
                <label class="form-label">产品备注</label>
                <textarea name="product_notes[]" class="form-textarea" placeholder="产品相关的特殊要求或备注"></textarea>
            </div>
        </div>
    `;
    productList.appendChild(newProduct);
}

async function removeProduct(btn) {
    const confirmed = await showConfirmModal('确定要移除这个产品吗？', '确认移除', '确认', '取消');
    if (confirmed) {
        btn.closest('.product-item').remove();
        const productItems = document.querySelectorAll('.product-item');
        productItems.forEach((item, index) => {
            const titleEl = item.querySelector('.product-item-title');
            if (titleEl) {
                titleEl.textContent = `产品 #${index + 1}`;
            }
        });
        productCount = productItems.length;
    }
}

function checkOrderNumber() {
    const orderNumber = document.getElementById('newOrderNumber').value.trim();
    const errorDiv = document.getElementById('orderNumberError');
    
    if (!orderNumber) {
        errorDiv.style.display = 'none';
        return;
    }
    
    fetch(`/tracking/api/orders/check-number?order_number=${encodeURIComponent(orderNumber)}`)
        .then(res => res.json())
        .then(data => {
            if (data.exists) {
                errorDiv.textContent = '❌ ' + data.message;
                errorDiv.style.display = 'block';
            } else {
                errorDiv.style.display = 'none';
            }
        })
        .catch(err => {
            console.error('檢查訂單號失敗:', err);
        });
}

let customerSearchTimeout;
function searchCustomers(query) {
    if (query.length < 1) {
        document.getElementById('customerSuggestions').style.display = 'none';
        return;
    }
    
    clearTimeout(customerSearchTimeout);
    customerSearchTimeout = setTimeout(() => {
        fetch(`/tracking/api/customers/search?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                const suggestionsDiv = document.getElementById('customerSuggestions');
                
                if (data.success && data.data.length > 0) {
                    suggestionsDiv.innerHTML = data.data.map(customer => 
                        `<div class="customer-suggestion-item" onclick="selectCustomer('${customer.replace(/'/g, "\\'")}')">${customer}</div>`
                    ).join('');
                    suggestionsDiv.style.display = 'block';
                } else {
                    suggestionsDiv.style.display = 'none';
                }
            })
            .catch(err => {
                console.error('搜索客戶失敗:', err);
            });
    }, 300);
}

function selectCustomer(customerName) {
    document.getElementById('newCustomerName').value = customerName;
    document.getElementById('customerSuggestions').style.display = 'none';
}

function hideCustomerSuggestions() {
    setTimeout(() => {
        document.getElementById('customerSuggestions').style.display = 'none';
    }, 200);
}

async function closeNewOrderModal() {
    const confirmed = await showConfirmModal('确定要关闭吗？未保存的数据将丢失。', '确认关闭', '确认', '取消', true);
    if (confirmed) {
        document.getElementById('newOrderModal').classList.remove('show');
        resetOrderForm();
    }
}

function resetOrderForm() {
    currentOrderStep = 1;
    productCount = 1;
    updateOrderStep();
    const form = document.getElementById('newOrderForm');
    if (form) form.reset();
    const confirmCheck = document.getElementById('confirmCheck');
    if (confirmCheck) confirmCheck.checked = false;
    document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(input => {
        input.classList.remove('error');
    });
    document.querySelectorAll('.form-error').forEach(error => {
        error.classList.remove('show');
    });
}

function submitNewOrder() {
    const confirmCheck = document.getElementById('confirmCheck');
    if (!confirmCheck || !confirmCheck.checked) {
        showToast('错误', '请确认订单信息后勾选确认框');
        return;
    }
    
    const orderNumber = document.getElementById('newOrderNumber').value.trim();
    const errorDiv = document.getElementById('orderNumberError');
    
    const checkAndSubmit = () => {
        const formData = new FormData(document.getElementById('newOrderForm'));
        
        const firstProduct = document.querySelector('.product-item');
        let productType = '';
        let productCode = '';
        
        if (firstProduct) {
            productType = firstProduct.querySelector('select[name="product_type[]"]')?.value || '';
            productCode = firstProduct.querySelector('input[name="product_code[]"]')?.value || '';
        }
        
        const data = {
            order_date: formData.get('order_date'),
            order_number: orderNumber || null,
            customer_name: formData.get('customer_name'),
            production_type: formData.get('production_type') || '',
            pattern_code: formData.get('pattern_code') || '',
            expected_delivery_date: formData.get('expected_delivery_date') || null,
            notes: formData.get('notes') || '',
            product_name: productType || '',
            product_code: productCode || ''
        };
        
        fetch('/tracking/orders/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                showToast('✅ 创建成功', `订单 ${result.message || '已创建'}`);
                closeNewOrderModal();
                setTimeout(() => location.reload(), 1500);
            } else {
                if (result.error && result.error.includes('已存在')) {
                    if (errorDiv) {
                        errorDiv.textContent = '❌ ' + result.error;
                        errorDiv.style.display = 'block';
                    }
                    currentOrderStep = 1;
                    updateOrderStep();
                } else {
                    showToast('错误', '创建失败：' + (result.error || '未知错误'), 'error');
                }
            }
        })
        .catch(err => {
            showToast('错误', '错误：' + err.message, 'error');
        });
    };
    
    if (orderNumber) {
        fetch(`/tracking/api/orders/check-number?order_number=${encodeURIComponent(orderNumber)}`)
            .then(res => res.json())
            .then(data => {
                if (data.exists) {
                    if (errorDiv) {
                        errorDiv.textContent = '❌ ' + data.message;
                        errorDiv.style.display = 'block';
                    }
                    currentOrderStep = 1;
                    updateOrderStep();
                } else {
                    checkAndSubmit();
                }
            })
            .catch(err => {
                    showToast('错误', '检查订单号失败：' + err.message, 'error');
            });
    } else {
        checkAndSubmit();
    }
}

// ==================== 列表詳情時間軸 ====================

const orderDetailCache = {};

function toggleDetail(orderNumber, event) {
    if (event && (event.target.closest('.actions-cell') || event.target.closest('.quick-btn'))) {
        return;
    }

    const row = document.querySelector(`tr[data-order-number="${orderNumber}"]`);
    if (!row) return;

    const expandBtn = document.getElementById(`expand-${orderNumber}`);

    const existingDetail = document.querySelector(`tr.detail-row[data-detail-for="${orderNumber}"]`);
    if (existingDetail) {
        existingDetail.parentNode.removeChild(existingDetail);
        if (expandBtn) expandBtn.classList.remove('expanded');
        return;
    }

    document.querySelectorAll('tr.detail-row').forEach(tr => tr.parentNode.removeChild(tr));
    document.querySelectorAll('.expand-btn').forEach(btn => btn.classList.remove('expanded'));

    const detailRow = document.createElement('tr');
    detailRow.className = 'detail-row show';
    detailRow.dataset.detailFor = orderNumber;
    const colSpan = row.children.length;
    detailRow.innerHTML = `
        <td colspan="${colSpan}">
            <div class="detail-content" id="detail-content-${orderNumber}">
                <div class="timeline-title">📊 載入中...</div>
            </div>
        </td>
    `;
    row.parentNode.insertBefore(detailRow, row.nextSibling);
    if (expandBtn) expandBtn.classList.add('expanded');

    if (orderDetailCache[orderNumber]) {
        renderOrderTimeline(orderNumber, orderDetailCache[orderNumber], 'row');
        return;
    }

    fetch(`/tracking/api/orders/${encodeURIComponent(orderNumber)}`)
        .then(res => res.json())
        .then(result => {
            if (!result.success) {
                document.getElementById(`detail-content-${orderNumber}`).innerHTML =
                    `<div class="timeline-title">❌ 載入失敗：${result.error || '未知錯誤'}</div>`;
                return;
            }
            orderDetailCache[orderNumber] = result.data;
            renderOrderTimeline(orderNumber, result.data, 'row');
        })
        .catch(err => {
            document.getElementById(`detail-content-${orderNumber}`).innerHTML =
                `<div class="timeline-title">❌ 載入失敗：${err.message}</div>`;
        });
}


function renderOrderTimeline(orderNumber, orderData) {
    const container = document.getElementById(`detail-content-${orderNumber}`);
    if (!container) return;

    const history = orderData.history || [];
    if (!history.length) {
        container.innerHTML = '<div class="timeline-empty">暂无历史记录</div>';
        return;
    }

    function parseDate(d) {
        if (!d) return null;
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? null : dt;
    }
    function diffDays(from, to) {
        if (!from || !to) return null;
        return Math.max(0, Math.round((to - from) / (1000 * 60 * 60 * 24)));
    }
    function formatDateDisplay(d) {
        const dt = parseDate(d);
        if (!dt) return '-';
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        return `${m}/${day}`;
    }

    const today = getTodayUTC();  // 使用UTC避免時區問題
    
    // 修正：不使用后端的 status_days，而是前端实时计算
    // 因为后端的值可能不准确或有延迟
    const lastHistoryItem = history[history.length - 1];
    const lastDate = parseDate(lastHistoryItem?.action_date);
    const currentStatusDays = lastDate ? diffDays(lastDate, today) : 0;

    // 折叠配置：如果超过10条记录，默认只显示最近的5条
    const MAX_VISIBLE_DEFAULT = 5;
    const TOTAL_THRESHOLD = 10;
    const shouldCollapse = history.length > TOTAL_THRESHOLD;
    const visibleCount = shouldCollapse ? MAX_VISIBLE_DEFAULT : history.length;
    const hiddenCount = history.length - visibleCount;
    
    // 检查是否已展开（从容器数据属性获取）
    const isExpanded = container.dataset.isExpanded === 'true';
    const displayCount = isExpanded ? history.length : visibleCount;
    const displayHistory = isExpanded ? history : history.slice(-displayCount);

    // 渲染单个步骤
    function renderStep(item, index, isLast) {
        const fromDate = parseDate(item.action_date);
        const toDate = isLast ? today : parseDate(history[index + 1].action_date);
        const stayDays = diffDays(fromDate, toDate);
        
        const icon = isLast ? '⏱️' : '✓';
        const stepClass = isLast ? 'current' : 'completed';
        
        let durationText = '';
        let durationClass = '';
        if (isLast) {
            // 确保天数不是负数，如果是负数显示为"已超時"
            if (currentStatusDays < 0) {
                durationText = `已超時 ${Math.abs(currentStatusDays)}天`;
                durationClass = 'danger';
            } else {
                durationText = `已等 ${currentStatusDays}天`;
                if (currentStatusDays > 7) {
                    durationText += ' ⚠️';
                    durationClass = 'danger';
                }
            }
        } else if (stayDays != null) {
            durationText = `花了 ${stayDays}天`;
        }

        const statusIcon = getStatusIcon(item.to_status);
        return `
            <div class="timeline-step ${stepClass}" data-step-index="${index}">
                <div class="step-icon-wrapper">${statusIcon || icon}</div>
                <div class="step-label">${displayStatus(item.to_status) || '-'}</div>
                <div class="step-date">${formatDateDisplay(item.action_date)}</div>
                ${durationText ? `<div class="step-duration ${durationClass}">${durationText}</div>` : ''}
            </div>
        `;
    }

    // 生成时间轴HTML
    let horizontalHtml = '<div class="timeline-horizontal">';
    
    // 如果折叠且未展开，添加折叠指示器
    if (shouldCollapse && !isExpanded) {
        horizontalHtml += `
            <div class="timeline-step timeline-collapsed-indicator" data-collapsed="true">
                <div class="step-icon-wrapper">⋯</div>
                <div class="step-label">已折叠 ${hiddenCount} 条记录</div>
                <div class="step-date"></div>
                <div class="step-duration"></div>
            </div>
        `;
    }
    
    // 渲染显示的记录
    displayHistory.forEach((item, displayIndex) => {
        // 计算在原始history中的索引
        const originalIndex = isExpanded ? displayIndex : (history.length - displayCount + displayIndex);
        const isLast = originalIndex === history.length - 1;
        horizontalHtml += renderStep(item, originalIndex, isLast);
    });
    
    horizontalHtml += '</div>';

    // 生成展开/折叠按钮
    let toggleButtonHtml = '';
    if (shouldCollapse) {
        toggleButtonHtml = isExpanded
            ? `
                <button class="btn btn-secondary timeline-toggle-btn" 
                        onclick="toggleTimelineExpand('${orderNumber}', false); event.stopPropagation();"
                        style="padding: 0.5rem 1rem; font-size: 0.85rem; margin-left: 0.5rem; width: auto;">
                    📕 折叠早期记录
                </button>
            `
            : `
                <button class="btn btn-secondary timeline-toggle-btn" 
                        onclick="toggleTimelineExpand('${orderNumber}', true); event.stopPropagation();"
                        style="padding: 0.5rem 1rem; font-size: 0.85rem; margin-left: 0.5rem; width: auto;">
                    📖 展开全部 (${hiddenCount} 条)
                </button>
            `;
    }

    container.innerHTML = `
        <div style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
            <button class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="openDetailDrawerFromTimeline('${orderNumber}', '${orderData.customer_name || ''}', ${currentStatusDays}); event.stopPropagation();">
                📋 查看完整记录与操作
            </button>
            ${toggleButtonHtml}
        </div>
        ${horizontalHtml}
    `;
    
    // 保存完整历史数据到容器，以便展开时使用
    container.dataset.fullHistory = JSON.stringify(history);
    container.dataset.isExpanded = isExpanded ? 'true' : 'false';
    container.dataset.statusDays = currentStatusDays;
    container.dataset.customerName = orderData.customer_name || '';
}

/**
 * 切换时间轴展开/折叠状态
 */
function toggleTimelineExpand(orderNumber, expand) {
    const container = document.getElementById(`detail-content-${orderNumber}`);
    if (!container) return;
    
    const fullHistory = JSON.parse(container.dataset.fullHistory || '[]');
    if (!fullHistory.length) return;
    
    // 重新渲染时间轴（展开或折叠）
    const orderData = {
        history: fullHistory,
        status_days: parseInt(container.dataset.statusDays) || 0,
        customer_name: container.dataset.customerName || ''
    };
    
    // 临时设置展开状态
    container.dataset.isExpanded = expand ? 'true' : 'false';
    
    // 重新渲染
    renderOrderTimeline(orderNumber, orderData);
}


// ==================== v10.html 的操作類 Modal（Action + Details + Note...） ====================

let currentAction = '';
let currentOrderId = '';
let fromStatus = '';
let toStatus = '';

function showActionModal(action, from, to, orderId) {
    currentAction = action;
    currentOrderId = orderId;
    fromStatus = from;
    toStatus = to;
    
    const modal = document.getElementById('actionModal');
    const title = document.getElementById('modalTitle');
    const info = document.getElementById('modalInfo');
    const confirmBtn = document.getElementById('confirmBtn');
    const noteField = document.getElementById('modalNote');
    
    if (!modal || !title || !info || !confirmBtn || !noteField) return;

    noteField.value = '';
    info.textContent = `订单 ${orderId}`;

    // 移除旧的箭头区块
    const infoParent = info.parentElement;
    Array.from(infoParent.querySelectorAll('.modal-arrow-line')).forEach(el => el.remove());

    const arrow = document.createElement('div');
    arrow.className = 'modal-arrow-line';
    arrow.style.display = 'flex';
    arrow.style.alignItems = 'center';
    arrow.style.gap = '0.5rem';
    arrow.style.marginTop = '0.5rem';

    if (action === 'confirm') {
        title.textContent = '确认：国外确认';
        arrow.innerHTML = `<span style="color: var(--text-2);">${from}</span> <span style="color: var(--text-3); font-weight: 600;">→</span> <span style="color: var(--blue); font-weight: 600;">${to}</span>`;
        confirmBtn.textContent = '✓ 确认';
        confirmBtn.className = 'modal-btn confirm';
    } else if (action === 'revise') {
        title.textContent = '确认：需要修改';
        arrow.innerHTML = `<span style="color: var(--text-2);">${from}</span> <span style="color: var(--text-3); font-weight: 600;">→</span> <span style="color: var(--yellow); font-weight: 600;">${to}</span>`;
        confirmBtn.textContent = '🔄 确认修改';
        confirmBtn.className = 'modal-btn confirm';
        noteField.placeholder = '建议说明修改原因...';
    } else if (action === 'send') {
        title.textContent = '确认：重新发图给国外';
        arrow.innerHTML = `<span style="color: var(--text-2);">${from}</span> <span style="color: var(--text-3); font-weight: 600;">→</span> <span style="color: var(--blue); font-weight: 600;">${to}</span>`;
        confirmBtn.textContent = '→ 确认发图';
        confirmBtn.className = 'modal-btn confirm';
    } else if (action === 'start') {
        title.textContent = '确认：开始下一步';
        arrow.innerHTML = `<span style="color: var(--text-2);">${from}</span> <span style="color: var(--text-3); font-weight: 600;">→</span> <span style="color: var(--blue); font-weight: 600;">${to}</span>`;
        confirmBtn.textContent = '✓ 确认开始';
        confirmBtn.className = 'modal-btn confirm';
    } else if (action === 'complete') {
        title.textContent = '确认：生产完成';
        arrow.innerHTML = `<span style="color: var(--text-2);">${from}</span> <span style="color: var(--text-3); font-weight: 600;">→</span> <span style="color: var(--green); font-weight: 600;">${to}</span>`;
        confirmBtn.textContent = '✓ 确认完成';
        confirmBtn.className = 'modal-btn confirm';
    } else if (action === 'skip') {
        title.textContent = '⚠️ 确认跳过打样阶段';
        info.textContent = `将直接从当前阶段进入生产阶段`;
        confirmBtn.textContent = '✓ 确认跳过';
        confirmBtn.className = 'modal-btn confirm';
    }

    infoParent.appendChild(arrow);
    modal.classList.add('show');
}

function showDetailsMenu(orderId) {
    currentOrderId = orderId;
    const modal = document.getElementById('detailsModal');
    if (modal) modal.classList.add('show');
}

function closeModal() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.classList.remove('show');
    });
}

function confirmAction() {
    const note = document.getElementById('modalNote').value;
    console.log('Action:', currentAction);
    console.log('Order ID:', currentOrderId);
    console.log('From:', fromStatus);
    console.log('To:', toStatus);
    console.log('Note:', note);
    
    showToast('成功', `订单 ${currentOrderId} 已从 "${fromStatus}" 变更为 "${toStatus}"`, 'success');
    closeModal();
}

function showNoteModal() {
    closeModal();
    document.getElementById('noteOrderId').textContent = currentOrderId;
    document.getElementById('noteModal').classList.add('show');
}

function confirmAddNote() {
    const note = document.getElementById('noteText').value;
    if (note.trim()) {
        console.log('Add note for', currentOrderId, ':', note);
        showToast('成功', '备注已添加', 'success');
        closeModal();
    } else {
        showToast('提示', '请输入备注内容', 'warning');
    }
}

function showDeliveryDateModal() {
    closeModal();
    document.getElementById('deliveryOrderId').textContent = currentOrderId;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('deliveryDate').valueAsDate = tomorrow;
    document.getElementById('deliveryDateModal').classList.add('show');
}

function confirmDeliveryDate() {
    const date = document.getElementById('deliveryDate').value;
    if (date) {
        console.log('Set delivery date for', currentOrderId, ':', date);
        showToast('成功', `预计交货日期已设定为：${date}`, 'success');
        closeModal();
    } else {
        showToast('提示', '请选择日期', 'warning');
    }
}

function showSkipSamplingModal() {
    closeModal();
    document.getElementById('skipSamplingModal').classList.add('show');
}

function confirmSkipSampling() {
    const reason = document.getElementById('skipReason').value;
    console.log('Skip sampling for', currentOrderId, 'Reason:', reason);
    showToast('成功', '已跳过打样阶段，进入生产阶段', 'success');
    closeModal();
}

function showBackStepModal() {
    closeModal();
    document.getElementById('backStepModal').classList.add('show');
}

// backToDetailsMenu 函数已删除，因为旧的 detailsModal 已经移除
// 现在所有 Modal 的返回按钮都使用 closeModal()

function confirmBackStep() {
    const selectedStep = document.querySelector('input[name="backStep"]:checked');
    const note = document.getElementById('backStepNote').value;
    
    if (selectedStep) {
        console.log('Back to:', selectedStep.value, 'Note:', note);
        showToast('成功', `已退回到：${selectedStep.value}`, 'success');
        closeModal();
    } else {
        showToast('提示', '请选择要退回的步骤', 'warning');
    }
}

function showCancelOrderModal() {
    closeModal();
    document.getElementById('cancelOrderModal').classList.add('show');
}

async function confirmCancelOrder() {
    const reason = document.getElementById('cancelReason').value;
    if (reason && reason.trim()) {
        const confirmed = await showConfirmModal(`确定要取消订单 ${currentOrderId} 吗？\n原因：${reason}`, '确认取消订单', '确认取消', '取消', true);
        if (confirmed) {
            console.log('Cancel order', currentOrderId, 'Reason:', reason);
            showToast('成功', '订单已取消', 'success');
            closeModal();
        }
    } else {
        showToast('提示', '取消订单需要填写原因', 'warning');
    }
}

function toggleCompletedOrders(checkbox) {
    currentFilter.showCompleted = checkbox.checked;
    applyFilters();
    saveFilterState(); // 保存狀態
}

function toggleCancelledOrders(checkbox) {
    currentFilter.showCancelled = checkbox.checked;
    applyFilters();
    saveFilterState(); // 保存狀態
}

// ==================== 首頁額外初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
    // 初始化筛选状态 - 根据 checkbox 的初始状态
    const completedCheckbox = document.getElementById('toggleCompleted');
    const cancelledCheckbox = document.getElementById('toggleCancelled');
    
    if (completedCheckbox) {
        currentFilter.showCompleted = completedCheckbox.checked;
    }
    if (cancelledCheckbox) {
        currentFilter.showCancelled = cancelledCheckbox.checked;
    }
    
    // 应用初始筛选
    applyFilters();
    
    // 初始化表格排序功能
    initTableSorting();
    
    // 为所有订单行初始化悬停按钮（基于 STATUS_SYSTEM.js）
    initQuickActionsForAllRows();
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentFilter.search = this.value;
            applyFilters();
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.stage-filter')) {
            document.querySelectorAll('.substatus-dropdown').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
        if (e.target.classList.contains('modal-overlay')) {
            if (e.target.id === 'orderDetailModal') {
                closeOrderDetailModal();
            }
        }
    });

    const orderDateInput = document.getElementById('newOrderDate');
    if (orderDateInput && !orderDateInput.value) {
        orderDateInput.value = getTodayDate();
    }

    const stageBar = document.getElementById('stageFilterBar');
    if (stageBar) {
        updateStageFilters('all');
    }
});

// ==================== 撤销最后一步功能 ====================

async function undoLastStep(orderNumber, restoreStatus, currentStatus) {
    // 确认对话框
    const confirmed = await showConfirmModal(
        `⚠️ 确认撤销操作？\n\n` +
        `订单：${orderNumber}\n` +
        `当前状态：${currentStatus}\n` +
        `将恢复到：${restoreStatus}\n\n` +
        `此操作会永久删除最后一步记录！`,
        '确认撤销',
        '确认撤销',
        '取消',
        true
    );
    
    if (!confirmed) return;
    
    // 可选：询问原因 - 暂时跳过，使用空字符串
    const reason = '';
    
    try {
        const response = await fetch(`/tracking/api/orders/${encodeURIComponent(orderNumber)}/undo-last-step`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason || '' })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (typeof showToast === 'function') {
                showToast('✅ 撤销成功', result.message);
            } else {
                showToast('成功', result.message, 'success');
            }
            
            // 使用统一的刷新函数，不刷新整个页面
            refreshAllComponents(orderNumber);
        } else {
            showToast('错误', '撤销失败：' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('错误', '网络错误', 'error');
    }
}



// ==================== 删除订单功能 ====================

/**
 * 从菜单确认删除订单
 */
function confirmDeleteOrderFromMenu() {
    // 关闭菜单
    closeModal();
    
    // 获取当前订单信息
    const orderNumber = currentOrderId;
    
    // 从页面获取订单详细信息
    const orderRow = document.querySelector(`tr[data-order="${orderNumber}"]`);
    if (!orderRow) {
        showToast('错误', '找不到订单信息', 'error');
        return;
    }
    
    const customerCell = orderRow.querySelector('td:nth-child(4)');
    const statusCell = orderRow.querySelector('td:nth-child(5)');
    
    const customerName = customerCell ? customerCell.textContent.trim() : '未知客户';
    const currentStatus = statusCell ? statusCell.textContent.trim().replace(/🔴|🟡|🟢/g, '').trim() : '未知状态';
    
    // 调用删除确认
    confirmDeleteOrder(orderNumber, customerName, currentStatus);
}

/**
 * 确认并删除订单
 */
async function confirmDeleteOrder(orderNumber, customerName, currentStatus) {
    // 第一步：基本确认
    const confirmed = await showConfirmModal(
        `⚠️ 确认删除订单？\n\n` +
        `订单号：${orderNumber}\n` +
        `客户：${customerName}\n` +
        `状态：${currentStatus}\n\n` +
        `⚠️ 此操作会永久删除订单！\n` +
        `• 删除订单记录\n` +
        `• 删除所有状态历史\n` +
        `• 删除所有备注\n` +
        `• 无法恢复！\n\n` +
        `确定要继续吗？`
    );
    
    if (!confirmed) return;
    
    // 第二步：输入订单号确认
    const confirmInput = prompt(
        `⚠️ 最后确认\n\n` +
        `为防止误操作，请输入订单号确认删除：\n` +
        `${orderNumber}`
    );
    
    if (confirmInput !== orderNumber) {
        showToast('错误', '订单号不匹配，已取消删除', 'error');
        return;
    }
    
    // 第三步：询问原因（可选）
    const reason = prompt('删除原因（选填）：', '输入错误');
    
    // 执行删除
    deleteOrder(orderNumber, reason);
}

/**
 * 执行删除订单
 */
async function deleteOrder(orderNumber, reason) {
    try {
        const response = await fetch(`/tracking/api/orders/${encodeURIComponent(orderNumber)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                confirm_order_number: orderNumber,
                reason: reason || ''
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (typeof showToast === 'function') {
                showToast('✅ 删除成功', result.message);
            } else {
                showToast('成功', result.message, 'success');
            }
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast('错误', '删除失败：' + result.error, 'error');
        }
    } catch (error) {
        console.error('Delete order error:', error);
        showToast('错误', '网络错误：' + error.message, 'error');
    }
}

// ==================== 訂單詳情頁：專用功能 ====================

/**
 * 渲染水平流程時間軸
 */
function renderProcessTimeline() {
    const container = document.getElementById('processTimeline');
    if (!container) return;
    
    const orderDataElement = document.getElementById('orderData');
    if (!orderDataElement) return;
    
    const orderData = JSON.parse(orderDataElement.textContent);
    const orderHistory = orderData.history;
    
    if (!orderHistory || orderHistory.length === 0) return;
    
    // 折叠配置：如果超过10条记录，默认只显示最近的5条
    const MAX_VISIBLE_DEFAULT = 5;
    const TOTAL_THRESHOLD = 10;
    const shouldCollapse = orderHistory.length > TOTAL_THRESHOLD;
    const visibleCount = shouldCollapse ? MAX_VISIBLE_DEFAULT : orderHistory.length;
    const hiddenCount = orderHistory.length - visibleCount;
    
    // 检查是否已展开（从容器数据属性获取）
    const isExpanded = container.dataset.isExpanded === 'true';
    const displayCount = isExpanded ? orderHistory.length : visibleCount;
    const displayHistory = isExpanded ? orderHistory : orderHistory.slice(-displayCount);
    
    const today = getTodayUTC();  // 使用UTC避免時區問題
    let html = '';
    
    // 如果折叠且未展开，添加折叠指示器
    if (shouldCollapse && !isExpanded) {
        html += `
            <div class="timeline-step timeline-collapsed-indicator" data-collapsed="true">
                <div class="step-icon-wrapper">⋯</div>
                <div class="step-label">已折叠 ${hiddenCount} 条记录</div>
                <div class="step-date"></div>
                <div class="step-duration"></div>
            </div>
        `;
    }
    
    // 渲染显示的记录
    displayHistory.forEach((item, displayIndex) => {
        // 计算在原始history中的索引
        const originalIndex = isExpanded ? displayIndex : (orderHistory.length - displayCount + displayIndex);
        const index = originalIndex;
        const isLast = index === orderHistory.length - 1;
        const isCompleted = !isLast;
        const isCurrent = isLast;
        
        const fromDate = parseDate(item.action_date);
        const toDate = isLast ? today : parseDate(orderHistory[index + 1] ? orderHistory[index + 1].action_date : null);
        const stayDays = diffDays(fromDate, toDate);
        
        const icon = isCurrent ? '⏱️' : (isCompleted ? '✓' : '⬜');
        const stepClass = isCurrent ? 'current' : (isCompleted ? 'completed' : '');
        
        const statusIcon = getStatusIcon(item.to_status);
        html += `
            <div class="timeline-step ${stepClass}">
                <div class="step-icon-wrapper">${statusIcon || icon}</div>
                <div class="step-label">${displayStatus(item.to_status)}</div>
                <div class="step-date">${formatDate(item.action_date)}</div>
                ${stayDays !== null ? `<div class="step-duration">${isCurrent ? '已等' : '花了'} ${stayDays} 天</div>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // 添加展开/折叠按钮（如果超过阈值）
    if (shouldCollapse) {
        // 移除旧的按钮（如果存在）
        const oldButton = container.parentElement.querySelector('.timeline-toggle-container');
        if (oldButton) oldButton.remove();
        
        const toggleButton = document.createElement('div');
        toggleButton.className = 'timeline-toggle-container';
        toggleButton.style.cssText = 'margin-top: 1rem; text-align: center;';
        toggleButton.innerHTML = isExpanded
            ? `<button class="btn btn-secondary" onclick="toggleProcessTimelineExpand(false);" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                📕 折叠早期记录
            </button>`
            : `<button class="btn btn-secondary" onclick="toggleProcessTimelineExpand(true);" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                📖 展开全部记录 (${hiddenCount} 条)
            </button>`;
        container.parentElement.appendChild(toggleButton);
    }
    
    // 保存完整历史数据到容器，以便展开时使用
    container.dataset.fullHistory = JSON.stringify(orderHistory);
    container.dataset.isExpanded = isExpanded ? 'true' : 'false';
}

/**
 * 切换详情页时间轴展开/折叠状态
 */
function toggleProcessTimelineExpand(expand) {
    const container = document.getElementById('processTimeline');
    if (!container) return;
    
    container.dataset.isExpanded = expand ? 'true' : 'false';
    
    // 重新渲染
    renderProcessTimeline();
}

/**
 * 渲染抽屜時間軸
 */
function renderDrawerTimeline() {
    const container = document.getElementById('drawerTimeline');
    if (!container) return;
    
    const orderDataElement = document.getElementById('orderData');
    if (!orderDataElement) return;
    
    const orderData = JSON.parse(orderDataElement.textContent);
    const orderHistory = orderData.history;
    const orderNumber = orderData.orderNumber;
    const isAdmin = orderData.isAdmin;
    
    if (!orderHistory || orderHistory.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无历史记录</div>';
        return;
    }
    
    const today = getTodayUTC();  // 使用UTC避免時區問題
    let html = '';
    let totalDays = 0;
    
    orderHistory.forEach((item, index) => {
        const isLast = index === orderHistory.length - 1;
        const fromDate = parseDate(item.action_date);
        const toDate = isLast ? today : parseDate(orderHistory[index + 1].action_date);
        const stayDays = diffDays(fromDate, toDate);
        
        // 修正：前端实时计算当前状态天数
        const currentStatusDays = isLast && fromDate ? diffDays(fromDate, today) : 0;
        
        if (stayDays !== null) {
            totalDays += stayDays;
        }
        
        // 获取上一个状态（用于撤销）
        let previousStatus = null;
        let canUndo = false;
        
        if (isLast && index > 0) {
            const prevItem = orderHistory[index - 1];
            previousStatus = prevItem.to_status;
            canUndo = !(index === 1 && prevItem.from_status === null);
        }
        
        const stepClass = isLast ? 'current' : 'completed';
        const statusIcon = getStatusIcon(item.to_status);
        
        html += `
            <div class="drawer-step ${stepClass}">
                <div class="drawer-step-dot"></div>
                <div class="drawer-step-header">
                    <div class="drawer-step-name">${statusIcon} ${displayStatus(item.to_status)}</div>
                    <div class="drawer-step-date">${formatDate(item.action_date)}</div>
                </div>
                <div class="drawer-step-meta">
                    <div class="meta-item ${isLast ? 'duration' : ''}">
                        <span>⏱️</span>
                        <span>${isLast ? (currentStatusDays < 0 ? `已超時 ${Math.abs(currentStatusDays)} 天` : `已等 ${currentStatusDays} 天`) : (stayDays !== null ? `停留 ${stayDays} 天` : '停留时间不明')}</span>
                    </div>
                    ${item.operator ? `
                        <div class="meta-item">
                            <span>👤</span>
                            <span>${item.operator}</span>
                        </div>
                    ` : ''}
                </div>
                ${item.notes ? `<div class="drawer-step-note">${item.notes}</div>` : ''}
                <div class="drawer-step-actions">
                    <button class="action-btn edit" onclick="toggleEdit(this, ${index})">
                        ✏️ 编辑
                    </button>
                    ${canUndo && previousStatus && isAdmin ? `
                        <button class="action-btn undo" onclick="undoLastStep('${orderNumber}', '${previousStatus}', '${item.to_status}')">
                            ↩️ 撤销
                        </button>
                    ` : ''}
                </div>
                <div class="edit-form" id="editForm${index}">
                    <div class="form-group">
                        <label class="form-label">日期</label>
                        <input type="date" class="form-input" value="${item.action_date}" id="editDate${index}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">备注</label>
                        <textarea class="form-textarea" id="editNote${index}">${item.notes || ''}</textarea>
                    </div>
                    <div class="form-actions">
                        <button class="form-btn save" onclick="saveEdit(${index})">💾 保存</button>
                        <button class="form-btn cancel" onclick="cancelEdit(${index})">✕ 取消</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // 更新总耗时
    const totalDaysEl = document.getElementById('drawerTotalDays');
    if (totalDaysEl) {
        totalDaysEl.textContent = `${totalDays} 天`;
    }
}


/**
 * 日期解析
 */
function parseDate(d) {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
}

/**
 * 計算天數差
 */
function diffDays(from, to) {
    if (!from || !to) return null;
    const ms = to.getTime() - from.getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

/**
 * 打开详情抽屉
 */
function openDetailDrawer() {
    renderDrawerTimeline();
    const overlay = document.getElementById('detailDrawerOverlay');
    const drawer = document.getElementById('detailDrawer');
    if (overlay) overlay.classList.add('show');
    if (drawer) drawer.classList.add('show');
}

/**
 * 关闭详情抽屉
 */
function closeDetailDrawer() {
    const overlay = document.getElementById('detailDrawerOverlay');
    const drawer = document.getElementById('detailDrawer');
    if (overlay) overlay.classList.remove('show');
    if (drawer) drawer.classList.remove('show');
}

/**
 * 切换编辑表单
 */
function toggleEdit(btn, index) {
    const editForm = document.getElementById(`editForm${index}`);
    const actions = btn.parentElement;
    
    // 关闭所有其他编辑表单
    document.querySelectorAll('.edit-form').forEach((form, i) => {
        if (i !== index) {
            form.classList.remove('show');
        }
    });
    document.querySelectorAll('.drawer-step-actions').forEach((act, i) => {
        if (i !== index) {
            act.style.display = 'flex';
        }
    });
    
    if (editForm.classList.contains('show')) {
        editForm.classList.remove('show');
        actions.style.display = 'flex';
    } else {
        editForm.classList.add('show');
        actions.style.display = 'none';
    }
}

/**
 * 保存编辑
 */
function saveEdit(index) {
    const newDate = document.getElementById(`editDate${index}`).value;
    const newNote = document.getElementById(`editNote${index}`).value;
    
    console.log('Save edit for step', index, ':', { date: newDate, note: newNote });
    
    // 这里应该调用API保存更改
    showToast('保存成功', '备注和日期已更新');
    
    // 关闭编辑表单
    cancelEdit(index);
    
    // 重新渲染
    setTimeout(() => {
        renderDrawerTimeline();
        renderProcessTimeline();
    }, 500);
}

/**
 * 取消编辑
 */
function cancelEdit(index) {
    const editForm = document.getElementById(`editForm${index}`);
    const actions = editForm.previousElementSibling;
    
    editForm.classList.remove('show');
    if (actions && actions.classList.contains('drawer-step-actions')) {
        actions.style.display = 'flex';
    }
}

// 订单详情页初始化
document.addEventListener('DOMContentLoaded', function() {
    // 如果存在流程時間軸容器，則渲染
    if (document.getElementById('processTimeline')) {
        renderProcessTimeline();
    }
});
// ==================== 抽屜功能增強版 ====================

function openDetailDrawer() {
    const orderDataEl = document.getElementById('orderData');
    if (!orderDataEl) return;
    
    const data = JSON.parse(orderDataEl.textContent);
    document.getElementById('drawerOrderNumber').textContent = `#${data.orderNumber}`;
    document.getElementById('drawerCustomerName').textContent = data.customerName;
    
    renderDrawerTimelineWithData(data.history, data.orderNumber, data.customerName, data.statusDays);
    
    document.getElementById('detailDrawerOverlay').classList.add('show');
    document.getElementById('detailDrawer').classList.add('show');
}

async function openDetailDrawerFromTimeline(orderNumber, customerName, statusDays) {
    document.getElementById('drawerOrderNumber').textContent = `#${orderNumber}`;
    document.getElementById('drawerCustomerName').textContent = customerName;
    document.getElementById('drawerTotalDays').textContent = '加载中...';
    
    document.getElementById('detailDrawerOverlay').classList.add('show');
    document.getElementById('detailDrawer').classList.add('show');
    
    const container = document.getElementById('drawerTimeline');
    container.innerHTML = '<div style="text-align:center;padding:2rem">⏳ 加载中...</div>';
    
    try {
        const res = await fetch(`/tracking/api/orders/${encodeURIComponent(orderNumber)}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (data.success && data.data && data.data.history) {
            renderDrawerTimelineWithData(data.data.history, orderNumber, customerName, statusDays);
        } else {
            container.innerHTML = '<div class="empty-state">❌ 加载失败</div>';
        }
    } catch (err) {
        console.error('加载订单历史失败:', err);
        container.innerHTML = '<div class="empty-state">❌ 网络错误</div>';
    }
}

function closeDetailDrawer() {
    document.getElementById('detailDrawerOverlay').classList.remove('show');
    document.getElementById('detailDrawer').classList.remove('show');
}

function renderDrawerTimelineWithData(history, orderNumber, customerName, currentStatusDays) {
    const container = document.getElementById('drawerTimeline');
    if (!container || !history || !history.length) {
        container.innerHTML = '<div class="empty-state">暂无历史记录</div>';
        return;
    }
    
    // 折叠配置：如果超过10条记录，默认只显示最近的5条
    const MAX_VISIBLE_DEFAULT = 5;
    const TOTAL_THRESHOLD = 10;
    const shouldCollapse = history.length > TOTAL_THRESHOLD;
    const visibleCount = shouldCollapse ? MAX_VISIBLE_DEFAULT : history.length;
    const hiddenCount = history.length - visibleCount;
    
    // 检查是否已展开（从容器数据属性获取）
    const isExpanded = container.dataset.isExpanded === 'true';
    const displayCount = isExpanded ? history.length : visibleCount;
    const displayHistory = isExpanded ? history : history.slice(-displayCount);
    
    // 获取当前状态
    const currentStatus = history[history.length - 1].to_status;
    
    // 生成快速操作按钮（如果不是已完成/已取消）
    const quickActionsSection = document.getElementById('drawerQuickActions');
    if (quickActionsSection && currentStatus !== STATUS.COMPLETED && currentStatus !== STATUS.CANCELLED) {
        const actions = getQuickActions(currentStatus);
        const actionsGrid = document.getElementById('drawerActionsGrid');
        
        let actionsHTML = '';
        if (actions && actions.length > 0) {
            actions.forEach(action => {
                const safeOrderNumber = String(orderNumber).replace(/'/g, "\\'");
                const safeAction = String(action.action).replace(/'/g, "\\'");
                const safeCurrentStatus = String(currentStatus).replace(/'/g, "\\'");
                const safeNextStatus = String(action.next || '').replace(/'/g, "\\'");
                
                actionsHTML += `
                    <button class="drawer-action-btn btn-${action.color}" 
                            onclick="handleQuickAction('${safeOrderNumber}', '${safeAction}', '${safeCurrentStatus}', '${safeNextStatus}', event)">
                        ${action.label}
                    </button>
                `;
            });
            
            // 添加「跳过阶段」按钮
            actionsHTML += `
                <button class="drawer-action-btn btn-warning" 
                        onclick="showSkipStageModal('${String(orderNumber).replace(/'/g, "\\'")}', '${String(currentStatus).replace(/'/g, "\\'")}')">
                    ⚡ 跳过阶段
                </button>
            `;
        }
        
        if (actionsHTML) {
            actionsGrid.innerHTML = actionsHTML;
            quickActionsSection.style.display = 'block';
        } else {
            quickActionsSection.style.display = 'none';
        }
    } else if (quickActionsSection) {
        quickActionsSection.style.display = 'none';
    }
    
    // 管理功能区（除非已取消，否则总是显示）
    const managementSection = document.getElementById('drawerManagement');
    if (managementSection) {
        if (currentStatus !== STATUS.CANCELLED) {
            managementSection.style.display = 'block';
        } else {
            managementSection.style.display = 'none';
        }
    }
    
    const today = getTodayUTC();  // 使用UTC避免時區問題
    let html = '';
    let totalDays = 0;
    const isAdmin = document.querySelectorAll('.quick-btn').length > 0;
    
    function parseDate(d) {
        if (!d) return null;
        // 使用parseUTCDate確保UTC解析
        return parseUTCDate(d);
    }
    function diffDays(from, to) {
        if (!from || !to) return null;
        const diffMs = to - from;
        return Math.max(0, Math.round(diffMs / (1000*60*60*24)));
    }
    function formatDate(d) {
        if (!d) return '-';
        return formatUTCDate(d);
    }
    
    // 如果折叠且未展开，添加折叠指示器
    if (shouldCollapse && !isExpanded) {
        html += `
            <div class="drawer-step drawer-collapsed-indicator">
                <div class="drawer-step-dot" style="background: var(--text-3); border-color: var(--text-3);"></div>
                <div class="drawer-step-header">
                    <div class="drawer-step-name">⋯ 已折叠 ${hiddenCount} 条早期记录</div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <button class="action-btn edit" onclick="toggleDrawerTimelineExpand('${orderNumber}', true); event.stopPropagation();" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="展开全部记录">📖 展开</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 渲染显示的记录（从displayHistory中获取，但需要映射回原始索引）
    displayHistory.forEach((item, displayIndex) => {
        // 计算在原始history中的索引
        const originalIndex = isExpanded ? displayIndex : (history.length - displayCount + displayIndex);
        const i = originalIndex;
        const isLast = i === history.length - 1;
        const from = parseDate(item.action_date);
        const to = isLast ? today : parseDate(history[i+1] ? history[i+1].action_date : null);
        const days = diffDays(from, to);
        if (days) totalDays += days;
        
        // 重新計算當前狀態的實際天數（不使用後端的currentStatusDays）
        const actualCurrentDays = isLast && from ? diffDays(from, today) : null;
        
        let prevStatus = null, canUndo = false;
        if (isLast && i > 0) {
            prevStatus = history[i-1].to_status;
            canUndo = true; // 只要不是第一步就能撤銷
        }
        
        const cls = isLast ? 'current' : 'completed';
        const icon = getStatusIcon(item.to_status);
        
        html += `<div class="drawer-step ${cls}">
            <div class="drawer-step-dot"></div>
            <div class="drawer-step-header">
                <div class="drawer-step-name">${icon} ${displayStatus(item.to_status)}</div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="drawer-step-date">${formatDate(item.action_date)}</div>
                    <button class="action-btn edit" onclick="toggleEditDrawer(this,${i})" title="编辑">✏️</button>
                    ${canUndo && prevStatus && isAdmin ? `<button class="action-btn undo" onclick="undoLastStepFromDrawer('${orderNumber}','${prevStatus}','${item.to_status}')" title="撤销">↩️</button>` : ''}
                </div>
            </div>
            <div class="drawer-step-meta">
                ${i > 0 || isLast ? `
                <div class="meta-item ${isLast?'duration':''}">
                    <span>⏱️</span>
                    <span>${isLast ? `已等 ${actualCurrentDays} 天` : (days !== null ? `停留 ${days} 天` : '時間不明')}</span>
                </div>
                ` : ''}
                ${item.operator ? `<div class="meta-item"><span>👤</span><span>${item.operator}</span></div>` : ''}
            </div>
            ${item.notes ? `<div class="drawer-step-note">${item.notes}</div>` : ''}
            <div class="edit-form" id="editFormDrawer${i}">
                <div class="form-group"><label class="form-label">日期</label><input type="date" class="form-input" value="${item.action_date}" id="editDateDrawer${i}"></div>
                <div class="form-group"><label class="form-label">备注</label><textarea class="form-textarea" id="editNoteDrawer${i}">${item.notes||''}</textarea></div>
                <div class="form-actions">
                    <button class="form-btn save" onclick="saveEditDrawer(${i}, '${orderNumber}', ${item.id})">💾 保存</button>
                    <button class="form-btn cancel" onclick="cancelEditDrawer(${i})">✕ 取消</button>
                </div>
            </div>
        </div>`;
    });
    
    // 如果已展开，添加折叠按钮（显示在最后一条记录下方）
    if (shouldCollapse && isExpanded) {
        html += `
            <div class="drawer-step" style="padding-top: 1rem; border-top: 1px solid var(--border-color);">
                <div class="drawer-step-dot" style="background: transparent; border-color: transparent;"></div>
                <div class="drawer-step-header">
                    <div class="drawer-step-name" style="color: var(--text-3); font-size: 0.85rem;">已显示全部 ${history.length} 条记录</div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <button class="action-btn edit" onclick="toggleDrawerTimelineExpand('${orderNumber}', false); event.stopPropagation();" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="折叠早期记录">📕 折叠</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    const el = document.getElementById('drawerTotalDays');
    if (el) el.textContent = `${totalDays} 天`;
    
    // 保存完整历史数据到容器，以便展开时使用
    container.dataset.fullHistory = JSON.stringify(history);
    container.dataset.isExpanded = isExpanded ? 'true' : 'false';
    container.dataset.orderNumber = orderNumber;
    container.dataset.customerName = customerName;
    container.dataset.statusDays = currentStatusDays;
}

/**
 * 切换抽屉时间轴展开/折叠状态
 */
function toggleDrawerTimelineExpand(orderNumber, expand) {
    const container = document.getElementById('drawerTimeline');
    if (!container) return;
    
    const fullHistory = JSON.parse(container.dataset.fullHistory || '[]');
    if (!fullHistory.length) return;
    
    const customerName = container.dataset.customerName || '';
    const statusDays = parseInt(container.dataset.statusDays) || 0;
    
    // 先设置展开状态
    container.dataset.isExpanded = expand ? 'true' : 'false';
    
    // 重新渲染时间轴（展开或折叠）
    renderDrawerTimelineWithData(fullHistory, orderNumber, customerName, statusDays);
}

function toggleEditDrawer(btn, i) {
    const step = btn.closest('.drawer-step');
    const form = document.getElementById(`editFormDrawer${i}`);
    document.querySelectorAll('.edit-form').forEach(f => { if(f!==form) f.classList.remove('show'); });
    if (form.classList.contains('show')) {
        form.classList.remove('show');
    } else {
        form.classList.add('show');
    }
}

function saveEditDrawer(i, orderNumber, historyId) {
    const newDate = document.getElementById(`editDateDrawer${i}`).value;
    const newNotes = document.getElementById(`editNoteDrawer${i}`).value;
    
    if (!newDate) {
        showToast('錯誤', '日期不能為空');
        return;
    }
    
    fetch(`/tracking/api/orders/${orderNumber}/history/${historyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_date: newDate, notes: newNotes })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('保存成功', '备注和日期已更新');
            cancelEditDrawer(i);
            const customerName = document.getElementById('drawerCustomerName').textContent;
            openDetailDrawerFromTimeline(orderNumber, customerName, 0);
            
            const detailContent = document.getElementById(`detail-content-${orderNumber}`);
            if (detailContent) {
                fetch(`/tracking/api/orders/${orderNumber}`)
                    .then(res => res.json())
                    .then(result => {
                        if (result.success) renderOrderTimeline(orderNumber, result.data);
                    });
            }
        } else {
            showToast('保存失败', data.error || '操作失败', 'error');
        }
    })
    .catch(err => {
        showToast('保存失败', '网络错误');
    });
}

function cancelEditDrawer(i) {
    const form = document.getElementById(`editFormDrawer${i}`);
    const step = form.closest('.drawer-step');
    const actions = step.querySelector('.drawer-step-actions');
    form.classList.remove('show');
    if (actions) actions.style.display = 'flex';
}

async function undoLastStepFromDrawer(orderNumber, previousStatus, currentStatus) {
    const confirmed = await showConfirmModal(`确认要撤销「${currentStatus}」，回到「${previousStatus}」？`, '确认撤销', '确认撤销', '取消', true);
    if (!confirmed) return;
    
    fetch(`/tracking/api/orders/${orderNumber}/undo-last-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: '手动撤销' })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('撤销成功', data.message);
            
            // 重新获取订单数据
            fetch(`/tracking/api/orders/${orderNumber}`)
                .then(res => res.json())
                .then(result => {
                    if (result.success) {
                        // 1. 更新主页面订单行
                        updateOrderRowAfterUndo(orderNumber, result.data);
                        
                        // 2. 更新筛选按钮计数
                        updateFilterCounts();
                        
                        // 3. 更新嵌入式时间轴（如果存在）
                        const detailContent = document.getElementById(`detail-content-${orderNumber}`);
                        if (detailContent && typeof renderOrderTimeline === 'function') {
                            renderOrderTimeline(orderNumber, result.data);
                        }
                        
                        // 4. 最后刷新抽屉
                        const customerName = document.getElementById('drawerCustomerName').textContent;
                        openDetailDrawerFromTimeline(orderNumber, customerName, 0);
                    }
                });
        } else {
            showToast('撤销失败', data.error || '操作失败', 'error');
        }
    })
    .catch(err => {
        showToast('撤销失败', '网络错误');
    });
}

/**
 * 显示跳过阶段 Modal
 */
function showSkipStageModal(orderNumber, currentStatus) {
    const modal = document.getElementById('skipStageModal');
    if (!modal) {
        console.error('Skip stage modal not found');
        return;
    }
    
    const currentStatusEl = document.getElementById('skipCurrentStatus');
    const optionsContainer = document.getElementById('skipStageOptions');
    
    if (currentStatusEl) {
        currentStatusEl.textContent = displayStatus(currentStatus);
    }
    
    // 获取可跳转的状态
    const skippableStatuses = getSkippableStatuses(currentStatus);
    
    if (!skippableStatuses || skippableStatuses.length === 0) {
        showToast('提示', '当前状态无法跳过到其他阶段');
        return;
    }
    
    let optionsHTML = '';
    skippableStatuses.forEach((status, index) => {
        const displayName = displayStatus(status);
        const icon = getStatusIcon(status);
        const stageName = getStageName(status);
        
        optionsHTML += `
            <label class="skip-option">
                <input type="radio" name="skipTarget" value="${status}" ${index === 0 ? 'checked' : ''}>
                <span class="skip-option-content">
                    <span class="skip-option-icon">${icon}</span>
                    <span class="skip-option-text">
                        <strong>${displayName}</strong>
                        <small>${stageName}</small>
                    </span>
                </span>
            </label>
        `;
    });
    
    if (optionsContainer) {
        optionsContainer.innerHTML = optionsHTML;
    }
    
    // 保存订单号和当前状态
    modal.dataset.orderNumber = orderNumber;
    modal.dataset.currentStatus = currentStatus;
    
    modal.classList.add('show');
}

/**
 * 关闭跳过阶段 Modal
 */
function closeSkipStageModal() {
    const modal = document.getElementById('skipStageModal');
    if (modal) {
        modal.classList.remove('show');
        // 清空备注
        const notesField = document.getElementById('skipStageNotes');
        if (notesField) {
            notesField.value = '';
        }
    }
}

/**
 * 确认跳过阶段
 */
function confirmSkipStage() {
    const modal = document.getElementById('skipStageModal');
    if (!modal) return;
    
    const orderNumber = modal.dataset.orderNumber;
    const currentStatus = modal.dataset.currentStatus;
    const selectedTarget = document.querySelector('input[name="skipTarget"]:checked');
    const notes = document.getElementById('skipStageNotes').value;
    
    if (!selectedTarget) {
        showToast('错误', '请选择目标阶段', 'error');
        return;
    }
    
    const targetStatus = selectedTarget.value;
    const targetDisplayName = displayStatus(targetStatus);
    
    // 准备请求数据
    const requestData = {
        action_date: getTodayDate(),
        notes: notes || `跳过阶段：${displayStatus(currentStatus)} → ${targetDisplayName}`
    };
    
    // 调用 API 执行状态更新
    fetch(`/tracking/api/orders/${orderNumber}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            new_status: targetStatus,
            action_date: requestData.action_date,
            notes: requestData.notes
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('跳过成功', `已从「${displayStatus(currentStatus)}」跳到「${targetDisplayName}」`);
            
            // 1. 立即关闭 Modal
            closeSkipStageModal();
            
            // 2. 关闭抽屉
            closeDetailDrawer();
            
            // 3. 刷新所有组件并高亮显示
            setTimeout(() => {
                refreshAndHighlightOrder(orderNumber);
            }, 300);
        } else {
            showToast('跳过失败', data.error || '操作失败', 'error');
        }
    })
    .catch(err => {
        console.error('跳过阶段失败:', err);
        showToast('跳过失败', '网络错误', 'error');
    });
}

/**
 * 刷新页面并高亮显示指定订单
 */
function refreshAndHighlightOrder(orderNumber) {
    // 刷新页面并通过 URL 参数传递高亮订单号
    const url = new URL(window.location.href);
    url.searchParams.set('highlight', orderNumber);
    window.location.href = url.toString();
}

/**
 * 高亮显示订单行
 */
function highlightOrderRow(orderNumber) {
    // 找到订单行
    const orderRow = document.querySelector(`tr[data-order-number="${orderNumber}"]`);
    if (!orderRow) {
        console.warn(`找不到订单 ${orderNumber} 的行`);
        return;
    }
    
    // 添加高亮类
    orderRow.classList.add('order-highlight');
    
    // 滚动到可见区域
    orderRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // 5秒后移除高亮
    setTimeout(() => {
        orderRow.classList.remove('order-highlight');
    }, 10000);
}

/**
 * 页面加载时检查是否有需要高亮的订单
 */
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const highlightOrder = urlParams.get('highlight');
    
    if (highlightOrder) {
        setTimeout(() => {
            highlightOrderRow(highlightOrder);
            // 清除 URL 参数
            const url = new URL(window.location.href);
            url.searchParams.delete('highlight');
            window.history.replaceState({}, '', url.toString());
        }, 500);
    }
});


/**
 * 从抽屉编辑订单（使用 Modal）
 */
function editOrderFromDrawer() {
    const orderNumber = document.getElementById('drawerOrderNumber').textContent.replace('#', '').trim();
    if (!orderNumber) {
        showToast('错误', '无法获取订单号');
        return;
    }
    
    // 获取订单数据
    fetch(`/tracking/api/orders/${encodeURIComponent(orderNumber)}`)
        .then(res => res.json())
        .then(result => {
            if (result.success && result.data) {
                const order = result.data; // 注意：API 返回 result.data 直接是订单对象
                
                // 设置标题
                const title = document.getElementById('editOrderModalTitle');
                if (title) title.textContent = '✏️ 编辑订单';
                
                // 设置提交按钮文本
                const submitBtn = document.getElementById('editOrderSubmitBtn');
                if (submitBtn) submitBtn.textContent = '保存修改 💾';
                
                // 填充表单
                const orderNumberInput = document.getElementById('editOrderNumber');
                const orderNumber = order.order_number || '';
                orderNumberInput.value = orderNumber;
                orderNumberInput.readOnly = true;
                orderNumberInput.style.background = '#f3f4f6';
                orderNumberInput.setAttribute('data-original-order-number', orderNumber);
                
                document.getElementById('editCustomerName').value = order.customer_name || '';
                document.getElementById('editOrderDate').value = order.order_date || '';
                document.getElementById('editProductCode').value = order.product_code || '';
                document.getElementById('editQuantity').value = order.quantity || '';
                document.getElementById('editFactory').value = order.factory || '';
                document.getElementById('editExpectedDeliveryDate').value = order.expected_delivery_date || '';
                document.getElementById('editProductionType').value = order.production_type || '';
                document.getElementById('editNotes').value = order.notes || '';
                
                // 显示"修改订单号"按钮（所有订单都可以修改订单号）
                const toggleBtn = document.getElementById('toggleOrderNumberEdit');
                const warning = document.getElementById('editOrderNumberWarning');
                const errorDiv = document.getElementById('editOrderNumberError');
                if (toggleBtn) toggleBtn.style.display = 'block';
                if (warning) warning.style.display = 'none';
                if (errorDiv) errorDiv.style.display = 'none';
                
                // 添加订单号输入监听（编辑模式，仅在解锁时验证）
                setupOrderNumberValidation(orderNumberInput, false);
                
                // 隐藏提示
                const hint = document.getElementById('editOrderNumberHint');
                if (hint) hint.style.display = 'none';
                
                // 显示 Modal
                const modal = document.getElementById('editOrderModal');
                if (modal) {
                    modal.classList.add('show');
                    modal.setAttribute('data-mode', 'edit');
                }
            } else {
                showToast('错误', '无法加载订单数据', 'error');
                console.error('API 返回错误:', result);
            }
        })
        .catch(err => {
            console.error('加载订单数据失败:', err);
            showToast('错误', '网络错误', 'error');
        });
}

/**
 * 设置订单号输入验证
 */
let orderNumberCheckTimeout;
function setupOrderNumberValidation(input, isNewMode) {
    // 移除旧的监听器
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    
    // 添加新的监听器
    newInput.addEventListener('input', function() {
        const orderNumber = this.value.trim();
        const errorDiv = document.getElementById('editOrderNumberError');
        const originalOrderNumber = this.getAttribute('data-original-order-number');
        
        // 清除之前的定时器
        clearTimeout(orderNumberCheckTimeout);
        
        // 如果是编辑模式且订单号未改变，不检查
        if (!isNewMode && originalOrderNumber && orderNumber === originalOrderNumber) {
            if (errorDiv) errorDiv.style.display = 'none';
            return;
        }
        
        // 如果订单号为空，隐藏错误提示
        if (!orderNumber) {
            if (errorDiv) errorDiv.style.display = 'none';
            return;
        }
        
        // 防抖：延迟 500ms 后检查
        orderNumberCheckTimeout = setTimeout(() => {
            fetch(`/tracking/api/orders/check-number?order_number=${encodeURIComponent(orderNumber)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.exists) {
                        if (errorDiv) {
                            errorDiv.textContent = '❌ ' + data.message;
                            errorDiv.style.display = 'block';
                        }
                    } else {
                        if (errorDiv) errorDiv.style.display = 'none';
                    }
                })
                .catch(err => {
                    console.error('檢查訂單號失敗:', err);
                });
        }, 500);
    });
}

/**
 * 切换订单号编辑状态
 */
function toggleOrderNumberEdit() {
    const orderNumberInput = document.getElementById('editOrderNumber');
    const toggleBtn = document.getElementById('toggleOrderNumberEdit');
    const warning = document.getElementById('editOrderNumberWarning');
    const errorDiv = document.getElementById('editOrderNumberError');
    
    if (orderNumberInput.readOnly) {
        // 解锁编辑
        orderNumberInput.readOnly = false;
        orderNumberInput.style.background = '';
        orderNumberInput.focus();
        if (toggleBtn) toggleBtn.textContent = '🔒 锁定订单号';
        if (warning) warning.style.display = 'block';
        // 解锁后立即检查订单号
        const orderNumber = orderNumberInput.value.trim();
        if (orderNumber) {
            const originalOrderNumber = orderNumberInput.getAttribute('data-original-order-number');
            if (orderNumber !== originalOrderNumber) {
                fetch(`/tracking/api/orders/check-number?order_number=${encodeURIComponent(orderNumber)}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.exists) {
                            if (errorDiv) {
                                errorDiv.textContent = '❌ ' + data.message;
                                errorDiv.style.display = 'block';
                            }
                        } else {
                            if (errorDiv) errorDiv.style.display = 'none';
                        }
                    })
                    .catch(err => console.error('檢查訂單號失敗:', err));
            }
        }
    } else {
        // 锁定编辑
        orderNumberInput.readOnly = true;
        orderNumberInput.style.background = '#f3f4f6';
        if (toggleBtn) toggleBtn.textContent = '✏️ 修改订单号';
        if (warning) warning.style.display = 'none';
        if (errorDiv) errorDiv.style.display = 'none';
    }
}

/**
 * 关闭编辑订单 Modal
 */
function closeEditOrderModal() {
    const modal = document.getElementById('editOrderModal');
    if (modal) {
        modal.classList.remove('show');
        modal.removeAttribute('data-mode');
    }
    
    // 重置订单号编辑状态
    const orderNumberInput = document.getElementById('editOrderNumber');
    const toggleBtn = document.getElementById('toggleOrderNumberEdit');
    const warning = document.getElementById('editOrderNumberWarning');
    if (orderNumberInput) {
        orderNumberInput.readOnly = true;
        orderNumberInput.style.background = '#f3f4f6';
        orderNumberInput.removeAttribute('data-original-order-number');
    }
    if (toggleBtn) toggleBtn.style.display = 'none';
    if (warning) warning.style.display = 'none';
}

/**
 * 确认编辑/新增订单
 */
function confirmEditOrder() {
    const modal = document.getElementById('editOrderModal');
    const isNewMode = modal && modal.getAttribute('data-mode') === 'new';
    
    const orderNumber = document.getElementById('editOrderNumber').value.trim();
    const customerName = document.getElementById('editCustomerName').value.trim();
    const orderDate = document.getElementById('editOrderDate').value;
    
    // 验证必填项
    if (!customerName) {
        showToast('错误', '客户名称不能为空', 'error');
        document.getElementById('editCustomerName').focus();
        return;
    }
    
    if (!orderDate) {
        showToast('错误', '订单日期不能为空', 'error');
        document.getElementById('editOrderDate').focus();
        return;
    }
    
    // 准备数据
    const orderData = {
        order_number: orderNumber || '', // 新增时可以为空
        customer_name: customerName,
        order_date: orderDate,
        product_code: document.getElementById('editProductCode').value.trim(),
        product_name: document.getElementById('editProductCode').value.trim(),
        quantity: document.getElementById('editQuantity').value.trim(),
        factory: document.getElementById('editFactory').value.trim(),
        expected_delivery_date: document.getElementById('editExpectedDeliveryDate').value,
        production_type: document.getElementById('editProductionType').value.trim(),
        pattern_code: '',
        notes: document.getElementById('editNotes').value.trim()
    };
    
    if (isNewMode) {
        // 新增订单
        fetch('/tracking/api/orders', {
            method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
            body: JSON.stringify(orderData)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
                showToast('创建成功', '订单已创建');
                closeEditOrderModal();
                
                // 刷新页面
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                showToast('创建失败', data.error || data.message || '操作失败', 'error');
            }
        })
        .catch(err => {
            console.error('创建订单失败:', err);
            showToast('创建失败', '网络错误', 'error');
        });
    } else {
        // 编辑订单
        if (!orderNumber) {
            showToast('错误', '订单号不能为空', 'error');
            return;
        }
        
        // 检查订单号是否被修改
        const orderNumberInput = document.getElementById('editOrderNumber');
        const originalOrderNumber = orderNumberInput.getAttribute('data-original-order-number');
        const orderNumberChanged = originalOrderNumber && orderNumber !== originalOrderNumber;
        
        // 如果订单号被修改，使用特殊的更新 API
        const apiUrl = orderNumberChanged 
            ? `/tracking/api/orders/${encodeURIComponent(originalOrderNumber)}/change-number`
            : `/tracking/api/orders/${encodeURIComponent(orderNumber)}`;
        
        // 如果订单号被修改，需要在数据中包含新订单号
        if (orderNumberChanged) {
            orderData.new_order_number = orderNumber;
        }
        
        fetch(apiUrl, {
            method: orderNumberChanged ? 'POST' : 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(orderData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (orderNumberChanged) {
                    showToast('保存成功', `订单号已从 ${originalOrderNumber} 修改为 ${orderNumber}`);
                    // 订单号已改变，需要刷新页面
                    closeEditOrderModal();
                    closeDetailDrawer();
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                } else {
            showToast('保存成功', '订单信息已更新');
            // 1. 关闭 Modal
            closeEditOrderModal();
            
            // 2. 关闭抽屉
            closeDetailDrawer();
            
            // 3. 刷新并高亮显示
            setTimeout(() => {
                refreshAndHighlightOrder(orderNumber);
            }, 300);
                }
        } else {
                showToast('保存失败', data.error || data.message || '操作失败', 'error');
        }
    })
    .catch(err => {
        console.error('编辑订单失败:', err);
            showToast('保存失败', '网络错误', 'error');
    });
    }
}

/**
 * 从抽屉取消订单（使用 Modal）
 */
function cancelOrderFromDrawer() {
    const orderNumber = document.getElementById('drawerOrderNumber').textContent.replace('#', '').trim();
    if (!orderNumber) {
        showToast('错误', '无法获取订单号');
        return;
    }
    
    // 显示取消订单 Modal
    document.getElementById('cancelOrderNumber').textContent = `#${orderNumber}`;
    document.getElementById('cancelReason').value = '';
    
    const modal = document.getElementById('cancelOrderModal');
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * 关闭取消订单 Modal
 */
function closeCancelOrderModal() {
    const modal = document.getElementById('cancelOrderModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * 确认取消订单
 */
function confirmCancelOrder() {
    const orderNumber = document.getElementById('cancelOrderNumber').textContent.replace('#', '').trim();
    const reason = document.getElementById('cancelReason').value.trim();
    
    if (!reason) {
        showToast('错误', '请填写取消原因', 'error');
        document.getElementById('cancelReason').focus();
        return;
    }
    
    // 调用 API
    fetch(`/tracking/api/orders/${encodeURIComponent(orderNumber)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            new_status: STATUS.CANCELLED,
            action_date: getTodayDate(),
            notes: `取消订单：${reason}`
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('取消成功', `订单 ${orderNumber} 已取消`);
            
            // 1. 立即关闭 Modal
            closeCancelOrderModal();
            
            // 2. 关闭抽屉
            closeDetailDrawer();
            
            // 3. 刷新并高亮显示
            setTimeout(() => {
                refreshAndHighlightOrder(orderNumber);
            }, 300);
        } else {
            showToast('取消失败', data.error || '操作失败', 'error');
        }
    })
    .catch(err => {
        console.error('取消订单失败:', err);
        showToast('取消失败', '网络错误', 'error');
    });
}



/**
 * 撤销后更新主页面的订单行
 */
function updateOrderRowAfterUndo(orderNumber, orderData) {
    const row = document.querySelector(`tr[data-order-number="${orderNumber}"]`);
    if (!row) return;
    
    // 更新状态
    row.dataset.status = orderData.current_status;
    row.dataset.light = orderData.status_light;
    
    // 使用STATUS_SYSTEM获取stage
    const stageGroup = getStageGroup(orderData.current_status);
    
    row.dataset.stageGroup = stageGroup;
    row.className = orderData.status_light;
    
    // 更新灯号
    const lightCell = row.querySelector('.light');
    if (lightCell) {
        let lightEmoji = '🟢';
        if (orderData.status_light === 'red') lightEmoji = '🔴';
        else if (orderData.status_light === 'yellow') lightEmoji = '🟡';
        else if (orderData.current_status === STATUS.CANCELLED) lightEmoji = '⚫';
        lightCell.textContent = lightEmoji;
    }
    
    // 更新阶段显示 - 使用STATUS_SYSTEM
    const stageInfo = row.querySelector('.stage-info');
    if (stageInfo) {
        let stageMajor = '📋 其他';
        if (stageGroup !== 'all') {
            const stageGroupData = STAGE_GROUPS[stageGroup];
            if (stageGroupData) {
                stageMajor = `${stageGroupData.icon} ${displayStatus(stageGroupData.name)}`;
            }
        }
        
        stageInfo.querySelector('.stage-major').textContent = stageMajor;
        stageInfo.querySelector('.stage-current').textContent = displayStatus(orderData.current_status);
    }
    
    // 更新等待天数
    const daysSpan = row.querySelector('.days');
    if (daysSpan) {
        daysSpan.textContent = `${orderData.status_days || 0}天`;
        daysSpan.className = 'days';
        if (orderData.status_light === 'red') daysSpan.className += ' danger';
        else if (orderData.status_light === 'yellow') daysSpan.className += ' warning';
    }
    
    // 重要：更新悬停按钮（根据新状态显示新的操作按钮）
    showQuickActionsForRow(row, orderData.current_status);
    
    // 重新应用筛选（如果当前有筛选）
    if (typeof applyFilters === 'function') {
        applyFilters();
    }
}

/**
 * 更新筛选按钮的计数（统一使用 STATUS_SYSTEM.js）
 */
function updateFilterCounts() {
    const allRows = document.querySelectorAll('#ordersTableBody tr[data-order-number]');
    
    // 统计各状态的数量（使用 STATUS_SYSTEM.js 的阶段分组）
    let counts = {
        all: 0,
        new_and_quote: 0,
        draft: 0,
        sampling: 0,
        production: 0,
        waiting_confirm: 0,  // 等国外确认（虚拟筛选器）
        completed: 0,
        cancelled: 0
    };
    
    allRows.forEach(row => {
        const status = row.dataset.status || ''; // 简体状态
        const stageGroup = row.dataset.stageGroup || '';
        
        // 使用 STATUS_SYSTEM.js 获取阶段分组（如果可用）
        let actualStageGroup = stageGroup;
        if (typeof getStageGroup === 'function' && status) {
            actualStageGroup = getStageGroup(status);
        }
        
        // 统计进行中的订单（排除已完成和已取消）
        if (status !== STATUS.COMPLETED && status !== STATUS.CANCELLED) {
            counts.all++;
            
            // 统计各阶段的数量（只统计进行中的订单）
            if (actualStageGroup && counts.hasOwnProperty(actualStageGroup)) {
                counts[actualStageGroup]++;
            }
        }
        
        // 特殊处理：等国外确认（虚拟筛选器 - 使用新的 isStatusInFilter 函数）
        if (typeof isStatusInFilter === 'function') {
            if (isStatusInFilter(status, 'waiting_confirm')) {
                counts.waiting_confirm++;
            }
        } else if (typeof STAGE_GROUPS !== 'undefined' && STAGE_GROUPS.waiting_confirm) {
            // 降级方案：直接检查 STAGE_GROUPS
            const waitingConfirmStatuses = STAGE_GROUPS.waiting_confirm.statuses;
            if (waitingConfirmStatuses && waitingConfirmStatuses.includes(status)) {
                counts.waiting_confirm++;
            }
        }
        
        // 特殊处理：已完成和已取消（独立统计，不重复）
        if (status === STATUS.COMPLETED) {
            counts.completed++;
        } else if (status === STATUS.CANCELLED) {
            counts.cancelled++;
        }
    });
    
    // 更新按钮显示
    const updateCount = (selector, count) => {
        const elem = document.querySelector(selector);
        if (elem) elem.textContent = count;
    };
    
    // 更新各个按钮的计数
    updateCount('.stage-btn.active .stage-count', counts.all);
    updateCount('#newAndQuoteCount', counts.new_and_quote);
    updateCount('#draftCount', counts.draft);
    updateCount('#samplingCount', counts.sampling);
    updateCount('#productionCount', counts.production);
    updateCount('#waitingConfirmCount', counts.waiting_confirm);  // 更新为新的 ID
    updateCount('#quoteCount', counts.waiting_confirm);  // 兼容旧 ID
    updateCount('#completedCount', counts.completed);
    updateCount('#cancelledCount', counts.cancelled);
    
    // 更新子状态计数（如果存在）
    if (typeof STAGE_GROUPS !== 'undefined' && typeof getStatusesByStageGroup === 'function') {
        // 更新打样阶段的子状态计数
        const samplingStatuses = getStatusesByStageGroup('sampling') || [];
        samplingStatuses.forEach(status => {
            const count = Array.from(allRows).filter(row => {
                const rowStatus = row.dataset.status || '';
                return rowStatus === status;
            }).length;
            // 更新简体状态计数
            const statusId = status.replace(/\s+/g, '-').toLowerCase();
            updateCount(`#sampling-${statusId}-count`, count);
            // 更新繁体显示状态计数（如果存在）
            if (typeof displayStatus === 'function') {
                const displayStatusText = displayStatus(status);
                const displayStatusId = displayStatusText.replace(/\s+/g, '-').toLowerCase();
                updateCount(`#sampling-${displayStatusId}-count`, count);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('processTimeline')) {
        renderProcessTimeline();
    }
});

// ==================== 筛选状态记忆功能 ====================

// 页面加载时恢复筛选状态
function restoreFilterState() {
    try {
        const saved = localStorage.getItem('orderFilterState');
        if (saved) {
            const state = JSON.parse(saved);
            
            // 恢复阶段筛选
            if (state.stageGroup && state.stageGroup !== 'all') {
                currentFilter.stageGroup = state.stageGroup;
                currentFilter.substatus = state.substatus || 'all';
                
                // 更新按钮状态
                const activeBtn = document.querySelector(`[onclick*="'${state.stageGroup}'"]`);
                if (activeBtn) {
                    document.querySelectorAll('.stage-btn').forEach(btn => btn.classList.remove('active'));
                    activeBtn.classList.add('active');
                }
            }
            
            // 恢复checkbox状态
            if (state.showCompleted !== undefined) {
                const completedCheckbox = document.getElementById('toggleCompleted');
                if (completedCheckbox) {
                    completedCheckbox.checked = state.showCompleted;
                    currentFilter.showCompleted = state.showCompleted;
                }
            }
            
            if (state.showCancelled !== undefined) {
                const cancelledCheckbox = document.getElementById('toggleCancelled');
                if (cancelledCheckbox) {
                    cancelledCheckbox.checked = state.showCancelled;
                    currentFilter.showCancelled = state.showCancelled;
                }
            }
            
            // 应用筛选
            applyFilters();
        } else {
            // 即使没有保存的筛选状态，也要初始化一次筛选（确保显示正确）
            applyFilters();
        }
    } catch (err) {
        console.error('恢复筛选状态失败:', err);
        // 出错时也要初始化筛选
        try {
            applyFilters();
        } catch (e) {
            console.error('初始化筛选失败:', e);
        }
    }
}

// 保存筛选状态
function saveFilterState() {
    try {
        const state = {
            stageGroup: currentFilter.stageGroup,
            substatus: currentFilter.substatus,
            showCompleted: currentFilter.showCompleted,
            showCancelled: currentFilter.showCancelled
        };
        localStorage.setItem('orderFilterState', JSON.stringify(state));
    } catch (err) {
        console.error('保存筛选状态失败:', err);
    }
}

// 页面加载时自动恢复
document.addEventListener('DOMContentLoaded', function() {
    restoreFilterState();
    // 转换HTML中硬编码的简体中文为繁体中文
    convertSimplifiedToTraditional();
    
    // 初始化筛选按钮计数（页面加载时）
    if (typeof updateFilterCounts === 'function') {
        // 等待 STATUS_SYSTEM.js 加载完成后再统计
        setTimeout(() => {
            updateFilterCounts();
        }, 100);
    }
});

// ==================== 繁简转换功能 ====================
/**
 * 将HTML中硬编码的简体中文转换为繁体中文
 * 确保与 STATUS_SYSTEM.js 中的 USER_LANG 设置一致
 */
function convertSimplifiedToTraditional() {
    // 检查是否应该使用繁体中文
    if (typeof USER_LANG === 'undefined' || USER_LANG === 'simplified') {
        return; // 如果使用简体，不需要转换
    }
    
    // 如果 STATUS_SYSTEM.js 未加载，等待一下
    if (typeof displayStatus === 'undefined' || typeof displayText === 'undefined') {
        setTimeout(convertSimplifiedToTraditional, 100);
        return;
    }
    
    // 转换阶段名称
    const stageTextMap = {
        '图稿阶段': '圖稿階段',
        '打样阶段': '打樣階段',
        '生产阶段': '生產階段',
        '新订单/询价': '新訂單/詢價',
        '新订单': '新訂單',
        '已完成': '已完成',
        '已取消': '已取消',
        '其他': '其他'
    };
    
    // 转换状态文本（在表格中的 stage-current 类）
    document.querySelectorAll('.stage-current').forEach(el => {
        const text = el.textContent.trim();
        if (text && typeof displayStatus === 'function') {
            el.textContent = displayStatus(text);
        }
    });
    
    // 转换阶段名称（在表格中的 stage-major 类）
    document.querySelectorAll('.stage-major').forEach(el => {
        let text = el.textContent.trim();
        // 移除emoji，只转换文字部分
        const emojiMatch = text.match(/^([^\s]+)\s+(.+)$/);
        if (emojiMatch) {
            const emoji = emojiMatch[1];
            const stageText = emojiMatch[2];
            if (stageTextMap[stageText]) {
                el.textContent = `${emoji} ${stageTextMap[stageText]}`;
            }
        } else {
            // 如果没有emoji，直接转换
            if (stageTextMap[text]) {
                el.textContent = stageTextMap[text];
            }
        }
    });
    
    // 转换筛选按钮中的文本
    document.querySelectorAll('.stage-btn').forEach(btn => {
        let text = btn.textContent.trim();
        // 移除计数，只转换文字部分
        const textMatch = text.match(/^([^\d]+)/);
        if (textMatch) {
            const stageText = textMatch[1].trim();
            if (stageTextMap[stageText]) {
                const countPart = text.substring(textMatch[0].length);
                btn.childNodes[0].textContent = stageTextMap[stageText] + countPart;
            }
        }
    });
    
    // 转换子状态选项中的文本
    document.querySelectorAll('.substatus-option span').forEach(span => {
        const text = span.textContent.trim();
        if (stageTextMap[text]) {
            span.textContent = stageTextMap[text];
        }
    });
}


// ==================== 全局搜索功能 ====================

let originalOrders = null;  // 保存原始订单数据
let isGlobalSearchMode = false;  // 是否在全局搜索模式

/**
 * 全局搜索函数
 */
async function globalSearch() {
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput ? searchInput.value.trim() : '';
    
    try {
        // 显示加载状态
        showToast('搜索中...', '正在查询数据库');
        
        // 如果是第一次搜索，保存原始订单数据
        if (!isGlobalSearchMode && originalOrders === null) {
            const tbody = document.getElementById('ordersTableBody');
            if (tbody) {
                originalOrders = tbody.innerHTML;
            }
        }
        
        // 调用后端API
        const response = await fetch(`/tracking/api/search?q=${encodeURIComponent(keyword)}`);
        const result = await response.json();
        
        if (!result.success) {
            showToast('搜索失败', result.error || '未知错误', 'error');
            return;
        }
        
        // 标记为搜索模式
        isGlobalSearchMode = true;
        
        // 渲染搜索结果
        renderSearchResults(result.orders);
        
        // Toast通知搜索结果
        if (result.type === 'search') {
            showToast('🔍 搜索完成', `找到 ${result.total} 条匹配的订单`);
        } else {
            showToast('📋 已加载', `显示最近 ${result.total} 条订单（所有状态）`);
        }
        
    } catch (error) {
        console.error('全局搜索错误:', error);
        showToast('搜索失败', '网络错误，请稍后再试', 'error');
    }
}

/**
 * 显示搜索结果提示 - 已移除，改用Toast
 */
function showSearchResultHeader(result) {
    // 不再需要此函数
}

/**
 * 渲染搜索结果
 */
function renderSearchResults(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="13" style="text-align: center; padding: 3rem; color: var(--text-3);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                    <div>未找到匹配的订单</div>
                </td>
            </tr>
        `;
        return;
    }
    
    // 清空现有内容
    tbody.innerHTML = '';
    
    // 渲染每个订单行
    orders.forEach(order => {
        const row = createOrderRow(order);
        tbody.appendChild(row);
    });
}

/**
 * 创建订单行元素
 */
function createOrderRow(order) {
    const tr = document.createElement('tr');
    tr.className = order.status_light;
    tr.dataset.orderNumber = order.order_number;
    tr.dataset.customerName = order.customer_name;
    tr.dataset.status = order.current_status;
    tr.dataset.light = order.status_light;
    tr.onclick = (e) => toggleDetail(order.order_number, e);
    
    // 使用STATUS_SYSTEM确定stage-group
    const stageGroup = getStageGroup(order.current_status);
    tr.dataset.stageGroup = stageGroup;
    
    // 灯号图标
    let lightEmoji = '🟢';
    if (order.status_light === 'red') lightEmoji = '🔴';
    else if (order.status_light === 'yellow') lightEmoji = '🟡';
    else if (typeof STATUS !== 'undefined' && order.current_status === STATUS.CANCELLED) lightEmoji = '⚫';
    
    // 订单号前缀
    const orderNumberDisplay = order.order_number.startsWith('REV-') 
        ? `🎨 ${order.order_number}` 
        : `#${order.order_number}`;
    
    // 阶段显示 - 使用STATUS_SYSTEM
    let stageMajor = '📋 其他';
    if (stageGroup !== 'all') {
        const stageGroupData = STAGE_GROUPS[stageGroup];
        if (stageGroupData) {
            stageMajor = `${stageGroupData.icon} ${displayStatus(stageGroupData.name)}`;
        }
    }
    
    // 等待天数显示和样式
    let daysClass = '';
    let daysDisplay = '';
    const statusDays = order.status_days || 0;
    
    if (order.status_light === 'red') {
        daysClass = ' danger';
        // 红灯：显示已超时
        if (statusDays < 0) {
            daysDisplay = `已超時 ${Math.abs(statusDays)} 天`;
        } else {
            daysDisplay = `${statusDays} 天`;
        }
    } else if (order.status_light === 'yellow') {
        daysClass = ' warning';
        // 黄灯：如果是负数显示已超时，否则正常显示
        if (statusDays < 0) {
            daysDisplay = `已超時 ${Math.abs(statusDays)} 天`;
        } else {
            daysDisplay = `${statusDays} 天`;
        }
    } else {
        // 绿灯：也要检查负数
        if (statusDays < 0) {
            daysDisplay = `已超時 ${Math.abs(statusDays)} 天`;
            daysClass = ' warning';  // 如果是负数，加警告样式
        } else {
            daysDisplay = `${statusDays} 天`;
        }
    }
    
    tr.innerHTML = `
        <td class="expand-cell">
            <span class="expand-btn" id="expand-${order.order_number}">▶</span>
        </td>
        <td class="light">${lightEmoji}</td>
        <td class="order-date">${order.order_date || '-'}</td>
        <td class="order-no">${orderNumberDisplay}</td>
        <td class="customer">${order.customer_name || '-'}</td>
        <td>${order.product_name || '-'}</td>
        <td>${order.product_code || '-'}</td>
        <td>${order.quantity || '-'}</td>
        <td>${order.production_type || '-'}</td>
        <td>
            <div class="stage-info">
                <div class="stage-major">${stageMajor}</div>
                <div class="stage-current">${order.current_status}</div>
            </div>
        </td>
        <td>
            <span class="days${daysClass}">${daysDisplay}</span>
        </td>
        ${sessionRole === 'admin' ? '<td class="actions-cell">-</td>' : ''}
    `;
    
    return tr;
}

/**
 * 清除全局搜索，返回原始列表
 */
function clearGlobalSearch() {
    if (!isGlobalSearchMode) return;
    
    // 恢复原始订单数据
    const tbody = document.getElementById('ordersTableBody');
    if (tbody && originalOrders) {
        tbody.innerHTML = originalOrders;
    }
    
    // 清空搜索框
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // 重置状态
    isGlobalSearchMode = false;
    
    // 重新应用筛选
    if (typeof applyFilters === 'function') {
        applyFilters();
    }
    
    showToast('✅ 已返回', '返回进行中订单列表');
}

// 获取session role（用于渲染操作列）
const sessionRole = document.querySelector('body').dataset.role || 
                   (document.querySelector('.user-name') ? 'admin' : 'viewer');


// ==================== 动态悬停按钮管理 ====================

/**
 * 为订单行动态生成悬停按钮
 */
function showQuickActionsForRow(row, currentStatus) {
    const actionsCell = row.querySelector('.actions-cell');
    if (!actionsCell) return;
    
    // 获取当前状态（如果没有提供，从 data 属性获取）
    if (!currentStatus) {
        currentStatus = row.dataset.status || actionsCell.dataset.currentStatus || '';
    }
    
    // 获取订单号
    const orderNumber = row.dataset.orderNumber || actionsCell.dataset.orderNumber || '';
    
    // 特殊情况：已完成、已取消不显示悬停按钮（新订单有下一步操作，需要显示按钮）
    if (!currentStatus || 
        currentStatus === STATUS.COMPLETED || 
        currentStatus === STATUS.CANCELLED) {
        const quickActions = actionsCell.querySelector('.quick-actions');
        if (quickActions) {
            quickActions.innerHTML = '';
        }
        return;
    }
    
    // 从 STATUS_SYSTEM.js 获取快捷操作
    if (typeof getQuickActions !== 'function') {
        console.error('getQuickActions function not found. Make sure STATUS_SYSTEM.js is loaded.');
        return;
    }
    
    const actions = getQuickActions(currentStatus);
    if (!actions || actions.length === 0) {
        console.warn(`No quick actions found for status: ${currentStatus}`);
        const quickActions = actionsCell.querySelector('.quick-actions');
        if (quickActions) {
            quickActions.innerHTML = '';
        }
        return;
    }
    
    // 生成按钮HTML
    let buttonsHTML = '';
    actions.forEach(action => {
        // 转义订单号和状态，避免XSS
        const safeOrderNumber = String(orderNumber).replace(/'/g, "\\'");
        const safeAction = String(action.action).replace(/'/g, "\\'");
        const safeCurrentStatus = String(currentStatus).replace(/'/g, "\\'");
        const safeNextStatus = String(action.next || '').replace(/'/g, "\\'");
        
        buttonsHTML += `
            <button 
                class="quick-btn quick-btn-${action.color || 'confirm'}" 
                onclick="handleQuickAction('${safeOrderNumber}', '${safeAction}', '${safeCurrentStatus}', '${safeNextStatus}', event)"
            >
                ${action.label || '操作'}
            </button>
        `;
    });
    
    // 更新按钮容器（保留详情按钮）
    const quickActions = actionsCell.querySelector('.quick-actions');
    if (quickActions) {
        quickActions.innerHTML = buttonsHTML;
    } else {
        // 如果没有容器，创建新的
        const actionsContainer = actionsCell.querySelector('.actions-container');
        if (actionsContainer) {
            const newQuickActions = document.createElement('div');
            newQuickActions.className = 'quick-actions';
            newQuickActions.innerHTML = buttonsHTML;
            actionsContainer.insertBefore(newQuickActions, actionsContainer.firstChild);
        }
    }
}

/**
 * 为所有订单行初始化悬停按钮
 */
function initQuickActionsForAllRows() {
    const allRows = document.querySelectorAll('#ordersTableBody tr[data-order-number]');
    allRows.forEach(row => {
        const currentStatus = row.dataset.status || '';
        if (currentStatus) {
            showQuickActionsForRow(row, currentStatus);
        }
    });
}

// 存储当前快速操作的数据
let currentQuickAction = null;

/**
 * 处理快捷按钮点击
 */
function handleQuickAction(orderNumber, action, currentStatus, nextStatus, event) {
    event.stopPropagation();
    
    // 存储操作信息
    currentQuickAction = {
        orderNumber,
        action,
        currentStatus,
        nextStatus,
        button: event.target
    };
    
    // 显示 Modal
    showQuickActionModal(orderNumber, currentStatus, nextStatus);
}

/**
 * 显示快速操作 Modal
 */
function showQuickActionModal(orderNumber, currentStatus, nextStatus) {
    const modal = document.getElementById('quickActionModal');
    const title = document.getElementById('quickActionTitle');
    const currentStatusEl = document.getElementById('quickActionCurrentStatus');
    const nextStatusEl = document.getElementById('quickActionNextStatus');
    const orderNumberEl = document.getElementById('quickActionOrderNumber');
    const dateEl = document.getElementById('quickActionDate');
    const noteEl = document.getElementById('quickActionNote');
    
    if (!modal) return;
    
    // 设置内容
    if (title) title.textContent = '確認操作';
    if (currentStatusEl) currentStatusEl.textContent = displayStatus(currentStatus);
    if (nextStatusEl) nextStatusEl.textContent = displayStatus(nextStatus);
    if (orderNumberEl) orderNumberEl.textContent = `#${orderNumber}`;
    
    // 设置日期（今天）
    const today = getTodayDate();
    if (dateEl) dateEl.textContent = today;
    
    // 清空备注
    if (noteEl) noteEl.value = '';
    
    // 显示 Modal
    modal.classList.add('show');
    
    // 聚焦到备注框
    setTimeout(() => {
        if (noteEl) noteEl.focus();
    }, 100);
}

/**
 * 关闭快速操作 Modal
 */
function closeQuickActionModal() {
    const modal = document.getElementById('quickActionModal');
    if (modal) {
        modal.classList.remove('show');
    }
    // 恢复按钮状态（如果用户取消）
    if (currentQuickAction && currentQuickAction.button) {
        const button = currentQuickAction.button;
        // 检查按钮是否还在处理中（如果用户还没确认就关闭）
        if (button.disabled && button.textContent === '处理中...') {
            button.disabled = false;
            button.style.opacity = '1';
            // 恢复原始文本（需要从按钮的data属性或重新获取）
            const actions = getQuickActions(currentQuickAction.currentStatus);
            const action = actions.find(a => a.action === currentQuickAction.action);
            if (action) {
                button.textContent = action.label;
            }
        }
    }
    currentQuickAction = null;
}

// 添加 ESC 键关闭 Modal 的功能
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const quickActionModal = document.getElementById('quickActionModal');
        if (quickActionModal && quickActionModal.classList.contains('show')) {
            closeQuickActionModal();
        }
    }
});

/**
 * 确认快速操作
 */
function confirmQuickAction() {
    if (!currentQuickAction) return;
    
    const noteEl = document.getElementById('quickActionNote');
    const notes = noteEl ? noteEl.value.trim() : '';
    const today = getTodayDate();
    
    const { orderNumber, action, currentStatus, nextStatus, button } = currentQuickAction;
    
    // 关闭 Modal
    closeQuickActionModal();
    
    // 立即禁用按钮，防止重复点击
    if (button) {
        const originalText = button.textContent;
        button.disabled = true;
        button.style.opacity = '0.5';
        button.textContent = '处理中...';
        
        // 执行更新
        performQuickUpdate(orderNumber, action, currentStatus, nextStatus, today, notes, button, originalText);
    } else {
        // 如果没有按钮引用，直接执行
        performQuickUpdate(orderNumber, action, currentStatus, nextStatus, today, notes);
    }
}

/**
 * 统一的订单行更新函数
 */
function updateOrderRowAfterUpdate(orderNumber, orderData) {
    const row = document.querySelector(`tr[data-order-number="${orderNumber}"]`);
    if (!row) return;
    
    row.dataset.status = orderData.current_status;
    row.dataset.light = orderData.status_light;
    row.dataset.stageGroup = getStageGroup(orderData.current_status);
    row.className = orderData.status_light;
    
    const lightCell = row.querySelector('.light');
    if (lightCell) {
        let lightEmoji = '🟢';
        if (orderData.status_light === 'red') lightEmoji = '🔴';
        else if (orderData.status_light === 'yellow') lightEmoji = '🟡';
        else if (orderData.current_status === STATUS.CANCELLED) lightEmoji = '⚫';
        lightCell.textContent = lightEmoji;
    }
    
    const stageInfo = row.querySelector('.stage-info');
    if (stageInfo) {
        stageInfo.querySelector('.stage-major').textContent = getStageName(orderData.current_status);
        stageInfo.querySelector('.stage-current').textContent = displayStatus(orderData.current_status);
    }
    
    const daysSpan = row.querySelector('.days');
    if (daysSpan) {
        daysSpan.textContent = `${orderData.status_days || 0}天`;
        daysSpan.className = 'days';
        if (orderData.status_light === 'red') daysSpan.className += ' danger';
        else if (orderData.status_light === 'yellow') daysSpan.className += ' warning';
    }
    
    showQuickActionsForRow(row, orderData.current_status);
    
    if (typeof applyFilters === 'function') {
        applyFilters();
    }
}

// ==================== 表格排序功能 ====================

let currentSort = {
    column: null,
    direction: 'asc'  // 'asc' 或 'desc'
};

/**
 * 初始化表格排序功能
 */
function initTableSorting() {
    const sortableHeaders = document.querySelectorAll('th.sortable');
    sortableHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        header.style.userSelect = 'none';
        header.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡到行点击
            const column = this.dataset.sort;
            toggleSort(column, this);
        });
    });
}

/**
 * 切换排序
 */
function toggleSort(column, headerElement) {
    // 如果点击的是当前列，切换排序方向；否则设置为升序
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    // 更新所有表头的排序图标
    document.querySelectorAll('th.sortable .sort-icon').forEach(icon => {
        icon.textContent = '⇅';
    });
    
    // 更新当前表头的排序图标
    const icon = headerElement.querySelector('.sort-icon');
    if (icon) {
        icon.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
    }
    
    // 执行排序
    sortTable(column, currentSort.direction);
}

/**
 * 执行表格排序
 */
function sortTable(column, direction) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('tr[data-order-number]'));
    
    rows.sort((a, b) => {
        let aValue = getCellValue(a, column);
        let bValue = getCellValue(b, column);
        
        // 处理数字排序
        if (column === 'status_days' || column === 'quantity') {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // 处理日期排序
        if (column === 'order_date') {
            aValue = new Date(aValue || '1900-01-01');
            bValue = new Date(bValue || '1900-01-01');
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // 处理字符串排序
        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();
        
        if (direction === 'asc') {
            return aValue.localeCompare(bValue, 'zh-CN');
        } else {
            return bValue.localeCompare(aValue, 'zh-CN');
        }
    });
    
    // 重新插入排序后的行
    rows.forEach(row => tbody.appendChild(row));
}

/**
 * 获取单元格的值
 */
function getCellValue(row, column) {
    const headerMap = {
        'order_date': 2,  // 订单日期（跳过展开和灯号）
        'order_number': 3,  // 订单号
        'customer_name': 4,  // 客户名称
        'production_type': 5,  // 产品类型
        'product_code': 6,  // 产品编号
        'quantity': 7,  // 数量
        'factory': 8,  // 生产工厂
        'current_status': 9,  // 阶段/状态
        'status_days': 10  // 等待天数
    };
    
    // 优先从 data 属性获取值（更可靠）
    if (column === 'order_number') {
        return row.dataset.orderNumber || '';
    }
    if (column === 'customer_name') {
        return row.dataset.customerName || '';
    }
    if (column === 'current_status') {
        return row.dataset.status || '';
    }
    
    // 从单元格获取值
    const cellIndex = headerMap[column];
    if (cellIndex !== undefined) {
        const cells = row.querySelectorAll('td');
        if (cells[cellIndex]) {
            // 获取文本内容，去除图标和格式
            let text = cells[cellIndex].textContent.trim();
            
            // 处理天数（提取数字）
            if (column === 'status_days') {
                const match = text.match(/(\d+)/);
                return match ? match[1] : '0';
            }
            
            // 处理状态（只取状态文本，不包括阶段信息）
            if (column === 'current_status') {
                const statusText = cells[cellIndex].querySelector('.stage-current');
                return statusText ? statusText.textContent.trim() : text;
            }
            
            // 处理订单号（去除 # 符号）
            if (column === 'order_number') {
                return text.replace(/^#/, '').replace(/^🎨\s*/, '');
            }
            
            return text;
        }
    }
    
    return '';
}

/**
 * 统一的刷新所有组件函数
 * 更新：订单行、时间轴、抽屉、筛选、悬停按钮
 */
function refreshAllComponents(orderNumber) {
    // 重新获取完整订单数据
    fetch(`/tracking/api/orders/${encodeURIComponent(orderNumber)}`)
        .then(res => res.json())
        .then(result => {
            if (!result.success || !result.data) {
                console.error('获取订单数据失败:', result.error);
                return;
            }
            
            const orderData = result.data;
            
            // 1. 清除缓存，强制重新加载
            if (typeof orderDetailCache !== 'undefined') {
                delete orderDetailCache[orderNumber];
            }
            
            // 2. 更新主页面订单行（完整更新，包括悬停按钮）
            if (typeof updateOrderRowAfterUpdate === 'function') {
                updateOrderRowAfterUpdate(orderNumber, orderData);
            } else if (typeof updateOrderRowAfterUndo === 'function') {
                updateOrderRowAfterUndo(orderNumber, orderData);
            }
            
            // 3. 更新时间轴（如果列表详情展开）- 不折叠
            const detailRow = document.querySelector(`tr.detail-row[data-detail-for="${orderNumber}"]`);
            const detailContent = document.getElementById(`detail-content-${orderNumber}`);
            if (detailContent && detailRow) {
                // 检查时间轴是否展开（通过检查 detailRow 是否可见）
                const isExpanded = detailRow.offsetParent !== null || detailRow.style.display !== 'none';
                if (isExpanded) {
                    // 时间轴已展开，直接更新内容，不折叠
                    if (typeof renderOrderTimeline === 'function') {
                        renderOrderTimeline(orderNumber, orderData);
                    }
                }
            }
            
            // 4. 更新时间轴（如果抽屉打开）
            const drawerOrderNumber = document.getElementById('drawerOrderNumber');
            const drawerOverlay = document.getElementById('detailDrawerOverlay');
            if (drawerOrderNumber && drawerOverlay && 
                drawerOverlay.classList.contains('show') &&
                drawerOrderNumber.textContent.includes(orderNumber)) {
                // 抽屉已打开且显示的是当前订单，重新加载抽屉数据
                const customerName = document.getElementById('drawerCustomerName').textContent;
                const statusDays = orderData.status_days || 0;
                if (typeof openDetailDrawerFromTimeline === 'function') {
                    // 重新加载抽屉数据，保持打开状态
                    openDetailDrawerFromTimeline(orderNumber, customerName, statusDays);
                }
            }
            
            // 5. 更新筛选按钮计数
            if (typeof updateFilterCounts === 'function') {
                updateFilterCounts();
            }
            
            // 6. 重新应用筛选（确保订单在正确的筛选组中）
            if (typeof applyFilters === 'function') {
                applyFilters();
            }
            
            // 7. 高亮显示订单行（新增）
            setTimeout(() => {
                highlightOrderRow(orderNumber);
            }, 200);
        })
        .catch(err => {
            console.error('刷新组件失败:', err);
        });
}

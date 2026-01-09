/**
 * 訂單流程追蹤系統 - 統一JavaScript文件
 * - 共用工具 & UI
 * - 主頁邏輯（從 tracking-page.js & index.html 抽出）
 */

// ==================== 共用工具函數 ====================

// Toast提示
function showToast(title, message, duration = 3000) {
    const existing = document.getElementById('toast');
    let toast = existing;

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        toast.innerHTML = `
            <div style="font-size: 1.5rem;">✅</div>
            <div class="toast-content">
                <div class="toast-title" id="toastTitle"></div>
                <div class="toast-message" id="toastMessage"></div>
            </div>
            <button class="modal-close" onclick="this.parentElement.remove()">✕</button>
        `;
        document.body.appendChild(toast);
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

// 獲取今天日期
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// 確認對話框
function confirmDialog(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// 導出數據（預留，主頁有專用覆寫）
function exportData() {
    showToast('提示', '匯出功能開發中...');
}

// 初始化：通用表單驗證 & Alert 自動關閉
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
                showToast('錯誤', '請填寫所有必填項');
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

// ==================== 主頁：篩選 / 快速更新 / 新增訂單 / 時間軸 ====================

// 篩選狀態（參考 v10.html 邏輯）
let currentFilter = {
    stageGroup: 'all',  // all, draft, sampling, production, quote, completed, cancelled
    substatus: 'all',   // 子狀態篩選
    search: '',
    showCompleted: true,
    showCancelled: false
};

// 階段映射（用於動態生成階段篩選按鈕）
const stageMap = {
    'all': ['all', 'quote', 'draft'],
    'quote': ['詢價中'],
    'draft': ['新訂單', '詢價中', '圖稿確認中', '圖稿修改中'],
    'sampling': ['待打樣', '打樣中', '打樣確認中', '打樣修改中'],
    'production': ['待生產', '生產中']
};

const stageNames = {
    '全部': 'all',
    '新訂單': '新訂單',
    '詢價中': '詢價中',
    '圖稿確認中': '圖稿確認中',
    '圖稿修改中': '圖稿修改中',
    '待打樣': '待打樣',
    '打樣中': '打樣中',
    '打樣確認中': '打樣確認中',
    '打樣修改中': '打樣修改中',
    '待生產': '待生產',
    '生產中': '生產中'
};

// 篩選函數（參考 v10.html 邏輯）
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
            stageGroupMatch = stageGroup === currentFilter.stageGroup;
        }
        
        // 子狀態篩選
        let substatusMatch = true;
        if (currentFilter.substatus !== 'all') {
            substatusMatch = status === currentFilter.substatus;
        }
        
        // 已完成/已取消篩選（当选择了特定阶段时）
        let completedMatch = true;
        if (currentFilter.stageGroup === 'completed' && !currentFilter.showCompleted) {
            completedMatch = false;
        }
        if (currentFilter.stageGroup === 'cancelled' && !currentFilter.showCancelled) {
            completedMatch = false;
        }
        
        // 搜尋篩選
        let searchMatch = true;
        if (currentFilter.search) {
            const search = currentFilter.search.toLowerCase();
            searchMatch = orderNumber.toLowerCase().includes(search) || 
                         customerName.toLowerCase().includes(search);
        }
        
        // 顯示或隱藏
        if (stageGroupMatch && substatusMatch && completedMatch && searchMatch) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // 更新空狀態顯示
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

// 更新篩選提示（目前未在模板中使用，但保留）
function updateFilterHint(count) {
    const tabNames = {
        'all': '全部進行中',
        'quote': '詢價/修圖',
        'draft': '圖稿階段',
        'sampling': '打樣階段',
        'production': '生產階段',
        'completed': '已完成',
        'cancelled': '已取消'
    };
    
    const stageNamesMap = {
        'all': '全部流程',
        '新訂單': '新訂單',
        '詢價中': '詢價中',
        '圖稿確認中': '圖稿確認中',
        '圖稿修改中': '圖稿修改中',
        '待打樣': '待打樣',
        '打樣中': '打樣中',
        '打樣確認中': '打樣確認中',
        '打樣修改中': '打樣修改中',
        '待生產': '待生產',
        '生產中': '生產中'
    };
    
    const lightNames = {
        'all': '全部狀態',
        'red': '逾期',
        'yellow': '需注意',
        'green': '正常'
    };
    
    const tabName = tabNames[currentFilter.tab] || '全部進行中';
    const stageName = stageNamesMap[currentFilter.stage] || '全部流程';
    const lightName = lightNames[currentFilter.light] || '全部狀態';
    
    const hintEl = document.getElementById('filterHint');
    if (hintEl) {
        hintEl.innerHTML = `
        當前顯示: <strong>${tabName}</strong> · <strong>${stageName}</strong> · <strong>${lightName}</strong> · 共 <strong id="filterCount">${count}</strong> 個訂單
        <span style="color: var(--text-muted); margin-left: 2rem;">
            💡 提示：懸停在訂單行上可以看到快速操作按鈕 · 按住 <strong>Shift</strong> + 點擊快捷按鈕可填寫日期和備註
        </span>
    `;
    }
}

// Stage Group 篩選（參考 v10.html）
function filterByStageGroup(stageGroup, button) {
    if (button) {
        event?.preventDefault();
        currentFilter.stageGroup = stageGroup;
        currentFilter.substatus = 'all';
        
        // 更新按鈕狀態
        document.querySelectorAll('.stage-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // 關閉所有下拉菜單
        document.querySelectorAll('.substatus-dropdown').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        
        applyFilters();
    }
}

// 切換子狀態下拉菜單
function toggleSubstatus(stageGroup, button) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const dropdown = document.getElementById(`dropdown-${stageGroup}`);
    const allDropdowns = document.querySelectorAll('.substatus-dropdown');
    
    allDropdowns.forEach(d => {
        if (d !== dropdown) {
            d.classList.remove('show');
        }
    });
    
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// 子狀態篩選
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

// 保留階段 / 燈號篩選接口（目前未在 UI 使用）
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

// 更新階段篩選按鈕
function updateStageFilters(tab) {
    const stageBar = document.getElementById('stageFilterBar');
    if (!stageBar) return;
    
    let html = '<span class="filter-label">細分流程:</span>';
    html += '<a href="#" class="filter-btn ' + (currentFilter.stage === 'all' ? 'active' : '') + '" data-stage="all" onclick="filterByStage(\'all\', event)">全部</a>';
    
    if (tab === 'all' || tab === 'quote') {
        html += '<a href="#" class="filter-btn ' + (currentFilter.stage === '詢價中' ? 'active' : '') + '" data-stage="詢價中" onclick="filterByStage(\'詢價中\', event)">🎨 詢價中</a>';
    }
    if (tab === 'all' || tab === 'draft') {
        html += '<a href="#" class="filter-btn ' + (currentFilter.stage === '新訂單' ? 'active' : '') + '" data-stage="新訂單" onclick="filterByStage(\'新訂單\', event)">新訂單</a>';
        html += '<a href="#" class="filter-btn ' + (currentFilter.stage === '圖稿確認中' ? 'active' : '') + '" data-stage="圖稿確認中" onclick="filterByStage(\'圖稿確認中\', event)">圖稿確認中</a>';
        html += '<a href="#" class="filter-btn ' + (currentFilter.stage === '圖稿修改中' ? 'active' : '') + '" data-stage="圖稿修改中" onclick="filterByStage(\'圖稿修改中\', event)">圖稿修改中</a>';
    }
    if (tab === 'all' || tab === 'sampling') {
        html += '<a href="#" class="filter-btn ' + (currentFilter.stage === '待打樣' ? 'active' : '') + '" data-stage="待打樣" onclick="filterByStage(\'待打樣\', event)">待打樣</a>';
        html += '<a href="#" class="filter-btn ' + (currentFilter.stage === '打樣中' ? 'active' : '') + '" data-stage="打樣中" onclick="filterByStage(\'打樣中\', event)">打樣中</a>';
        html += '<a href="#" class="filter-btn ' + (currentFilter.stage === '打樣確認中' ? 'active' : '') + '" data-stage="打樣確認中" onclick="filterByStage(\'打樣確認中\', event)">打樣確認中</a>';
        html += '<a href="#" class="filter-btn ' + (currentFilter.stage === '打樣修改中' ? 'active' : '') + '" data-stage="打樣修改中" onclick="filterByStage(\'打樣修改中\', event)">打樣修改中</a>';
    }
    if (tab === 'all' || tab === 'production') {
        html += '<a href="#" class="filter-btn ' + (currentFilter.stage === '待生產' ? 'active' : '') + '" data-stage="待生產" onclick="filterByStage(\'待生產\', event)">待生產</a>';
        html += '<a href="#" class="filter-btn ' + (currentFilter.stage === '生產中' ? 'active' : '') + '" data-stage="生產中" onclick="filterByStage(\'生產中\', event)">生產中</a>';
    }
    
    stageBar.innerHTML = html;
}

let currentUpdateData = {};

// 快速更新相關
function setToday() {
    const dateInput = document.getElementById('updateDate');
    if (dateInput) {
        dateInput.value = getTodayDate();
    }
}

function handleQuickUpdate(event, button) {
    const orderNumber = button.dataset.order;
    const action = button.dataset.action;
    const current = button.dataset.current;
    const next = button.dataset.next;

    currentUpdateData = { orderNumber, action, current, next };

    if (action === 'quote_to_order') {
        const newOrderNumber = prompt('請輸入訂單號：');
        if (!newOrderNumber) return;
        updateOrderNumber(orderNumber, newOrderNumber, action);
        return;
    }

    if (event.shiftKey) {
        showModal(orderNumber, current, next);
    } else {
        performQuickUpdate(orderNumber, action, current, next, getTodayDate(), '');
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

function updateOrderNumber(oldOrderNumber, newOrderNumber, action) {
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
            showToast('✅ 轉換成功', `詢價已轉為訂單 #${newOrderNumber}`);
            setTimeout(() => location.reload(), 1000);
        } else {
            alert('轉換失敗：' + data.error);
        }
    })
    .catch(err => {
        alert('錯誤：' + err.message);
    });
}

function performQuickUpdate(orderNumber, action, current, next, date, notes) {
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
            let message = `訂單 #${orderNumber} · ${current} → ${next}`;
            if (notes) {
                message += ` · ${notes}`;
            }
            message += ` · ${date}`;
            showToast('✅ 更新成功', message);
            setTimeout(() => location.reload(), 1500);
        } else {
            alert('更新失敗：' + data.error);
        }
    })
    .catch(err => {
        alert('錯誤：' + err.message);
    });
}

// ==================== 新增訂單（分步驟表單） ====================

let currentOrderStep = 1;
const totalOrderSteps = 4;
let productCount = 1;

function showNewOrderModal() {
    currentOrderStep = 1;
    productCount = 1;
    
    const form = document.getElementById('newOrderForm');
    if (form) form.reset();
    const orderErr = document.getElementById('orderNumberError');
    if (orderErr) orderErr.style.display = 'none';
    const suggestions = document.getElementById('customerSuggestions');
    if (suggestions) suggestions.style.display = 'none';
    
    const dateInput = document.getElementById('newOrderDate');
    if (dateInput) dateInput.value = getTodayDate();
    
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 30);
    const deliveryInput = document.getElementById('newExpectedDeliveryDate');
    if (deliveryInput) {
        deliveryInput.valueAsDate = deliveryDate;
    }
    
    fetch('/tracking/api/orders/next-quote-number')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const hint = document.querySelector('#newOrderNumber + .form-hint');
                if (hint) {
                    hint.textContent = `💡 不填訂單號將創建詢價/修圖需求（將自動生成：${data.next_number}）`;
                }
            }
        });
    
    updateOrderStep();
    
    const productList = document.getElementById('productList');
    if (productList) {
        productList.innerHTML = `
            <div class="product-item">
                <div class="product-item-header">
                    <div class="product-item-title">產品 #1</div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">產品類型 <span class="required">*</span></label>
                        <select name="product_type[]" class="form-select" required>
                            <option value="">請選擇</option>
                            <option value="數碼印花">數碼印花</option>
                            <option value="活性印花">活性印花</option>
                            <option value="冰絲印花">冰絲印花</option>
                            <option value="冰絲確剪碼印花">冰絲確剪碼印花</option>
                        </select>
                        <span class="form-error">請選擇產品類型</span>
                    </div>
                    <div class="form-group">
                        <label class="form-label">產品編號</label>
                        <input type="text" name="product_code[]" class="form-input" placeholder="PRD-2026-XXX">
                    </div>
                    <div class="form-group">
                        <label class="form-label">數量</label>
                        <input type="text" name="quantity[]" class="form-input" placeholder="例如：500 碼">
                    </div>
                    <div class="form-group">
                        <label class="form-label">單位</label>
                        <select name="unit[]" class="form-select">
                            <option value="碼">碼</option>
                            <option value="米">米</option>
                            <option value="件">件</option>
                            <option value="打">打</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label class="form-label">產品備註</label>
                        <textarea name="product_notes[]" class="form-textarea" placeholder="產品相關的特殊要求或備註"></textarea>
                    </div>
                </div>
            </div>
        `;
    }
    
    const modal = document.getElementById('newOrderModal');
    if (modal) modal.classList.add('show');
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
            showToast('錯誤', '至少需要添加一個產品');
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
                showToast('錯誤', '請為至少一個產品選擇產品類型');
                isValid = false;
            }
        }
    }
    
    if (!isValid) {
        showToast('錯誤', '請填寫所有必填項目');
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
    
    document.getElementById('summaryOrderNumber').textContent = orderNumber || '自動生成（詢價/修圖）';
    document.getElementById('summaryOrderDate').textContent = orderDate || '-';
    document.getElementById('summaryCustomer').textContent = customer || '-';
    
    const productItems = document.querySelectorAll('.product-item');
    const summaryProducts = document.getElementById('summaryProducts');
    if (summaryProducts) {
        if (productItems.length === 0) {
            summaryProducts.innerHTML = '<div class="summary-row"><span class="summary-label">無產品信息</span></div>';
        } else {
            summaryProducts.innerHTML = '';
            productItems.forEach((item, index) => {
                const productType = item.querySelector('select[name="product_type[]"]')?.value || '-';
                const productCode = item.querySelector('input[name="product_code[]"]')?.value || '-';
                const quantity = item.querySelector('input[name="quantity[]"]')?.value || '-';
                const unit = item.querySelector('select[name="unit[]"]')?.value || '';
                
                summaryProducts.innerHTML += `
                    <div class="summary-row">
                        <span class="summary-label">產品 ${index + 1}</span>
                        <span class="summary-value">${productType}</span>
                    </div>
                    ${productCode ? `<div class="summary-row">
                        <span class="summary-label">產品編號</span>
                        <span class="summary-value">${productCode}</span>
                    </div>` : ''}
                    ${quantity ? `<div class="summary-row">
                        <span class="summary-label">數量</span>
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
    document.getElementById('summarySampling').textContent = needSampling === 'yes' ? '需要打樣' : '直接生產';
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
            <div class="product-item-title">產品 #${productCount}</div>
            <button type="button" class="remove-product-btn" onclick="removeProduct(this)">✕ 移除</button>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">產品類型 <span class="required">*</span></label>
                <select name="product_type[]" class="form-select" required>
                    <option value="">請選擇</option>
                    <option value="數碼印花">數碼印花</option>
                    <option value="活性印花">活性印花</option>
                    <option value="冰絲印花">冰絲印花</option>
                    <option value="冰絲確剪碼印花">冰絲確剪碼印花</option>
                </select>
                <span class="form-error">請選擇產品類型</span>
            </div>
            <div class="form-group">
                <label class="form-label">產品編號</label>
                <input type="text" name="product_code[]" class="form-input" placeholder="PRD-2026-XXX">
            </div>
            <div class="form-group">
                <label class="form-label">數量</label>
                <input type="text" name="quantity[]" class="form-input" placeholder="例如：500 碼">
            </div>
            <div class="form-group">
                <label class="form-label">單位</label>
                <select name="unit[]" class="form-select">
                    <option value="碼">碼</option>
                    <option value="米">米</option>
                    <option value="件">件</option>
                    <option value="打">打</option>
                </select>
            </div>
            <div class="form-group full-width">
                <label class="form-label">產品備註</label>
                <textarea name="product_notes[]" class="form-textarea" placeholder="產品相關的特殊要求或備註"></textarea>
            </div>
        </div>
    `;
    productList.appendChild(newProduct);
}

function removeProduct(btn) {
    if (confirm('確定要移除這個產品嗎？')) {
        btn.closest('.product-item').remove();
        const productItems = document.querySelectorAll('.product-item');
        productItems.forEach((item, index) => {
            const titleEl = item.querySelector('.product-item-title');
            if (titleEl) {
                titleEl.textContent = `產品 #${index + 1}`;
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

function closeNewOrderModal() {
    if (confirm('確定要關閉嗎？未保存的數據將丟失。')) {
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
        showToast('錯誤', '請確認訂單信息後勾選確認框');
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
                showToast('✅ 創建成功', `訂單 ${result.message || '已創建'}`);
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
                    alert('創建失敗：' + (result.error || '未知錯誤'));
                }
            }
        })
        .catch(err => {
            alert('錯誤：' + err.message);
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
                alert('檢查訂單號失敗：' + err.message);
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

function renderOrderTimeline(orderNumber, orderData, target = 'row') {
    const containerId = target === 'modal'
        ? 'orderDetailModalBody'
        : `detail-content-${orderNumber}`;
    const container = document.getElementById(containerId);
    if (!container) return;

    const history = orderData.history || [];
    const order = orderData;

    if (!history.length) {
        container.innerHTML = `
            <div class="timeline-title">📊 完整流程歷史</div>
            <div class="timeline-empty">暫無歷史記錄</div>
        `;
        return;
    }

    function parseDate(d) {
        if (!d) return null;
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? null : dt;
    }
    function diffDays(from, to) {
        if (!from || !to) return null;
        const ms = to.getTime() - from.getTime();
        return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
    }
    function formatDateDisplay(d) {
        const dt = parseDate(d);
        if (!dt) return '-';
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        return `${y}/${m}/${day}`;
    }
    function getStatusIcon(status) {
        if (!status) return '⬜';
        if (status.includes('詢價')) return '💬';
        if (status.includes('圖稿')) return '🎨';
        if (status.includes('打樣')) return '🧪';
        if (status.includes('生產')) return '🏭';
        if (status.includes('完成')) return '✅';
        if (status.includes('取消')) return '❌';
        return '📌';
    }

    const today = new Date();
    const createdDate = history[0].action_date || order.order_date;
    const lastActionDate = history[history.length - 1].action_date || createdDate;
    const totalDays = diffDays(parseDate(createdDate), today);
    const currentStatus = order.current_status || history[history.length - 1].to_status;
    const currentStatusDays = order.status_days ?? diffDays(parseDate(lastActionDate), today) ?? '-';

    let horizontalHtml = '<div class="timeline-horizontal">';
    history.forEach((item, index) => {
        const isLast = index === history.length - 1;
        const fromDate = parseDate(item.action_date);
        const toDate = isLast ? today : parseDate(history[index + 1].action_date);
        const stayDays = diffDays(fromDate, toDate);
        const durationText = isLast
            ? `已等 ${currentStatusDays}天`
            : (stayDays != null ? `花了 ${stayDays}天` : '');

        horizontalHtml += `
            <div class="timeline-step ${isLast ? 'current danger' : 'completed'}">
                <div class="timeline-dot-wrap">
                    <div class="timeline-dot">${isLast ? '⏱️' : '✓'}</div>
                </div>
                <div class="timeline-step-info">
                    <div class="timeline-label">${item.to_status || '-'}</div>
                    <div class="timeline-meta">
                        ${item.action_date ? `<div class="timeline-date">${formatDateDisplay(item.action_date)}</div>` : ''}
                        ${durationText ? `<div class="timeline-duration">${durationText}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    horizontalHtml += '</div>';

    const summaryHtml = `
        <div class="timeline-summary-bar">
            <div class="summary-item">
                <div class="summary-label">訂單創建</div>
                <div class="summary-value">${formatDateDisplay(createdDate)}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">總耗時</div>
                <div class="summary-value ${totalDays != null ? 'danger' : ''}">
                    ${totalDays != null ? totalDays + '天' : '-'}
                </div>
            </div>
            <div class="summary-item">
                <div class="summary-label">目前狀態</div>
                <div class="summary-value">${currentStatus || '-'}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">當前狀態等待天數</div>
                <div class="summary-value ${currentStatusDays && currentStatusDays > 0 ? 'danger' : ''}">
                    ${currentStatusDays || '-'}
                </div>
            </div>
        </div>
    `;

    let detailedHtml = `
        <button class="timeline-toggle-btn" type="button" onclick="document.getElementById('timeline-detailed-${orderNumber}').classList.toggle('show'); this.textContent = this.textContent.includes('查看') ? '✕ 收起詳細記錄' : '📋 查看詳細記錄';">
            📋 查看詳細記錄
        </button>
        <div class="timeline-detailed" id="timeline-detailed-${orderNumber}">
    `;

    // 检查用户是否为管理员（通过检查页面上是否有管理员专属元素）
    // 注意：时间轴是动态渲染的，需要检查当前页面的元素
    let isAdmin = false;
    try {
        // 方法1: 检查操作列是否存在
        const actionsCells = document.querySelectorAll('.actions-cell');
        if (actionsCells.length > 0) {
            isAdmin = true;
        }
        // 方法2: 检查新建订单按钮
        if (!isAdmin) {
            const newOrderBtn = document.querySelector('button[onclick*="openNewOrderModal"]');
            if (newOrderBtn) {
                isAdmin = true;
            }
        }
        // 方法3: 检查是否有快速操作按钮
        if (!isAdmin) {
            const quickBtns = document.querySelectorAll('.quick-btn');
            if (quickBtns.length > 0) {
                isAdmin = true;
            }
        }
    } catch (e) {
        console.warn('检查管理员权限失败:', e);
    }
    
    history.forEach((item, index) => {
        const isLast = index === history.length - 1;
        const isFirst = index === 0;
        const fromDate = parseDate(item.action_date);
        const toDate = isLast ? today : parseDate(history[index + 1].action_date);
        const stayDays = diffDays(fromDate, toDate);
        
        // 获取上一个状态（用于撤销）- 需要确保不是订单创建步骤
        let previousStatus = null;
        let canUndo = false;
        if (isLast && !isFirst && index > 0) {
            const prevItem = history[index - 1];
            // 只有当上一步不是订单创建时才能撤销
            if (prevItem && prevItem.from_status !== null) {
                previousStatus = prevItem.to_status;
                canUndo = true;
            }
        }

        detailedHtml += `
            <div class="step-card ${isLast ? 'current' : ''}">
                <div class="step-card-header">
                    <div class="step-card-icon">${getStatusIcon(item.to_status)}</div>
                    <div class="step-card-name">${item.to_status || '-'}</div>
                    <div class="step-card-date">${item.action_date || '-'}</div>
                </div>
                <div class="step-card-body">
                    <div class="step-card-duration">
                        ${isLast 
                            ? `目前已停留 ${currentStatusDays} 天` 
                            : (stayDays != null ? `在此狀態停留 ${stayDays} 天` : '停留時間不明')}
                    </div>
                    ${item.notes ? `<div class="step-card-note">${item.notes}</div>` : ''}
                    ${item.operator ? `<div class="timeline-operator">操作人：${item.operator}</div>` : ''}
                    ${canUndo && previousStatus && isAdmin ? `
                        <div style="margin-top: 0.75rem;">
                            <button class="btn-undo" onclick="undoLastStep('${orderNumber}', '${previousStatus}', '${item.to_status}')">
                                ↩️ 撤銷此步驟
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    detailedHtml += '</div>';

    container.innerHTML = `
        <div class="timeline-title">📊 完整流程歷史</div>
        ${horizontalHtml}
        ${summaryHtml}
        ${detailedHtml}
    `;
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
    info.textContent = `訂單 ${orderId}`;

    // 移除舊的箭頭區塊
    const infoParent = info.parentElement;
    Array.from(infoParent.querySelectorAll('.modal-arrow-line')).forEach(el => el.remove());

    const arrow = document.createElement('div');
    arrow.className = 'modal-arrow-line';
    arrow.style.display = 'flex';
    arrow.style.alignItems = 'center';
    arrow.style.gap = '0.5rem';
    arrow.style.marginTop = '0.5rem';

    if (action === 'confirm') {
        title.textContent = '確認：國外確認';
        arrow.innerHTML = `<span style="color: var(--text-2);">${from}</span> <span style="color: var(--text-3); font-weight: 600;">→</span> <span style="color: var(--blue); font-weight: 600;">${to}</span>`;
        confirmBtn.textContent = '✓ 確認';
        confirmBtn.className = 'modal-btn confirm';
    } else if (action === 'revise') {
        title.textContent = '確認：需要修改';
        arrow.innerHTML = `<span style="color: var(--text-2);">${from}</span> <span style="color: var(--text-3); font-weight: 600;">→</span> <span style="color: var(--yellow); font-weight: 600;">${to}</span>`;
        confirmBtn.textContent = '🔄 確認修改';
        confirmBtn.className = 'modal-btn confirm';
        noteField.placeholder = '建議說明修改原因...';
    } else if (action === 'send') {
        title.textContent = '確認：重新發圖給國外';
        arrow.innerHTML = `<span style="color: var(--text-2);">${from}</span> <span style="color: var(--text-3); font-weight: 600;">→</span> <span style="color: var(--blue); font-weight: 600;">${to}</span>`;
        confirmBtn.textContent = '→ 確認發圖';
        confirmBtn.className = 'modal-btn confirm';
    } else if (action === 'start') {
        title.textContent = '確認：開始下一步';
        arrow.innerHTML = `<span style="color: var(--text-2);">${from}</span> <span style="color: var(--text-3); font-weight: 600;">→</span> <span style="color: var(--blue); font-weight: 600;">${to}</span>`;
        confirmBtn.textContent = '✓ 確認開始';
        confirmBtn.className = 'modal-btn confirm';
    } else if (action === 'complete') {
        title.textContent = '確認：生產完成';
        arrow.innerHTML = `<span style="color: var(--text-2);">${from}</span> <span style="color: var(--text-3); font-weight: 600;">→</span> <span style="color: var(--green); font-weight: 600;">${to}</span>`;
        confirmBtn.textContent = '✓ 確認完成';
        confirmBtn.className = 'modal-btn confirm';
    } else if (action === 'skip') {
        title.textContent = '⚠️ 確認跳過打樣階段';
        info.textContent = `將直接從當前階段進入生產階段`;
        confirmBtn.textContent = '✓ 確認跳過';
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
    
    alert(`操作成功！\n訂單 ${currentOrderId} 已從 "${fromStatus}" 變更為 "${toStatus}"`);
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
        alert('備註已添加');
        closeModal();
    } else {
        alert('請輸入備註內容');
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
        alert(`預計交貨日期已設定為：${date}`);
        closeModal();
    } else {
        alert('請選擇日期');
    }
}

function showSkipSamplingModal() {
    closeModal();
    document.getElementById('skipSamplingModal').classList.add('show');
}

function confirmSkipSampling() {
    const reason = document.getElementById('skipReason').value;
    console.log('Skip sampling for', currentOrderId, 'Reason:', reason);
    alert('已跳過打樣階段，進入生產階段');
    closeModal();
}

function showBackStepModal() {
    closeModal();
    document.getElementById('backStepModal').classList.add('show');
}

function backToDetailsMenu() {
    closeModal();
    document.getElementById('detailsModal').classList.add('show');
}

function confirmBackStep() {
    const selectedStep = document.querySelector('input[name="backStep"]:checked');
    const note = document.getElementById('backStepNote').value;
    
    if (selectedStep) {
        console.log('Back to:', selectedStep.value, 'Note:', note);
        alert(`已退回到：${selectedStep.value}`);
        closeModal();
    } else {
        alert('請選擇要退回的步驟');
    }
}

function showCancelOrderModal() {
    closeModal();
    document.getElementById('cancelOrderModal').classList.add('show');
}

function confirmCancelOrder() {
    const reason = document.getElementById('cancelReason').value;
    if (reason && reason.trim()) {
        if (confirm(`確定要取消訂單 ${currentOrderId} 嗎？\n原因：${reason}`)) {
            console.log('Cancel order', currentOrderId, 'Reason:', reason);
            alert('訂單已取消');
            closeModal();
        }
    } else {
        alert('取消訂單需要填寫原因');
    }
}

function toggleCompletedOrders(checkbox) {
    currentFilter.showCompleted = checkbox.checked;
    applyFilters();
}

function toggleCancelledOrders(checkbox) {
    currentFilter.showCancelled = checkbox.checked;
    applyFilters();
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

// ==================== 撤銷最後一步功能 ====================

async function undoLastStep(orderNumber, restoreStatus, currentStatus) {
    // 確認對話框
    const confirmed = confirm(
        `⚠️ 確認撤銷操作？\n\n` +
        `訂單：${orderNumber}\n` +
        `當前狀態：${currentStatus}\n` +
        `將恢復到：${restoreStatus}\n\n` +
        `此操作會永久刪除最後一步記錄！`
    );
    
    if (!confirmed) return;
    
    // 可選：詢問原因
    const reason = prompt('撤銷原因（選填）：');
    
    try {
        const response = await fetch(`/tracking/api/orders/${encodeURIComponent(orderNumber)}/undo-last-step`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason || '' })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (typeof showToast === 'function') {
                showToast('✅ 撤銷成功', result.message);
            } else {
                alert('✅ ' + result.message);
            }
            setTimeout(() => location.reload(), 1000);
        } else {
            alert('❌ 撤銷失敗：' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ 網絡錯誤');
    }
}



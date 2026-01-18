// 用戶管理模塊 - v3.0 改進版
// 更新：移除負責產品欄位、改用 Modal 替代 alert、使用 SVG 圖標

console.log('🚀 用戶管理模塊已載入 - 版本 3.0');
console.log('📅 更新時間: 2025-01-18');

let allUsers = [];
let editingUserId = null;
let approvingUserId = null;
let currentActionUserId = null; // 用於 Modal 操作

// ==================== 載入用戶 ====================

async function loadUsers() {
    console.log('🔄 開始載入用戶列表...');
    try {
        const response = await fetch('/tracking/api//users');
        console.log('📡 API 響應狀態:', response.status);
        
        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }
        
        const data = await response.json();
        console.log('📊 API 返回數據:', data);
        
        if (data.success) {
            allUsers = data.data;
            console.log('✅ 用戶數據載入成功，共', allUsers.length, '個用戶');
            updateTotalCount();
            renderUsers();
        } else {
            showToast('錯誤', data.error || '未知錯誤', 'error');
        }
    } catch (error) {
        console.error('載入用戶列表錯誤：', error);
        showToast('錯誤', '載入用戶列表失敗：' + error.message, 'error');
    }
}

// ==================== 渲染用戶表格 ====================

function renderUsers() {
    console.log('🎨 開始渲染用戶表格...');
    const tbody = document.getElementById('users-table-body');
    if (!tbody) {
        console.error('❌ 找不到表格 tbody 元素！');
        return;
    }
    
    const filtered = getFilteredUsers();
    console.log('🔍 篩選後的用戶數量:', filtered.length);
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-2);">沒有找到匹配的用戶</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(user => {
        const employeeId = user.employee_id || `EMP${String(user.user_id).padStart(3, '0')}`;
        const userStatus = user.status || 'active';
        const statusBadge = getStatusBadge(userStatus);
        
        return `
            <tr class="user-row" data-status="${userStatus}" data-user-id="${user.user_id}">
                <td style="color: var(--text-2); font-size: 0.875rem;">${user.user_id}</td>
                <td><code style="background: var(--gray-bg); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; font-weight: 600;">${employeeId}</code></td>
                <td><strong>${escapeHtml(user.username)}</strong></td>
                <td>
                    <input type="text" 
                           class="inline-edit" 
                           value="${escapeHtml(user.real_name || user.display_name)}" 
                           data-field="real_name"
                           data-user-id="${user.user_id}"
                           onblur="saveInlineEdit(this)"
                           style="width: 100%; border: 1px solid transparent; background: transparent; padding: 0.25rem; border-radius: 4px; font-size: 0.9375rem;">
                </td>
                <td>
                    <select class="inline-edit-select" 
                            data-field="role"
                            data-user-id="${user.user_id}"
                            onchange="saveInlineEdit(this)"
                            style="width: 100%; border: 1px solid var(--border); background: white; padding: 0.375rem; border-radius: 4px; font-size: 0.875rem; cursor: pointer;">
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>ADMIN</option>
                        <option value="sales" ${user.role === 'sales' ? 'selected' : ''}>SALES</option>
                        <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>VIEWER</option>
                    </select>
                </td>
                <td class="status-cell">${statusBadge}</td>
                <td style="color: var(--text-2); font-size: 0.875rem;">${formatDate(user.created_at)}</td>
                <td class="actions-cell">
                    <div class="action-buttons">
                        ${getActionButtons(user)}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // 修復隱藏欄位
    setTimeout(() => {
        const table = document.querySelector('.users-table');
        if (table) {
            let fixedCount = 0;
            table.querySelectorAll('th, td').forEach(cell => {
                if (cell.style.display === 'none') {
                    cell.style.display = '';
                    fixedCount++;
                }
            });
            if (fixedCount > 0) {
                console.log(`✅ 已修復 ${fixedCount} 個隱藏的欄位`);
            }
        }
    }, 50);
}

// ==================== 狀態徽章 ====================

function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="status-badge status-pending">待審核</span>',
        'active': '<span class="status-badge status-active">已審核</span>',
        'rejected': '<span class="status-badge status-rejected">已拒絕</span>',
        'suspended': '<span class="status-badge status-suspended">已停權</span>' // ⭐ 新增
    };
    return badges[status] || badges['active'];
}

// ==================== 動態操作按鈕 ====================

function getActionButtons(user) {
    const status = user.status || 'active';
    const buttons = [];
    
    // 根據狀態顯示對應按鈕
    if (status === 'pending') {
        // 待審核：通過 + 拒絕
        buttons.push(`
            <button class="action-btn approve" onclick="openApproveModal(${user.user_id})" title="通過審核">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                通過
            </button>
        `);
        buttons.push(`
            <button class="action-btn reject" onclick="quickReject(${user.user_id})" title="拒絕">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                拒絕
            </button>
        `);
    } else if (status === 'active') {
        // 已審核：停權
        buttons.push(`
            <button class="action-btn suspend" onclick="openSuspendModal(${user.user_id}, '${escapeHtml(user.username)}')" title="停權">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                停權
            </button>
        `);
    } else if (status === 'rejected') {
        // 已拒絕：恢復
        buttons.push(`
            <button class="action-btn restore" onclick="openRestoreModal(${user.user_id}, '${escapeHtml(user.username)}')" title="恢復">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                </svg>
                恢復
            </button>
        `);
    
    } else if (status === 'suspended') {  
        buttons.push(`
            <button class="action-btn restore" onclick="openRestoreModal(${user.user_id}, '${escapeHtml(user.username)}')" title="恢復">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                </svg>
                恢復
            </button>
        `);
    }
    
    // 所有狀態都有：重設密碼
    buttons.push(`
        <button class="action-btn reset" onclick="openResetPasswordModal(${user.user_id}, '${escapeHtml(user.username)}', '${escapeHtml(user.real_name || user.display_name)}')" title="重設密碼">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            重設密碼
        </button>
    `);
    
    return buttons.join('');
}

// ==================== Modal 操作函數 ====================

// 停權 Modal
function openSuspendModal(userId, username) {
    currentActionUserId = userId;
    document.getElementById('suspend-username').textContent = username;
    document.getElementById('suspendConfirmModal').classList.add('show');
}

function closeSuspendConfirmModal() {
    document.getElementById('suspendConfirmModal').classList.remove('show');
    currentActionUserId = null;
}

async function confirmSuspendUser() {
    if (!currentActionUserId) return;
    
    try {
        const response = await fetch(`/tracking/api//users/${currentActionUserId}/suspend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('成功', '用戶已停權', 'success');
            closeSuspendConfirmModal();
            loadUsers();
        } else {
            showToast('錯誤', data.error || '停權失敗', 'error');
        }
    } catch (error) {
        console.error('停權用戶失敗：', error);
        showToast('錯誤', '停權失敗：' + error.message, 'error');
    }
}

// 恢復 Modal
function openRestoreModal(userId, username) {
    currentActionUserId = userId;
    document.getElementById('restore-username').textContent = username;
    document.getElementById('restoreConfirmModal').classList.add('show');
}

function closeRestoreConfirmModal() {
    document.getElementById('restoreConfirmModal').classList.remove('show');
    currentActionUserId = null;
}

async function confirmRestoreUser() {
    if (!currentActionUserId) return;
    
    try {
        const response = await fetch(`/tracking/api//users/${currentActionUserId}/restore`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('成功', '用戶已恢復', 'success');
            closeRestoreConfirmModal();
            loadUsers();
        } else {
            showToast('錯誤', data.error || '恢復失敗', 'error');
        }
    } catch (error) {
        console.error('恢復用戶失敗：', error);
        showToast('錯誤', '恢復失敗：' + error.message, 'error');
    }
}

// 重設密碼 Modal
function openResetPasswordModal(userId, username, realName) {
    currentActionUserId = userId;
    document.getElementById('reset-username').textContent = username;
    document.getElementById('reset-real-name').textContent = realName;
    document.getElementById('reset-new-password').value = '';
    document.getElementById('reset-require-change').checked = true;
    document.getElementById('resetPasswordModal').classList.add('show');
}

function closeResetPasswordModal() {
    document.getElementById('resetPasswordModal').classList.remove('show');
    currentActionUserId = null;
}

async function confirmResetPassword() {
    if (!currentActionUserId) return;
    
    const newPassword = document.getElementById('reset-new-password').value.trim();
    const requireChange = document.getElementById('reset-require-change').checked;
    
    if (newPassword && newPassword.length < 6) {
        showToast('錯誤', '密碼至少需要 6 個字符', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/tracking/api//users/${currentActionUserId}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                new_password: newPassword || null,
                require_change: requireChange
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('成功', data.message || '密碼已重設', 'success');
            closeResetPasswordModal();
            loadUsers();
        } else {
            showToast('錯誤', data.error || '重設失敗', 'error');
        }
    } catch (error) {
        console.error('重設密碼失敗：', error);
        showToast('錯誤', '重設失敗：' + error.message, 'error');
    }
}

// ==================== 快速操作（保留原有功能）====================

async function quickReject(userId) {
    try {
        const response = await fetch(`/tracking/api//users/${userId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('成功', '用戶已拒絕', 'success');
            loadUsers();
        } else {
            showToast('錯誤', data.error || '拒絕失敗', 'error');
        }
    } catch (error) {
        console.error('拒絕用戶失敗：', error);
        showToast('錯誤', '拒絕失敗：' + error.message, 'error');
    }
}

// ==================== 審核 Modal（保留原有）====================

function openApproveModal(userId) {
    const user = allUsers.find(u => u.user_id === userId);
    if (!user) return;
    
    approvingUserId = userId;
    document.getElementById('approve-username').textContent = user.username;
    document.getElementById('approve-real-name').textContent = user.real_name || user.display_name || '-';
    document.getElementById('approve-created-at').textContent = formatDate(user.created_at);
    document.getElementById('approve-role').value = user.role || 'sales';
    document.getElementById('approveUserModal').classList.add('show');
}

function closeApproveModal() {
    document.getElementById('approveUserModal').classList.remove('show');
    approvingUserId = null;
}

async function confirmApproveUser() {
    if (!approvingUserId) return;
    
    const role = document.getElementById('approve-role').value;
    
    try {
        const response = await fetch(`/tracking/api//users/${approvingUserId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('成功', '用戶已通過審核', 'success');
            closeApproveModal();
            loadUsers();
        } else {
            showToast('錯誤', data.error || '審核失敗', 'error');
        }
    } catch (error) {
        console.error('審核用戶失敗：', error);
        showToast('錯誤', '審核失敗：' + error.message, 'error');
    }
}

async function confirmRejectUser() {
    if (!approvingUserId) return;
    
    try {
        const response = await fetch(`/tracking/api//users/${approvingUserId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('成功', '用戶已拒絕', 'success');
            closeApproveModal();
            loadUsers();
        } else {
            showToast('錯誤', data.error || '拒絕失敗', 'error');
        }
    } catch (error) {
        console.error('拒絕用戶失敗：', error);
        showToast('錯誤', '拒絕失敗：' + error.message, 'error');
    }
}

// ==================== 內聯編輯 ====================

async function saveInlineEdit(element) {
    const userId = element.dataset.userId;
    const field = element.dataset.field;
    const value = element.value.trim();
    
    if (!value) {
        showToast('錯誤', '值不能為空', 'error');
        loadUsers();
        return;
    }
    
    try {
        const response = await fetch(`/tracking/api//users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('成功', '更新成功', 'success');
            loadUsers();
        } else {
            showToast('錯誤', data.error || '更新失敗', 'error');
            loadUsers();
        }
    } catch (error) {
        console.error('更新失敗：', error);
        showToast('錯誤', '更新失敗：' + error.message, 'error');
        loadUsers();
    }
}

// ==================== 工具函數 ====================

function getFilteredUsers() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const roleFilter = document.getElementById('role-filter').value;
    
    return allUsers.filter(user => {
        const matchSearch = !searchTerm || 
            user.username.toLowerCase().includes(searchTerm) ||
            (user.real_name && user.real_name.toLowerCase().includes(searchTerm)) ||
            (user.display_name && user.display_name.toLowerCase().includes(searchTerm));
        
        const matchStatus = !statusFilter || (user.status || 'active') === statusFilter;
        const matchRole = !roleFilter || user.role === roleFilter;
        
        return matchSearch && matchStatus && matchRole;
    });
}

function filterUsers() {
    renderUsers();
}

function updateTotalCount() {
    document.getElementById('total-count').textContent = allUsers.length;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showToast(title, message, type = 'success') {
    if (typeof window.showToast === 'function') {
        window.showToast(title, message, type);
    } else {
        alert(`${title}: ${message}`);
    }
}

// ==================== 新增用戶 Modal（保留原有）====================

function openNewUserModal() {
    editingUserId = null;
    document.getElementById('userModalTitle').textContent = '新增用戶';
    document.getElementById('submitUserBtn').textContent = '創建';
    document.getElementById('passwordField').style.display = 'block';
    document.getElementById('newUserForm').reset();
    document.getElementById('newUserModal').classList.add('show');
}

function closeModal() {
    document.getElementById('newUserModal').classList.remove('show');
    editingUserId = null;
}

async function submitUserForm() {
    const form = document.getElementById('newUserForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    if (!data.username || !data.password || !data.real_name) {
        showToast('錯誤', '請填寫所有必填欄位', 'error');
        return;
    }
    
    try {
        const response = await fetch('/tracking/api//users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (result.success) {
            showToast('成功', '用戶創建成功', 'success');
            closeModal();
            loadUsers();
        } else {
            showToast('錯誤', result.error || '創建失敗', 'error');
        }
    } catch (error) {
        console.error('創建用戶失敗：', error);
        showToast('錯誤', '創建失敗：' + error.message, 'error');
    }
}

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 DOM 已載入，開始初始化用戶管理模塊...');
    loadUsers();
});
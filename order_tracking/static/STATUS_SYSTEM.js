/**
 * ============================================
 * 订单状态统一管理系统
 * ============================================
 * 核心原则：
 * 1. 统一使用简体中文
 * 2. 所有状态判断只依赖这个文件
 * 3. 支持主要阶段和虚拟筛选器的双层系统
 * ============================================
 */

// ==================== 状态名称常量（简体中文）====================
const STATUS = {
    // 新订单/询价阶段
    NEW_ORDER: '新订单',
    QUOTE_CONFIRMING: '报价待确认',
    
    // 图稿阶段
    DRAFT_CONFIRMING: '图稿待确认',
    DRAFT_REVISING: '图稿修改中',
    
    // 打样阶段
    PENDING_SAMPLE: '待打样',
    SAMPLING: '打样中',
    SAMPLE_CONFIRMING: '打样待确认',
    SAMPLE_REVISING: '打样修改中',
    
    // 生产阶段
    PENDING_PRODUCTION: '待生产',
    PRODUCING: '生产中',
    
    // 最终状态
    COMPLETED: '已完成',
    CANCELLED: '已取消'
};

// ==================== 显示函数 ====================
/**
 * 直接返回状态名称（统一使用简体中文）
 * @param {string} status - 状态名称
 * @returns {string} 状态名称
 */
function displayStatus(status) {
    return status;
}

/**
 * 直接返回文本（统一使用简体中文）
 * @param {string} text - 文本
 * @returns {string} 文本
 */
function displayText(text) {
    return text;
}

// ==================== 主要阶段分组（互斥，用于订单归属）====================
const PRIMARY_STAGE_GROUPS = {
    new_and_quote: {
        name: '新订单/询价',
        statuses: [STATUS.NEW_ORDER, STATUS.QUOTE_CONFIRMING],
        icon: '📝',
        color: '#8b5cf6',
        order: 1,
        isPrimary: true
    },
    draft: {
        name: '图稿阶段',
        statuses: [STATUS.DRAFT_CONFIRMING, STATUS.DRAFT_REVISING],
        icon: '🎨',
        color: '#3b82f6',
        order: 2,
        isPrimary: true
    },
    sampling: {
        name: '打样阶段',
        statuses: [STATUS.PENDING_SAMPLE, STATUS.SAMPLING, STATUS.SAMPLE_CONFIRMING, STATUS.SAMPLE_REVISING],
        icon: '🧪',
        color: '#06b6d4',
        order: 3,
        isPrimary: true
    },
    production: {
        name: '生产阶段',
        statuses: [STATUS.PENDING_PRODUCTION, STATUS.PRODUCING],
        icon: '🏭',
        color: '#10b981',
        order: 4,
        isPrimary: true
    },
    completed: {
        name: '已完成',
        statuses: [STATUS.COMPLETED],
        icon: '✅',
        color: '#22c55e',
        order: 5,
        isPrimary: true
    },
    cancelled: {
        name: '已取消',
        statuses: [STATUS.CANCELLED],
        icon: '❌',
        color: '#ef4444',
        order: 6,
        isPrimary: true
    }
};

// ==================== 虚拟筛选器（可重叠，用于筛选按钮）====================
const FILTER_GROUPS = {
    waiting_confirm: {
        name: '等国外确认/询价',
        statuses: [STATUS.QUOTE_CONFIRMING, STATUS.DRAFT_CONFIRMING, STATUS.SAMPLE_CONFIRMING],
        icon: '⏳',
        color: '#f59e0b',
        order: 0,  // 显示在最前面
        isFilter: true
    }
};

// ==================== 合并的阶段分组（向后兼容）====================
const STAGE_GROUPS = {
    ...FILTER_GROUPS,
    ...PRIMARY_STAGE_GROUPS
};

// ==================== 工具函数 ====================

/**
 * 根据状态获取所属主要阶段（不包括虚拟筛选器）
 * @param {string} status - 状态名称
 * @returns {string} 阶段分组名称
 */
function getStageGroup(status) {
    // 只从主要阶段分组中查找
    for (const [groupName, group] of Object.entries(PRIMARY_STAGE_GROUPS)) {
        if (group.statuses.includes(status)) {
            return groupName;
        }
    }
    return 'all';
}

/**
 * 获取阶段显示名称
 * @param {string} status - 状态名称
 * @returns {string} 阶段显示名称
 */
function getStageName(status) {
    const group = getStageGroup(status);
    if (group === 'all') return displayStatus('其他');
    
    const stageGroup = STAGE_GROUPS[group];
    return `${stageGroup.icon} ${displayStatus(stageGroup.name)}`;
}

/**
 * 获取状态图标（时间轴用）
 * @param {string} status - 状态名称
 * @returns {string} 状态图标
 */
function getStatusIcon(status) {
    const iconMap = {
        [STATUS.NEW_ORDER]: '📝',
        [STATUS.QUOTE_CONFIRMING]: '✅',  // 待确认状态用 ✅
        [STATUS.DRAFT_CONFIRMING]: '✅',  // 待确认状态用 ✅
        [STATUS.DRAFT_REVISING]: '✏️',
        [STATUS.PENDING_SAMPLE]: '⏳',
        [STATUS.SAMPLING]: '🔄',  // 进行中的阶段用 🔄
        [STATUS.SAMPLE_CONFIRMING]: '✅',  // 待确认状态用 ✅
        [STATUS.SAMPLE_REVISING]: '🔄',
        [STATUS.PENDING_PRODUCTION]: '⏸️',
        [STATUS.PRODUCING]: '🔄',  // 进行中的阶段用 🔄
        [STATUS.COMPLETED]: '✅',  // 完成也用 ✅
        [STATUS.CANCELLED]: '❌'
    };
    return iconMap[status] || '📋';
}

/**
 * 获取状态的天数阈值
 * @param {string} status - 状态名称
 * @returns {object} {yellowDays, redDays}
 */
function getStatusThresholds(status) {
    const thresholds = {
        [STATUS.NEW_ORDER]: { yellowDays: 5, redDays: 7 },
        [STATUS.QUOTE_CONFIRMING]: { yellowDays: 3, redDays: 5 },
        [STATUS.DRAFT_CONFIRMING]: { yellowDays: 3, redDays: 5 },
        [STATUS.DRAFT_REVISING]: { yellowDays: 2, redDays: 4 },
        [STATUS.PENDING_SAMPLE]: { yellowDays: 5, redDays: 7 },
        [STATUS.SAMPLING]: { yellowDays: 10, redDays: null },
        [STATUS.SAMPLE_CONFIRMING]: { yellowDays: 2, redDays: 3 },
        [STATUS.SAMPLE_REVISING]: { yellowDays: 3, redDays: 5 },
        [STATUS.PENDING_PRODUCTION]: { yellowDays: 3, redDays: 5 },
        [STATUS.PRODUCING]: { yellowDays: 14, redDays: 21 },
        [STATUS.COMPLETED]: { yellowDays: null, redDays: null },
        [STATUS.CANCELLED]: { yellowDays: null, redDays: null }
    };
    return thresholds[status] || { yellowDays: null, redDays: null };
}

// ==================== 快捷操作配置 ====================
// 主頁懸停按鈕（簡潔版）- 只顯示主要下一步和必要的「需修改」
const QUICK_ACTIONS = {
    [STATUS.NEW_ORDER]: [
        { action: 'to_quote', label: '💰 发报价', next: STATUS.QUOTE_CONFIRMING, color: 'confirm', showInHover: true }
    ],
    [STATUS.QUOTE_CONFIRMING]: [
        { action: 'quote_confirmed', label: '✅ 客户确认', next: STATUS.DRAFT_CONFIRMING, color: 'confirm', showInHover: true }
    ],
    [STATUS.DRAFT_CONFIRMING]: [
        { action: 'draft_confirm', label: '✅ 图稿确认', next: STATUS.PENDING_SAMPLE, color: 'confirm', showInHover: true },
        { action: 'draft_modify', label: '🔄 需修改', next: STATUS.DRAFT_REVISING, color: 'warning', showInHover: true }
    ],
    [STATUS.DRAFT_REVISING]: [
        { action: 'draft_resent', label: '✅ 重新发图', next: STATUS.DRAFT_CONFIRMING, color: 'confirm', showInHover: true }
    ],
    [STATUS.PENDING_SAMPLE]: [
        { action: 'sampling_start', label: '✅ 开始打样', next: STATUS.SAMPLING, color: 'confirm', showInHover: true }
    ],
    [STATUS.SAMPLING]: [
        { action: 'sampling_sent', label: '✅ 打样待确认', next: STATUS.SAMPLE_CONFIRMING, color: 'confirm', showInHover: true }
    ],
    [STATUS.SAMPLE_CONFIRMING]: [
        { action: 'sampling_confirm', label: '✅ 样品确认', next: STATUS.PENDING_PRODUCTION, color: 'confirm', showInHover: true },
        { action: 'sampling_modify', label: '🔄 需修改', next: STATUS.SAMPLE_REVISING, color: 'warning', showInHover: true }
    ],
    [STATUS.SAMPLE_REVISING]: [
        { action: 'sampling_restart', label: '✅ 重新打样', next: STATUS.SAMPLING, color: 'confirm', showInHover: true }
    ],
    [STATUS.PENDING_PRODUCTION]: [
        { action: 'production_start', label: '✅ 开始生产', next: STATUS.PRODUCING, color: 'confirm', showInHover: true }
    ],
    [STATUS.PRODUCING]: [
        { action: 'production_complete', label: '✅ 生产完成', next: STATUS.COMPLETED, color: 'confirm', showInHover: true }
    ]
};

/**
 * 获取状态的快捷操作
 * @param {string} status - 状态名称
 * @returns {Array} 快捷操作列表
 */
function getQuickActions(status) {
    return QUICK_ACTIONS[status] || [];
}

// ==================== 状态流程顺序（用于跳过功能）====================
const STATUS_FLOW_ORDER = [
    STATUS.NEW_ORDER,           // 0
    STATUS.QUOTE_CONFIRMING,    // 1
    STATUS.DRAFT_CONFIRMING,    // 2
    STATUS.DRAFT_REVISING,      // 3
    STATUS.PENDING_SAMPLE,      // 4
    STATUS.SAMPLING,            // 5
    STATUS.SAMPLE_CONFIRMING,   // 6
    STATUS.SAMPLE_REVISING,     // 7
    STATUS.PENDING_PRODUCTION,  // 8
    STATUS.PRODUCING,           // 9
    STATUS.COMPLETED            // 10
];

/**
 * 获取可跳转的目标状态（只能往后跳）
 * @param {string} currentStatus - 当前状态
 * @returns {Array} 可跳转的状态列表
 */
function getSkippableStatuses(currentStatus) {
    const currentIndex = STATUS_FLOW_ORDER.indexOf(currentStatus);
    if (currentIndex === -1) return [];
    
    // 返回当前状态之后的所有状态（排除修改中的状态和已取消）
    return STATUS_FLOW_ORDER
        .slice(currentIndex + 1)
        .filter(status => 
            status !== STATUS.DRAFT_REVISING && 
            status !== STATUS.SAMPLE_REVISING &&
            status !== STATUS.CANCELLED
        );
}

/**
 * 获取某个阶段的所有状态（简体）
 * @param {string} stageGroup - 阶段分组名称
 * @returns {Array} 状态列表（简体）
 */
function getStatusesByStageGroup(stageGroup) {
    if (!STAGE_GROUPS[stageGroup]) {
        return [];
    }
    return STAGE_GROUPS[stageGroup].statuses || [];
}

/**
 * 获取所有阶段的状态映射（用于筛选）
 * @returns {Object} 阶段到状态列表的映射
 */
function getStageMap() {
    const map = {};
    for (const [groupName, group] of Object.entries(STAGE_GROUPS)) {
        map[groupName] = group.statuses;
    }
    return map;
}

/**
 * 检查状态是否属于某个筛选器
 * @param {string} status - 状态名称
 * @param {string} filterGroup - 筛选器分组名称
 * @returns {boolean} 是否匹配
 */
function isStatusInFilter(status, filterGroup) {
    if (!STAGE_GROUPS[filterGroup]) {
        return false;
    }
    return STAGE_GROUPS[filterGroup].statuses.includes(status);
}

/**
 * 获取状态匹配的所有分组（包括主要阶段和虚拟筛选器）
 * @param {string} status - 状态名称
 * @returns {Array} 匹配的分组名称列表
 */
function getAllMatchingGroups(status) {
    const matches = [];
    for (const [groupName, group] of Object.entries(STAGE_GROUPS)) {
        if (group.statuses.includes(status)) {
            matches.push(groupName);
        }
    }
    return matches;
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
    window.STATUS = STATUS;
    window.STAGE_GROUPS = STAGE_GROUPS;
    window.PRIMARY_STAGE_GROUPS = PRIMARY_STAGE_GROUPS;
    window.FILTER_GROUPS = FILTER_GROUPS;
    window.displayStatus = displayStatus;
    window.displayText = displayText;
    window.getStageGroup = getStageGroup;
    window.getStageName = getStageName;
    window.getStatusIcon = getStatusIcon;
    window.getStatusThresholds = getStatusThresholds;
    window.getQuickActions = getQuickActions;
    window.getStatusesByStageGroup = getStatusesByStageGroup;
    window.getStageMap = getStageMap;
    window.isStatusInFilter = isStatusInFilter;
    window.getAllMatchingGroups = getAllMatchingGroups;
    window.STATUS_FLOW_ORDER = STATUS_FLOW_ORDER;
    window.getSkippableStatuses = getSkippableStatuses;
}

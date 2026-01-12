"""
订单状态配置 - Python端
与 STATUS_SYSTEM.js 保持一致
用于Python后端的状态管理
"""

# ==================== 状态名称常量（简体 - 数据库存储用）====================
STATUS = {
    # 新订单/询价阶段
    'NEW_ORDER': '新订单',
    'QUOTE_CONFIRMING': '报价待确认',
    
    # 图稿阶段
    'DRAFT_CONFIRMING': '图稿待确认',
    'DRAFT_REVISING': '图稿修改中',
    
    # 打样阶段
    'PENDING_SAMPLE': '待打样',
    'SAMPLING': '打样中',
    'SAMPLE_CONFIRMING': '打样待确认',  # ← 已改为"待确认"
    'SAMPLE_REVISING': '打样修改中',
    
    # 生产阶段
    'PENDING_PRODUCTION': '待生产',
    'PRODUCING': '生产中',
    
    # 最终状态
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
}

# ==================== 阶段分组 ====================
STAGE_GROUPS = {
    'new_and_quote': {
        'name': '新订单/询价',
        'statuses': [STATUS['NEW_ORDER'], STATUS['QUOTE_CONFIRMING']],
        'icon': '📝',
        'color': '#8b5cf6'
    },
    # 等国外确认/询价 - 包含所有需要国外确认的状态（虚拟筛选器）
    'waiting_confirm': {
        'name': '等国外确认/询价',
        'statuses': [STATUS['QUOTE_CONFIRMING'], STATUS['DRAFT_CONFIRMING'], STATUS['SAMPLE_CONFIRMING']],
        'icon': '⏳',
        'color': '#f59e0b',
        'is_filter': True  # 标记为虚拟筛选器
    },
    'draft': {
        'name': '图稿阶段',
        'statuses': [STATUS['DRAFT_CONFIRMING'], STATUS['DRAFT_REVISING']],
        'icon': '🎨',
        'color': '#3b82f6'
    },
    'sampling': {
        'name': '打样阶段',
        'statuses': [
            STATUS['PENDING_SAMPLE'],
            STATUS['SAMPLING'],
            STATUS['SAMPLE_CONFIRMING'],  # ← 打样待确认
            STATUS['SAMPLE_REVISING']
        ],
        'icon': '🧪',
        'color': '#06b6d4'
    },
    'production': {
        'name': '生产阶段',
        'statuses': [STATUS['PENDING_PRODUCTION'], STATUS['PRODUCING']],
        'icon': '🏭',
        'color': '#10b981'
    },
    'completed': {
        'name': '已完成',
        'statuses': [STATUS['COMPLETED']],
        'icon': '✅',
        'color': '#22c55e'
    },
    'cancelled': {
        'name': '已取消',
        'statuses': [STATUS['CANCELLED']],
        'icon': '❌',
        'color': '#ef4444'
    }
}

# ==================== 工具函数 ====================

def get_stage_group(status):
    """根据状态获取所属阶段"""
    for group_name, group in STAGE_GROUPS.items():
        if status in group['statuses']:
            return group_name
    return 'all'

def get_statuses_by_stage_group(stage_group):
    """获取某个阶段的所有状态"""
    if stage_group not in STAGE_GROUPS:
        return []
    return STAGE_GROUPS[stage_group]['statuses']

# ==================== 状态映射（用于API）====================
# 与 STATUS_SYSTEM.js 中的 QUICK_ACTIONS 保持一致
STATUS_MAP = {
    # 新订单/询价阶段
    'to_quote': STATUS['QUOTE_CONFIRMING'],
    'skip_to_draft': STATUS['DRAFT_CONFIRMING'],
    'quote_confirmed': STATUS['DRAFT_CONFIRMING'],
    
    # 图稿阶段
    'draft_confirm': STATUS['PENDING_SAMPLE'],
    'draft_modify': STATUS['DRAFT_REVISING'],
    'draft_resent': STATUS['DRAFT_CONFIRMING'],
    
    # 打样阶段
    'sampling_start': STATUS['SAMPLING'],
    'skip_sampling': STATUS['PENDING_PRODUCTION'],
    'sampling_sent': STATUS['SAMPLE_CONFIRMING'],  # ← 打样中 → 打样待确认
    'sampling_confirm': STATUS['PENDING_PRODUCTION'],
    'sampling_modify': STATUS['SAMPLE_REVISING'],
    'sampling_restart': STATUS['SAMPLING'],
    
    # 生产阶段
    'production_start': STATUS['PRODUCING'],
    'production_complete': STATUS['COMPLETED'],
    
    # 取消
    'cancel': STATUS['CANCELLED'],
}


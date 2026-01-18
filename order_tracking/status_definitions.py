"""
订单状态统一定义 - 唯一来源
===========================================
这是整个系统的状态定义中心，所有状态相关的逻辑都从这里读取。

核心原则：
1. 数据库存储：使用英文 key（如 NEW_ORDER, DRAFT_MAKING）
2. 显示文字：通过 labels 映射到中文（简体/繁体）
3. 所有逻辑判断：只使用 key，不依赖中文文字
4. 新增流程：只需在这里添加一个 key + 配置即可
===========================================
"""

# ==================== 状态 Key 定义（英文，用于数据库和逻辑判断）====================
STATUS_KEYS = {
    # 新订单/询价阶段
    'NEW_ORDER': 'NEW_ORDER',
    'QUOTE_CONFIRMING': 'QUOTE_CONFIRMING',
    
    # 图稿阶段
    'DRAFT_MAKING': 'DRAFT_MAKING',
    'DRAFT_CONFIRMING': 'DRAFT_CONFIRMING',
    'DRAFT_REVISING': 'DRAFT_REVISING',
    
    # 打样阶段
    'PENDING_SAMPLE': 'PENDING_SAMPLE',
    'SAMPLING': 'SAMPLING',
    'SAMPLE_CONFIRMING': 'SAMPLE_CONFIRMING',
    'SAMPLE_REVISING': 'SAMPLE_REVISING',
    
    # 生产阶段
    'PENDING_PRODUCTION': 'PENDING_PRODUCTION',
    'PRODUCING': 'PRODUCING',
    
    # 最终状态
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED'
}

# ==================== 状态显示文字（简体/繁体）====================
STATUS_LABELS = {
    'NEW_ORDER': {
        'zh_cn': '新订单',
        'zh_tw': '新訂單',
        'en': 'New Order'
    },
    'QUOTE_CONFIRMING': {
        'zh_cn': '报价待确认',
        'zh_tw': '報價待確認',
        'en': 'Quote Pending Confirmation'
    },
    'DRAFT_MAKING': {
        'zh_cn': '图稿制作中',
        'zh_tw': '圖稿製作中',
        'en': 'Artwork in Progress'
    },
    'DRAFT_CONFIRMING': {
        'zh_cn': '图稿待确认',
        'zh_tw': '圖稿待確認',
        'en': 'Artwork Pending Confirmation'
    },
    'DRAFT_REVISING': {
        'zh_cn': '图稿修改中',
        'zh_tw': '圖稿修改中',
        'en': 'Artwork Revising'
    },
    'PENDING_SAMPLE': {
        'zh_cn': '待打样',
        'zh_tw': '待打樣',
        'en': 'Pending Sample'
    },
    'SAMPLING': {
        'zh_cn': '打样中',
        'zh_tw': '打樣中',
        'en': 'Sampling'
    },
    'SAMPLE_CONFIRMING': {
        'zh_cn': '打样待确认',
        'zh_tw': '打樣待確認',
        'en': 'Sample Pending Confirmation'
    },
    'SAMPLE_REVISING': {
        'zh_cn': '打样修改中',
        'zh_tw': '打樣修改中',
        'en': 'Sample Revising'
    },
    'PENDING_PRODUCTION': {
        'zh_cn': '待生产',
        'zh_tw': '待生產',
        'en': 'Pending Production'
    },
    'PRODUCING': {
        'zh_cn': '生产中',
        'zh_tw': '生產中',
        'en': 'Producing'
    },
    'COMPLETED': {
        'zh_cn': '已完成',
        'zh_tw': '已完成',
        'en': 'Completed'
    },
    'CANCELLED': {
        'zh_cn': '已取消',
        'zh_tw': '已取消',
        'en': 'Cancelled'
    }
}

# ==================== 阶段分组（使用 key）====================
STAGE_GROUPS = {
    'new_and_quote': {
        'name_zh_cn': '新订单/询价',
        'name_zh_tw': '新訂單/詢價',
        'name_en': 'New Order/Quote',
        'status_keys': ['NEW_ORDER', 'QUOTE_CONFIRMING'],
        'icon': '📝',
        'color': '#8b5cf6',
        'order': 1
    },
    'waiting_confirm': {
        'name_zh_cn': '等国外确认/询价',
        'name_zh_tw': '等國外確認/詢價',
        'name_en': 'Waiting for Overseas Confirmation',
        'status_keys': ['QUOTE_CONFIRMING', 'DRAFT_CONFIRMING', 'SAMPLE_CONFIRMING'],
        'icon': '⏳',
        'color': '#f59e0b',
        'is_filter': True,
        'order': 0
    },
    'draft': {
        'name_zh_cn': '图稿阶段',
        'name_zh_tw': '圖稿階段',
        'name_en': 'Draft Stage',
        'status_keys': ['DRAFT_MAKING', 'DRAFT_CONFIRMING', 'DRAFT_REVISING'],
        'icon': '🎨',
        'color': '#3b82f6',
        'order': 2
    },
    'sampling': {
        'name_zh_cn': '打样阶段',
        'name_zh_tw': '打樣階段',
        'name_en': 'Sampling Stage',
        'status_keys': ['PENDING_SAMPLE', 'SAMPLING', 'SAMPLE_CONFIRMING', 'SAMPLE_REVISING'],
        'icon': '🧪',
        'color': '#06b6d4',
        'order': 3
    },
    'production': {
        'name_zh_cn': '生产阶段',
        'name_zh_tw': '生產階段',
        'name_en': 'Production Stage',
        'status_keys': ['PENDING_PRODUCTION', 'PRODUCING'],
        'icon': '🏭',
        'color': '#10b981',
        'order': 4
    },
    'completed': {
        'name_zh_cn': '已完成',
        'name_zh_tw': '已完成',
        'name_en': 'Completed',
        'status_keys': ['COMPLETED'],
        'icon': '✅',
        'color': '#22c55e',
        'order': 5
    },
    'cancelled': {
        'name_zh_cn': '已取消',
        'name_zh_tw': '已取消',
        'name_en': 'Cancelled',
        'status_keys': ['CANCELLED'],
        'icon': '❌',
        'color': '#ef4444',
        'order': 6
    }
}

# ==================== 状态流程顺序（使用 key）====================
STATUS_FLOW_ORDER = [
    'NEW_ORDER',
    'QUOTE_CONFIRMING',
    'DRAFT_MAKING',
    'DRAFT_CONFIRMING',
    'DRAFT_REVISING',
    'PENDING_SAMPLE',
    'SAMPLING',
    'SAMPLE_CONFIRMING',
    'SAMPLE_REVISING',
    'PENDING_PRODUCTION',
    'PRODUCING',
    'COMPLETED'
]

# ==================== 快捷操作映射（action → status_key）====================
QUICK_ACTIONS_MAP = {
    # 新订单/询价阶段
    'to_quote': 'QUOTE_CONFIRMING',
    'skip_to_draft': 'DRAFT_CONFIRMING',
    'quote_confirmed': 'DRAFT_MAKING',
    
    # 图稿阶段
    'draft_sent': 'DRAFT_CONFIRMING',
    'draft_confirm': 'PENDING_SAMPLE',
    'draft_modify': 'DRAFT_REVISING',
    'draft_resent': 'DRAFT_CONFIRMING',
    
    # 打样阶段
    'sampling_start': 'SAMPLING',
    'skip_sampling': 'PENDING_PRODUCTION',
    'sampling_sent': 'SAMPLE_CONFIRMING',
    'sampling_confirm': 'PENDING_PRODUCTION',
    'sampling_modify': 'SAMPLE_REVISING',
    'sampling_restart': 'SAMPLING',
    
    # 生产阶段
    'production_start': 'PRODUCING',
    'production_complete': 'COMPLETED',
    
    # 取消
    'cancel': 'CANCELLED',
}

# ==================== 工具函数 =====================

def get_status_label(status_key, lang='zh_cn'):
    """
    获取状态的显示文字
    
    Args:
        status_key: 状态 key（如 'NEW_ORDER'）
        lang: 语言 ('zh_cn', 'zh_tw', 'en')
    
    Returns:
        显示文字，如果找不到则返回 key
    """
    if status_key in STATUS_LABELS:
        return STATUS_LABELS[status_key].get(lang, status_key)
    return status_key

def get_stage_group(status_key):
    """根据状态 key 获取所属阶段"""
    for group_name, group in STAGE_GROUPS.items():
        if status_key in group['status_keys']:
            return group_name
    return 'all'

def get_statuses_by_stage_group(stage_group):
    """获取某个阶段的所有状态 key"""
    if stage_group not in STAGE_GROUPS:
        return []
    return STAGE_GROUPS[stage_group]['status_keys']

def is_status_in_group(status_key, group_name):
    """检查状态是否属于某个阶段"""
    if group_name not in STAGE_GROUPS:
        return False
    return status_key in STAGE_GROUPS[group_name]['status_keys']

# ==================== 向后兼容：生成旧的 STATUS 字典（用于逐步迁移）====================
# 这个字典用于保持向后兼容，让现有代码可以继续工作
# 但新代码应该直接使用 STATUS_KEYS 和 get_status_label()
STATUS = {key: get_status_label(key, 'zh_cn') for key in STATUS_KEYS.keys()}

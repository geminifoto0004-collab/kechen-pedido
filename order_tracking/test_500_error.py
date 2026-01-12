#!/usr/bin/env python3
"""
诊断 500 错误 - 找出真正原因
运行: cd order_tracking && python test_500_error.py
"""
from datetime import date

print("=" * 70)
print("诊断 500 错误")
print("=" * 70)
print()

# 服务器时间
print(f"服务器时间: {date.today()}")
print()

# 模拟逻辑
order_date = '2026-01-12'
today_str = date.today().isoformat()

print(f"创建订单:")
print(f"  订单日期: {order_date}")
print(f"  last_status_change_date: {today_str}")
print()

# 计算
last_change = date.fromisoformat(today_str)
today = date.today()
days = (today - last_change).days

print(f"计算天数: {today} - {last_change} = {days}")
print()

if days == 0:
    print("✅ __init__.py 已正确修改！天数是 0")
    print()
    print("⚠️  500 错误是其他原因，请检查:")
    print()
    print("1. 服务器控制台的完整错误信息")
    print("2. models.py 是否有语法错误")
    print("3. 数据库是否正常")
    print()
    print("请把服务器控制台显示的完整错误发给我！")
else:
    print(f"❌ 天数是 {days}，__init__.py 可能还有问题")

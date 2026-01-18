# M8 - 圖片管理 UI（三欄布局）

## 📌 模塊概述
**時間**: 2-3 天 | **依賴**: M2, M3

**目標**: 實現三欄布局圖片查看器

## 🔧 在 __init__.py 添加輔助 API

```python
# ==================== 新增：圖片管理 UI 輔助 API（M8）====================

@tracking_bp.route('/api/orders/adjacent', methods=['GET'])
@login_required
def get_adjacent_orders_api():
    """獲取相鄰訂單（用於訂單切換）"""
    current = request.args.get('current')
    mode = request.args.get('mode', 'global')  # global 或 filter
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 根據模式查詢
    if mode == 'global':
        cursor.execute('SELECT order_number FROM orders ORDER BY order_number')
    else:
        # 這裡可以根據篩選條件查詢
        cursor.execute('SELECT order_number FROM orders ORDER BY order_number')
    
    orders = cursor.fetchall()
    order_numbers = [o['order_number'] for o in orders]
    
    try:
        current_index = order_numbers.index(current)
        prev_order = order_numbers[current_index - 1] if current_index > 0 else None
        next_order = order_numbers[current_index + 1] if current_index < len(order_numbers) - 1 else None
    except ValueError:
        prev_order = next_order = None
    
    conn.close()
    
    return jsonify({
        'success': True,
        'prev': prev_order,
        'next': next_order,
        'current_index': current_index + 1 if current in order_numbers else 0,
        'total': len(order_numbers)
    })
```

## 🎨 前端：圖片查看器

### `static/js/modules/image-viewer.js`:

```javascript
// 圖片查看器
class ImageViewer {
    constructor() {
        this.currentZoom = 100;
        this.currentRotation = 0;
    }
    
    zoomIn() {
        this.currentZoom += 25;
        this.applyZoom();
    }
    
    zoomOut() {
        if (this.currentZoom > 25) {
            this.currentZoom -= 25;
            this.applyZoom();
        }
    }
    
    resetZoom() {
        this.currentZoom = 100;
        this.applyZoom();
    }
    
    applyZoom() {
        const img = document.getElementById('main-image');
        if (img) {
            img.style.width = this.currentZoom + '%';
        }
    }
    
    rotateLeft() {
        this.currentRotation -= 90;
        this.applyRotation();
    }
    
    rotateRight() {
        this.currentRotation += 90;
        this.applyRotation();
    }
    
    applyRotation() {
        const img = document.getElementById('main-image');
        if (img) {
            img.style.transform = `rotate(${this.currentRotation}deg)`;
        }
    }
    
    toggleFullscreen() {
        const viewer = document.getElementById('image-viewer');
        if (viewer.requestFullscreen) {
            viewer.requestFullscreen();
        }
    }
}

const imageViewer = new ImageViewer();
```

### `static/css/modules/image-viewer.css`:

```css
.image-viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.viewer-controls {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background: #f5f5f5;
}

.viewer-canvas {
    flex: 1;
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2c2c2c;
}

.viewer-canvas img {
    max-width: 90%;
    max-height: 90%;
    transition: transform 0.3s;
}
```

**完成後進入 M9** 🚀

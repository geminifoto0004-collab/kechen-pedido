/**
 * 新建訂單功能
 */

// 打開新建訂單 Modal
function openNewOrderModal() {
    const modal = document.getElementById('newOrderModal');
    if (modal) {
        // 重置表單
        const form = document.getElementById('newOrderForm');
        if (form) {
            form.reset();
        }
        
        // 設置默認日期為今天
        const orderDateInput = document.getElementById('newOrderDate');
        if (orderDateInput) {
            const today = new Date().toISOString().split('T')[0];
            orderDateInput.value = today;
        }
        
        modal.classList.add('show');
    }
}

// 關閉新建訂單 Modal
function closeNewOrderModal() {
    const modal = document.getElementById('newOrderModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// 提交新建訂單表單
async function submitNewOrder() {
    // 收集表單數據
    const formData = {
        order_number: document.getElementById('newOrderNumber').value.trim(),
        customer_name: document.getElementById('newCustomerName').value.trim(),
        order_date: document.getElementById('newOrderDate').value,
        product_code: document.getElementById('newProductCode')?.value.trim() || '',
        product_name: document.getElementById('newProductName')?.value.trim() || '',
        quantity: document.getElementById('newQuantity')?.value.trim() || '',
        factory: document.getElementById('newFactory')?.value || '',
        production_type: document.getElementById('newProductionType')?.value.trim() || '',
        expected_delivery_date: document.getElementById('newDeliveryDate')?.value || '',
        notes: document.getElementById('newOrderNotes')?.value.trim() || ''
    };
    
    // 驗證必填項
    if (!formData.order_number) {
        alert('請填寫訂單號');
        document.getElementById('newOrderNumber').focus();
        return;
    }
    
    if (!formData.customer_name) {
        alert('請填寫客戶名稱');
        document.getElementById('newCustomerName').focus();
        return;
    }
    
    if (!formData.order_date) {
        alert('請選擇訂單日期');
        document.getElementById('newOrderDate').focus();
        return;
    }
    
    try {
        const response = await fetch('/tracking/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (typeof showToast === 'function') {
                showToast('✅ 訂單創建成功', `訂單 ${formData.order_number} 已創建`);
            } else {
                alert('✅ 訂單創建成功！');
            }
            closeNewOrderModal();
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            alert('❌ 創建失敗：' + (result.error || '未知錯誤'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ 網絡錯誤，請稍後再試');
    }
}

// 點擊 Modal 外部關閉
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('newOrderModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeNewOrderModal();
            }
        });
    }
});

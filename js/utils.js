/* ===== Utility Functions ===== */
function formatCurrency(amount) {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr, options) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', options || { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(dateStr) {
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove() }, 3500);
}

function debounce(fn, delay = 300) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay) };
}

function getInitials(name) {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
}

function paymentMethodLabel(method) {
    const map = { cash: '💵 เงินสด', promptpay: '📱 พร้อมเพย์', card: '💳 บัตรเครดิต' };
    return map[method] || method;
}

function statusLabel(status) {
    const map = { completed: 'เสร็จสิ้น', pending: 'รอดำเนินการ', cancelled: 'ยกเลิก' };
    return map[status] || status;
}

function statusBadge(status) {
    const cls = { completed: 'badge-success', pending: 'badge-warning', cancelled: 'badge-danger' };
    return `<span class="badge ${cls[status] || 'badge-info'}">${statusLabel(status)}</span>`;
}

/* Simple chart bar renderer */
function renderBarChart(container, data, maxVal) {
    if (!maxVal) maxVal = Math.max(...data.map(d => d.value), 1);
    container.innerHTML = data.map(d => `
    <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem">
      <span style="width:60px;font-size:.75rem;color:var(--text-secondary);text-align:right">${d.label}</span>
      <div style="flex:1;height:28px;background:var(--bg);border-radius:var(--radius);overflow:hidden">
        <div style="height:100%;width:${(d.value / maxVal * 100).toFixed(1)}%;background:linear-gradient(90deg,var(--primary),var(--primary-light));border-radius:var(--radius);display:flex;align-items:center;justify-content:flex-end;padding:0 .5rem;font-size:.7rem;color:#fff;font-weight:600;transition:width .8s var(--ease)">${d.value}</div>
      </div>
    </div>
  `).join('');
}

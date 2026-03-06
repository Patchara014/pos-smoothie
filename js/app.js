/* ===== App Initialization — Supabase Version ===== */
document.addEventListener('DOMContentLoaded', async () => {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const dir = window.location.pathname.split('/').slice(-2, -1)[0];

  // Auth pages don't need guard
  if (page === 'index.html' && !dir.match(/owner|employee|customer/)) {
    initLoginPage();
    return;
  }
  if (page === 'register.html') {
    initRegisterPage();
    return;
  }

  // Protected pages
  const roleMap = {
    owner: ['owner'],
    employee: ['employee'],
    customer: ['customer']
  };
  const allowedRoles = roleMap[dir];
  if (allowedRoles && !Auth.guard(allowedRoles)) return;

  await initComponents();

  const user = await Auth.getCurrentUser();
  if (user && (user.role === 'owner' || user.role === 'employee')) {
    initRealtimeNotifications();
  }

  // Page-specific init
  const initMap = {
    'owner/dashboard.html': initOwnerDashboard,
    'owner/pos.html': initPOS,
    'owner/payment.html': initPayment,
    'owner/orders.html': initOrders,
    'owner/reports.html': initReports,
    'owner/products.html': initProducts,
    'owner/employees.html': initEmployees,
    'owner/customers.html': initCustomers,
    'owner/profile.html': initProfile,
    'employee/dashboard.html': initEmployeeDashboard,
    'employee/pos.html': initPOS,
    'employee/payment.html': initPayment,
    'employee/orders.html': initOrders,
    'employee/customers.html': initCustomers,
    'employee/profile.html': initProfile,
    'customer/menu.html': initCustomerMenu,
    'customer/orders.html': initCustomerOrders,
    'customer/profile.html': initProfile,
  };

  const key = dir + '/' + page;
  if (initMap[key]) await initMap[key]();
});

/* ===== Login Page ===== */
function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'กำลังเข้าสู่ระบบ...';
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const result = await Auth.login(username, password);
    if (!result.success) { showToast(result.message, 'error'); btn.disabled = false; btn.textContent = 'เข้าสู่ระบบ'; return; }
    showToast(`ยินดีต้อนรับ ${result.user.name}!`, 'success');
    const roleRedirect = { owner: 'owner/dashboard.html', employee: 'employee/dashboard.html', customer: 'customer/menu.html' };
    setTimeout(() => { window.location.href = roleRedirect[result.user.role] || 'index.html'; }, 600);
  });
}

/* ===== Register Page ===== */
function initRegisterPage() {
  const form = document.getElementById('registerForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'กำลังสมัครสมาชิก...';
    const data = {
      name: document.getElementById('regName').value.trim(),
      username: document.getElementById('regUsername').value.trim(),
      password: document.getElementById('regPassword').value,
      email: document.getElementById('regEmail').value.trim(),
      phone: document.getElementById('regPhone').value.trim(),
      role: 'customer'
    };
    if (data.password !== document.getElementById('regConfirm').value) { showToast('รหัสผ่านไม่ตรงกัน', 'error'); btn.disabled = false; btn.textContent = 'สมัครสมาชิก'; return; }
    const result = await Auth.register(data);
    if (!result.success) { showToast(result.message, 'error'); btn.disabled = false; btn.textContent = 'สมัครสมาชิก'; return; }
    showToast('สมัครสมาชิกสำเร็จ!', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 800);
  });
}

/* ===== Owner Dashboard ===== */
async function initOwnerDashboard() {
  const [orders, products, users] = await Promise.all([
    DataStore.getOrders(), DataStore.getProducts(), DataStore.getUsers()
  ]);

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const employees = users.filter(u => u.role === 'employee');

  document.getElementById('statRevenue').textContent = formatCurrency(todayRevenue);
  document.getElementById('statOrders').textContent = todayOrders.length;
  document.getElementById('statProducts').textContent = products.length;
  document.getElementById('statEmployees').textContent = employees.length;
  document.getElementById('statTotalRevenue').textContent = formatCurrency(totalRevenue);
  document.getElementById('statTotalOrders').textContent = orders.length;

  // Recent orders
  const recentEl = document.getElementById('recentOrders');
  const recent = orders.slice(0, 8);
  recentEl.innerHTML = recent.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.items.map(i => i.name).join(', ')}</td>
      <td>${formatCurrency(o.total)}</td>
      <td>${paymentMethodLabel(o.payment_method || o.paymentMethod)}</td>
      <td>${statusBadge(o.status)}</td>
      <td>${formatDate(o.createdAt)}</td>
    </tr>
  `).join('');

  // Charts
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toDateString();
    const dayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === ds);
    last7.push({ label: d.toLocaleDateString('th-TH', { weekday: 'short' }), value: dayOrders.reduce((s, o) => s + o.total, 0) });
  }
  const chartEl = document.getElementById('revenueChart');
  if (chartEl) renderBarChart(chartEl, last7);

  // Top products
  const productCount = {};
  orders.forEach(o => o.items.forEach(it => { productCount[it.name] = (productCount[it.name] || 0) + it.qty; }));
  const topProducts = Object.entries(productCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value }));
  const topEl = document.getElementById('topProducts');
  if (topEl) renderBarChart(topEl, topProducts);
}

/* ===== Employee Dashboard ===== */
async function initEmployeeDashboard() {
  const orders = await DataStore.getOrders();

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);

  document.getElementById('statRevenue').textContent = formatCurrency(todayRevenue);
  document.getElementById('statOrders').textContent = todayOrders.length;
  document.getElementById('statAvg').textContent = formatCurrency(todayOrders.length ? todayRevenue / todayOrders.length : 0);

  const recentEl = document.getElementById('recentOrders');
  const recent = orders.slice(0, 10);
  recentEl.innerHTML = recent.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.items.map(i => (i.emoji || '') + ' ' + i.name).join(', ')}</td>
      <td>${formatCurrency(o.total)}</td>
      <td>${statusBadge(o.status)}</td>
      <td>${formatDate(o.createdAt)}</td>
    </tr>
  `).join('');
}

/* ===== POS (Owner & Employee) ===== */
let cart = [];
let posProductsCache = [];

async function initPOS() {
  cart = JSON.parse(sessionStorage.getItem('pos_cart') || '[]');
  posProductsCache = await DataStore.getProducts();
  renderPOSProducts();
  renderCart();

  // Category filter
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPOSProducts(btn.dataset.cat);
    });
  });

  // Search
  const search = document.getElementById('posSearch');
  if (search) search.addEventListener('input', debounce((e) => {
    const active = document.querySelector('.cat-btn.active');
    renderPOSProducts(active?.dataset.cat, e.target.value);
  }));
}

function renderPOSProducts(category, search) {
  let products = posProductsCache.filter(p => p.status === 'active');
  if (category && category !== 'all') products = products.filter(p => p.category === category);
  if (search) products = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const grid = document.getElementById('productGrid');
  grid.innerHTML = products.map(p => `
    <div class="card product-card animate-scale-in" onclick="addToCart('${p.id}')">
      <div class="product-img">${p.emoji || '🍹'}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">${formatCurrency(p.price)}</div>
    </div>
  `).join('');
}

function addToCart(productId) {
  const product = posProductsCache.find(p => p.id === productId);
  if (!product) return;
  const existing = cart.find(i => i.productId === productId);
  if (existing) { existing.qty++; }
  else { cart.push({ productId, name: product.name, price: product.price, qty: 1, emoji: product.emoji }); }
  sessionStorage.setItem('pos_cart', JSON.stringify(cart));
  renderCart();
  showToast(`เพิ่ม ${product.name} แล้ว`, 'success');
}

function updateCartQty(productId, delta) {
  const item = cart.find(i => i.productId === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.productId !== productId);
  sessionStorage.setItem('pos_cart', JSON.stringify(cart));
  renderCart();
}

function removeCartItem(productId) {
  cart = cart.filter(i => i.productId !== productId);
  sessionStorage.setItem('pos_cart', JSON.stringify(cart));
  renderCart();
}

function clearCart() {
  cart = [];
  sessionStorage.removeItem('pos_cart');
  renderCart();
}

function renderCart() {
  const itemsEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.getElementById('cartCount');
  const subtotalEl = document.getElementById('cartSubtotal');

  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🛒</div><h3>ตะกร้าว่าง</h3><p>เลือกสินค้าเพื่อเริ่มขาย</p></div>';
    if (totalEl) totalEl.textContent = formatCurrency(0);
    if (countEl) countEl.textContent = '0';
    if (subtotalEl) subtotalEl.textContent = formatCurrency(0);
    return;
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  itemsEl.innerHTML = cart.map(i => `
    <div class="cart-item">
      <div class="item-img">${i.emoji || '🍹'}</div>
      <div class="item-details">
        <div class="item-name">${i.name}</div>
        <div class="item-price">${formatCurrency(i.price)}</div>
      </div>
      <div class="item-qty">
        <button onclick="updateCartQty('${i.productId}', -1)">−</button>
        <span>${i.qty}</span>
        <button onclick="updateCartQty('${i.productId}', 1)">+</button>
      </div>
      <button class="item-remove" onclick="removeCartItem('${i.productId}')">✕</button>
    </div>
  `).join('');

  if (totalEl) totalEl.textContent = formatCurrency(total);
  if (subtotalEl) subtotalEl.textContent = formatCurrency(total);
  if (countEl) countEl.textContent = count;
}

function goToPayment() {
  if (cart.length === 0) { showToast('กรุณาเลือกสินค้าก่อน', 'warning'); return; }
  const session = Auth.getSession();
  const role = session?.role || 'owner';
  const base = getBasePath();
  window.location.href = base + role + '/payment.html';
}

/* ===== Payment ===== */
async function initPayment() {
  cart = JSON.parse(sessionStorage.getItem('pos_cart') || '[]');
  if (cart.length === 0) {
    const session = Auth.getSession();
    const role = session?.role;
    window.location.href = getBasePath() + (role === 'employee' ? 'employee' : 'owner') + '/pos.html';
    return;
  }
  renderPaymentSummary();

  document.querySelectorAll('.payment-method').forEach(m => {
    m.addEventListener('click', () => {
      document.querySelectorAll('.payment-method').forEach(pm => pm.classList.remove('active'));
      m.classList.add('active');
    });
  });

  const confirmBtn = document.getElementById('confirmPayment');
  if (confirmBtn) confirmBtn.addEventListener('click', processPayment);
}

function renderPaymentSummary() {
  const listEl = document.getElementById('paymentItems');
  const totalEl = document.getElementById('paymentTotal');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  if (listEl) listEl.innerHTML = cart.map(i => `
    <div class="order-item-row">
      <span>${i.emoji || ''} ${i.name} × ${i.qty}</span>
      <strong>${formatCurrency(i.price * i.qty)}</strong>
    </div>
  `).join('');

  if (totalEl) totalEl.textContent = formatCurrency(total);
}

async function processPayment() {
  const method = document.querySelector('.payment-method.active');
  if (!method) { showToast('กรุณาเลือกวิธีชำระเงิน', 'warning'); return; }

  const btn = document.getElementById('confirmPayment');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const paymentType = method.dataset.method;

  if (paymentType === 'promptpay' && btn.dataset.step !== 'pay') {
    btn.disabled = true; btn.textContent = 'กำลังโหลด...';
    const promptpayNo = await DataStore.getSetting('promptpay_number');
    if (!promptpayNo) {
      showToast('คุณยังไม่ได้ตั้งค่าเบอร์พร้อมเพย์ (แจ้งเจ้าของร้าน)', 'error');
      btn.disabled = false; btn.textContent = '✅ ยืนยันชำระเงิน';
      return;
    }

    // ใช้ API จาก promptpay.io โดยไม่ระบุจำนวนเงินเพื่อให้ลูกค้าพิมพ์เอง
    document.getElementById('qrCanvas').innerHTML = `<img src="https://promptpay.io/${promptpayNo}.png" style="width:220px;height:220px;display:block;margin:0 auto;" alt="PromptPay QR">`;

    document.getElementById('qrAmount').textContent = 'สแกนแล้วระบุยอด: ' + formatCurrency(total);
    document.getElementById('qrPromptpayId').textContent = 'พร้อมเพย์: ' + promptpayNo;

    document.getElementById('promptpayQR').style.display = 'block';

    const methodsDiv = document.querySelector('.payment-methods');
    if (methodsDiv && methodsDiv.parentElement) methodsDiv.parentElement.style.display = 'none';

    btn.dataset.step = 'pay';
    btn.disabled = false;
    btn.textContent = '✅ ตรวจสอบการชำระเงินสำเร็จ (บันทึก)';
    return;
  }

  try {
    const user = await Auth.getCurrentUser();
    if (!user) {
      showToast('ไม่สามารถตรวจสอบตัวตนได้ กรุณาล็อกอินใหม่', 'error');
      setTimeout(() => Auth.logout(), 2000);
      return;
    }

    const order = await DataStore.addOrder({
      items: JSON.parse(JSON.stringify(cart)),
      total,
      paymentMethod: paymentType,
      status: 'pending',
      employeeId: user.id,
      customerId: null
    });

    if (!order) {
      showToast('เกิดข้อผิดพลาดในการบันทึกออเดอร์ กรุณาลองใหม่', 'error');
      btn.disabled = false;
      btn.textContent = '✅ ยืนยันชำระเงิน';
      return;
    }

    cart = [];
    sessionStorage.removeItem('pos_cart');
    showToast(`ชำระเงินสำเร็จ! #${order.id}`, 'success');


    const session = Auth.getSession();
    const role = session?.role || 'owner';

    document.getElementById('paymentSection').innerHTML = `
    <div class="card card-body text-center animate-scale-in" style="padding:3rem">
      <div style="font-size:4rem;margin-bottom:1rem">✅</div>
      <h2 style="color:var(--success);margin-bottom:.5rem">ชำระเงินสำเร็จ</h2>
      <p style="color:var(--text-secondary)">หมายเลขออเดอร์: <strong>${order.id}</strong></p>
      <p style="font-size:var(--font-2xl);font-weight:700;color:var(--primary);margin:1rem 0">${formatCurrency(total)}</p>
      <p style="color:var(--text-secondary)">ชำระโดย: ${paymentMethodLabel(order.paymentMethod || order.payment_method)}</p>
      <div style="margin-top:2rem;display:flex;gap:1rem;justify-content:center">
        <a href="${getBasePath()}${role}/pos.html" class="btn btn-primary">🛒 ขายต่อ</a>
        <a href="${getBasePath()}${role === 'employee' ? 'employee' : 'owner'}/orders.html" class="btn btn-outline">📋 ดูประวัติ</a>
      </div>
    </div>
  `;
  } catch (err) {
    console.error('Process Payment Error:', err);
    showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    btn.disabled = false;
    btn.textContent = '✅ ยืนยันชำระเงิน';
  }
}

/* ===== Orders ===== */
let orderProfilesCache = {};

async function initOrders() {
  const users = await DataStore.getUsers();
  users.forEach(u => orderProfilesCache[u.id] = u.name);

  const empFilter = document.getElementById('orderEmployee');
  if (empFilter) {
    const employees = users.filter(u => u.role === 'employee');
    empFilter.innerHTML = `<option value="">พนักงานทั้งหมด</option>` + employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
    empFilter.addEventListener('change', () => renderOrdersTable());
  }

  await renderOrdersTable();
  const search = document.getElementById('orderSearch');
  if (search) search.addEventListener('input', debounce(() => renderOrdersTable()));
  const statusFilter = document.getElementById('orderStatus');
  if (statusFilter) statusFilter.addEventListener('change', () => renderOrdersTable());
}

async function renderOrdersTable() {
  let orders = await DataStore.getOrders();
  const search = document.getElementById('orderSearch')?.value?.toLowerCase();
  const status = document.getElementById('orderStatus')?.value;
  const empId = document.getElementById('orderEmployee')?.value;

  if (search) orders = orders.filter(o => o.id.toLowerCase().includes(search) || o.items.some(i => i.name.toLowerCase().includes(search)));
  if (status) orders = orders.filter(o => o.status === status);
  if (empId) orders = orders.filter(o => (o.employeeId || o.employee_id) === empId);

  const tbody = document.getElementById('ordersBody');
  tbody.innerHTML = orders.map(o => {
    let customerStr = '';
    const cId = o.customerId || o.customer_id;
    if (cId) customerStr = `<br><span style="font-size:var(--font-xs);color:var(--primary)">ลูกค้า: ${orderProfilesCache[cId] || 'ลูกค้าทั่วไป'}</span>`;

    let empStr = '';
    const eId = o.employeeId || o.employee_id;
    if (eId) empStr = `<br><span style="font-size:var(--font-xs);color:var(--text-muted)">พนักงาน: ${orderProfilesCache[eId] || 'ผู้ดูแลระบบ'}</span>`;

    return `
    <tr>
      <td><strong>${o.id}</strong>${customerStr}${empStr}</td>
      <td>${o.items.map(i => `${i.emoji || ''} ${i.name} ×${i.qty}`).join('<br>')}</td>
      <td>${formatCurrency(o.total)}</td>
      <td>${paymentMethodLabel(o.payment_method || o.paymentMethod)}</td>
      <td>
        <select class="form-select" style="padding:.25rem .5rem; font-size:var(--font-sm); border-radius: var(--radius-sm); border-color: var(--border); width: 130px" onchange="changeOrderStatus('${o.id}', this.value)">
          <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>⏳ รอคิว</option>
          <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>✅ เสร็จสิ้น</option>
          <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>❌ ยกเลิก</option>
        </select>
      </td>
      <td>${formatDate(o.createdAt)}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="openReceiptModal('${o.id}')">🧾 ดูบิล</button>
      </td>
    </tr>
    `;
  }).join('');

  const totalEl = document.getElementById('ordersTotal');
  if (totalEl) totalEl.textContent = orders.length;
  const revenueEl = document.getElementById('ordersRevenue');
  if (revenueEl) revenueEl.textContent = formatCurrency(orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0));
}

async function changeOrderStatus(id, newStatus) {
  await DataStore.updateOrder(id, { status: newStatus });
  showToast(`อัปเดตสถานะออเดอร์ #${id} สำเร็จ`, 'success');
  renderOrdersTable();
}

/* ===== Products Management ===== */
async function initProducts() {
  await renderProductsTable();
  const search = document.getElementById('productSearch');
  if (search) search.addEventListener('input', debounce(() => renderProductsTable()));
}

async function renderProductsTable() {
  let products = await DataStore.getProducts();
  const search = document.getElementById('productSearch')?.value?.toLowerCase();
  if (search) products = products.filter(p => p.name.toLowerCase().includes(search));

  const tbody = document.getElementById('productsBody');
  tbody.innerHTML = products.map(p => `
    <tr>
      <td>${p.emoji || '🍹'}</td>
      <td><strong>${p.name}</strong><br><small style="color:var(--text-muted)">${p.description || ''}</small></td>
      <td><span class="badge badge-primary">${p.category}</span></td>
      <td><strong>${formatCurrency(p.price)}</strong></td>
      <td>${p.status === 'active' ? '<span class="badge badge-success">ขายอยู่</span>' : '<span class="badge badge-danger">ปิด</span>'}</td>
      <td class="actions">
        <button class="btn btn-sm btn-outline" onclick="editProduct('${p.id}')">✏️ แก้ไข</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function openProductModal(product) {
  if (typeof product === 'string') product = null; // called without args
  const modal = document.getElementById('productModal');
  document.getElementById('modalTitle').textContent = product ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่';
  document.getElementById('pName').value = product?.name || '';
  document.getElementById('pPrice').value = product?.price || '';
  document.getElementById('pCategory').value = product?.category || 'ผลไม้ปั่น';
  document.getElementById('pEmoji').value = product?.emoji || '🍹';
  document.getElementById('pDesc').value = product?.description || '';
  document.getElementById('pStatus').value = product?.status || 'active';
  document.getElementById('productForm').dataset.editId = product?.id || '';
  modal.classList.add('active');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
}

async function editProduct(id) {
  const product = await DataStore.getProduct(id);
  openProductModal(product);
}

async function saveProduct() {
  const form = document.getElementById('productForm');
  const data = {
    name: document.getElementById('pName').value.trim(),
    price: parseInt(document.getElementById('pPrice').value),
    category: document.getElementById('pCategory').value,
    emoji: document.getElementById('pEmoji').value,
    desc: document.getElementById('pDesc').value.trim(),
    status: document.getElementById('pStatus').value
  };
  if (!data.name || !data.price) { showToast('กรุณากรอกข้อมูลให้ครบ', 'error'); return; }
  const editId = form.dataset.editId;
  if (editId) { await DataStore.updateProduct(editId, data); showToast('แก้ไขสินค้าสำเร็จ', 'success'); }
  else { await DataStore.addProduct(data); showToast('เพิ่มสินค้าสำเร็จ', 'success'); }
  closeProductModal();
  await renderProductsTable();
}

async function deleteProduct(id) {
  if (!confirm('ต้องการลบสินค้านี้?')) return;
  await DataStore.deleteProduct(id);
  showToast('ลบสินค้าแล้ว', 'success');
  await renderProductsTable();
}

/* ===== Employee Management ===== */
async function initEmployees() {
  await renderEmployeesTable();
  const search = document.getElementById('employeeSearch');
  if (search) search.addEventListener('input', debounce(() => renderEmployeesTable()));
}

async function renderEmployeesTable() {
  const users = await DataStore.getUsers();
  let employees = users.filter(u => u.role === 'employee');

  const search = document.getElementById('employeeSearch')?.value?.toLowerCase();
  if (search) {
    employees = employees.filter(e =>
      e.name.toLowerCase().includes(search) ||
      e.username.toLowerCase().includes(search) ||
      (e.email || '').toLowerCase().includes(search) ||
      (e.phone || '').toLowerCase().includes(search)
    );
  }

  const tbody = document.getElementById('employeesBody');
  tbody.innerHTML = employees.map(e => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:.75rem">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary-light),var(--secondary));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:.85rem">${getInitials(e.name)}</div>
          <div><strong>${e.name}</strong><br><small style="color:var(--text-muted)">@${e.username}</small></div>
        </div>
      </td>
      <td>${e.email || '-'}</td>
      <td>${e.phone || '-'}</td>
      <td>${formatDateShort(e.createdAt)}</td>
      <td class="actions">
        <div style="display:flex;gap:.5rem">
          <button class="btn btn-sm btn-outline" onclick='openEmployeeModal(${JSON.stringify(e).replace(/'/g, "&apos;")})'>✏️ แก้ไข</button>
          <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${e.id}')">🗑️ ลบ</button>
        </div>
      </td>
    </tr>
  `).join('');
  if (employees.length === 0) tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding:2rem">ยังไม่มีพนักงาน</td></tr>';
}

function openEmployeeModal(emp = null) {
  const modal = document.getElementById('employeeModal');
  const form = document.getElementById('empForm');
  const title = document.getElementById('empModalTitle');
  const passInput = document.getElementById('empPassword');
  const passHint = document.getElementById('passHint');

  form.reset();
  modal.classList.add('active');

  if (emp) {
    form.dataset.editId = emp.id;
    title.textContent = 'แก้ไขข้อมูลพนักงาน';
    document.getElementById('empName').value = emp.name;
    document.getElementById('empUsername').value = emp.username;
    document.getElementById('empEmail').value = emp.email || '';
    document.getElementById('empPhone').value = emp.phone || '';
    passInput.required = false;
    passHint.style.display = 'block';
  } else {
    form.dataset.editId = '';
    title.textContent = 'เพิ่มพนักงานใหม่';
    passInput.required = true;
    passHint.style.display = 'none';
  }
}
function closeEmployeeModal() { document.getElementById('employeeModal').classList.remove('active'); }

async function saveEmployee() {
  const form = document.getElementById('empForm');
  const editId = form.dataset.editId;
  const password = document.getElementById('empPassword').value;

  const data = {
    name: document.getElementById('empName').value.trim(),
    username: document.getElementById('empUsername').value.trim(),
    email: document.getElementById('empEmail').value.trim(),
    phone: document.getElementById('empPhone').value.trim(),
    role: 'employee'
  };

  if (password) data.password = password;

  if (!data.name || !data.username || (!editId && !password)) {
    showToast('กรุณากรอกข้อมูลให้ครบ', 'error'); return;
  }

  if (editId) {
    await DataStore.updateUser(editId, data);
    showToast('แก้ไขข้อมูลพนักงานสำเร็จ', 'success');
  } else {
    const existing = await DataStore.getUserByUsername(data.username);
    if (existing) { showToast('ชื่อผู้ใช้นี้ถูกใช้แล้ว', 'error'); return; }
    await DataStore.addUser(data);
    showToast('เพิ่มพนักงานสำเร็จ', 'success');
  }

  closeEmployeeModal();
  await renderEmployeesTable();
}

async function deleteEmployee(id) {
  if (!confirm('ต้องการลบพนักงานนี้?')) return;
  await DataStore.deleteUser(id);
  showToast('ลบพนักงานแล้ว', 'success');
  await renderEmployeesTable();
}

/* ===== Profile ===== */
async function initProfile() {
  const user = await Auth.getCurrentUser();
  if (!user) return;
  document.getElementById('profName').value = user.name || '';
  document.getElementById('profEmail').value = user.email || '';
  document.getElementById('profPhone').value = user.phone || '';
  document.getElementById('profUsername').value = user.username || '';

  const avatarEl = document.getElementById('profAvatar');
  if (avatarEl) avatarEl.textContent = getInitials(user.name);

  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
    const data = {
      name: document.getElementById('profName').value.trim(),
      email: document.getElementById('profEmail').value.trim(),
      phone: document.getElementById('profPhone').value.trim(),
    };
    const newPass = document.getElementById('profNewPass')?.value;
    if (newPass) data.password = newPass;
    await DataStore.updateUser(user.id, data);
    showToast('บันทึกข้อมูลสำเร็จ', 'success');
    setTimeout(() => location.reload(), 800);
  });

  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    const pno = document.getElementById('settingPromptpay');
    const sname = document.getElementById('settingShopName');
    const sphone = document.getElementById('settingShopPhone');

    DataStore.getSetting('promptpay_number').then(v => { if (pno) pno.value = v; });
    DataStore.getSetting('shop_name').then(v => { if (sname) sname.value = v || 'ป้าณาน้ำผลไม้ปั่น'; });
    DataStore.getSetting('shop_phone').then(v => { if (sphone) sphone.value = v; });

    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
      if (pno) await DataStore.setSetting('promptpay_number', pno.value);
      if (sname) await DataStore.setSetting('shop_name', sname.value);
      if (sphone) await DataStore.setSetting('shop_phone', sphone.value);
      showToast('บันทึกการตั้งค่าสำเร็จ', 'success');
      btn.disabled = false; btn.textContent = '💾 บันทึกการตั้งค่า';
    });
  }
}

/* ===== Customer Menu ===== */
let customerCart = [];
let menuProductsCache = [];

async function initCustomerMenu() {
  customerCart = JSON.parse(sessionStorage.getItem('customer_cart') || '[]');
  menuProductsCache = await DataStore.getProducts();
  renderCustomerMenu();
  renderCustomerCart();

  const methods = document.querySelectorAll('#custPaymentMethods .payment-method');
  methods.forEach(m => {
    m.addEventListener('click', () => {
      methods.forEach(pm => pm.classList.remove('active'));
      m.classList.add('active');
    });
  });
}

function renderCustomerMenu() {
  const products = menuProductsCache.filter(p => p.status === 'active');
  const grid = document.getElementById('menuGrid');
  grid.innerHTML = products.map(p => `
    <div class="card menu-item animate-fade-in">
      <div class="menu-img">${p.emoji || '🍹'}</div>
      <div class="menu-info">
        <div class="menu-name">${p.name}</div>
        <div class="menu-desc">${p.description || ''}</div>
        <div class="menu-bottom">
          <span class="menu-price">${formatCurrency(p.price)}</span>
          <button class="btn btn-sm btn-primary" onclick="addToCustomerCart('${p.id}')">+ เพิ่ม</button>
        </div>
      </div>
    </div>
  `).join('');
}

function addToCustomerCart(productId) {
  const product = menuProductsCache.find(p => p.id === productId);
  if (!product) return;
  const existing = customerCart.find(i => i.productId === productId);
  if (existing) existing.qty++;
  else customerCart.push({ productId, name: product.name, price: product.price, qty: 1, emoji: product.emoji });
  sessionStorage.setItem('customer_cart', JSON.stringify(customerCart));
  renderCustomerCart();
  showToast(`เพิ่ม ${product.name} แล้ว`, 'success');
}

function updateCustomerQty(productId, delta) {
  const item = customerCart.find(i => i.productId === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) customerCart = customerCart.filter(i => i.productId !== productId);
  sessionStorage.setItem('customer_cart', JSON.stringify(customerCart));
  renderCustomerCart();
}

function removeCustomerItem(productId) {
  customerCart = customerCart.filter(i => i.productId !== productId);
  sessionStorage.setItem('customer_cart', JSON.stringify(customerCart));
  renderCustomerCart();
}

function renderCustomerCart() {
  const panel = document.getElementById('customerCartPanel');
  if (!panel) return;
  const total = customerCart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = customerCart.reduce((s, i) => s + i.qty, 0);

  const countEl = document.getElementById('custCartCount');
  if (countEl) countEl.textContent = count;

  const itemsEl = document.getElementById('custCartItems');
  if (customerCart.length === 0) {
    itemsEl.innerHTML = '<p class="text-center text-muted" style="padding:1rem">ยังไม่มีสินค้า</p>';
  } else {
    itemsEl.innerHTML = customerCart.map(i => `
      <div class="cart-item">
        <div class="item-img">${i.emoji || '🍹'}</div>
        <div class="item-details">
          <div class="item-name">${i.name}</div>
          <div class="item-price">${formatCurrency(i.price)}</div>
        </div>
        <div class="item-qty">
          <button onclick="updateCustomerQty('${i.productId}',-1)">−</button>
          <span>${i.qty}</span>
          <button onclick="updateCustomerQty('${i.productId}',1)">+</button>
        </div>
        <button class="item-remove" onclick="removeCustomerItem('${i.productId}')">✕</button>
      </div>
    `).join('');
  }

  const totalEl = document.getElementById('custCartTotal');
  if (totalEl) totalEl.textContent = formatCurrency(total);
}

async function placeCustomerOrder() {
  if (customerCart.length === 0) { showToast('กรุณาเลือกสินค้าก่อน', 'warning'); return; }

  const activeMethod = document.querySelector('#custPaymentMethods .payment-method.active');
  const paymentMethod = activeMethod ? activeMethod.dataset.method : 'cash';
  const total = customerCart.reduce((s, i) => s + i.price * i.qty, 0);

  if (paymentMethod === 'promptpay') {
    const promptpayNo = await DataStore.getSetting('promptpay_number');
    if (!promptpayNo) {
      showToast('เบอร์พร้อมเพย์ของร้านยังไม่ถูกตั้งค่า', 'error');
      return;
    }
    document.getElementById('custQrCanvas').innerHTML = `<img src="https://promptpay.io/${promptpayNo}.png" style="width:220px;height:220px;display:block;margin:0 auto;" alt="PromptPay QR">`;
    document.getElementById('custQrAmount').textContent = 'สแกนแล้วระบุยอด: ' + formatCurrency(total);
    document.getElementById('custQrPromptpayId').textContent = 'พร้อมเพย์: ' + promptpayNo;
    document.getElementById('custPromptpayModal').classList.add('active');
    return;
  }

  await executeCustomerOrder('cash');
}

async function confirmCustPromptpayOrder() {
  const btn = document.querySelector('#custPromptpayModal .btn-primary');
  btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
  await executeCustomerOrder('promptpay');
  closeCustPromptpayModal();
  btn.disabled = false; btn.textContent = '✅ โอนเรียบร้อย บันทึกออเดอร์';
}

function closeCustPromptpayModal() {
  document.getElementById('custPromptpayModal').classList.remove('active');
}

async function executeCustomerOrder(paymentMethod) {
  const user = await Auth.getCurrentUser();
  const total = customerCart.reduce((s, i) => s + i.price * i.qty, 0);
  const order = await DataStore.addOrder({
    items: customerCart.map(i => ({ ...i })),
    total,
    paymentMethod,
    status: 'pending',
    customerId: user.id,
    employeeId: null
  });

  if (!order) { showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error'); return; }
  customerCart = [];
  sessionStorage.removeItem('customer_cart');
  renderCustomerCart();
  showToast(`สั่งซื้อสำเร็จ! #${order.id}`, 'success');
  renderCustomerMenu();
}


/* ===== Customer Orders ===== */
async function initCustomerOrders() {
  const user = await Auth.getCurrentUser();
  const allOrders = await DataStore.getOrders();
  const orders = allOrders.filter(o => o.customer_id === user.id);
  const container = document.getElementById('customerOrdersList');
  if (orders.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><h3>ยังไม่มีประวัติการสั่งซื้อ</h3><p>สั่งซื้อสินค้ากันเลย!</p></div>';
    return;
  }
  container.innerHTML = orders.map(o => `
    <div class="card order-detail-card animate-fade-in" style="margin-bottom:1rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <strong>${o.id}</strong>
        ${statusBadge(o.status)}
      </div>
      <div class="order-items-list">
        ${o.items.map(i => `<div class="order-item-row"><span>${i.emoji || ''} ${i.name} × ${i.qty}</span><span>${formatCurrency(i.price * i.qty)}</span></div>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.75rem;padding-top:.75rem;border-top:2px solid var(--border-light)">
        <div style="display:flex;flex-direction:column;gap:.25rem">
          <span style="color:var(--text-secondary);font-size:.85rem">${formatDate(o.createdAt)}</span>
          <strong style="font-size:1.1rem;color:var(--primary)">${formatCurrency(o.total)}</strong>
        </div>
        <button class="btn btn-sm btn-outline" onclick="openReceiptModal('${o.id}')">🧾 ดูบิล</button>
      </div>
    </div>
  `).join('');
}

/* ===== PromptPay Utilities ===== */
function generatePromptPay(id, amount) {
  id = id.replace(/[^0-9]/g, '');
  let accType = (id.length === 13) ? '0213' : '0113';
  if (id.length === 10) id = '0066' + id.slice(1);

  let data = [
    '000201', '010212',
    '29370016A000000677010111' + accType + id,
    '5802TH', '5303764'
  ];

  if (amount) {
    let amt = Number(amount).toFixed(2).toString();
    data.push('54' + ('00' + amt.length).slice(-2) + amt);
  }

  data.push('6304');
  let str = data.join('');
  return str + crc16(str).toString(16).toUpperCase().padStart(4, '0');
}

function crc16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000)) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
    }
  }
  return crc & 0xFFFF;
}

/* ===== Receipt System ===== */
async function openReceiptModal(orderId) {
  const order = await DataStore.getOrder(orderId);
  if (!order) return;
  const shopName = await DataStore.getSetting('shop_name') || 'ป้าณาน้ำผลไม้ปั่น';
  const shopPhone = await DataStore.getSetting('shop_phone') || '';

  const content = document.getElementById('receiptContent') || document.getElementById('receiptPaper');
  if (!content) return;
  content.innerHTML = `
    <div id="receiptPaper" style="padding:2rem;background:#fff;color:#333;font-family:'Prompt', sans-serif;text-align:center">
      <div style="font-size:1.5rem;font-weight:bold;margin-bottom:.5rem">${shopName}</div>
      ${shopPhone ? `<div style="font-size:.9rem;margin-bottom:1rem;color:#666">เบอร์โทร: ${shopPhone}</div>` : ''}
      <div style="font-size:.9rem;border-bottom:1px dashed #ccc;padding-bottom:.5rem;margin-bottom:.5rem;display:flex;justify-content:space-between">
        <span style="font-weight:600">ใบเสร็จรับเงิน</span>
        <span style="color:#666">${formatDate(order.createdAt)}</span>
      </div>
      <div style="font-size:.9rem;text-align:left;margin-bottom:1rem;color:#666">
        ออเดอร์: <span style="font-weight:600;color:#333">#${order.id}</span>
      </div>
      <div style="text-align:left;font-size:.9rem;margin-bottom:1rem">
        <table style="width:100%;border-collapse:collapse">
          ${order.items.map(i => `
            <tr>
              <td style="padding:4px 0">${i.name}</td>
              <td style="text-align:center;color:#666">x${i.qty}</td>
              <td style="text-align:right">${(i.price * i.qty).toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
      </div>
      <div style="border-top:1px dashed #ccc;padding-top:.5rem;display:flex;justify-content:space-between;font-weight:bold;font-size:1.1rem">
        <span>ยอดรวมทั้งสิ้น</span>
        <span>฿${order.total.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:.9rem;margin-top:.5rem;border-top:1px dashed #ccc;padding-top:.5rem">
        <span style="color:#666">ชำระโดย:</span>
        <span style="font-weight:600">${paymentMethodLabel(order.payment_method || order.paymentMethod)}</span>
      </div>
      <div style="margin-top:2rem;font-size:.85rem;color:#666">
        ขอบคุณที่อุดหนุน<br>โอกาสหน้าเชิญใหม่ครับ/ค่ะ
      </div>
    </div>
  `;
  document.getElementById('receiptModal').classList.add('active');
}

function closeReceiptModal() {
  document.getElementById('receiptModal').classList.remove('active');
}

function printReceipt() {
  const content = document.getElementById('receiptPaper').innerHTML;
  const win = window.open('', '_blank');
  win.document.write(`<html><head><title>Print Receipt</title><style>@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;600&display=swap');body{font-family:'Prompt',sans-serif;margin:0}</style></head><body onload="window.print();window.close()">${content}</body></html>`);
  win.document.close();
}

function downloadReceipt() {
  const rect = document.getElementById('receiptPaper');
  if (!rect) return;
  html2canvas(rect, { scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'receipt-' + Date.now() + '.png';
    link.href = canvas.toDataURL();
    link.click();
  });
}

/* ===== Owner Reports ===== */
async function initReports() {
  // Populate Years
  const yearSelect = document.getElementById('reportYear');
  if (yearSelect) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 3; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y + 543; // BE Year
      yearSelect.appendChild(opt);
    }
  }

  await renderReports('day');

  document.querySelectorAll('.report-period-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.report-period-btn').forEach(b => b.classList.remove('active'));
      const target = e.target.closest('.report-period-btn');
      target.classList.add('active');

      // Reset month select when using quick buttons
      const mSelect = document.getElementById('reportMonth');
      if (mSelect) mSelect.value = '';

      renderReports(target.dataset.mode);
    });
  });

  const onCustomChange = () => {
    document.querySelectorAll('.report-period-btn').forEach(b => b.classList.remove('active'));
    renderReports('custom');
  };

  document.getElementById('reportMonth')?.addEventListener('change', onCustomChange);
  document.getElementById('reportYear')?.addEventListener('change', onCustomChange);
}

async function renderReports(mode) {
  const allOrders = await DataStore.getOrders();
  const completedOrders = allOrders.filter(o => o.status === 'completed');

  let filteredOrders = completedOrders;
  const now = new Date();

  if (mode === 'day') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    filteredOrders = completedOrders.filter(o => new Date(o.createdAt) >= today);
  } else if (mode === 'month') {
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    filteredOrders = completedOrders.filter(o => new Date(o.createdAt) >= thisMonth);
  } else if (mode === 'year') {
    const thisYear = new Date(now.getFullYear(), 0, 1);
    filteredOrders = completedOrders.filter(o => new Date(o.createdAt) >= thisYear);
  } else if (mode === 'custom') {
    const m = document.getElementById('reportMonth').value;
    const y = document.getElementById('reportYear').value;
    filteredOrders = completedOrders.filter(o => {
      const d = new Date(o.createdAt);
      const matchYear = d.getFullYear() == y;
      const matchMonth = m === "" || d.getMonth() == m;
      return matchYear && matchMonth;
    });
  }

  // Aggregate Stats
  const revenue = filteredOrders.reduce((s, o) => s + o.total, 0);
  const orderCount = filteredOrders.length;
  let itemsSold = 0;

  const productSalesMap = {};

  filteredOrders.forEach(o => {
    o.items.forEach(i => {
      itemsSold += i.qty;
      if (!productSalesMap[i.productId]) {
        productSalesMap[i.productId] = { name: i.name, qty: 0, emoji: i.emoji };
      }
      productSalesMap[i.productId].qty += i.qty;
    });
  });

  document.getElementById('reportRevenue').textContent = formatCurrency(revenue);
  document.getElementById('reportOrders').textContent = orderCount;
  document.getElementById('reportItems').textContent = itemsSold;

  // Best & Least Selling
  const productsArray = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty);

  const bestEl = document.getElementById('reportBestSelling');
  const leastEl = document.getElementById('reportLeastSelling');

  if (productsArray.length > 0) {
    const best = productsArray[0];
    const least = productsArray[productsArray.length - 1];

    bestEl.innerHTML = `
      <div style="font-size:3rem;margin-bottom:.5rem">${best.emoji || '🍹'}</div>
      <h3 style="font-size:var(--font-xl)">${best.name}</h3>
      <p style="color:var(--text-secondary);margin-top:.5rem">ขายได้ ${best.qty} แก้ว</p>
    `;

    leastEl.innerHTML = `
      <div style="font-size:3rem;margin-bottom:.5rem">${least.emoji || '🧊'}</div>
      <h3 style="font-size:var(--font-xl)">${least.name}</h3>
      <p style="color:var(--text-secondary);margin-top:.5rem">ขายได้ ${least.qty} แก้ว</p>
    `;
  } else {
    bestEl.innerHTML = '<p class="text-muted" style="padding:2rem">ไม่มีข้อมูลในช่วงเวลานี้</p>';
    leastEl.innerHTML = '<p class="text-muted" style="padding:2rem">ไม่มีข้อมูลในช่วงเวลานี้</p>';
  }

  // Chart
  const top10 = productsArray.slice(0, 10);
  const chartData = top10.map(p => ({ label: p.name, value: p.qty }));
  const chartContainer = document.getElementById('productChartContainer');
  if (chartContainer) {
    chartContainer.innerHTML = '';
    renderBarChart(chartContainer, chartData);
  }
}

/* ===== Customers Management ===== */
async function initCustomers() {
  await renderCustomersTable();
  const search = document.getElementById('customerSearch');
  if (search) search.addEventListener('input', debounce(() => renderCustomersTable()));
}

async function renderCustomersTable() {
  let users = await DataStore.getUsers();
  let customers = users.filter(u => u.role === 'customer');

  const search = document.getElementById('customerSearch')?.value?.toLowerCase();
  if (search) {
    customers = customers.filter(c =>
      c.name.toLowerCase().includes(search) ||
      (c.email || '').toLowerCase().includes(search) ||
      (c.phone || '').toLowerCase().includes(search)
    );
  }

  const tbody = document.getElementById('customersBody');
  if (!tbody) return;

  tbody.innerHTML = customers.map(c => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:.5rem">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--primary-bg);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:600">${getInitials(c.name)}</div>
          <div>
            <strong>${c.name}</strong><br>
            <small style="color:var(--text-muted)">${c.username}</small>
          </div>
        </div>
      </td>
      <td>${c.email || '-'}</td>
      <td>${c.phone || '-'}</td>
      <td>${formatDateShort(c.createdAt)}</td>
      <td style="display:flex;gap:.25rem">
        <button class="btn btn-sm btn-outline" onclick="openCustomerOrdersModal('${c.id}', '${c.name.replace(/'/g, "\\'")}')" title="ดูประวัติ">📋</button>
        <button class="btn btn-sm btn-outline" onclick="openCustomerModal('${c.id}')" title="แก้ไข">✏️</button>
        <button class="btn btn-sm btn-outline btn-danger" onclick="deleteCustomer('${c.id}', '${c.name.replace(/'/g, "\\'")}')" title="ลบ">🗑️</button>
      </td>
    </tr>
  `).join('');
}

let allCustomersCache = [];
async function openCustomerModal(id = null) {
  const modal = document.getElementById('customerModal');
  if (!modal) return;
  const form = document.getElementById('custForm');
  form.reset();

  if (id) {
    const user = await DataStore.getUser(id);
    if (user) {
      document.querySelector('#customerModal h3').textContent = 'แก้ไขข้อมูลลูกค้า';
      document.getElementById('custId').value = user.id;
      document.getElementById('custName').value = user.name || '';
      document.getElementById('custUsername').value = user.username || '';
      document.getElementById('custUsername').readOnly = true;
      document.getElementById('custPassword').placeholder = 'เว้นว่างไว้หากไม่ต้องการเปลี่ยน';
      document.getElementById('custEmail').value = user.email || '';
      document.getElementById('custPhone').value = user.phone || '';
    }
  } else {
    document.querySelector('#customerModal h3').textContent = 'เพิ่มลูกค้าใหม่';
    document.getElementById('custId').value = '';
    document.getElementById('custUsername').readOnly = false;
    document.getElementById('custUsername').placeholder = 'สำหรับเข้าสู่ระบบ';
    document.getElementById('custPassword').placeholder = 'ตั้งรหัสผ่าน';
  }
  modal.classList.add('active');
}

function closeCustomerModal() {
  const modal = document.getElementById('customerModal');
  if (modal) modal.classList.remove('active');
}

async function saveCustomer() {
  const id = document.getElementById('custId').value;
  const name = document.getElementById('custName').value.trim();
  const username = document.getElementById('custUsername').value.trim();
  const password = document.getElementById('custPassword').value;
  const email = document.getElementById('custEmail').value.trim();
  const phone = document.getElementById('custPhone').value.trim();

  if (!name || (!id && (!username || !password))) {
    showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
    return;
  }

  const btn = document.querySelector('#customerModal .btn-primary');
  btn.disabled = true; btn.textContent = 'กำลังบันทึก...';

  if (id) {
    // Update
    const updates = { name, email, phone };
    if (password) updates.password = password;
    await DataStore.updateUser(id, updates);
    showToast('อัปเดตข้อมูลลูกค้าสำเร็จ', 'success');
  } else {
    // Add
    const existing = await DataStore.getUserByUsername(username);
    if (existing) {
      showToast('ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว', 'error');
      btn.disabled = false; btn.textContent = '💾 บันทึก';
      return;
    }
    await DataStore.addUser({ name, username, password, email, phone, role: 'customer' });
    showToast('เพิ่มลูกค้าใหม่สำเร็จ', 'success');
  }

  closeCustomerModal();
  renderCustomersTable();
  btn.disabled = false; btn.textContent = '💾 บันทึก';
}

async function deleteCustomer(id, name) {
  if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีคุณ ${name}?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;

  await DataStore.deleteUser(id);
  showToast(`ลบบัญชีคุณ ${name} สำเร็จ`, 'success');
  renderCustomersTable();
}

async function openCustomerOrdersModal(customerId, customerName) {
  const modal = document.getElementById('customerOrdersModal');
  if (!modal) return;

  document.getElementById('custOrdersName').textContent = customerName;

  const allOrders = await DataStore.getOrders();
  const orders = allOrders.filter(o => (o.customerId || o.customer_id) === customerId);

  const tbody = document.getElementById('custOrdersBody');
  const emptyState = document.getElementById('custOrdersEmpty');

  if (orders.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>${o.items.map(i => `${i.emoji || ''} ${i.name} ×${i.qty}`).join('<br>')}</td>
        <td>${formatCurrency(o.total)}</td>
      <td>${paymentMethodLabel(o.payment_method || o.paymentMethod)}</td>
      <td>${formatDate(o.createdAt)}</td>
        <td>${statusBadge(o.status)}</td>
      </tr>
    `).join('');
  }

  modal.classList.add('active');
}

function closeCustomerOrdersModal() {
  const modal = document.getElementById('customerOrdersModal');
  if (modal) modal.classList.remove('active');
}

/* ===== Realtime Notifications ===== */
function initRealtimeNotifications() {
  db.channel('public:orders')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
      const order = payload.new;
      // Show notification
      showToast(`🏮 มีออเดอร์ใหม่ #${order.id}! ยอดรวม ${formatCurrency(order.total)}`, 'info');

      // Play sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audio.play().catch(e => console.warn('Audio play blocked:', e));
      } catch (e) { }

      // Auto refresh if on relevant page
      const page = window.location.pathname.split('/').pop() || 'index.html';
      const dir = window.location.pathname.split('/').slice(-2, -1)[0];

      if (page === 'dashboard.html') {
        if (dir === 'owner') initOwnerDashboard();
        else if (dir === 'employee') initEmployeeDashboard();
      } else if (page === 'orders.html') {
        if (typeof renderOrdersTable === 'function') renderOrdersTable();
      }
    })
    .subscribe();
}



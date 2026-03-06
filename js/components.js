/* ===== ป้าณาน้ำผลไม้ปั่น — UI Component Manager ===== */

/**
 * Renders the Unified Sidebar Layout
 */
async function renderSidebar() {
  const containerEl = document.getElementById('app-container') || document.body;

  // Wrap existing content if not already wrapped
  let mainContent = document.querySelector('.main-content');
  if (!document.querySelector('.app-container')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'app-container';
    // Move all children of body into wrapper except scripts/toasts
    Array.from(document.body.childNodes).forEach(node => {
      if (node.tagName !== 'SCRIPT' && !node.classList?.contains('toast-container')) {
        wrapper.appendChild(node);
      }
    });
    document.body.insertBefore(wrapper, document.body.firstChild);
    // Re-query mainContent after wrapping
    mainContent = document.querySelector('.main-content');
  }

  const user = await Auth.getCurrentUser();
  if (!user) return;

  const base = getBasePath();
  const role = user.role;
  const current = window.location.pathname.split('/').pop() || 'dashboard.html';

  // Dynamic Menu Links based on Role
  let dropdownLinks = '';
  if (role === 'customer') {
    dropdownLinks = `
      <div class="menu-label">🛒 คำสั่งซื้อ</div>
      <a href="${base}customer/menu.html" class="sidebar-nav-link ${current === 'menu.html' ? 'active' : ''}">🥤 สั่งเครื่องดื่ม</a>
      <a href="${base}customer/orders.html" class="sidebar-nav-link ${current === 'orders.html' ? 'active' : ''}">📋 ประวัติการสั่งซื้อ</a>
      <div class="menu-label">👤 บัญชี</div>
      <a href="${base}customer/profile.html" class="sidebar-nav-link ${current === 'profile.html' ? 'active' : ''}">⚙️ แก้ไขข้อมูลส่วนตัว</a>
    `;
  } else if (role === 'owner') {
    dropdownLinks = `
      <div class="menu-label">📊 ภาพรวม & สถิติ</div>
      <a href="${base}owner/dashboard.html" class="sidebar-nav-link ${current === 'dashboard.html' ? 'active' : ''}">📈 แดชบอร์ด</a>
      <a href="${base}owner/pos.html" class="sidebar-nav-link ${current === 'pos.html' ? 'active' : ''}">🛒 ขายสินค้า (POS)</a>
      <a href="${base}owner/orders.html" class="sidebar-nav-link ${current === 'orders.html' ? 'active' : ''}">🧾 รายการออเดอร์</a>
      <a href="${base}owner/reports.html" class="sidebar-nav-link ${current === 'reports.html' ? 'active' : ''}">💹 สรุปยอดขาย</a>
      <div class="menu-label">🛠️ จัดการระบบ</div>
      <a href="${base}owner/products.html" class="sidebar-nav-link ${current === 'products.html' ? 'active' : ''}">🍹 จัดการสินค้า</a>
      <a href="${base}owner/employees.html" class="sidebar-nav-link ${current === 'employees.html' ? 'active' : ''}">👥 จัดการพนักงาน</a>
      <a href="${base}owner/customers.html" class="sidebar-nav-link ${current === 'customers.html' ? 'active' : ''}">🤝 ข้อมูลลูกค้า</a>
      <div class="menu-label">👤 บัญชี</div>
      <a href="${base}owner/profile.html" class="sidebar-nav-link ${current === 'profile.html' ? 'active' : ''}">⚙️ การตั้งค่าส่วนตัว</a>
    `;
  } else { // Employee
    dropdownLinks = `
      <div class="menu-label">🛒 งานปัจจุบัน</div>
      <a href="${base}employee/dashboard.html" class="sidebar-nav-link ${current === 'dashboard.html' ? 'active' : ''}">📈 หน้าแรก</a>
      <a href="${base}employee/pos.html" class="sidebar-nav-link ${current === 'pos.html' ? 'active' : ''}">🛒 ขายสินค้า (POS)</a>
      <a href="${base}employee/orders.html" class="sidebar-nav-link ${current === 'orders.html' ? 'active' : ''}">🧾 ดูออเดอร์ทั้งหมด</a>
      <div class="menu-label">👥 บริการ</div>
      <a href="${base}employee/customers.html" class="sidebar-nav-link ${current === 'customers.html' ? 'active' : ''}">🤝 ข้อมูลลูกค้า</a>
      <div class="menu-label">👤 บัญชี</div>
      <a href="${base}employee/profile.html" class="sidebar-nav-link ${current === 'profile.html' ? 'active' : ''}">⚙️ โปรไฟล์ของฉัน</a>
    `;
  }

  // Create Sidebar
  const sidebar = document.createElement('aside');
  sidebar.className = 'app-sidebar';
  sidebar.id = 'appSidebar';

  sidebar.innerHTML = `
    <a href="${base}${role}/dashboard.html" class="sidebar-brand">
      <span class="sidebar-emoji">🍹</span>
      <div class="sidebar-brand-text">
        <span>ป้าณาน้ำผลไม้ปั่น</span>
      </div>
    </a>
    
    <div class="sidebar-user">
      <div class="sidebar-avatar">${getInitials(user.name)}</div>
      <div class="sidebar-user-info">
        <strong>คุณ${user.name.split(' ')[0]}</strong>
        <p>${role === 'owner' ? 'Admin' : role === 'employee' ? 'Staff' : 'Member'}</p>
      </div>
    </div>
    
    <nav class="sidebar-menu">
      ${dropdownLinks}
    </nav>
    
    <div class="sidebar-logout">
      <a href="#" onclick="Auth.logout();return false">🚪 ออกจากระบบ</a>
    </div>
  `;

  // Create Mobile Toggle
  const toggleBtn = document.createElement('div');
  toggleBtn.className = 'mobile-menu-toggle';
  toggleBtn.id = 'mobileMenuToggle';
  toggleBtn.innerHTML = '☰';

  // Clean up old elements if they exist
  const oldHeader = document.getElementById('header');
  if (oldHeader) oldHeader.remove(); // Remove old header element
  const oldHeaderTag = document.querySelector('.app-header');
  if (oldHeaderTag) oldHeaderTag.remove();

  // Prepend to app-container
  const appContainer = document.querySelector('.app-container');
  if (appContainer) {
    appContainer.insertBefore(sidebar, appContainer.firstChild);
    appContainer.appendChild(toggleBtn);
  }

  // Setup Mobile Toggle Logic
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('open');
    let overlay = document.getElementById('sidebarOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay active';
      overlay.id = 'sidebarOverlay';
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
      document.body.appendChild(overlay);
    } else {
      overlay.classList.toggle('active');
    }
  });
}

/**
 * Unified Mobile Cart Toggle for BOTH POS and Customer Menu
 */
function initMobileCartToggle() {
  const isMobile = window.innerWidth <= 767;
  if (!isMobile) return;

  // Watch for any .cart-header (handles both POS and Customer)
  document.addEventListener('click', (e) => {
    const header = e.target.closest('.cart-header');
    if (!header) return;

    // Ignore if clicking internal buttons like "Clear Cart"
    if (e.target.closest('button')) return;

    const panel = header.closest('.cart-panel') || document.getElementById('customerCartPanel');
    if (panel) {
      panel.classList.toggle('open');
      // Prevent page scrolling when cart is open as full sheet
      if (panel.classList.contains('open')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  });
}

function renderFooter() {
  const footerEl = document.getElementById('footer');
  if (!footerEl) return;
  footerEl.innerHTML = '';
}

async function initComponents() {
  await renderSidebar();
  renderFooter();
  // Init features after a short tick to ensure DOM is ready
  setTimeout(() => {
    initMobileCartToggle();
  }, 150);
}

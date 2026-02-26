/* ===== Data Store — Supabase CRUD ===== */
const DataStore = {

  /* ---- Products ---- */
  async getProducts() {
    const { data, error } = await db.from('products').select('*').order('created_at', { ascending: true });
    if (error) { console.error('getProducts:', error); return []; }
    return data;
  },

  async getProduct(id) {
    const { data, error } = await db.from('products').select('*').eq('id', id).single();
    if (error) { console.error('getProduct:', error); return null; }
    return data;
  },

  async addProduct(p) {
    const { data, error } = await db.from('products').insert({
      name: p.name, price: p.price, category: p.category,
      emoji: p.emoji, description: p.desc || p.description || '', status: p.status || 'active'
    }).select().single();
    if (error) { console.error('addProduct:', error); return null; }
    return data;
  },

  async updateProduct(id, updates) {
    const payload = { ...updates };
    if (payload.desc !== undefined) { payload.description = payload.desc; delete payload.desc; }
    const { error } = await db.from('products').update(payload).eq('id', id);
    if (error) console.error('updateProduct:', error);
  },

  async deleteProduct(id) {
    const { error } = await db.from('products').delete().eq('id', id);
    if (error) console.error('deleteProduct:', error);
  },

  /* ---- Orders ---- */
  async getOrders() {
    const { data, error } = await db.from('orders').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getOrders:', error); return []; }
    return data.map(o => ({ ...o, createdAt: o.created_at }));
  },

  async getOrder(id) {
    const { data, error } = await db.from('orders').select('*').eq('id', id).single();
    if (error) { console.error('getOrder:', error); return null; }
    return data ? { ...data, createdAt: data.created_at } : null;
  },

  async addOrder(o) {
    const now = new Date();
    const ddmmyy = now.getDate().toString().padStart(2, '0') +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getFullYear().toString().slice(-2);

    // Find the latest order ID for today to determine the next number
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const { data: todayOrders } = await db.from('orders')
      .select('id')
      .gte('created_at', startOfToday)
      .ilike('id', `${ddmmyy}-%`)
      .order('id', { ascending: false })
      .limit(1);

    let seq = 1;
    if (todayOrders && todayOrders.length > 0) {
      const lastIdParts = todayOrders[0].id.split('-');
      if (lastIdParts.length === 2) {
        seq = parseInt(lastIdParts[1]) + 1;
      }
    }

    const orderId = `${ddmmyy}-${seq.toString().padStart(3, '0')}`;

    const { data, error } = await db.from('orders').insert({
      id: orderId,
      items: o.items,
      total: o.total,
      payment_method: o.paymentMethod || o.payment_method,
      status: o.status || 'pending',
      customer_id: o.customerId || o.customer_id || null,
      employee_id: o.employeeId || o.employee_id || null
    }).select().single();
    if (error) { console.error('addOrder:', error); return null; }
    return { ...data, createdAt: data.created_at, paymentMethod: data.payment_method, customerId: data.customer_id, employeeId: data.employee_id };
  },

  async updateOrder(id, updates) {
    const { error } = await db.from('orders').update(updates).eq('id', id);
    if (error) console.error('updateOrder:', error);
  },

  /* ---- Users (Profiles) ---- */
  async getUsers() {
    const { data, error } = await db.from('profiles').select('*').order('created_at', { ascending: true });
    if (error) { console.error('getUsers:', error); return []; }
    return data.map(u => ({ ...u, createdAt: u.created_at }));
  },

  async getUser(id) {
    const { data, error } = await db.from('profiles').select('*').eq('id', id).single();
    if (error) { console.error('getUser:', error); return null; }
    return data ? { ...data, createdAt: data.created_at } : null;
  },

  async getUserByUsername(username) {
    const { data, error } = await db.from('profiles').select('*').eq('username', username).single();
    if (error && error.code !== 'PGRST116') console.error('getUserByUsername:', error);
    return data ? { ...data, createdAt: data.created_at } : null;
  },

  async addUser(u) {
    const { data, error } = await db.from('profiles').insert({
      username: u.username, password: u.password, name: u.name,
      email: u.email || '', phone: u.phone || '', role: u.role || 'customer'
    }).select().single();
    if (error) { console.error('addUser:', error); return null; }
    return { ...data, createdAt: data.created_at };
  },

  async updateUser(id, updates) {
    const { error } = await db.from('profiles').update(updates).eq('id', id);
    if (error) console.error('updateUser:', error);
  },

  async deleteUser(id) {
    const { error } = await db.from('profiles').delete().eq('id', id);
    if (error) console.error('deleteUser:', error);
  },

  /* ---- Shop Settings ---- */
  async getSetting(key) {
    const { data, error } = await db.from('shop_settings').select('value').eq('key', key).single();
    if (error && error.code !== 'PGRST116') console.error('getSetting:', error);
    return data?.value || '';
  },

  async setSetting(key, value) {
    const { error } = await db.from('shop_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) console.error('setSetting:', error);
  },

  async getAllSettings() {
    const { data, error } = await db.from('shop_settings').select('*');
    if (error) { console.error('getAllSettings:', error); return {}; }
    const settings = {};
    data.forEach(s => { settings[s.key] = s.value; });
    return settings;
  }
};

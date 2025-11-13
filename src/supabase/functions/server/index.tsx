import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// ============ HEALTH CHECK ============

app.get('/make-server-88ccad03/health', (c) => {
  return c.json({ 
    status: 'ok', 
    version: '2.1.0', 
    features: ['auth', 'products', 'cart', 'groups', 'analytics', 'notifications'],
    endpoints: {
      groups: {
        join: 'POST /make-server-88ccad03/groups/:productId/join',
        leave: 'POST /make-server-88ccad03/groups/:productId/leave',
        get: 'GET /make-server-88ccad03/groups/:productId',
        getAll: 'GET /make-server-88ccad03/groups'
      }
    }
  });
});

// ============ AUTH ROUTES ============

app.post('/make-server-88ccad03/auth/signup', async (c) => {
  try {
    const { email, password, name, isAdmin } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, isAdmin: isAdmin || false },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log(`Signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Store user info in KV
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      isAdmin: isAdmin || false,
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log(`Signup error: ${error}`);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// ============ PRODUCT ROUTES ============

app.get('/make-server-88ccad03/products', async (c) => {
  try {
    const products = await kv.getByPrefix('product:');
    return c.json({ products: products.filter(p => p && p.id) });
  } catch (error) {
    console.log(`Get products error: ${error}`);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.get('/make-server-88ccad03/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const product = await kv.get(`product:${id}`);
    
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }
    
    return c.json({ product });
  } catch (error) {
    console.log(`Get product error: ${error}`);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});

app.post('/make-server-88ccad03/products', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userData = await kv.get(`user:${user.id}`);
    if (!userData?.isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const product = await c.req.json();
    const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newProduct = {
      id: productId,
      ...product,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`product:${productId}`, newProduct);
    
    return c.json({ success: true, product: newProduct });
  } catch (error) {
    console.log(`Create product error: ${error}`);
    return c.json({ error: 'Failed to create product' }, 500);
  }
});

app.put('/make-server-88ccad03/products/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData?.isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`product:${id}`);
    if (!existing) {
      return c.json({ error: 'Product not found' }, 404);
    }

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`product:${id}`, updated);
    
    return c.json({ success: true, product: updated });
  } catch (error) {
    console.log(`Update product error: ${error}`);
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

app.delete('/make-server-88ccad03/products/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData?.isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const id = c.req.param('id');
    await kv.del(`product:${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Delete product error: ${error}`);
    return c.json({ error: 'Failed to delete product' }, 500);
  }
});

// ============ CART ROUTES ============

app.get('/make-server-88ccad03/cart', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const cart = await kv.get(`cart:${user.id}`) || { items: [] };
    return c.json({ cart });
  } catch (error) {
    console.log(`Get cart error: ${error}`);
    return c.json({ error: 'Failed to fetch cart' }, 500);
  }
});

app.post('/make-server-88ccad03/cart', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { items } = await c.req.json();
    await kv.set(`cart:${user.id}`, { items, updatedAt: new Date().toISOString() });
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Update cart error: ${error}`);
    return c.json({ error: 'Failed to update cart' }, 500);
  }
});

// ============ GROUP BUYING ROUTES ============
// IMPORTANT: More specific routes must come before generic routes

// Leave group - most specific
app.post('/make-server-88ccad03/groups/:productId/leave', async (c) => {
  try {
    console.log('Leave group endpoint called');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    console.log('Access token present:', !!accessToken);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    console.log('User authenticated:', !!user?.id, 'Error:', authError?.message);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const productId = c.req.param('productId');
    console.log('Leaving group for product:', productId, 'User:', user.id);
    
    const group = await kv.get(`group:${productId}`) || {
      productId,
      participants: [],
      totalQuantity: 0,
      discountTier: 0,
    };

    console.log('Group before leaving:', JSON.stringify(group));
    const wasInGroup = group.participants.some((p: any) => p.userId === user.id);
    console.log('User was in group:', wasInGroup);

    // Remove participant
    group.participants = group.participants.filter((p: any) => p.userId !== user.id);

    // Recalculate total and discount tier
    group.totalQuantity = group.participants.reduce((sum: number, p: any) => sum + p.quantity, 0);
    
    // Discount tiers: 5+ = 5%, 10+ = 10%, 20+ = 15%, 50+ = 20%
    if (group.totalQuantity >= 50) group.discountTier = 20;
    else if (group.totalQuantity >= 20) group.discountTier = 15;
    else if (group.totalQuantity >= 10) group.discountTier = 10;
    else if (group.totalQuantity >= 5) group.discountTier = 5;
    else group.discountTier = 0;

    group.updatedAt = new Date().toISOString();
    await kv.set(`group:${productId}`, group);
    
    console.log('Group after leaving:', JSON.stringify(group));
    return c.json({ success: true, group, wasInGroup });
  } catch (error) {
    console.log(`Leave group error: ${error}`);
    console.error('Leave group stack trace:', error);
    return c.json({ error: 'Failed to leave group', details: String(error) }, 500);
  }
});

// Join group - specific
app.post('/make-server-88ccad03/groups/:productId/join', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const productId = c.req.param('productId');
    const { quantity } = await c.req.json();
    
    const group = await kv.get(`group:${productId}`) || {
      productId,
      participants: [],
      totalQuantity: 0,
      discountTier: 0,
    };

    // Add or update participant
    const existingIndex = group.participants.findIndex((p: any) => p.userId === user.id);
    if (existingIndex >= 0) {
      group.participants[existingIndex].quantity = quantity;
    } else {
      group.participants.push({ userId: user.id, quantity });
    }

    // Calculate total and discount tier
    const previousTier = group.discountTier;
    group.totalQuantity = group.participants.reduce((sum: number, p: any) => sum + p.quantity, 0);
    
    // Discount tiers: 5+ = 5%, 10+ = 10%, 20+ = 15%, 50+ = 20%
    if (group.totalQuantity >= 50) group.discountTier = 20;
    else if (group.totalQuantity >= 20) group.discountTier = 15;
    else if (group.totalQuantity >= 10) group.discountTier = 10;
    else if (group.totalQuantity >= 5) group.discountTier = 5;
    else group.discountTier = 0;

    // Notify admin if max tier reached
    if (group.discountTier === 20 && previousTier !== 20) {
      const product = await kv.get(`product:${productId}`);
      const adminUsers = await kv.getByPrefix('user:');
      const admins = adminUsers.filter((u: any) => u.isAdmin);
      
      for (const admin of admins) {
        const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await kv.set(`notification:${notificationId}`, {
          id: notificationId,
          type: 'group_max_tier',
          productId,
          productName: product?.name || 'Unknown Product',
          message: `Group for "${product?.name || 'Unknown Product'}" reached maximum discount tier (20%)! Ready for shipment with ${group.totalQuantity} items.`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    group.updatedAt = new Date().toISOString();
    await kv.set(`group:${productId}`, group);
    
    return c.json({ success: true, group });
  } catch (error) {
    console.log(`Join group error: ${error}`);
    return c.json({ error: 'Failed to join group' }, 500);
  }
});

// Get specific group
app.get('/make-server-88ccad03/groups/:productId', async (c) => {
  try {
    const productId = c.req.param('productId');
    const group = await kv.get(`group:${productId}`) || {
      productId,
      participants: [],
      totalQuantity: 0,
      discountTier: 0,
    };
    
    return c.json({ group });
  } catch (error) {
    console.log(`Get group error: ${error}`);
    return c.json({ error: 'Failed to fetch group' }, 500);
  }
});

// Get all groups - most generic (must come last)
app.get('/make-server-88ccad03/groups', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const groups = await kv.getByPrefix('group:');
    const users = await kv.getByPrefix('user:');
    const products = await kv.getByPrefix('product:');

    // Enrich group data with user and product info
    const enrichedGroups = groups.filter(g => g && g.productId).map(group => {
      const product = products.find(p => p.id === group.productId);
      const participants = group.participants.map((p: any) => {
        const userInfo = users.find(u => u.id === p.userId);
        return {
          ...p,
          email: userInfo?.email || 'Unknown',
          name: userInfo?.name || 'Unknown',
        };
      });

      return {
        ...group,
        productName: product?.name || 'Unknown Product',
        participants,
      };
    });
    
    // If not admin, filter to only show groups the user is in
    const userGroups = userData?.isAdmin 
      ? enrichedGroups 
      : enrichedGroups.filter(g => 
          g.participants.some((p: any) => p.userId === user.id)
        );
    
    return c.json({ groups: userGroups });
  } catch (error) {
    console.log(`Get groups error: ${error}`);
    return c.json({ error: 'Failed to fetch groups' }, 500);
  }
});

// ============ ANALYTICS ROUTES ============

app.get('/make-server-88ccad03/analytics', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData?.isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const products = await kv.getByPrefix('product:');
    const users = await kv.getByPrefix('user:');
    const orders = await kv.getByPrefix('order:');
    const groups = await kv.getByPrefix('group:');

    const analytics = {
      totalProducts: products.length,
      totalUsers: users.length,
      totalOrders: orders.length,
      activeGroups: groups.length,
      totalRevenue: orders.reduce((sum, o) => sum + (o?.total || 0), 0),
    };

    return c.json({ analytics });
  } catch (error) {
    console.log(`Get analytics error: ${error}`);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// ============ ORDER ROUTES ============

app.get('/make-server-88ccad03/orders', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData?.isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const orders = await kv.getByPrefix('order:');
    return c.json({ orders: orders.filter(o => o && o.id) });
  } catch (error) {
    console.log(`Get orders error: ${error}`);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

app.post('/make-server-88ccad03/orders', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orderData = await c.req.json();
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newOrder = {
      id: orderId,
      userId: user.id,
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await kv.set(`order:${orderId}`, newOrder);

    // Create admin notification
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await kv.set(`notification:${notificationId}`, {
      id: notificationId,
      type: 'order_request',
      orderId,
      userId: user.id,
      message: 'New order request',
      read: false,
      createdAt: new Date().toISOString(),
    });
    
    return c.json({ success: true, order: newOrder });
  } catch (error) {
    console.log(`Create order error: ${error}`);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

app.post('/make-server-88ccad03/orders/:id/approve', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData?.isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const orderId = c.req.param('id');
    const order = await kv.get(`order:${orderId}`);
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    order.status = 'approved';
    order.approvedAt = new Date().toISOString();
    order.approvedBy = user.id;
    await kv.set(`order:${orderId}`, order);

    // Create user notification
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await kv.set(`notification:${notificationId}`, {
      id: notificationId,
      type: 'order_approved',
      orderId,
      userId: order.userId,
      message: 'Your order has been approved and will be shipped soon!',
      read: false,
      createdAt: new Date().toISOString(),
    });
    
    return c.json({ success: true, order });
  } catch (error) {
    console.log(`Approve order error: ${error}`);
    return c.json({ error: 'Failed to approve order' }, 500);
  }
});

app.post('/make-server-88ccad03/orders/:id/cancel', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData?.isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const orderId = c.req.param('id');
    const order = await kv.get(`order:${orderId}`);
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date().toISOString();
    order.cancelledBy = user.id;
    await kv.set(`order:${orderId}`, order);

    // Create user notification
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await kv.set(`notification:${notificationId}`, {
      id: notificationId,
      type: 'order_cancelled',
      orderId,
      userId: order.userId,
      message: 'Your order has been cancelled by admin.',
      read: false,
      createdAt: new Date().toISOString(),
    });
    
    return c.json({ success: true, order });
  } catch (error) {
    console.log(`Cancel order error: ${error}`);
    return c.json({ error: 'Failed to cancel order' }, 500);
  }
});

// ============ NOTIFICATION ROUTES ============

app.get('/make-server-88ccad03/notifications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allNotifications = await kv.getByPrefix('notification:');
    const userData = await kv.get(`user:${user.id}`);
    
    // Admin sees all notifications, users see only their own
    const notifications = userData?.isAdmin
      ? allNotifications
      : allNotifications.filter(n => n.userId === user.id);
    
    return c.json({ notifications: notifications.filter(n => n && n.id) });
  } catch (error) {
    console.log(`Get notifications error: ${error}`);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

app.post('/make-server-88ccad03/notifications/:id/read', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');
    const notification = await kv.get(`notification:${notificationId}`);
    
    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    notification.read = true;
    notification.readAt = new Date().toISOString();
    await kv.set(`notification:${notificationId}`, notification);
    
    return c.json({ success: true, notification });
  } catch (error) {
    console.log(`Mark notification read error: ${error}`);
    return c.json({ error: 'Failed to mark notification as read' }, 500);
  }
});

// ============ INITIALIZE DEMO DATA ============

app.post('/make-server-88ccad03/init-demo', async (c) => {
  try {
    // Check if products already exist
    const existing = await kv.getByPrefix('product:');
    if (existing.length > 0) {
      return c.json({ message: 'Demo data already exists' });
    }

    // Create demo products
    const demoProducts = [
      {
        id: 'prod_headphones_01',
        name: 'Premium Wireless Headphones',
        description: 'Experience crystal-clear audio with active noise cancellation',
        price: 299.99,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1672925216556-c995d23aab2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFkcGhvbmVzJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjIxODEyNTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        stock: 50,
        superSaverEnabled: true,
      },
      {
        id: 'prod_watch_01',
        name: 'Smart Fitness Watch',
        description: 'Track your fitness goals with style and precision',
        price: 399.99,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1615834569398-4cc6036929f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydHdhdGNoJTIwbW9kZXJufGVufDF8fHx8MTc2MjE5MjU1N3ww&ixlib=rb-4.1.0&q=80&w=1080',
        stock: 30,
        superSaverEnabled: true,
      },
      {
        id: 'prod_tech_01',
        name: 'Ultra-Fast SSD Drive',
        description: 'Lightning-fast storage for your creative projects',
        price: 199.99,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1651752090085-50375d90bf8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwZ2FkZ2V0cyUyMGRhcmt8ZW58MXx8fHwxNzYyMjQ5NDk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        stock: 100,
        superSaverEnabled: false,
      },
      {
        id: 'prod_fashion_01',
        name: 'Designer Collection Jacket',
        description: 'Premium quality fabric with modern design',
        price: 249.99,
        category: 'Fashion',
        image: 'https://images.unsplash.com/photo-1653875842174-429c1b467548?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmclMjBtaW5pbWFsfGVufDF8fHx8MTc2MjIyNzI5OHww&ixlib=rb-4.1.0&q=80&w=1080',
        stock: 25,
        superSaverEnabled: true,
      },
    ];

    for (const product of demoProducts) {
      await kv.set(`product:${product.id}`, {
        ...product,
        createdAt: new Date().toISOString(),
      });
    }

    return c.json({ success: true, message: 'Demo data initialized' });
  } catch (error) {
    console.log(`Init demo error: ${error}`);
    return c.json({ error: 'Failed to initialize demo data' }, 500);
  }
});

// ============ DEBUG CATCH-ALL ROUTE (must be last) ============

app.all('*', (c) => {
  const method = c.req.method;
  const path = c.req.path;
  console.log(`404 - Route not found: ${method} ${path}`);
  return c.json({ 
    error: '404 Not Found',
    attemptedPath: path,
    attemptedMethod: method,
    availableRoutes: {
      leave: 'POST /make-server-88ccad03/groups/:productId/leave',
      join: 'POST /make-server-88ccad03/groups/:productId/join',
      getGroup: 'GET /make-server-88ccad03/groups/:productId',
      getAllGroups: 'GET /make-server-88ccad03/groups'
    }
  }, 404);
});

Deno.serve(app.fetch);

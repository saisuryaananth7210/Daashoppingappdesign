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
    group.totalQuantity = group.participants.reduce((sum: number, p: any) => sum + p.quantity, 0);
    
    // Discount tiers: 5+ = 5%, 10+ = 10%, 20+ = 15%, 50+ = 20%
    if (group.totalQuantity >= 50) group.discountTier = 20;
    else if (group.totalQuantity >= 20) group.discountTier = 15;
    else if (group.totalQuantity >= 10) group.discountTier = 10;
    else if (group.totalQuantity >= 5) group.discountTier = 5;
    else group.discountTier = 0;

    group.updatedAt = new Date().toISOString();
    await kv.set(`group:${productId}`, group);
    
    return c.json({ success: true, group });
  } catch (error) {
    console.log(`Join group error: ${error}`);
    return c.json({ error: 'Failed to join group' }, 500);
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

Deno.serve(app.fetch);

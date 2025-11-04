import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Edit, Trash2, TrendingUp, Users, Package, DollarSign } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  superSaverEnabled: boolean;
}

interface Analytics {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  activeGroups: number;
  totalRevenue: number;
}

interface AdminPortalProps {
  onClose: () => void;
  accessToken: string | null;
}

export function AdminPortal({ onClose, accessToken }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'analytics'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    stock: '',
    superSaverEnabled: false,
  });

  useEffect(() => {
    fetchProducts();
    fetchAnalytics();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-88ccad03/products`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchAnalytics = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-88ccad03/analytics`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) {
      alert('Please sign in as admin');
      return;
    }

    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      image: formData.image,
      stock: parseInt(formData.stock),
      superSaverEnabled: formData.superSaverEnabled,
    };

    try {
      const url = editingProduct
        ? `https://${projectId}.supabase.co/functions/v1/make-server-88ccad03/products/${editingProduct.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-88ccad03/products`;

      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to save product:', error);
        alert('Failed to save product. Make sure you are signed in as admin.');
        return;
      }

      await fetchProducts();
      setIsAddingProduct(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        stock: '',
        superSaverEnabled: false,
      });
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!accessToken) {
      alert('Please sign in as admin');
      return;
    }

    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-88ccad03/products/${productId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to delete product:', error);
        alert('Failed to delete product. Make sure you are signed in as admin.');
        return;
      }

      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image: product.image,
      stock: product.stock.toString(),
      superSaverEnabled: product.superSaverEnabled,
    });
    setIsAddingProduct(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-white">Admin Portal</h2>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-6 border-b border-white/20">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-2xl transition-all ${
              activeTab === 'products'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-2xl transition-all ${
              activeTab === 'analytics'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {activeTab === 'products' ? (
            <div className="p-6">
              {/* Add Product Button */}
              {!isAddingProduct && (
                <button
                  onClick={() => setIsAddingProduct(true)}
                  className="mb-6 bg-gradient-to-r from-[#FF6B00] to-[#C84C0C] text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-5 h-5" />
                  Add Product
                </button>
              )}

              {/* Add/Edit Form */}
              {isAddingProduct && (
                <form onSubmit={handleSubmit} className="mb-8 bg-white/5 rounded-3xl p-6">
                  <h3 className="text-white mb-6">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />

                    <input
                      type="number"
                      placeholder="Price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      step="0.01"
                      className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />

                    <input
                      type="text"
                      placeholder="Category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />

                    <input
                      type="number"
                      placeholder="Stock"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      required
                      className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>

                  <textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={3}
                    className="w-full mb-4 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />

                  <input
                    type="url"
                    placeholder="Image URL"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    required
                    className="w-full mb-4 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />

                  <label className="flex items-center gap-3 text-white mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.superSaverEnabled}
                      onChange={(e) =>
                        setFormData({ ...formData, superSaverEnabled: e.target.checked })
                      }
                      className="w-5 h-5 rounded"
                    />
                    Enable Super Saver
                  </label>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-[#FF6B00] to-[#C84C0C] text-white px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity"
                    >
                      {editingProduct ? 'Update' : 'Add'} Product
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingProduct(false);
                        setEditingProduct(null);
                        setFormData({
                          name: '',
                          description: '',
                          price: '',
                          category: '',
                          image: '',
                          stock: '',
                          superSaverEnabled: false,
                        });
                      }}
                      className="bg-white/10 text-white px-6 py-3 rounded-2xl hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Products List */}
              <div className="space-y-4">
                {products.filter(p => p && p.id).map((product) => (
                  <div
                    key={product.id}
                    className="bg-white/5 border border-white/20 rounded-3xl p-4 flex items-center gap-4"
                  >
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-white mb-1">{product.name}</h4>
                      <p className="text-white/60 text-sm mb-2 line-clamp-1">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span>${product.price}</span>
                        <span>Stock: {product.stock}</span>
                        <span>{product.category}</span>
                        {product.superSaverEnabled && (
                          <span className="bg-[#FF6B00]/20 text-[#FF6B00] px-2 py-1 rounded">
                            Super Saver
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(product)}
                        className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-3 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6">
              {analytics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-[#FF6B00]/20 to-[#C84C0C]/20 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
                    <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 w-fit mb-4">
                      <Package className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-white/60 mb-2">Total Products</div>
                    <div className="text-white">{analytics.totalProducts}</div>
                  </div>

                  <div className="bg-gradient-to-br from-[#C84C0C]/20 to-[#FF6B00]/20 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
                    <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 w-fit mb-4">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-white/60 mb-2">Total Users</div>
                    <div className="text-white">{analytics.totalUsers}</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
                    <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 w-fit mb-4">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-white/60 mb-2">Active Groups</div>
                    <div className="text-white">{analytics.activeGroups}</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
                    <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 w-fit mb-4">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-white/60 mb-2">Total Revenue</div>
                    <div className="text-white">${analytics.totalRevenue.toFixed(2)}</div>
                  </div>

                  <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#FF6B00]/20 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
                    <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 w-fit mb-4">
                      <Package className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-white/60 mb-2">Total Orders</div>
                    <div className="text-white">{analytics.totalOrders}</div>
                  </div>
                </div>
              ) : (
                <div className="text-white/60">Loading analytics...</div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

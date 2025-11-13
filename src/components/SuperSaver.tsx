import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, TrendingDown, Clock, Plus, Minus, LogOut } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getSupabaseClient } from '../utils/supabase/client';

const supabase = getSupabaseClient();

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

interface Group {
  productId: string;
  participants: { userId: string; quantity: number }[];
  totalQuantity: number;
  discountTier: number;
}

interface SuperSaverProps {
  accessToken: string | null;
}

export function SuperSaver({ accessToken }: SuperSaverProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<{ [key: string]: Group }>({});
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCurrentUser();
  }, [accessToken]);

  const fetchCurrentUser = async () => {
    if (!accessToken) {
      setCurrentUserId(null);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

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

      if (!response.ok) {
        console.error('Failed to fetch products:', await response.text());
        return;
      }

      const data = await response.json();
      const superSaverProducts = (data.products || []).filter((p: Product) => p.superSaverEnabled);
      setProducts(superSaverProducts);

      // Fetch groups for each product
      for (const product of superSaverProducts) {
        await fetchGroup(product.id);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroup = async (productId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-88ccad03/groups/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGroups(prev => ({ ...prev, [productId]: data.group }));
      }
    } catch (error) {
      console.error('Error fetching group:', error);
    }
  };

  const joinGroup = async (productId: string) => {
    if (!accessToken) {
      alert('Please sign in to join a group');
      return;
    }

    const quantity = quantities[productId] || 1;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-88ccad03/groups/${productId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ quantity }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to join group:', error);
        alert('Failed to join group. Please sign in first.');
        return;
      }

      const data = await response.json();
      setGroups(prev => ({ ...prev, [productId]: data.group }));
      alert(`Successfully joined group! Current discount: ${data.group.discountTier}%`);
      
      // Refresh the current user info
      await fetchCurrentUser();
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to join group');
    }
  };

  const exitGroup = async (productId: string) => {
    if (!accessToken || !currentUserId) {
      alert('Please sign in first');
      return;
    }

    // Confirm before leaving
    const confirmed = window.confirm('Are you sure you want to exit this group? You can always join again later.');
    if (!confirmed) return;

    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-88ccad03/groups/${productId}/leave`;
      console.log('Attempting to leave group:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('Leave group response status:', response.status);

      if (!response.ok) {
        let errorText = '';
        let errorJson = null;
        
        try {
          errorText = await response.text();
          errorJson = JSON.parse(errorText);
        } catch (e) {
          // errorText is already set
        }
        
        console.error('Failed to exit group:', response.status, errorText);
        console.error('Error details:', errorJson);
        
        if (response.status === 404) {
          const debugInfo = errorJson?.attemptedPath 
            ? `\n\nDebug Info:\nAttempted: ${errorJson.attemptedPath}\nMethod: ${errorJson.attemptedMethod}`
            : '';
          alert(`⚠️ Unable to exit group - Endpoint not found (404)\n\n` +
                `The "leave group" endpoint exists in the code but isn't responding.\n\n` +
                `SOLUTION: You need to redeploy the Supabase Edge Function:\n` +
                `1. Open your terminal\n` +
                `2. Run: supabase functions deploy server\n` +
                `3. Or use: npx supabase functions deploy server\n\n` +
                `This will update the deployed server with the latest code.${debugInfo}`);
        } else if (response.status === 401) {
          alert('Your session has expired. Please sign in again.');
        } else {
          alert(`Failed to exit group: ${errorJson?.error || errorText || 'Unknown error'}`);
        }
        return;
      }

      const data = await response.json();
      console.log('Successfully left group:', data);
      
      // Update the groups state with the new group data
      // This will immediately update the UI to show the Join button
      setGroups(prev => ({ ...prev, [productId]: data.group }));
      
      // Also refresh to ensure we have the latest data
      await fetchGroup(productId);
      
      alert('Successfully exited the group!');
    } catch (error) {
      console.error('Error exiting group:', error);
      alert(`An error occurred while exiting the group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const isUserInGroup = (group: Group) => {
    if (!currentUserId || !accessToken) return false;
    return group.participants.some((p) => p.userId === currentUserId);
  };

  const getNextTier = (currentQuantity: number) => {
    if (currentQuantity < 5) return { target: 5, discount: 5 };
    if (currentQuantity < 10) return { target: 10, discount: 10 };
    if (currentQuantity < 20) return { target: 20, discount: 15 };
    if (currentQuantity < 50) return { target: 50, discount: 20 };
    return { target: 50, discount: 20 };
  };

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const newValue = Math.max(1, current + delta);
      return { ...prev, [productId]: newValue };
    });
  };

  return (
    <div className="min-h-screen pb-32 px-6 pt-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-white mb-2">Super Saver</h1>
        <p className="text-white/60">Join groups and unlock massive discounts</p>
      </motion.div>

      {/* Discount Tiers Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 bg-gradient-to-br from-[#FF6B00]/20 to-[#C84C0C]/20 backdrop-blur-xl border border-white/20 rounded-3xl p-6"
      >
        <h3 className="text-white mb-4">Discount Tiers</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { qty: '5+', discount: '5%' },
            { qty: '10+', discount: '10%' },
            { qty: '20+', discount: '15%' },
            { qty: '50+', discount: '20%' },
          ].map((tier) => (
            <div
              key={tier.qty}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 text-center"
            >
              <div className="text-white/60 mb-1">{tier.qty} items</div>
              <div className="text-white">{tier.discount} off</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Products */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-white/60">Loading products...</div>
        </div>
      ) : products.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-white/60">No Super Saver products available</div>
        </div>
      ) : (
        <div className="space-y-6">
          {products.filter(p => p && p.id).map((product, index) => {
            const group = groups[product.id] || {
              productId: product.id,
              participants: [],
              totalQuantity: 0,
              discountTier: 0,
            };
            const nextTier = getNextTier(group.totalQuantity);
            const progress = (group.totalQuantity / nextTier.target) * 100;
            const quantity = quantities[product.id] || 1;
            const discountedPrice = product.price * (1 - group.discountTier / 100);

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden"
              >
                <div className="md:flex">
                  {/* Product Image */}
                  <div className="md:w-1/3 relative h-64 md:h-auto">
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="md:w-2/3 p-6">
                    <h3 className="text-white mb-2">{product.name}</h3>
                    <p className="text-white/60 mb-4">{product.description}</p>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-3 mb-6">
                      <div className="text-white">
                        ₹{(discountedPrice * 83).toFixed(2)}
                      </div>
                      {group.discountTier > 0 && (
                        <>
                          <div className="text-white/40 line-through">
                            ₹{(product.price * 83).toFixed(2)}
                          </div>
                          <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg">
                            {group.discountTier}% OFF
                          </div>
                        </>
                      )}
                    </div>

                    {/* Group Status */}
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-white/60">
                          <Users className="w-4 h-4" />
                          {group.participants.length} participants
                        </div>
                        <div className="text-white/60">
                          {group.totalQuantity} / {nextTier.target} items
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FF6B00] to-[#C84C0C] rounded-full"
                        />
                      </div>

                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <TrendingDown className="w-4 h-4" />
                        {group.totalQuantity >= nextTier.target
                          ? 'Maximum discount unlocked!'
                          : `${nextTier.target - group.totalQuantity} more for ${nextTier.discount}% off`}
                      </div>
                    </div>

                    {/* Quantity Selector and Join/Exit Button */}
                    <div className="flex items-center gap-4">
                      {!isUserInGroup(group) && (
                        <div className="flex items-center gap-2 bg-white/10 rounded-2xl p-2">
                          <button
                            onClick={() => updateQuantity(product.id, -1)}
                            className="bg-white/20 hover:bg-white/30 text-white rounded-xl p-2 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="text-white px-4">{quantity}</div>
                          <button
                            onClick={() => updateQuantity(product.id, 1)}
                            className="bg-white/20 hover:bg-white/30 text-white rounded-xl p-2 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {isUserInGroup(group) ? (
                        <motion.button
                          onClick={() => exitGroup(product.id)}
                          className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <LogOut className="w-5 h-5" />
                          Exit Group
                        </motion.button>
                      ) : (
                        <motion.button
                          onClick={() => joinGroup(product.id)}
                          className="flex-1 bg-gradient-to-r from-[#FF6B00] to-[#C84C0C] text-white px-8 py-4 rounded-2xl hover:opacity-90 transition-opacity"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Join Group
                        </motion.button>
                      )}
                    </div>

                    {/* ETA */}
                    <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
                      <Clock className="w-4 h-4" />
                      Estimated delivery: 5-7 business days after group closes
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

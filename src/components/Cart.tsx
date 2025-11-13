import { motion } from 'motion/react';
import { Trash2, Plus, Minus, ShoppingBag, Users, X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState, useEffect } from 'react';
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
}

interface CartItem extends Product {
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
}

interface Group {
  productId: string;
  productName: string;
  participants: any[];
  totalQuantity: number;
  discountTier: number;
}

export function Cart({ items, onUpdateQuantity, onRemove }: CartProps) {
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchUserGroups = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Please sign in to view your groups');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-88ccad03/groups`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Groups are already filtered by the server for non-admin users
        setUserGroups(data.groups || []);
        setShowGroupInfo(true);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch groups:', response.status, errorText);
        alert('Failed to load your groups. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      alert('Failed to load your groups. Please try again.');
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }
    setShowCheckoutModal(true);
  };

  const submitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Please sign in to checkout');
        return;
      }

      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total: total * 83, // Convert to INR
        customerInfo: checkoutForm,
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-88ccad03/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(orderData),
        }
      );

      if (response.ok) {
        alert('Order placed successfully! Admin will review and approve it.');
        setShowCheckoutModal(false);
        setCheckoutForm({
          name: '',
          phone: '',
          address: '',
          city: '',
          pincode: '',
        });
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to place order');
    }
  };

  return (
    <div className="min-h-screen pb-32 px-6 pt-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-white mb-2">Shopping Cart</h1>
        <p className="text-white/60">
          {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
        </p>
      </motion.div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-full p-8 mb-6">
            <ShoppingBag className="w-16 h-16 text-white/40" />
          </div>
          <h2 className="text-white mb-2">Your cart is empty</h2>
          <p className="text-white/60">Start shopping to add items to your cart</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden"
              >
                <div className="flex gap-6 p-6">
                  {/* Image */}
                  <div className="w-32 h-32 flex-shrink-0 rounded-2xl overflow-hidden">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white mb-2">{item.name}</h3>
                    <p className="text-white/60 mb-4 line-clamp-2">{item.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="text-white">
                        ₹{(item.price * 83).toFixed(2)} each
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-white/10 rounded-2xl p-2">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="bg-white/20 hover:bg-white/30 text-white rounded-xl p-2 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="text-white px-4">{item.quantity}</div>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="bg-white/20 hover:bg-white/30 text-white rounded-xl p-2 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemove(item.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl p-3 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sticky top-6">
              <h3 className="text-white mb-6">Order Summary</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-white/60">
                  <span>Subtotal</span>
                  <span>₹{(subtotal * 83).toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-white/60">
                  <span>Tax (8%)</span>
                  <span>₹{(tax * 83).toFixed(2)}</span>
                </div>

                <div className="border-t border-white/20 pt-4">
                  <div className="flex items-center justify-between text-white">
                    <span>Total</span>
                    <span>₹{(total * 83).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-[#FF6B00] to-[#C84C0C] text-white py-4 rounded-2xl hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Proceed to Checkout
              </motion.button>

              <motion.button
                onClick={fetchUserGroups}
                className="w-full mt-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white py-3 rounded-2xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Users className="w-5 h-5" />
                View My Groups
              </motion.button>

              <div className="mt-6 space-y-2 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                  <span>Free shipping on orders over ₹8,300</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                  <span>30-day return policy</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Group Info Modal */}
      {showGroupInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setShowGroupInfo(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <h3 className="text-white">My Group Memberships</h3>
              <button
                onClick={() => setShowGroupInfo(false)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
              {userGroups.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">You're not in any groups yet</p>
                  <p className="text-white/40 text-sm mt-2">
                    Visit Super Saver to join group buying deals
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userGroups.map((group) => {
                    const myParticipation = group.participants.find(
                      (p) => p.userId === currentUserId
                    );
                    return (
                      <div
                        key={group.productId}
                        className="bg-white/5 border border-white/20 rounded-2xl p-4"
                      >
                        <h4 className="text-white mb-2">{group.productName}</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-white/60">Your Quantity:</span>
                            <div className="text-white">{myParticipation?.quantity || 0}</div>
                          </div>
                          <div>
                            <span className="text-white/60">Total Participants:</span>
                            <div className="text-white">{group.participants.length}</div>
                          </div>
                          <div>
                            <span className="text-white/60">Total Quantity:</span>
                            <div className="text-white">{group.totalQuantity}</div>
                          </div>
                          <div>
                            <span className="text-white/60">Current Discount:</span>
                            <div className="text-green-400">{group.discountTier}%</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setShowCheckoutModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <h3 className="text-white">Checkout</h3>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={submitCheckout} className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Delivery Address</label>
                  <textarea
                    required
                    value={checkoutForm.address}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                    placeholder="Enter your address"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">City</label>
                    <input
                      type="text"
                      required
                      value={checkoutForm.city}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Pincode</label>
                    <input
                      type="text"
                      required
                      value={checkoutForm.pincode}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, pincode: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                      placeholder="Pincode"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60">Total Amount</span>
                  <span className="text-white">₹{(total * 83).toFixed(2)}</span>
                </div>
                <p className="text-white/40 text-sm">
                  Your order will be reviewed by admin before processing
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF6B00] to-[#C84C0C] text-white py-4 rounded-2xl hover:opacity-90 transition-opacity"
              >
                Place Order
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

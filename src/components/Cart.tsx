import { motion } from 'motion/react';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

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

export function Cart({ items, onUpdateQuantity, onRemove }: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }
    alert('Checkout functionality would be integrated here!');
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
                        ${item.price.toFixed(2)} each
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
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-white/60">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                <div className="border-t border-white/20 pt-4">
                  <div className="flex items-center justify-between text-white">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
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

              <div className="mt-6 space-y-2 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                  <span>Free shipping on orders over $100</span>
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
    </div>
  );
}

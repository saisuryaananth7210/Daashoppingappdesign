import { Home, Zap, DollarSign, ShoppingCart, MessageCircle, Wallet, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  cartItemCount?: number;
}

export function BottomNav({ currentPage, onNavigate, cartItemCount = 0 }: BottomNavProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'fastbuy', icon: Zap, label: 'FastBuy' },
    { id: 'supersaver', icon: DollarSign, label: 'Super Saver' },
    { id: 'budgettracker', icon: Wallet, label: 'Budget' },
    { id: 'cart', icon: ShoppingCart, label: 'Cart', badge: cartItemCount },
    { id: 'support', icon: MessageCircle, label: 'Support' },
    { id: 'team', icon: Users, label: 'Team' },
  ];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl px-6 py-3 shadow-2xl">
        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
                
                {item.badge !== undefined && item.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                  >
                    {item.badge}
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

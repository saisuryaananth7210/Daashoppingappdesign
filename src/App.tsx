import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, LogOut, LogIn } from 'lucide-react';
import { getSupabaseClient } from './utils/supabase/client';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { BottomNav } from './components/BottomNav';
import { Home } from './components/Home';
import { FastBuy } from './components/FastBuy';
import { SuperSaver } from './components/SuperSaver';
import { Cart } from './components/Cart';
import { Support } from './components/Support';
import { BudgetTracker } from './components/BudgetTracker';
import { Team } from './components/Team';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';

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

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    document.title = 'Smart Product Recommendation System - DAA Techniques';
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      setAccessToken(session.access_token);
      const userIsAdmin = session.user?.user_metadata?.isAdmin || false;
      setIsAdmin(userIsAdmin);
    }

    // Initialize demo data
    if (!initialized) {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-88ccad03/init-demo`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize demo data:', error);
      }
    }
  };

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === productId) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleAuthSuccess = (token: string, adminStatus: boolean) => {
    setAccessToken(token);
    setIsAdmin(adminStatus);
    setShowAuthModal(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setIsAdmin(false);
    setShowAdminPortal(false);
  };

  const handleAdminClick = () => {
    if (!accessToken) {
      setShowAuthModal(true);
    } else if (isAdmin) {
      setShowAdminPortal(true);
    } else {
      alert('Admin access required');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'fastbuy':
        return <FastBuy onAddToCart={handleAddToCart} />;
      case 'supersaver':
        return <SuperSaver accessToken={accessToken} />;
      case 'budgettracker':
        return <BudgetTracker />;
      case 'cart':
        return (
          <Cart
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveFromCart}
          />
        );
      case 'support':
        return <Support />;
      case 'team':
        return <Team />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] dark">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF6B00]/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C84C0C]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Top Bar */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-6 right-6 z-40 flex items-center gap-3"
      >
        {accessToken && (
          <motion.button
            onClick={handleSignOut}
            className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-4 py-2 rounded-2xl hover:bg-white/20 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </motion.button>
        )}

        {!accessToken && (
          <motion.button
            onClick={() => setShowAuthModal(true)}
            className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-4 py-2 rounded-2xl hover:bg-white/20 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </motion.button>
        )}

        <motion.button
          onClick={handleAdminClick}
          className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-4 py-2 rounded-2xl hover:bg-white/20 transition-colors flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings className="w-5 h-5" />
          {isAdmin ? 'Admin' : 'Admin Portal'}
        </motion.button>
      </motion.div>

      {/* Main Content */}
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
      />

      {/* Admin Portal Modal */}
      <AnimatePresence>
        {showAdminPortal && (
          <AdminPortal
            onClose={() => setShowAdminPortal(false)}
            accessToken={accessToken}
          />
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

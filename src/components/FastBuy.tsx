import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Plus, Check } from 'lucide-react';
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
}

interface FastBuyProps {
  onAddToCart: (product: Product) => void;
}

export function FastBuy({ onAddToCart }: FastBuyProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
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

      if (!response.ok) {
        console.error('Failed to fetch products:', await response.text());
        return;
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(products.filter(p => p && p.category).map((p) => p.category))];

  const filteredProducts = products.filter((product) => {
    if (!product) return false;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: Product) => {
    onAddToCart(product);
    setAddedProducts(prev => new Set(prev).add(product.id));
    
    // Reset added state after animation
    setTimeout(() => {
      setAddedProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen pb-32 px-6 pt-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-white mb-2">FastBuy</h1>
        <p className="text-white/60">Quick shopping with instant checkout</p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              {category}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-white/60">Loading products...</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-white/60">No products found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, index) => {
            const isAdded = addedProducts.has(product.id);
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden hover:scale-105 transition-transform"
              >
                <div className="relative h-64 overflow-hidden">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>

                <div className="p-6">
                  <h3 className="text-white mb-2">{product.name}</h3>
                  <p className="text-white/60 mb-4 line-clamp-2">{product.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="text-white">${product.price.toFixed(2)}</div>
                    
                    <motion.button
                      onClick={() => handleAddToCart(product)}
                      className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
                        isAdded
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add
                        </>
                      )}
                    </motion.button>
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

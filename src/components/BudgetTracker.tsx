import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { DollarSign, TrendingDown, ShoppingBag, ArrowRight } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
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

export function BudgetTracker() {
  const [budget, setBudget] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [aroundBudgetProducts, setAroundBudgetProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'within' | 'around'>('within');

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

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleBudgetSubmit = () => {
    const budgetAmount = parseFloat(budget);
    
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      alert('Please enter a valid budget amount');
      return;
    }

    setLoading(true);
    
    // Convert INR budget to USD for comparison (divide by 83)
    const budgetInUSD = budgetAmount / 83;
    
    // Filter products within budget and sort by price (descending)
    const affordable = products
      .filter((product) => product.price <= budgetInUSD)
      .sort((a, b) => b.price - a.price);
    
    // Filter products around budget (+/- 5%)
    const lowerBound = budgetInUSD * 0.95;
    const upperBound = budgetInUSD * 1.05;
    const aroundBudget = products
      .filter((product) => product.price >= lowerBound && product.price <= upperBound)
      .sort((a, b) => Math.abs(a.price - budgetInUSD) - Math.abs(b.price - budgetInUSD));
    
    setFilteredProducts(affordable);
    setAroundBudgetProducts(aroundBudget);
    setShowResults(true);
    setLoading(false);
  };

  const calculateMaxItems = () => {
    const budgetAmount = parseFloat(budget);
    if (isNaN(budgetAmount)) return 0;
    
    // Convert INR budget to USD for calculation
    const budgetInUSD = budgetAmount / 83;
    
    return filteredProducts.reduce((count, product) => {
      return count + Math.floor(budgetInUSD / product.price);
    }, 0);
  };

  const getOptimalCombination = () => {
    const budgetAmount = parseFloat(budget);
    if (isNaN(budgetAmount) || filteredProducts.length === 0) return [];

    // Convert INR budget to USD for calculation
    const budgetInUSD = budgetAmount / 83;

    // Simple greedy algorithm to find optimal product combination
    const combination: Array<{ product: Product; quantity: number }> = [];
    let remainingBudget = budgetInUSD;

    // Sort by value (price descending) for greedy approach
    const sortedProducts = [...filteredProducts].sort((a, b) => b.price - a.price);

    for (const product of sortedProducts) {
      const quantity = Math.floor(remainingBudget / product.price);
      if (quantity > 0) {
        combination.push({ product, quantity });
        remainingBudget -= quantity * product.price;
      }
      if (remainingBudget < Math.min(...sortedProducts.map(p => p.price))) break;
    }

    return combination.slice(0, 5); // Show top 5 recommendations
  };

  return (
    <div className="min-h-screen pb-32 px-6 pt-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-white mb-2">Budget Tracker</h1>
        <p className="text-white/60">Find products within your budget using DAA optimization</p>
      </motion.div>

      {/* Budget Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#FF6B00]/20 to-[#C84C0C]/20 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#FF6B00]/20 backdrop-blur-xl rounded-full p-3">
            <DollarSign className="w-6 h-6 text-[#FF6B00]" />
          </div>
          <h2 className="text-white">Enter Your Budget</h2>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-xl">₹</span>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white/10 border border-white/20 rounded-2xl pl-10 pr-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
            />
          </div>
          <motion.button
            onClick={handleBudgetSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-[#FF6B00] to-[#C84C0C] text-white px-8 py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Analyzing...' : 'Find Products'}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Results Section */}
      {showResults && (
        <>
          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingBag className="w-5 h-5 text-[#FF6B00]" />
                <span className="text-white/60">Available Products</span>
              </div>
              <div className="text-white">{filteredProducts.length} items</div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-white/60">Your Budget</span>
              </div>
              <div className="text-white">₹{parseFloat(budget).toFixed(2)}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="w-5 h-5 text-[#C84C0C]" />
                <span className="text-white/60">Best Value</span>
              </div>
              <div className="text-white">
                {filteredProducts.length > 0
                  ? `₹${(filteredProducts[0].price * 83).toFixed(2)}`
                  : 'N/A'}
              </div>
            </div>
          </motion.div>

          {/* Optimal Combination */}
          {getOptimalCombination().length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-[#D4AF37]/20 to-[#FF6B00]/20 backdrop-blur-xl border border-[#D4AF37]/30 rounded-3xl p-6 mb-8"
            >
              <h3 className="text-white mb-4">Optimal Product Combination</h3>
              <p className="text-white/60 text-sm mb-4">
                Using DAA greedy algorithm to maximize your budget
              </p>
              <div className="space-y-3">
                {getOptimalCombination().map(({ product, quantity }, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between bg-white/10 rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                        <span className="text-[#D4AF37]">{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-white">{product.name}</div>
                        <div className="text-white/60 text-sm">
                          ₹{(product.price * 83).toFixed(2)} × {quantity}
                        </div>
                      </div>
                    </div>
                    <div className="text-white">
                      ₹{(product.price * quantity * 83).toFixed(2)}
                    </div>
                  </div>
                ))}
                <div className="border-t border-white/20 pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Total</span>
                    <span className="text-white">
                      ₹
                      {(getOptimalCombination()
                        .reduce(
                          (sum, { product, quantity }) =>
                            sum + product.price * quantity,
                          0
                        ) * 83)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-white/60">Remaining</span>
                    <span className="text-[#D4AF37]">
                      ₹
                      {(
                        parseFloat(budget) -
                        (getOptimalCombination().reduce(
                          (sum, { product, quantity }) =>
                            sum + product.price * quantity,
                          0
                        ) * 83)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4 mb-6"
          >
            <button
              onClick={() => setActiveTab('within')}
              className={`px-6 py-3 rounded-2xl transition-all ${
                activeTab === 'within'
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#C84C0C] text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              Within Budget ({filteredProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('around')}
              className={`px-6 py-3 rounded-2xl transition-all ${
                activeTab === 'around'
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#C84C0C] text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              Around Budget ±5% ({aroundBudgetProducts.length})
            </button>
          </motion.div>

          {/* All Products Within Budget */}
          {activeTab === 'within' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-white mb-6">
                All Products Within Budget ({filteredProducts.length})
              </h3>

              {filteredProducts.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 text-center">
                <DollarSign className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-white/60 mb-2">No products found within your budget</p>
                <p className="text-white/40 text-sm">Try increasing your budget amount</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden hover:scale-105 transition-transform"
                  >
                    <div className="aspect-square overflow-hidden">
                      <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white">{product.name}</h4>
                        <span className="bg-[#FF6B00]/20 text-[#FF6B00] px-2 py-1 rounded text-sm">
                          ₹{(product.price * 83).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-white/60 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-xs">{product.category}</span>
                        <span className="text-white/60 text-sm">
                          Max: {Math.floor((parseFloat(budget) / 83) / product.price)} units
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            </motion.div>
          )}

          {/* Products Around Budget */}
          {activeTab === 'around' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-white mb-6">
                Products Around Budget ±5% ({aroundBudgetProducts.length})
              </h3>

              {aroundBudgetProducts.length === 0 ? (
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 text-center">
                  <DollarSign className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60 mb-2">No products found around your budget range</p>
                  <p className="text-white/40 text-sm">Try adjusting your budget amount</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aroundBudgetProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden hover:scale-105 transition-transform"
                    >
                      <div className="aspect-square overflow-hidden">
                        <ImageWithFallback
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white">{product.name}</h4>
                          <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-1 rounded text-sm">
                            ₹{(product.price * 83).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-white/60 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-white/40 text-xs">{product.category}</span>
                          <span className="text-white/60 text-sm">
                            {product.price * 83 < parseFloat(budget) ? 'Within Budget' : 'Slightly Over'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </>
      )}

      {/* Empty State */}
      {!showResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 text-center"
        >
          <DollarSign className="w-20 h-20 text-white/40 mx-auto mb-4" />
          <h3 className="text-white mb-2">Enter Your Budget</h3>
          <p className="text-white/60 max-w-md mx-auto">
            Our DAA-based algorithm will analyze all products and recommend the best options within your budget
          </p>
        </motion.div>
      )}
    </div>
  );
}

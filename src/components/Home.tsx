import { motion } from 'motion/react';
import { Sparkles, Users, Zap, TrendingUp } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const features = [
    {
      icon: Zap,
      title: 'FastBuy',
      description: 'Instant shopping with one-tap checkout',
      gradient: 'from-[#FF6B00]/20 to-[#C84C0C]/20',
      action: () => onNavigate('fastbuy'),
    },
    {
      icon: Users,
      title: 'Super Saver',
      description: 'Join groups and save big on bulk orders',
      gradient: 'from-[#C84C0C]/20 to-[#FF6B00]/20',
      action: () => onNavigate('supersaver'),
    },
    {
      icon: TrendingUp,
      title: 'Budget Tracker',
      description: 'Find products within your budget using DAA algorithms',
      gradient: 'from-[#D4AF37]/20 to-[#FF6B00]/20',
      action: () => onNavigate('budgettracker'),
    },
  ];

  return (
    <div className="min-h-screen pb-32">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl mx-6 mt-6 bg-gradient-to-br from-[#FF6B00]/30 via-[#C84C0C]/30 to-[#D4AF37]/20 backdrop-blur-xl border border-white/20"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
        
        <div className="relative p-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block mb-6"
          >
            <div className="bg-white/20 backdrop-blur-xl rounded-full p-6">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </motion.div>
          
          <h1 className="text-white mb-4">Smart Product Recommendation System</h1>
          <p className="text-white/80 max-w-md mx-auto">
            Based on Budget Using DAA Techniques - Experience intelligent shopping with budget-aware recommendations and group-buy savings
          </p>
        </div>
      </motion.div>

      {/* Features Grid */}
      <div className="px-6 mt-8">
        <h2 className="text-white mb-6">Explore Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <motion.button
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={feature.action}
                className="text-left"
              >
                <div className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:scale-105 transition-transform`}>
                  <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 w-fit mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-white mb-2">{feature.title}</h3>
                  <p className="text-white/70">{feature.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Featured Products Preview */}
      <div className="px-6 mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white">Trending Now</h2>
          <button
            onClick={() => onNavigate('fastbuy')}
            className="text-white/60 hover:text-white transition-colors"
          >
            View All →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            'https://images.unsplash.com/photo-1672925216556-c995d23aab2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFkcGhvbmVzJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjIxODEyNTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
            'https://images.unsplash.com/photo-1615834569398-4cc6036929f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydHdhdGNoJTIwbW9kZXJufGVufDF8fHx8MTc2MjE5MjU1N3ww&ixlib=rb-4.1.0&q=80&w=1080',
            'https://images.unsplash.com/photo-1651752090085-50375d90bf8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwZ2FkZ2V0cyUyMGRhcmt8ZW58MXx8fHwxNzYyMjQ5NDk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
            'https://images.unsplash.com/photo-1653875842174-429c1b467548?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmclMjBtaW5pbWFsfGVufDF8fHx8MTc2MjIyNzI5OHww&ixlib=rb-4.1.0&q=80&w=1080',
          ].map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden hover:scale-105 transition-transform cursor-pointer"
            >
              <ImageWithFallback
                src={image}
                alt={`Product ${index + 1}`}
                className="w-full h-48 object-cover"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { motion } from 'motion/react';
import { Users, Award, BookOpen, Code } from 'lucide-react';

export function Team() {
  const teamMembers = [
    {
      name: 'G.POOJA',
      rollNumber: '23891A7227',
      icon: Code,
    },
    {
      name: 'G.PRANEETH',
      rollNumber: '23891A7221',
      icon: Code,
    },
    {
      name: 'K.SHIKHARA',
      rollNumber: '23891A7235',
      icon: Code,
    },
    {
      name: 'B.SAI SURYA ANANTH',
      rollNumber: '23891A7210',
      icon: Code,
    },
  ];

  return (
    <div className="min-h-screen pb-32 px-6 pt-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-white mb-2">Development Team</h1>
        <p className="text-white/60">
          Smart Product Recommendation System Based on Budget Using DAA Techniques
        </p>
      </motion.div>

      {/* Guide Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#D4AF37]/20 to-[#FF6B00]/20 backdrop-blur-xl border border-[#D4AF37]/30 rounded-3xl p-8 mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-[#D4AF37]/20 backdrop-blur-xl rounded-full p-4">
            <Award className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-white">Project Guide</h2>
            <p className="text-white/60">Mentor & Supervisor</p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[#D4AF37]" />
            <div>
              <div className="text-white text-xl">SUDHAKAR SIR</div>
              <div className="text-white/60">Project Guide & Mentor</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Team Members Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-[#FF6B00]" />
          <h2 className="text-white">Team Members</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teamMembers.map((member, index) => {
            const Icon = member.icon;
            return (
              <motion.div
                key={member.rollNumber}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 hover:scale-105 transition-transform"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-[#FF6B00]/20 to-[#C84C0C]/20 backdrop-blur-xl rounded-2xl p-4">
                    <Icon className="w-8 h-8 text-[#FF6B00]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[#D4AF37]">{index + 1}.</span>
                      <h3 className="text-white">{member.name}</h3>
                    </div>
                    <div className="bg-white/10 rounded-xl px-3 py-2 inline-block">
                      <span className="text-white/80 text-sm">{member.rollNumber}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Project Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-br from-[#FF6B00]/20 to-[#C84C0C]/20 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
      >
        <h3 className="text-white mb-4">About the Project</h3>
        <div className="space-y-4 text-white/80">
          <p>
            This Smart Product Recommendation System utilizes Design and Analysis of Algorithms (DAA) techniques to provide intelligent, budget-aware product recommendations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 rounded-2xl p-4">
              <h4 className="text-white mb-2">Key Features</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li>• Budget-based product filtering</li>
                <li>• DAA optimization algorithms</li>
                <li>• Group buying with dynamic discounts</li>
                <li>• Real-time cart synchronization</li>
              </ul>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <h4 className="text-white mb-2">Technologies Used</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li>• React & TypeScript</li>
                <li>• Supabase Backend</li>
                <li>• Motion animations</li>
                <li>• DAA Algorithms</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

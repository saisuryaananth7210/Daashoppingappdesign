import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, HelpCircle, Package, CreditCard, MessageCircle } from 'lucide-react';

export function Support() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'bot' as const,
      text: 'Hello! How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');

  const quickActions = [
    { icon: Package, label: 'Track Order', action: 'track' },
    { icon: CreditCard, label: 'Refund Status', action: 'refund' },
    { icon: HelpCircle, label: 'FAQ', action: 'faq' },
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot' as const,
        text: 'Thank you for your message! Our support team will assist you shortly. In the meantime, you can check our FAQ or track your order using the quick actions above.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const handleQuickAction = (action: string) => {
    let response = '';
    switch (action) {
      case 'track':
        response = 'Please provide your order number to track your shipment.';
        break;
      case 'refund':
        response = 'To check your refund status, please share your order number or email address.';
        break;
      case 'faq':
        response =
          'Here are some frequently asked questions:\n\n1. How long does shipping take?\n2. What is your return policy?\n3. How do I track my order?\n\nWhich one would you like to know more about?';
        break;
    }

    const botMessage = {
      id: Date.now().toString(),
      type: 'bot' as const,
      text: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
  };

  return (
    <div className="min-h-screen pb-32 px-6 pt-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-white mb-2">Support</h1>
        <p className="text-white/60">We're here to help 24/7</p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 grid grid-cols-3 gap-4"
      >
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.action}
              onClick={() => handleQuickAction(action.action)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-6 h-6 text-white mx-auto mb-2" />
              <div className="text-white text-sm">{action.label}</div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Chat Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden"
      >
        {/* Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${
                message.type === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'bot'
                    ? 'bg-gradient-to-br from-[#FF6B00] to-[#C84C0C]'
                    : 'bg-white/20'
                }`}
              >
                {message.type === 'bot' ? (
                  <Bot className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`flex-1 max-w-md ${
                  message.type === 'user' ? 'text-right' : ''
                }`}
              >
                <div
                  className={`inline-block px-4 py-3 rounded-2xl ${
                    message.type === 'bot'
                      ? 'bg-white/20 text-white'
                      : 'bg-gradient-to-r from-[#FF6B00] to-[#C84C0C] text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.text}</div>
                </div>
                <div className="text-xs text-white/40 mt-1 px-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input Area */}
        <div className="border-t border-white/20 p-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <motion.button
              onClick={handleSend}
              className="bg-gradient-to-r from-[#FF6B00] to-[#C84C0C] text-white p-3 rounded-2xl hover:opacity-90 transition-opacity"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Contact Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6"
      >
        <h3 className="text-white mb-4">Other Ways to Reach Us</h3>
        <div className="space-y-3 text-white/60">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5" />
            <span>Email: support@daashopping.com</span>
          </div>
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5" />
            <span>Phone: 1-800-DAA-SHOP</span>
          </div>
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5" />
            <span>Live Chat: Available 24/7</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

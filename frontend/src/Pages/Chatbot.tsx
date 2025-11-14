import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Shield } from 'lucide-react';
import bot from '../assets/bot.png';
import bot1 from '../assets/bot1.png';
import bot3 from '../assets/bot3.png';

const StunningChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Welcome to the future of AI assistance! 🚀 How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const containsPhrase = (text: string, phrase: string): boolean => {
    return text.toLowerCase().includes(phrase.toLowerCase());
  };

  const parseQueryIntent = (query: string) => {
    const intentPatterns = {
      'land_purchase': ['buy land', 'purchase land', 'how to buy', 'land price', 'acquire land'],
      'wallet_connection': ['connect wallet', 'wallet connection', 'polkadot wallet', 'how to connect'],
      'land_listing': ['sell land', 'list land', 'how to sell', 'create listing', 'list my land', 'how do i list', 'how to list'],
      'verification': ['verify land', 'land verification', 'inspector', 'trusted inspector'],
      'marketplace_navigation': ['how to use', 'navigate', 'find land', 'search land'],
      'smart_contracts': ['smart contract', 'escrow', 'blockchain', 'nft'],
      'platform_info': ['what is bima', 'how it works', 'about platform'],
      'general_help': ['help', 'support', 'assistance']
    };

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => containsPhrase(query, pattern))) {
        return intent;
      }
    }
    return 'general_help';
  };

  const getBimaResponses = () => {
    return {
      greetings: [
        "Hello! I'm the BIMA AI Assistant. I can help you navigate our decentralized land marketplace and answer questions about buying, selling, and verifying land on the blockchain.",
        "Hi there! Welcome to BIMA. I'm here to help you with blockchain-secured land transactions and marketplace navigation."
      ],
      
      intents: {
        land_purchase: {
          responses: [
            "To purchase land on BIMA:\n\n1. Connect your Polkadot wallet\n2. Browse available listings in the Marketplace\n3. Select a property and review details\n4. Ensure the land is verified by trusted inspectors\n5. Complete the purchase through our smart contract escrow system\n\nAll transactions are secured on the Polkadot blockchain!"
          ]
        },
        
        wallet_connection: {
          responses: [
            "To connect your wallet to BIMA:\n\n1. Install a Polkadot-compatible wallet (Polkadot.js extension recommended)\n2. Click the wallet icon in the top navigation\n3. Select your preferred wallet\n4. Authorize the connection\n\nYour wallet enables secure transactions and land ownership verification on our platform."
          ]
        },
        
        land_listing: {
          responses: [
            "To list your land for sale on BIMA:\n\n1. Navigate to 'Sell Land' page\n2. Connect your Polkadot wallet\n3. Upload property documents and photos\n4. Set your asking price\n5. Submit for community verification\n6. Once verified, your listing goes live!\n\nOur blockchain system ensures transparent and fraud-proof listings."
          ]
        },
        
        verification: {
          responses: [
            "BIMA's verification system works through:\n\n1. Trusted community inspectors review all listings\n2. Multi-signature consensus validates property details\n3. Blockchain records create immutable proof\n4. NFT land titles eliminate fraud\n\nOnly verified properties appear in our marketplace, ensuring buyer confidence."
          ]
        },
        
        marketplace_navigation: {
          responses: [
            "Navigating BIMA is easy:\n\n• **Marketplace**: Browse all verified land listings\n• **Sell Land**: List your property for sale\n• **Inspectors**: View trusted community verifiers\n• **How It Works**: Learn about our process\n\nUse filters to find land by location, price, or property type!"
          ]
        },
        
        smart_contracts: {
          responses: [
            "BIMA uses smart contracts for:\n\n• **Automated Escrow**: Funds held securely until transfer\n• **NFT Land Titles**: Immutable ownership proof\n• **Multi-sig Verification**: Community consensus\n• **Instant Settlement**: No waiting for paperwork\n\nAll powered by Polkadot's secure blockchain infrastructure."
          ]
        },
        
        platform_info: {
          responses: [
            "BIMA is a decentralized land marketplace that:\n\n✓ Eliminates land fraud through blockchain verification\n✓ Reduces transaction time from months to minutes\n✓ Uses community-verified trust system\n✓ Provides global access to land markets\n✓ Operates on carbon-negative Polkadot network\n\nWe're revolutionizing real estate with Web3 technology!"
          ]
        },
        
        general_help: {
          responses: [
            "I can help you with:\n\n• Buying and selling land on BIMA\n• Connecting your Polkadot wallet\n• Understanding our verification process\n• Navigating the marketplace\n• Learning about smart contracts\n\nWhat specific question do you have about our platform?"
          ]
        }
      }
    };
  };

  const fetchBotReply = async (userText: string): Promise<string> => {
    const responses = getBimaResponses();
    const intent = parseQueryIntent(userText);
    
    // Check for greeting patterns
    const greetingPatterns = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
    if (greetingPatterns.some(pattern => containsPhrase(userText, pattern))) {
      return responses.greetings[Math.floor(Math.random() * responses.greetings.length)];
    }
    
    // Return intent-based response
    const intentResponses = responses.intents[intent as keyof typeof responses.intents];
    if (intentResponses && intentResponses.responses.length > 0) {
      return intentResponses.responses[Math.floor(Math.random() * intentResponses.responses.length)];
    }
    
    // Fallback response
    return "I'm here to help with BIMA platform questions! You can ask me about buying land, selling property, wallet connections, or how our verification system works. What would you like to know?";
  };

  const handleSubmit = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = { 
      text: inputMessage, 
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    try {
      const botText = await fetchBotReply(userMessage.text);
      const botMessage = { 
        text: botText, 
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const botMessage = { 
        text: 'Sorry, I had trouble reaching the AI service. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(236, 72, 153, 0.3); }
          50% { box-shadow: 0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(236, 72, 153, 0.5); }
        }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.4s ease-out;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.4s ease-out;
        }

        .animate-pulse-ring {
          animation: pulse-ring 2s ease-out infinite;
        }

        .glass-effect {
          backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .text-shadow-glow {
          text-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
        }

        .message-hover:hover {
          transform: translateY(-2px);
          transition: transform 0.2s ease;
        }
      `}</style>



      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="relative">
          {/* Animated Rings */}
          {!isOpen && (
            <>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse-ring"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse-ring" style={{ animationDelay: '1s' }}></div>
            </>
          )}
          
          {/* Main Button */}
          <button
            onClick={toggleChat}
            className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white p-5 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 transform hover:scale-110 active:scale-95 animate-gradient-shift animate-glow"
            aria-label="Toggle chat"
          >
            <div className="relative">
              {isOpen ? (
                <X className="w-7 h-7" />
              ) : (
                <MessageSquare className="w-7 h-7" />
              )}
            </div>
          </button>
        </div>
        
        {/* Notification Badge */}
        {!isOpen && (
          <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce shadow-lg">
            AI
          </div>
        )}
      </div>
      
      {/* Chat Interface */}
      <div className={`fixed bottom-28 right-8 w-full max-w-[400px] rounded-3xl shadow-2xl overflow-hidden transition-all duration-700 z-50 transform ${
        isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8 pointer-events-none'
      }`}>
        {/* Glass Effect Container */}
        <div className="glass-effect backdrop-blur-2xl">
          {/* Chat Header */}
          <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 animate-gradient-shift text-white p-6 overflow-hidden">
            {/* Header Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
              }}></div>
            </div>

            <div className="relative flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {/* AI Avatar with Hacker Image */}
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 animate-glow">
                    <div className="w-full h-full bg-black rounded-2xl overflow-hidden">
                      <img 
                        src={bot} 
                        alt="BIMA Assistant"
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                </div>
                <div>
                  <h2 className="font-bold text-lg text-shadow-glow">BIMA AI Assistant</h2>
                </div>
              </div>
              <button 
                onClick={toggleChat} 
                className="text-white hover:bg-white/20 p-2.5 rounded-xl transition-all duration-300 transform hover:rotate-180 hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          
          {/* Chat Messages */}
          <div className="h-[420px] overflow-y-auto p-6 bg-gradient-to-b from-white/95 to-purple-50/95 backdrop-blur-xl">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-6 flex items-end gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'
                }`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                  message.sender === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500' 
                    : 'bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 p-0.5'
                }`}>
                  {message.sender === 'user' ? (
                    <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                      <img 
                        src={bot1} 
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-black rounded-2xl overflow-hidden flex items-center justify-center">
                      <img 
                        src={bot3} 
                        alt="Bot"
                        className="w-full h-full object-cover opacity-70"
                      />
                    </div>
                  )}
                </div>
                
                {/* Message Bubble */}
                <div className={`max-w-[75%] flex flex-col ${
                  message.sender === 'user' ? 'items-end' : 'items-start'
                }`}>
                  <div className={`p-4 rounded-2xl shadow-lg message-hover transition-all duration-300 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm border-2 border-purple-100'
                  }`}>
                    <p className="text-sm leading-relaxed font-medium">{message.text}</p>
                  </div>
                  <span className="text-xs text-gray-500 mt-2 px-2 font-medium">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isLoading && (
              <div className="mb-6 flex items-end gap-3 animate-slide-in-left">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 shadow-lg p-0.5">
                  <div className="w-full h-full bg-black rounded-2xl overflow-hidden flex items-center justify-center">
                    <img 
                      src={bot} 
                      alt="Bot"
                      className="w-full h-full object-cover opacity-70"
                    />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-bl-sm shadow-lg border-2 border-purple-100">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-bounce"></div>
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat Input */}
          <div className="p-5 bg-white/95 backdrop-blur-xl border-t-2 border-purple-100">
            <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-1 transition-all duration-300 focus-within:ring-4 focus-within:ring-purple-300 focus-within:shadow-xl">
              <input
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent px-5 py-3 focus:outline-none text-gray-800 placeholder-gray-400 font-medium"
                disabled={isLoading}
              />
              <button
                onClick={handleSubmit}
                className={`p-3.5 rounded-xl transition-all duration-300 transform ${
                  inputMessage.trim() 
                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white hover:shadow-2xl hover:scale-105 active:scale-95 animate-gradient-shift' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={isLoading || !inputMessage.trim()}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Footer Info */}
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-purple-500" />
                <span>Encrypted & Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>AI Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StunningChatbot;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Wallet, LogOut, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { connectWallet, getBalanceFormatted, isExtensionAvailable } from '@/wallet/polkadotConnector';
import { Link, useLocation } from 'react-router-dom';
import { useWalletStore } from '@/state/wallet';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("home");
  const [dotBalanceStr, setDotBalanceStr] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const location = useLocation();
  const setAddress = useWalletStore((s) => s.setAddress);
  const setDotBalance = useWalletStore((s) => s.setDotBalance);

  const navLinks = [
    { name: "Home", id: "home", to: "/" },
    { name: "Marketplace", id: "marketplace", to: "/marketplace" },
    { name: "Inspectors", id: "inspectors", to: "/inspectors" },
    { name: "Inspector Dashboard", id: "inspector-dashboard", to: "/inspector-dashboard" },
    { name: "How It Works", id: "how-it-works", to: "/how-it-works" },
  ];

  // Track active link based on current path
  useEffect(() => {
    const pathToId: Record<string, string> = {
      "/": "home",
      "/marketplace": "marketplace", 
      "/inspectors": "inspectors",
      "/how-it-works": "how-it-works",
      "/inspector-dashboard": "inspectors",
    };
    const id = pathToId[location.pathname] || "home";
    setActiveSection(id);
  }, [location.pathname]);

  const fetchAccountInfo = async (address: string) => {
    try {
      setIsBalanceLoading(true);
      const balStr = await getBalanceFormatted(address);
      setDotBalanceStr(balStr);
      setDotBalance(balStr);
    } catch (err) {
      console.error('Failed to fetch Polkadot balance', err);
      setDotBalanceStr(null);
      setDotBalance(null);
    }
    finally {
      setIsBalanceLoading(false);
    }
  };

  const handleConnect = async () => {
    if (isConnecting) return;
    try {
      setIsConnecting(true);
      setErrorMsg(null);
      const accounts = await connectWallet();
      const first = accounts?.[0]?.address;
      if (first) {
        setAccountId(first);
        setAddress(first);
        fetchAccountInfo(first);
      } else {
        setErrorMsg('No Polkadot accounts found in the extension. Create or import an account and try again.');
      }
    } catch (e) {
      console.error('Failed to connect Polkadot wallet:', e);
      const message = e instanceof Error ? e.message : 'Unknown error connecting wallet.';
      // Common guidance for missing extension or denied access
      if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('denied')) {
        setErrorMsg('Polkadot.js extension not found or access denied. Install/enable the extension and approve access.');
      } else {
        setErrorMsg(message);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAccountId(null);
    setDotBalanceStr(null);
    setErrorMsg(null);
    setAddress(null);
    setDotBalance(null);
  };

  const extAvailable = isExtensionAvailable();

  return (
    <motion.header
      className="relative z-50 border-b border-border/50 backdrop-blur-xl bg-background/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Link to="/">
              <div className="relative">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-lg blur-lg opacity-50"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <div className="relative px-4 py-2 bg-gradient-to-r from-primary to-accent rounded-lg">
                  <span className="text-2xl font-black text-background">Bima</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {navLinks.map((link, index) => (
              <Link key={link.name} to={link.to} className="group">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  aria-current={activeSection === link.id ? 'page' : undefined}
                  className={`relative px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    activeSection === link.id
                      ? 'text-foreground border border-primary/40 bg-secondary/60'
                      : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60 border border-transparent hover:border-primary/30'
                  }`}
                >
                  <span className="relative z-10">{link.name}</span>
                  <motion.div
                    className="absolute inset-0 rounded-md pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: activeSection === link.id ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                  />
                  <span
                    className={`pointer-events-none absolute left-4 right-4 -bottom-1 h-0.5 rounded-full transition-opacity duration-200 ${
                      activeSection === link.id ? 'opacity-100 bg-gradient-to-r from-primary via-accent to-primary' : 'opacity-0 group-hover:opacity-100 bg-primary/60'
                    }`}
                  />
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Theme Toggle & Connect Wallet Button - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <Button
              type="button"
              aria-label="Connect Wallet"
              onClick={handleConnect}
              disabled={isConnecting}
              className="cursor-pointer select-none flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-lg relative overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Wallet className="w-5 h-5" />
              <span className="text-left">
                {isConnecting
                  ? 'Connecting…'
                  : accountId
                    ? `${accountId.slice(0, 6)}...${accountId.slice(-4)}${
                        isBalanceLoading ? ' • fetching…' : dotBalanceStr ? ` • ${dotBalanceStr} DOT` : ''
                      }`
                    : 'Connect Wallet'}
              </span>
            </Button>
            {accountId && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDisconnect}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            whileTap={{ scale: 0.95 }}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>
      </nav>

      {(!extAvailable && !accountId) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mt-2 mb-0 rounded-md border border-primary/30 bg-primary/10 text-primary px-4 py-2 text-sm">
            Polkadot.js extension not detected. Install it from
            {' '}<a className="underline font-medium" href="https://polkadot.js.org/extension" target="_blank" rel="noreferrer">polkadot.js.org/extension</a>
            {' '}and refresh this page.
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mt-2 mb-2 rounded-md border border-destructive/30 bg-destructive/10 text-destructive px-4 py-2 text-sm">
            {errorMsg}
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link, index) => (
                <Link key={link.name} to={link.to} onClick={() => setIsMenuOpen(false)} className="block">
                  <motion.div
                    aria-current={activeSection === link.id ? 'page' : undefined}
                    className={`px-4 py-3 text-base font-semibold rounded-lg transition-colors ${
                      activeSection === link.id
                        ? 'text-foreground bg-secondary border border-primary/40'
                        : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {link.name}
                  </motion.div>
                </Link>
              ))}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <ThemeToggle />
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-lg disabled:opacity-70"
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wallet className="w-4 h-4" />
                  )}
                  <span className="text-left">
                    {isConnecting
                      ? 'Connecting…'
                      : accountId
                        ? `${accountId.slice(0, 6)}...${accountId.slice(-4)}${
                            isBalanceLoading ? ' • fetching…' : dotBalanceStr ? ` • ${dotBalanceStr} DOT` : ''
                          }`
                        : 'Connect Wallet'}
                  </span>
                </Button>
                {accountId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDisconnect}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { 
  Shield, 
  Zap, 
  Globe, 
  Lock, 
  ArrowRight, 
  CheckCircle, 
  Wallet, 
  Activity,
  Layers,
  Fingerprint,
  Key,
  Cpu,
  Network,
  Terminal,
  Search,
  Eye,
  Users,
  Clock,
  ChevronRight,
  Play,
  X,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useStore } from '@/lib/store';

function HeroScene() {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00f5d4" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#7b2cbf" />
        <Sphere args={[1, 64, 64]} position={[0, 0, 0]}>
          <MeshDistortMaterial
            color="#00f5d4"
            attach="material"
            distort={0.4}
            speed={2}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}

function AnimatedGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-[100px] animate-pulse" 
           style={{ top: '10%', left: '10%' }} />
      <div className="absolute w-[400px] h-[400px] bg-gradient-to-r from-pink-500/20 to-cyan-500/20 rounded-full blur-[80px] animate-pulse"
           style={{ bottom: '20%', right: '15%', animationDelay: '1s' }} />
      <div className="absolute w-[300px] h-[300px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-[60px] animate-pulse"
           style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animationDelay: '2s' }} />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, delay, color }: {
  icon: any;
  title: string;
  description: string;
  delay: number;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card p-8 card-hover group cursor-pointer"
    >
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${color} group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold mb-3 text-gradient">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function ChainButton({ chain, logo, connected }: { chain: string; logo: string; connected: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-all ${
        connected 
          ? 'border-cyan-500 bg-cyan-500/10' 
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-sm font-bold">
        {logo}
      </div>
      <span className="font-medium">{chain}</span>
      {connected && <CheckCircle className="w-5 h-5 text-cyan-500" />}
    </motion.button>
  );
}

function WalletModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [connecting, setConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('');
  const { connectWallet, address } = useStore();

  const wallets = [
    { id: 'phantom', name: 'Phantom', icon: '👻' },
    { id: 'solflare', name: 'Solflare', icon: '🔥' },
    { id: 'metamask', name: 'MetaMask', icon: '🦊' },
    { id: 'walletconnect', name: 'WalletConnect', icon: '🔗' },
  ];

  const handleConnect = async (walletId: string) => {
    setSelectedWallet(walletId);
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setStep(2);
    }, 1500);
  };

  const handleConfirm = () => {
    connectWallet('demo-address');
    onClose();
    setStep(1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card p-8 max-w-md w-full"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">
              {step === 1 ? 'Connect Wallet' : 'Confirm Connection'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              {wallets.map((wallet) => (
                <motion.button
                  key={wallet.id}
                  whileHover={{ x: 10 }}
                  onClick={() => handleConnect(wallet.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <span className="text-3xl">{wallet.icon}</span>
                  <span className="font-medium text-lg">{wallet.name}</span>
                  <ChevronRight className="w-5 h-5 ml-auto text-gray-500" />
                </motion.button>
              ))}
              {connecting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-8"
                >
                  <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
                </motion.div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <p className="text-gray-400">Connection request from</p>
                <p className="text-xl font-mono mt-2 text-cyan-400">CrossChain Hub</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4 font-mono text-sm text-gray-400">
                <p>• View your balance and transactions</p>
                <p>• Request transaction approvals</p>
                <p>• Connect to dApps</p>
              </div>
              <button
                onClick={handleConfirm}
                className="w-full btn-primary"
              >
                Connect
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TransferDemo({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState('1000');
  const [sourceChain, setSourceChain] = useState('solana');
  const [destChain, setDestChain] = useState('ethereum');
  const [zkVerified, setZkVerified] = useState(false);
  const [generating, setGenerating] = useState(false);

  const chains = [
    { id: 'solana', name: 'Solana', icon: 'S', color: 'from-purple-500 to-pink-500' },
    { id: 'ethereum', name: 'Ethereum', icon: 'E', color: 'from-blue-500 to-cyan-500' },
    { id: 'polygon', name: 'Polygon', icon: 'P', color: 'from-purple-500 to-purple-700' },
  ];

  const steps = [
    { title: 'Amount', description: 'Enter transfer amount' },
    { title: 'Source', description: 'Select source chain' },
    { title: 'Destination', description: 'Select destination' },
    { title: 'Verify', description: 'ZK Proof verification' },
    { title: 'Complete', description: 'Transfer initiated' },
  ];

  useEffect(() => {
    if (step === 3 && !zkVerified) {
      setGenerating(true);
      setTimeout(() => {
        setGenerating(false);
        setZkVerified(true);
        setTimeout(() => setStep(4), 1000);
      }, 2500);
    }
  }, [step, zkVerified]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gradient">Cross-Chain Transfer</h2>
              <p className="text-gray-400 mt-1">Experience seamless asset transfer</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex justify-between mb-8 relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 -translate-y-1/2" />
            <motion.div 
              className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 -translate-y-1/2"
              animate={{ width: `${(step / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
            {steps.map((s, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <motion.div
                  animate={{ 
                    backgroundColor: i <= step ? '#00f5d4' : '#374151',
                    scale: i === step ? 1.2 : 1
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                >
                  {i < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
                </motion.div>
                <span className="text-xs mt-2 text-gray-500">{s.title}</span>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="min-h-[300px]">
            {step === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <label className="block text-sm text-gray-400 mb-2">Amount (USDC)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-glass text-3xl font-bold"
                  placeholder="0.00"
                />
                <div className="flex gap-2 mt-4">
                  {[100, 500, 1000, 5000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(v.toString())}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <label className="block text-sm text-gray-400 mb-4">Select Source Chain</label>
                <div className="grid grid-cols-3 gap-4">
                  {chains.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setSourceChain(chain.id)}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        sourceChain === chain.id
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${chain.color} flex items-center justify-center text-2xl font-bold`}>
                        {chain.icon}
                      </div>
                      <p className="font-medium">{chain.name}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <label className="block text-sm text-gray-400 mb-4">Select Destination Chain</label>
                <div className="grid grid-cols-3 gap-4">
                  {chains.filter(c => c.id !== sourceChain).map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setDestChain(chain.id)}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        destChain === chain.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${chain.color} flex items-center justify-center text-2xl font-bold`}>
                        {chain.icon}
                      </div>
                      <p className="font-medium">{chain.name}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="text-center py-8">
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30 animate-ping" />
                    <div className="absolute inset-4 rounded-full border-4 border-purple-500/30 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {generating ? (
                        <RefreshCw className="w-12 h-12 text-cyan-500 animate-spin" />
                      ) : zkVerified ? (
                        <CheckCircle className="w-12 h-12 text-green-500" />
                      ) : (
                        <Fingerprint className="w-12 h-12 text-cyan-500" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {generating ? 'Generating ZK Proof' : 'Verification Complete'}
                  </h3>
                  <p className="text-gray-400">
                    {generating 
                      ? 'Generating zero-knowledge proof for privacy-preserving verification...' 
                      : 'Your transaction has been privately verified'}
                  </p>
                  {generating && (
                    <div className="mt-6 max-w-xs mx-auto">
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 2.5 }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2 font-mono">Circuit: Kyber512 • Proof: PLONK</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center"
                  >
                    <Zap className="w-12 h-12 text-white" />
                  </motion.div>
                  <h3 className="text-3xl font-bold mb-2 text-gradient">Transfer Initiated!</h3>
                  <p className="text-gray-400 mb-6">Your cross-chain transfer is being processed</p>
                  
                  <div className="bg-black/30 rounded-xl p-4 font-mono text-sm text-left space-y-2 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount</span>
                      <span className="text-cyan-400">{amount} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">From</span>
                      <span className="text-purple-400 capitalize">{sourceChain}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">To</span>
                      <span className="text-purple-400 capitalize">{destChain}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">TX Hash</span>
                      <span className="text-gray-400 truncate max-w-[150px]">7x9f...3m2k</span>
                    </div>
                  </div>
                  
                  <button className="btn-secondary inline-flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View Transaction
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Navigation */}
          {step < 3 && (
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(step + 1)}
                className="btn-primary inline-flex items-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ComplianceDemo({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (step === 1 && !verified) {
      setVerifying(true);
      setTimeout(() => {
        setVerifying(false);
        setVerified(true);
      }, 3000);
    }
  }, [step, verified]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card p-8 max-w-lg w-full"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold">eIDAS 2.0 Compliance</h2>
              <p className="text-gray-400 text-sm mt-1">EU Regulatory Compliance Verification</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center py-12">
            <div className="relative w-40 h-40 mx-auto mb-8">
              {verifying ? (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-purple-500 animate-spin" />
                  <div className="absolute inset-4 rounded-full border-4 border-t-green-500 border-l-pink-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                </>
              ) : verified ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center"
                  >
                    <Shield className="w-20 h-20 text-white" />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -inset-4 rounded-full border-2 border-green-500/50"
                  />
                </>
              ) : (
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <Shield className="w-20 h-20 text-gray-600" />
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold mb-2">
              {verifying ? 'Verifying Identity...' : verified ? 'Identity Verified' : 'Start Verification'}
            </h3>
            <p className="text-gray-400 mb-6">
              {verifying 
                ? 'Checking qualified certificates and compliance status' 
                : verified 
                  ? 'You are now eIDAS compliant with High assurance level'
                  : 'Verify your identity for regulated transactions'}
            </p>

            {step === 0 && (
              <button onClick={() => setStep(1)} className="btn-primary">
                Start Verification
              </button>
            )}

            {verified && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-left space-y-2 mt-6">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Qualified Electronic Signature</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">KYC/AML Verified</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">EU Jurisdiction Compliant</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Home() {
  const [walletOpen, setWalletOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Globe,
      title: 'Multi-Chain Bridge',
      description: 'Seamlessly transfer assets between Solana, Ethereum, Polygon, and more with atomic swaps.',
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      delay: 0.1,
    },
    {
      icon: Shield,
      title: 'eIDAS 2.0 Compliance',
      description: 'Full EU regulatory compliance with Qualified Electronic Signatures and timestamps.',
      color: 'bg-gradient-to-br from-cyan-500 to-blue-500',
      delay: 0.2,
    },
    {
      icon: Lock,
      title: 'Zero-Knowledge Proofs',
      description: 'Privacy-preserving transactions with zk-SNARKs and zk-STARKs cryptographic verification.',
      color: 'bg-gradient-to-br from-green-500 to-cyan-500',
      delay: 0.3,
    },
    {
      icon: Key,
      title: 'Arcium Integration',
      description: 'Encrypted compute network for confidential smart contracts on Solana.',
      color: 'bg-gradient-to-br from-orange-500 to-red-500',
      delay: 0.4,
    },
    {
      icon: Users,
      title: 'Multi-Sig Wallets',
      description: 'Enterprise-grade multi-signature wallets with customizable thresholds.',
      color: 'bg-gradient-to-br from-blue-500 to-purple-500',
      delay: 0.5,
    },
    {
      icon: Activity,
      title: 'Real-Time Analytics',
      description: 'Monitor cross-chain activity, gas prices, and compliance status in real-time.',
      color: 'bg-gradient-to-br from-pink-500 to-purple-500',
      delay: 0.6,
    },
  ];

  return (
    <main className="relative min-h-screen">
      <AnimatedGradient />
      
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'glass py-4' : 'py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <Network className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">CrossChain Hub</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Demo', 'Documentation', 'Compliance'].map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-gray-400 hover:text-white transition-colors"
                whileHover={{ y: -2 }}
              >
                {item}
              </motion.a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setWalletOpen(true)}
              className="btn-primary text-sm py-2 px-4"
            >
              Connect Wallet
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <HeroScene />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-gray-300">Now supporting Ethereum → Solana bridges</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
              <span className="text-gradient">The Future of</span>
              <br />
              <span className="glow-text">Cross-Chain</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Bridge assets across blockchains with military-grade security, 
              EU eIDAS compliance, and zero-knowledge proof privacy. 
              One platform, infinite possibilities.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTransferOpen(true)}
                className="btn-primary inline-flex items-center gap-2 text-lg"
              >
                <Play className="w-5 h-5" />
                Try Demo
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary inline-flex items-center gap-2 text-lg"
              >
                Read Documentation
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Chain Status */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-20 flex flex-wrap items-center justify-center gap-4"
            >
              <ChainButton chain="Solana" logo="S" connected={true} />
              <ChainButton chain="Ethereum" logo="E" connected={true} />
              <ChainButton chain="Polygon" logo="P" connected={true} />
              <ChainButton chain="Arbitrum" logo="A" connected={false} />
              <ChainButton chain="Optimism" logo="O" connected={false} />
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-gray-600 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 bg-cyan-500 rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold mb-6">
              <span className="text-gradient">Powerful Features</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built with the most advanced security primitives and compliance standards
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5" />
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl font-bold mb-6">
                <span className="text-gradient">Zero-Knowledge</span>
                <br />
                <span className="text-white">Proof Security</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Our platform leverages cutting-edge zk-SNARKs and zk-STARKs cryptography 
                to ensure your transactions remain private while still being verifiable.
              </p>
              
              <div className="space-y-4">
                {[
                  'Proves transaction validity without revealing amounts',
                  'Shielded addresses for complete privacy',
                  'Recursive proofs for scalability',
                  'Post-quantum resistant algorithms',
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-cyan-500" />
                    </div>
                    <span className="text-gray-300">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card p-8"
            >
              <div className="bg-black/40 rounded-2xl p-6 font-mono text-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-gray-500">zk-proof-verifier.ts</span>
                </div>
                <div className="space-y-2 text-gray-300">
                  <p><span className="text-purple-400">import</span> {'{ prove, verify }'} <span className="text-purple-400">from</span> <span className="text-cyan-400">'@crosschain/zkp'</span></p>
                  <p>&nbsp;</p>
                  <p><span className="text-gray-500">// Generate zero-knowledge proof</span></p>
                  <p><span className="text-yellow-400">const</span> proof = <span className="text-blue-400">await</span> prove({'{'}</p>
                  <p className="pl-4">circuit: <span className="text-green-400">'transfer'</span>,</p>
                  <p className="pl-4">publicInput: [amount, recipient],</p>
                  <p className="pl-4">privateInput: {['{'}salt, randomness{'}'].join(', ')}</p>
                  <p>{'}'})</p>
                  <p>&nbsp;</p>
                  <p><span className="text-gray-500">// Verify proof on-chain</span></p>
                  <p><span className="text-yellow-400">const</span> valid = <span className="text-blue-400">await</span> verify(proof)</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section id="compliance" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6">
              <span className="text-gradient">EU eIDAS 2.0</span> Compliant
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Fully compliant with European Union electronic identification and trust services
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Fingerprint,
                title: 'Qualified Signatures',
                description: 'Highest level of electronic signature under EU law',
                color: 'from-cyan-500 to-blue-500',
              },
              {
                icon: Clock,
                title: 'Qualified Timestamps',
                description: 'Legally binding time-stamping for transaction verification',
                color: 'from-purple-500 to-pink-500',
              },
              {
                icon: Shield,
                title: 'AML/KYC Integration',
                description: 'Built-in compliance checks for regulated entities',
                color: 'from-green-500 to-cyan-500',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 text-center"
              >
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <item.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button 
              onClick={() => setComplianceOpen(true)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Try Compliance Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-500/5" />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold mb-6">
              Ready to <span className="text-gradient">Bridge</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Start building with our SDK or explore the demo to see CrossChain Hub in action
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTransferOpen(true)}
                className="btn-primary inline-flex items-center gap-2 text-lg"
              >
                <Zap className="w-5 h-5" />
                Launch Demo
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary inline-flex items-center gap-2 text-lg"
              >
                <Terminal className="w-5 h-5" />
                Read Docs
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">CrossChain Hub</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2024 CrossChain Hub. Built with ❤️ for the decentralized future.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
      <TransferDemo isOpen={transferOpen} onClose={() => setTransferOpen(false)} />
      <ComplianceDemo isOpen={complianceOpen} onClose={() => setComplianceOpen(false)} />
    </main>
  );
}

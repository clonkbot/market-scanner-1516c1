import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Asset {
  id: string;
  name: string;
  symbol: string;
  category: 'futures' | 'commodity' | 'memecoin';
  price: number;
  change5m: number;
  change15m: number;
  change30m: number;
  volume: number;
  momentum: number;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  lastUpdate: Date;
}

// Simulated market data generator
const generateAssetData = (): Asset[] => {
  const baseAssets = [
    { id: 'btc', name: 'Bitcoin', symbol: 'BTC', category: 'futures' as const, basePrice: 67500 },
    { id: 'mnq', name: 'Micro Nasdaq', symbol: 'MNQ', category: 'futures' as const, basePrice: 21250 },
    { id: 'mes', name: 'Micro S&P 500', symbol: 'MES', category: 'futures' as const, basePrice: 5890 },
    { id: 'mgc', name: 'Micro Gold', symbol: 'MGC', category: 'commodity' as const, basePrice: 2340 },
    { id: 'si', name: 'Silver', symbol: 'SI', category: 'commodity' as const, basePrice: 31.50 },
    { id: 'hg', name: 'Copper', symbol: 'HG', category: 'commodity' as const, basePrice: 4.85 },
    { id: 'ng', name: 'Natural Gas', symbol: 'NG', category: 'commodity' as const, basePrice: 2.95 },
    { id: 'pepe', name: 'PEPE', symbol: 'PEPE', category: 'memecoin' as const, basePrice: 0.0000125 },
    { id: 'wif', name: 'dogwifhat', symbol: 'WIF', category: 'memecoin' as const, basePrice: 2.45 },
    { id: 'bonk', name: 'BONK', symbol: 'BONK', category: 'memecoin' as const, basePrice: 0.0000285 },
    { id: 'floki', name: 'FLOKI', symbol: 'FLOKI', category: 'memecoin' as const, basePrice: 0.000185 },
    { id: 'brett', name: 'Brett', symbol: 'BRETT', category: 'memecoin' as const, basePrice: 0.145 },
  ];

  return baseAssets.map(asset => {
    const volatility = asset.category === 'memecoin' ? 0.08 : 0.015;
    const change5m = (Math.random() - 0.5) * volatility * 100;
    const change15m = change5m + (Math.random() - 0.5) * volatility * 100;
    const change30m = change15m + (Math.random() - 0.5) * volatility * 100;
    const momentum = (change5m * 0.5 + change15m * 0.3 + change30m * 0.2);

    let signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (momentum > 1.5) signal = 'BULLISH';
    else if (momentum < -1.5) signal = 'BEARISH';

    return {
      ...asset,
      price: asset.basePrice * (1 + (Math.random() - 0.5) * 0.02),
      change5m,
      change15m,
      change30m,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      momentum,
      signal,
      lastUpdate: new Date(),
    };
  });
};

const formatPrice = (price: number, symbol: string): string => {
  if (symbol === 'PEPE' || symbol === 'BONK' || symbol === 'FLOKI') {
    return price.toFixed(8);
  }
  if (symbol === 'BRETT' || symbol === 'WIF') {
    return price.toFixed(4);
  }
  if (price < 10) {
    return price.toFixed(3);
  }
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatVolume = (vol: number): string => {
  if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
  if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`;
  return vol.toString();
};

const SignalBadge: React.FC<{ signal: Asset['signal'] }> = ({ signal }) => {
  const colors = {
    BULLISH: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    BEARISH: 'bg-red-500/20 text-red-400 border-red-500/50',
    NEUTRAL: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-mono border rounded ${colors[signal]}`}>
      {signal}
    </span>
  );
};

const MomentumBar: React.FC<{ value: number }> = ({ value }) => {
  const absValue = Math.min(Math.abs(value), 10);
  const width = (absValue / 10) * 100;
  const isPositive = value >= 0;

  return (
    <div className="relative h-2 w-20 md:w-24 bg-zinc-800 rounded-sm overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`absolute h-full ${isPositive ? 'bg-emerald-500 left-1/2' : 'bg-red-500 right-1/2'}`}
        style={{
          boxShadow: isPositive ? '0 0 10px #10b981' : '0 0 10px #ef4444',
        }}
      />
      <div className="absolute left-1/2 top-0 h-full w-px bg-zinc-600" />
    </div>
  );
};

const ChangeCell: React.FC<{ value: number }> = ({ value }) => {
  const isPositive = value >= 0;
  return (
    <span className={`font-mono text-xs md:text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
      {isPositive ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
};

const ScanLine: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
    <motion.div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
      animate={{
        top: ['0%', '100%'],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  </div>
);

const RadarPulse: React.FC = () => (
  <div className="absolute -right-8 md:-right-20 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
    <div className="relative w-40 h-40 md:w-64 md:h-64">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 border-2 border-cyan-400 rounded-full"
          initial={{ scale: 0.3, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: 'easeOut',
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
      </div>
    </div>
  </div>
);

const AssetRow: React.FC<{ asset: Asset; index: number }> = ({ asset, index }) => {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 300);
    return () => clearTimeout(timer);
  }, [asset.price]);

  const categoryColors = {
    futures: 'border-l-cyan-400',
    commodity: 'border-l-amber-400',
    memecoin: 'border-l-fuchsia-400',
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors border-l-2 ${categoryColors[asset.category]} ${flash ? 'bg-cyan-500/10' : ''}`}
    >
      <td className="py-2 md:py-3 px-2 md:px-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="font-bold text-zinc-100 text-xs md:text-sm">{asset.symbol}</div>
            <div className="text-xs text-zinc-500 hidden md:block">{asset.name}</div>
          </div>
        </div>
      </td>
      <td className="py-2 md:py-3 px-2 md:px-4 font-mono text-zinc-200 text-xs md:text-sm">
        ${formatPrice(asset.price, asset.symbol)}
      </td>
      <td className="py-2 md:py-3 px-2 md:px-4 hidden sm:table-cell">
        <ChangeCell value={asset.change5m} />
      </td>
      <td className="py-2 md:py-3 px-2 md:px-4 hidden md:table-cell">
        <ChangeCell value={asset.change15m} />
      </td>
      <td className="py-2 md:py-3 px-2 md:px-4">
        <ChangeCell value={asset.change30m} />
      </td>
      <td className="py-2 md:py-3 px-2 md:px-4 hidden lg:table-cell">
        <MomentumBar value={asset.momentum} />
      </td>
      <td className="py-2 md:py-3 px-2 md:px-4 font-mono text-zinc-400 text-xs hidden md:table-cell">
        {formatVolume(asset.volume)}
      </td>
      <td className="py-2 md:py-3 px-2 md:px-4">
        <SignalBadge signal={asset.signal} />
      </td>
    </motion.tr>
  );
};

type CategoryFilter = 'all' | 'futures' | 'commodity' | 'memecoin';

export default function App() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<'momentum' | 'change30m'>('momentum');
  const [scanningIndex, setScanningIndex] = useState(0);

  const refreshData = useCallback(() => {
    setAssets(generateAssetData());
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanningIndex(prev => (prev + 1) % 12);
    }, 400);
    return () => clearInterval(scanInterval);
  }, []);

  const filteredAssets = assets
    .filter(a => filter === 'all' || a.category === filter)
    .sort((a, b) => Math.abs(b[sortBy]) - Math.abs(a[sortBy]));

  const filterButtons: { key: CategoryFilter; label: string; color: string }[] = [
    { key: 'all', label: 'ALL', color: 'cyan' },
    { key: 'futures', label: 'FUTURES', color: 'cyan' },
    { key: 'commodity', label: 'COMMODITIES', color: 'amber' },
    { key: 'memecoin', label: 'MEMECOINS', color: 'fuchsia' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Scanline effect */}
      <ScanLine />

      {/* Noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        {/* Header */}
        <header className="mb-6 md:mb-8 relative">
          <RadarPulse />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-4 md:mb-6"
          >
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter">
              <span className="text-cyan-400">MARKET</span>
              <span className="text-zinc-100">_SCANNER</span>
            </h1>
            <div className="flex items-center gap-2 text-xs md:text-sm text-zinc-500 font-mono">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>LIVE</span>
              <span className="hidden md:inline">|</span>
              <span className="hidden md:inline">5-15 MIN CHARTS</span>
              <span className="hidden md:inline">|</span>
              <span className="hidden md:inline">30M WINDOW</span>
            </div>
          </motion.div>

          <div className="text-xs text-zinc-500 font-mono mb-4 md:hidden">
            5-15 MIN CHARTS | 30M WINDOW
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {filterButtons.map(btn => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`px-3 md:px-4 py-2 text-xs font-mono border rounded transition-all min-h-[44px] ${
                  filter === btn.key
                    ? `bg-${btn.color}-500/20 border-${btn.color}-500 text-${btn.color}-400`
                    : 'bg-zinc-900/50 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
                style={filter === btn.key ? {
                  backgroundColor: btn.color === 'cyan' ? 'rgba(6, 182, 212, 0.2)' :
                                   btn.color === 'amber' ? 'rgba(245, 158, 11, 0.2)' :
                                   'rgba(217, 70, 239, 0.2)',
                  borderColor: btn.color === 'cyan' ? '#06b6d4' :
                               btn.color === 'amber' ? '#f59e0b' : '#d946ef',
                  color: btn.color === 'cyan' ? '#22d3ee' :
                         btn.color === 'amber' ? '#fbbf24' : '#e879f9',
                } : {}}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Sort options */}
          <div className="flex gap-2 items-center text-xs font-mono text-zinc-500">
            <span>SORT:</span>
            <button
              onClick={() => setSortBy('momentum')}
              className={`px-2 py-1 rounded min-h-[36px] ${sortBy === 'momentum' ? 'bg-zinc-800 text-cyan-400' : 'hover:bg-zinc-800/50'}`}
            >
              MOMENTUM
            </button>
            <button
              onClick={() => setSortBy('change30m')}
              className={`px-2 py-1 rounded min-h-[36px] ${sortBy === 'change30m' ? 'bg-zinc-800 text-cyan-400' : 'hover:bg-zinc-800/50'}`}
            >
              30M CHANGE
            </button>
          </div>
        </header>

        {/* Scanner status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-2 md:p-3 bg-zinc-900/50 border border-zinc-800 rounded font-mono text-xs"
        >
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <span className="text-zinc-500">SCANNING:</span>
            <div className="flex gap-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 md:w-2 h-3 md:h-4 rounded-sm transition-colors ${
                    i === scanningIndex ? 'bg-cyan-400' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
            <span className="text-emerald-400">{filteredAssets.length} ASSETS TRACKED</span>
            <span className="text-zinc-600 hidden md:inline">|</span>
            <span className="text-zinc-500 hidden md:inline">REFRESH: 5s</span>
          </div>
        </motion.div>

        {/* Main table */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-900/50">
                  <th className="py-2 md:py-3 px-2 md:px-4 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider">Asset</th>
                  <th className="py-2 md:py-3 px-2 md:px-4 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider">Price</th>
                  <th className="py-2 md:py-3 px-2 md:px-4 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider hidden sm:table-cell">5m</th>
                  <th className="py-2 md:py-3 px-2 md:px-4 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider hidden md:table-cell">15m</th>
                  <th className="py-2 md:py-3 px-2 md:px-4 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider">30m</th>
                  <th className="py-2 md:py-3 px-2 md:px-4 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Momentum</th>
                  <th className="py-2 md:py-3 px-2 md:px-4 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider hidden md:table-cell">Vol</th>
                  <th className="py-2 md:py-3 px-2 md:px-4 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider">Signal</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredAssets.map((asset, index) => (
                    <AssetRow key={asset.id} asset={asset} index={index} />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 md:mt-6 flex flex-wrap gap-3 md:gap-6 text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-cyan-400" />
            <span>Futures</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-amber-400" />
            <span>Commodities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-fuchsia-400" />
            <span>Memecoins</span>
          </div>
        </div>

        {/* Alerts section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 md:mt-8"
        >
          <h2 className="text-sm font-mono text-zinc-400 mb-3 flex items-center gap-2">
            <span className="text-amber-400">!</span> MOMENTUM ALERTS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {filteredAssets
              .filter(a => Math.abs(a.momentum) > 2)
              .slice(0, 4)
              .map((asset) => (
                <motion.div
                  key={`alert-${asset.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-3 md:p-4 rounded border ${
                    asset.momentum > 0
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-sm">{asset.symbol}</span>
                      <span className="text-zinc-500 ml-2 text-xs">{asset.name}</span>
                    </div>
                    <ChangeCell value={asset.change30m} />
                  </div>
                  <div className="mt-2 text-xs text-zinc-400 font-mono">
                    {asset.momentum > 0 ? 'Strong upward' : 'Strong downward'} momentum detected
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="mt-12 md:mt-16 pb-4 md:pb-8 text-center">
          <p className="text-xs text-zinc-600 font-mono">
            Requested by @Quincy · Built by @clonkbot
          </p>
        </footer>
      </div>
    </div>
  );
}

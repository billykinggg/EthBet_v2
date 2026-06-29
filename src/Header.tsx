import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, Info, Activity, ShieldCheck, Database } from 'lucide-react';

interface HeaderProps {
  account: string;
  isSandbox: boolean;
}

export default function Header({ account, isSandbox }: HeaderProps) {
  const location = useLocation();

  const getLinkClass = (path: string) => {
    const base = "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200";
    const isActive = location.pathname === path;
    return isActive 
      ? `${base} bg-indigo-600 text-white shadow-md shadow-indigo-500/20`
      : `${base} text-slate-300 hover:text-white hover:bg-slate-800`;
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 12h5v8h10v-8h5L12 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white tracking-wide text-lg">Eth Price Bet</span>
              <span className="text-[10px] text-slate-400 font-mono">Prediction Market</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <Link to="/" className={getLinkClass('/')}>
              <Activity className="w-4 h-4" />
              Betting Market
            </Link>
            <Link to="/Wallet" className={getLinkClass('/Wallet')}>
              <Wallet className="w-4 h-4" />
              Wallet Info
            </Link>
            <Link to="/Etherscan" className={getLinkClass('/Etherscan')}>
              <Info className="w-4 h-4" />
              Etherscan Stats
            </Link>
          </nav>

          {/* Wallet Connection / Sandbox Status */}
          <div className="flex items-center gap-2.5">
            {isSandbox ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium font-mono">
                <Database className="w-3.5 h-3.5 animate-pulse" />
                SANDBOX MODE
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                LIVE WEB3
              </div>
            )}

            {account ? (
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </div>
            ) : (
              <div className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-700/50 font-mono">
                Wallet Locked
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60">
          <Link to="/" className="flex flex-col items-center gap-1 text-[11px] text-slate-400 hover:text-white">
            <Activity className="w-4 h-4" />
            Betting
          </Link>
          <Link to="/Wallet" className="flex flex-col items-center gap-1 text-[11px] text-slate-400 hover:text-white">
            <Wallet className="w-4 h-4" />
            Wallet
          </Link>
          <Link to="/Etherscan" className="flex flex-col items-center gap-1 text-[11px] text-slate-400 hover:text-white">
            <Info className="w-4 h-4" />
            Etherscan
          </Link>
        </div>
      </div>
    </header>
  );
}

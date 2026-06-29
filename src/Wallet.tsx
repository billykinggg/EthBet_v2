import React, { useState, useEffect } from 'react';
import Header from './Header';
import web3 from './web3';
import { Wallet as WalletIcon, Coins, RefreshCw, Key, Shield, Info, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WalletProps {
  account: string;
  accountBalance: string;
  isSandbox: boolean;
  onConnectWallet: () => void;
  mockWallets?: { address: string; label: string; balance: number }[];
  onSelectMockWallet?: (address: string) => void;
}

export default function Wallet({
  account,
  accountBalance,
  isSandbox,
  onConnectWallet,
  mockWallets = [],
  onSelectMockWallet
}: WalletProps) {

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      <Header account={account} isSandbox={isSandbox} />

      <main className="max-w-xl mx-auto px-4 py-8 sm:px-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col gap-6">
          
          {/* Headline */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/15">
              <WalletIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Wallet Dashboard</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage connected wallets and simulated funds.</p>
            </div>
          </div>

          {/* Account Details Panel */}
          {account ? (
            <div className="flex flex-col gap-4">
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Connected Address</span>
                    <span className="text-xs font-mono font-bold text-indigo-300 break-all">{account}</span>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/10 text-emerald-400">
                    Active
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-1">
                  <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Available Balance</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
                      {parseFloat(accountBalance).toFixed(4)}
                    </span>
                    <span className="text-sm font-bold text-indigo-400 font-mono">ETH</span>
                  </div>
                </div>
              </div>

              {/* Security info */}
              <div className="flex items-start gap-2.5 p-3.5 bg-slate-950/40 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  All simulation trades are safe and run inside your local secure memory sandbox. Live transactions will request explicit authorization from your MetaMask wallet.
                </span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center text-slate-500">
                <Key className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-white text-base">Wallet Disconnected</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Connect your web3 provider or load a simulation address to begin betting.
                </p>
              </div>

              <button
                onClick={onConnectWallet}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/10"
              >
                Connect MetaMask
              </button>
            </div>
          )}

          {/* Sandbox Wallet Loader */}
          {isSandbox && mockWallets.length > 0 && onSelectMockWallet && (
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                Interactive Sandbox Accounts
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {mockWallets.map((wallet) => (
                  <button
                    key={wallet.address}
                    onClick={() => onSelectMockWallet(wallet.address)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left group ${
                      account.toLowerCase() === wallet.address.toLowerCase()
                        ? 'bg-slate-950 border-indigo-500/50 text-white'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        {wallet.label}
                        {account.toLowerCase() === wallet.address.toLowerCase() && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        )}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 8)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                        {wallet.balance.toFixed(2)} ETH
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Back */}
          <div className="flex items-center justify-center pt-4 border-t border-slate-800/80">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Betting Dashboard
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}

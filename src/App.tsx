import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import web3 from './web3';
import chainlink from './chainlink';
import ethbet, { ethbetAddress } from './ethbet';
import Header from './Header';
import PriceChart from './PriceChart';
import Wallet from './Wallet';
import Etherscan from './Etherscan';
import { Play, TrendingUp, Trophy, Users, ShieldAlert, Cpu, Bell, CheckCircle, RefreshCw, Layers } from 'lucide-react';

// Pre-defined mock wallets for Sandbox Mode
const INITIAL_MOCK_WALLETS = [
  { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', label: 'My Wallet (User)', balance: 10.0 },
  { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', label: 'Alice (Predictor)', balance: 2.5 },
  { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', label: 'Bob (Trader)', balance: 4.12 },
  { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', label: 'Charlie (Bull)', balance: 8.44 }
];

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<string>('dark');

  // Connection & Core states
  const [isSandbox, setIsSandbox] = useState<boolean>(true);
  const [account, setAccount] = useState<string>('');
  const [accountBalance, setAccountBalance] = useState<string>('0.00');
  const [countdown, setCountdown] = useState<number>(60);
  const [latestAnswer, setLatestAnswer] = useState<string>('348520000000'); // Default $3,485.20

  // Contract specific states
  const [ethbetManager, setEthbetManager] = useState<string>('0x90F79bf6EB2c4f870365E785982E1f101E93b906');
  const [ethbetBalance, setEthbetBalance] = useState<string>('3000000000000000'); // 0.003 ether starting pool
  const [ethbetValue, setEthbetValue] = useState<string>('0.001');
  const [ethbetBetValue, setEthbetBetValue] = useState<string>('');
  const [ethbetMessage, setEthbetMessage] = useState<string>('');
  const [walletMessage, setWalletMessage] = useState<string>('');

  // Active bets lists
  const [ethbetPlayersList, setEthbetPlayersList] = useState<string[]>([
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Alice
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Bob
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906'  // Charlie
  ]);
  const [ethbetPlayerBetsList, setEthbetPlayerBetsList] = useState<{ players: string[]; bets: number[] }>({
    players: [
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
    ],
    bets: [3420, 3550, 3610]
  });

  // Simulator persistence reference
  const [mockWallets, setMockWallets] = useState<typeof INITIAL_MOCK_WALLETS>(INITIAL_MOCK_WALLETS);

  // Winner log history
  const [winnerLogs, setWinnerLogs] = useState<{ winner: string; prediction: number; actual: number; reward: string; date: string }[]>([]);

  // Tickers & intervals
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Initial check: Is MetaMask / web3 connected?
    if (web3) {
      setIsSandbox(false);
      connectWallet(true);
    } else {
      // Setup sandbox user account by default
      setAccount(INITIAL_MOCK_WALLETS[0].address);
      setAccountBalance(INITIAL_MOCK_WALLETS[0].balance.toString());
    }

    // 2. Fetch price feed
    fetchLatestETHPrice();

    // 3. Start ticking loop (countdown + random price updates if sandbox)
    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) {
          return prev - 1;
        } else {
          fetchLatestETHPrice();
          return 60;
        }
      });
    }, 1000);

    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, []);

  // Fetch ETH price from live chainlink feed OR Coingecko OR Mock
  const fetchLatestETHPrice = async () => {
    if (web3 && chainlink) {
      try {
        const answer = await chainlink.methods.getChainlinkDataFeedLatestAnswer().call();
        setLatestAnswer(String(answer));
        return;
      } catch (err) {
        console.warn("Chainlink call failed, using high fidelity live coin data:", err);
      }
    }

    // Live price API Coingecko fallback
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await res.json();
      if (data.ethereum?.usd) {
        // Convert to Chainlink scale (8 decimals)
        const priceScale8 = Math.round(data.ethereum.usd * 1e8).toString();
        setLatestAnswer(priceScale8);
        return;
      }
    } catch (err) {
      console.warn("CoinGecko simple price rate-limited, walking sandbox feed.");
    }

    // Sandbox walk
    setLatestAnswer((prev) => {
      const prevPrice = Number(prev) / 1e8;
      const delta = (Math.random() - 0.5) * 8; // gentle variation
      const nextPrice = Math.max(1000, prevPrice + delta);
      return Math.round(nextPrice * 1e8).toString();
    });
  };

  // Connect to live Metamask wallet
  const connectWallet = async (silently = false) => {
    if (!web3 || typeof (window as any).ethereum === 'undefined') {
      if (!silently) {
        setWalletMessage('MetaMask extension not found. Loading Sandbox environment instead.');
        setTimeout(() => setWalletMessage(''), 5000);
      }
      return;
    }

    try {
      const accounts = await (silently 
        ? web3.eth.getAccounts() 
        : (window as any).ethereum.request({ method: 'eth_requestAccounts' }));

      if (accounts.length > 0) {
        const connectedAddress = accounts[0];
        setAccount(connectedAddress);
        setIsSandbox(false);
        const weiBalance = await web3.eth.getBalance(connectedAddress);
        const ethBalanceVal = web3.utils.fromWei(weiBalance, 'ether');
        setAccountBalance(ethBalanceVal);

        // Load contract variables
        if (ethbet) {
          const managerAddress = await ethbet.methods.manager().call();
          setEthbetManager(String(managerAddress));
          const contractWei = await web3.eth.getBalance(ethbetAddress);
          setEthbetBalance(String(contractWei));
          
          // Pull active list
          const players = await ethbet.methods.getPlayer().call();
          setEthbetPlayersList(players as any as string[]);
        }
      } else if (!silently) {
        setWalletMessage('Please sign in to MetaMask to connect.');
      }
    } catch (err: any) {
      console.error(err);
      if (!silently) {
        setWalletMessage('Connection refused or timed out.');
      }
    }
  };

  // Change simulated wallet
  const handleSelectMockWallet = (address: string) => {
    const selected = mockWallets.find(w => w.address.toLowerCase() === address.toLowerCase());
    if (selected) {
      setAccount(selected.address);
      setAccountBalance(selected.balance.toString());
      setEthbetMessage(`Switched to simulated wallet: ${selected.label}`);
      setTimeout(() => setEthbetMessage(''), 4000);
    }
  };

  // Submit dynamic prediction bet
  const handleBetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ethbetBetValue || isNaN(Number(ethbetBetValue))) {
      setEthbetMessage('Please enter a valid numeric USD target price (e.g., 3480).');
      return;
    }

    const priceTarget = Math.round(Number(ethbetBetValue));

    // CHECK 1: Is this live Web3 or Sandbox?
    if (!isSandbox && web3 && ethbet) {
      setEthbetMessage('Initiating wallet transfer... Confirm gas inside MetaMask.');
      try {
        await ethbet.methods.Enter(priceTarget).send({
          from: account,
          value: web3.utils.toWei(ethbetValue, 'ether')
        });
        setEthbetMessage('Successfully entered prediction on-chain!');
        
        // Refresh values
        const contractWei = await web3.eth.getBalance(ethbetAddress);
        setEthbetBalance(contractWei.toString());
        const players = await ethbet.methods.getPlayer().call();
        setEthbetPlayersList(players as string[]);
      } catch (err: any) {
        setEthbetMessage(`On-chain Transaction failed: ${err.message || err}`);
      }
      return;
    }

    // SANDBOX SIMULATOR PATH
    if (ethbetPlayersList.map(p => p.toLowerCase()).includes(account.toLowerCase())) {
      setEthbetMessage('This wallet address has already registered a prediction in this pool.');
      return;
    }

    // Deduct simulator balance
    const currentEth = Number(accountBalance);
    const entryFee = Number(ethbetValue);
    if (currentEth < entryFee) {
      setEthbetMessage('Insufficient simulated balance to cover 0.001 ETH entry fee.');
      return;
    }

    // Deduct balance from mockWallets and account state
    const nextBalance = currentEth - entryFee;
    setAccountBalance(nextBalance.toString());
    setMockWallets(prev => prev.map(w => w.address.toLowerCase() === account.toLowerCase() ? { ...w, balance: nextBalance } : w));

    // Add player to lists
    setEthbetPlayersList(prev => [...prev, account]);
    setEthbetPlayerBetsList(prev => ({
      players: [...prev.players, account],
      bets: [...prev.bets, priceTarget]
    }));

    // Add funds to Prize Pool (Wei scale)
    setEthbetBalance(prev => {
      const totalWei = Number(prev) + (entryFee * 1e18);
      return totalWei.toString();
    });

    setEthbetMessage(`Registered prediction target of $${priceTarget}! Simulated fee of ${ethbetValue} ETH transferred.`);
    setEthbetBetValue('');
    setTimeout(() => setEthbetMessage(''), 6000);
  };

  // Pick Winner trigger
  const handlePickWinner = async () => {
    setEthbetMessage('Resolving market... Comparing predictions against latest feed price.');

    // Compute actual current price
    const currentPriceUSD = Number(latestAnswer) / 1e8;

    // 1. Live Web3 resolution
    if (!isSandbox && web3 && ethbet) {
      try {
        await ethbet.methods.pickWinner().send({ from: account });
        setEthbetMessage('Winner resolved on-chain! Reward has been distributed.');
        const contractWei = await web3.eth.getBalance(ethbetAddress);
        setEthbetBalance(contractWei.toString());
        setEthbetPlayersList([]);
      } catch (err: any) {
        setEthbetMessage(`Failed to trigger on-chain pickWinner: ${err.message || err}`);
      }
      return;
    }

    // 2. Sandbox simulation winner computation
    if (ethbetPlayerBetsList.players.length === 0) {
      setEthbetMessage('No predictions in the pool to resolve.');
      return;
    }

    let closestIndex = 0;
    let minDiff = Infinity;

    ethbetPlayerBetsList.bets.forEach((bet, i) => {
      const diff = Math.abs(bet - currentPriceUSD);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    });

    const winnerAddress = ethbetPlayerBetsList.players[closestIndex];
    const winnerPrediction = ethbetPlayerBetsList.bets[closestIndex];
    const totalPrizeWei = Number(ethbetBalance);
    const prizeETH = totalPrizeWei / 1e18;

    // Award prize in simulated balances
    setMockWallets(prev => prev.map(w => {
      if (w.address.toLowerCase() === winnerAddress.toLowerCase()) {
        const newBal = w.balance + prizeETH;
        if (account.toLowerCase() === winnerAddress.toLowerCase()) {
          setAccountBalance(newBal.toString());
        }
        return { ...w, balance: newBal };
      }
      return w;
    }));

    const mockLabel = INITIAL_MOCK_WALLETS.find(w => w.address.toLowerCase() === winnerAddress.toLowerCase())?.label || 'External Trader';

    // Log to winner list
    const newLog = {
      winner: `${mockLabel} (${winnerAddress.substring(0,6)}...)`,
      prediction: winnerPrediction,
      actual: Math.round(currentPriceUSD * 100) / 100,
      reward: `${prizeETH.toFixed(4)} ETH`,
      date: new Date().toLocaleTimeString()
    };
    setWinnerLogs(prev => [newLog, ...prev]);

    // Reset pool state
    setEthbetPlayersList([]);
    setEthbetPlayerBetsList({ players: [], bets: [] });
    setEthbetBalance('0');

    setEthbetMessage(`🏆 Round Solved! ${mockLabel} won ${prizeETH.toFixed(4)} ETH with a target of $${winnerPrediction} (Actual ETH: $${currentPriceUSD.toFixed(2)})!`);
  };

  const currentPriceDisplay = (Number(latestAnswer) / 1e8).toFixed(2);
  const isManager = account.toLowerCase() === ethbetManager.toLowerCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 font-sans crypto-grid-bg pb-12">
      <BrowserRouter>
        <Routes>
          {/* Market view (Default) */}
          <Route path="/" element={
            <>
              <Header account={account} isSandbox={isSandbox} />
              
              <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Banner / Live Tracker */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  
                  {/* Left Hero stats */}
                  <div className="lg:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden group glow-card">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span className="text-xs font-mono font-bold tracking-wider uppercase text-indigo-400">Chainlink Node Feed</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500">
                        Refresh in {countdown}s
                      </span>
                    </div>

                    <div className="my-6">
                      <span className="text-xs text-slate-400 font-mono">Current ETH Spot Price (USD)</span>
                      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-display mt-1 flex items-baseline gap-2">
                        ${Number(currentPriceDisplay).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <TrendingUp className="w-6 h-6 text-emerald-400 animate-bounce" />
                      </h1>
                    </div>

                    <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        Audited Oracle Contracts
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 truncate max-w-[200px]">
                        Feed Address: {ethbetAddress}
                      </span>
                    </div>
                  </div>

                  {/* Sandbox Notification Panel */}
                  <div className="p-6 bg-gradient-to-tr from-slate-900 to-slate-900/90 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between glow-card">
                    <div>
                      <h3 className="font-bold text-white text-base font-display flex items-center gap-1.5">
                        <Cpu className="w-5 h-5 text-indigo-400" />
                        Simulation Sandbox
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                        No MetaMask? No problem! Toggle simulated players, enter forecasting targets, and play with the oracle pricing system instantly.
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Interactive Wallets</span>
                      <div className="flex flex-wrap gap-2">
                        {mockWallets.map(wallet => (
                          <button
                            key={wallet.address}
                            onClick={() => handleSelectMockWallet(wallet.address)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                              account.toLowerCase() === wallet.address.toLowerCase()
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 border border-indigo-500'
                                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {wallet.label.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Main Graph & Betting Form */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  
                  {/* Chart and Bets List */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    <PriceChart theme={theme} />

                    {/* Active player bets table */}
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800/85">
                        <h3 className="font-bold text-white text-base font-display flex items-center gap-2">
                          <Users className="w-5 h-5 text-indigo-400" />
                          Registered Predictions ({ethbetPlayersList.length})
                        </h3>
                        <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/10">
                          Active Round
                        </span>
                      </div>

                      {ethbetPlayersList.length > 0 ? (
                        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                          {ethbetPlayersList.map((player, idx) => {
                            const matchedBet = ethbetPlayerBetsList.players.findIndex(p => p.toLowerCase() === player.toLowerCase());
                            const targetVal = matchedBet !== -1 ? ethbetPlayerBetsList.bets[matchedBet] : 'TBD';
                            const label = INITIAL_MOCK_WALLETS.find(w => w.address.toLowerCase() === player.toLowerCase())?.label || 'Trader Account';
                            return (
                              <div key={idx} className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-xs font-mono">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                                  <span className="text-slate-300 font-semibold">{label}</span>
                                  <span className="text-slate-500 text-[10px]">({player.substring(0, 6)}...{player.substring(player.length - 4)})</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-slate-400">Target:</span>
                                  <span className="font-bold text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">${targetVal}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-xs text-slate-500 font-mono">
                          No forecasts entered for this round. Be the first to predict!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prediction form & manager controls */}
                  <div className="flex flex-col gap-6">
                    
                    {/* Betting entry box */}
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-indigo-400" />
                        Place Forecast Bet
                      </h3>
                      
                      <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-slate-800/80 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Prize Pool</span>
                          <span className="text-xl font-extrabold font-mono text-indigo-400 tracking-tight">
                            {(Number(ethbetBalance) / 1e18).toFixed(4)} ETH
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Entrance Fee</span>
                          <span className="text-xs font-bold font-mono text-slate-300">{ethbetValue} ETH</span>
                        </div>
                      </div>

                      <form onSubmit={handleBetSubmit} className="mt-5 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-slate-400 font-medium">Your ETH Target Price Prediction (USD)</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono text-sm">$</span>
                            <input
                              type="number"
                              required
                              value={ethbetBetValue}
                              onChange={(e) => setEthbetBetValue(e.target.value)}
                              placeholder="e.g. 3520"
                              className="w-full bg-slate-950 border border-slate-800/80 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-2 pl-8 pr-4 text-sm font-mono text-white focus:outline-none transition-colors"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold tracking-wide transition-all duration-200 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Submit Prediction
                        </button>
                      </form>

                      {ethbetMessage && (
                        <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
                          <Bell className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                          <span className="font-mono text-[11px] leading-relaxed break-words">{ethbetMessage}</span>
                        </div>
                      )}
                    </div>

                    {/* Manager controls */}
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-indigo-400" />
                          Contract Governance
                        </h4>
                        <span className="text-[9px] font-mono bg-slate-950 px-2 py-0.5 rounded-full text-slate-500 border border-slate-850">
                          Manager Role
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                        Only the contract owner/manager can invoke <code className="text-indigo-400 bg-slate-950 px-1 py-0.5 rounded text-[10px]">pickWinner</code> to distribute prize pools using live Chainlink oracle feeds.
                      </p>

                      <button
                        onClick={handlePickWinner}
                        className="w-full mt-4 py-2.5 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs font-semibold tracking-wider uppercase transition-all duration-200"
                      >
                        Trigger Oracle Payoff
                      </button>
                    </div>

                    {/* Winner Logs */}
                    {winnerLogs.length > 0 && (
                      <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col gap-3">
                        <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-indigo-400" />
                          Payout History
                        </span>
                        <div className="space-y-2.5">
                          {winnerLogs.map((log, i) => (
                            <div key={i} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-[11px] flex flex-col gap-1">
                              <div className="flex justify-between items-center text-slate-200">
                                <span className="font-semibold text-white">{log.winner}</span>
                                <span className="text-indigo-400 font-bold">{log.reward}</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-500 text-[10px]">
                                <span>Prediction: ${log.prediction} (Spot: ${log.actual})</span>
                                <span>{log.date}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              </main>
            </>
          } />

          {/* Wallet route */}
          <Route path="/Wallet" element={
            <Wallet
              account={account}
              accountBalance={accountBalance}
              isSandbox={isSandbox}
              onConnectWallet={() => connectWallet()}
              mockWallets={mockWallets}
              onSelectMockWallet={handleSelectMockWallet}
            />
          } />

          {/* Etherscan route */}
          <Route path="/Etherscan" element={<Etherscan />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

// components/MetaMaskConnector.js
import { useState, useEffect } from 'react';
import { useBountyContract } from '../hooks/useBountyContract';

const MetaMaskConnector = () => {
  const { account, initializeContract } = useBountyContract();
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      await initializeContract();
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
    setIsConnecting(false);
  };

  return (
    <div className="glass-card p-4">
      {account ? (
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="text-cyan-400">
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-lg text-white font-semibold disabled:opacity-50"
        >
          {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
        </button>
      )}
    </div>
  );
};

export default MetaMaskConnector;
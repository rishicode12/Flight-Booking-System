import React from 'react';
import { Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const WalletDisplay = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const walletBalance = user?.walletBalance || 0;

  return (
    <div 
      className="flex items-center gap-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-full shadow-lg border border-blue-400 hover:shadow-xl transition-all cursor-pointer"
      onClick={() => navigate('/profile')}
      title="View wallet balance in profile"
    >
      {/* Wallet Icon with Background */}
      <div className="bg-white bg-opacity-20 p-2 rounded-full">
        <Wallet size={22} />
      </div>

      {/* Balance Info */}
      <div className="flex flex-col min-w-fit">
        <span className="text-xs font-semibold opacity-90 uppercase tracking-wide">Balance</span>
        <span className="text-2xl font-bold">₹{walletBalance.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
};

export default WalletDisplay;

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * RefreshHeader Component
 * Displays title with a refresh icon button
 * 
 * Usage:
 * <RefreshHeader 
 *   title="Dashboard" 
 *   onRefresh={() => fetchData()} 
 * />
 */
const RefreshHeader = ({ 
  title, 
  icon: Icon, 
  onRefresh, 
  isLoading = false,
  subtitle
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await Promise.resolve(onRefresh());
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center justify-between mb-5 px-1">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="bg-blue-500/10 p-2 rounded-lg text-[#137fec]">
            <Icon size={18} />
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      
      <button
        onClick={handleRefresh}
        disabled={isRefreshing || isLoading}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50"
        title="Refresh data"
      >
        <RefreshCw 
          size={18} 
          className={`text-slate-500 dark:text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} 
        />
      </button>
    </div>
  );
};

export default RefreshHeader;

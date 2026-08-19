import React, { useState, useEffect } from 'react';
import { subscribeServerWarmup } from '../../services/api';
import { CloudLightning, Loader2 } from 'lucide-react';

export const ServerWarmupBanner = () => {
  const [isWarmingUp, setIsWarmingUp] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeServerWarmup((warming) => {
      setIsWarmingUp(warming);
    });
    return () => unsubscribe();
  }, []);

  if (!isWarmingUp) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-2 text-xs sm:text-sm font-medium shadow-md flex items-center justify-center gap-2 transition-all animate-fadeIn">
      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      <CloudLightning className="w-4 h-4 shrink-0" />
      <span>
        Connecting to cloud server... If the server was inactive, Render free tier takes ~20–40s to wake up.
      </span>
    </div>
  );
};

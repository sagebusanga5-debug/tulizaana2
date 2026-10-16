import React, { useEffect } from 'react';
import { TulizaanaIcon } from '../brand/TulizaanaBrand';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2400);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      onClick={onFinish}
      className="fixed inset-0 z-50 bg-[#080D14] text-slate-100 flex flex-col items-center justify-center p-6 select-none cursor-pointer overflow-hidden animate-fadeIn"
    >
      {/* Subtle, soothing ambient background illumination */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Center content: ONLY Tulizaana Icon + Name below in reduced size */}
      <div className="relative flex flex-col items-center text-center space-y-3.5 max-w-md px-4 z-10">
        
        {/* Tulizaana Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#0E1626]/90 border border-cyan-500/30 p-3 shadow-2xl shadow-cyan-500/20 flex items-center justify-center transition-transform hover:scale-105 duration-500 animate-pulse">
          <TulizaanaIcon className="w-full h-full drop-shadow-md" />
        </div>

        {/* Tulizaana Name in Poppins bold with blue dot at the end like on the logo */}
        <div className="inline-flex items-baseline justify-center font-poppins font-bold text-2xl sm:text-3xl text-white tracking-tight">
          <span>Tulizaana</span>
          <span
            className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-tr from-cyan-400 to-teal-300 shadow-xs shadow-cyan-400/80 shrink-0 ml-0.5 sm:ml-1"
            aria-hidden="true"
          />
        </div>

      </div>
    </div>
  );
};

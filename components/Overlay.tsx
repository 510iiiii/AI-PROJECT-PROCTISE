import React from 'react';
import { AppState, HandGestureData } from '../types';

interface OverlayProps {
  appState: AppState;
  handData: HandGestureData;
  onManualToggle: () => void;
  isProcessing: boolean;
}

export const Overlay: React.FC<OverlayProps> = ({ appState, handData, onManualToggle, isProcessing }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="border-l-4 border-[#FFD700] pl-4 bg-neutral-900/80 backdrop-blur-md p-4 rounded-r-lg">
          <h1 className="text-4xl font-serif text-[#FFD700] tracking-wider drop-shadow-lg">ZS510</h1>
          <p className="text-emerald-400 font-sans tracking-widest text-sm uppercase mt-1">
            Golden Spruce Edition
          </p>
        </div>
        
        <div className="text-right bg-neutral-900/80 backdrop-blur-md p-4 rounded-lg border border-[#FFD700]/30">
          <p className="text-xs text-neutral-400 font-sans uppercase mb-1">Status</p>
          <div className="flex items-center justify-end gap-2">
            <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-green-500 animate-pulse' : 'bg-neutral-500'}`} />
            <span className="text-[#FFD700] font-serif text-xl">{appState}</span>
          </div>
          <div className="mt-2 text-neutral-300 text-xs font-mono">
            HAND: {handData.isOpen ? 'OPEN (UNLEASH)' : 'CLOSED (FORM)'} <br/>
            POS: [{handData.x.toFixed(2)}, {handData.y.toFixed(2)}]
          </div>
        </div>
      </div>

      {/* Footer / Instructions */}
      <div className="flex justify-center items-end">
        <div className="bg-neutral-900/90 border border-[#FFD700] p-6 rounded-lg shadow-[0_0_30px_rgba(255,215,0,0.2)] text-center max-w-md pointer-events-auto">
          <p className="text-[#F7E7CE] font-serif italic text-lg mb-4">
            "Show your open hand to unleash chaos. <br/> Close it to restore order."
          </p>
          
          <button 
            onClick={onManualToggle}
            className="px-6 py-2 bg-gradient-to-r from-[#046307] to-[#013203] text-[#FFD700] border border-[#FFD700] font-sans text-xs uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
          >
            Manual Override
          </button>
        </div>
      </div>
    </div>
  );
};

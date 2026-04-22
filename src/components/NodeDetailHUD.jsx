import React from 'react';
import { X, Cpu, Move, Zap, Hash, Database } from 'lucide-react';
import useIDEStore from '../store/useIDEStore';

export default function NodeDetailHUD() {
  const selectedCanvasNodes = useIDEStore(state => state.selectedCanvasNodes);
  const lastSelection = selectedCanvasNodes[selectedCanvasNodes.length - 1];
  const selectedNode = lastSelection?.node;
  const toggleSelectedNode = useIDEStore(state => state.toggleSelectedCanvasNode);
  const highlightColor = useIDEStore(state => state.highlightColor);
  const collapsedPanels = useIDEStore(state => state.collapsedPanels);
  const isRightCollapsed = collapsedPanels.right;
  const activeView = useIDEStore(state => state.activeView);

  if (!selectedNode || activeView === 'code') return null;

  return (
    <div 
      className="absolute bottom-28 z-40 w-72 glass-panel rounded-2xl border border-white/10 shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
      style={{ right: isRightCollapsed ? '40px' : '360px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: lastSelection?.color || '#22C55E', backgroundColor: 'currentColor' }} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Node Entity</span>
        </div>
        <button onClick={() => toggleSelectedNode(selectedNode)} className="text-white/20 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Attributes Grid */}
      <div className="p-5 space-y-4">
        {/* Name & ID */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Identification</span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold" style={{ color: lastSelection?.color || highlightColor }}>{selectedNode.name || 'ANONYMOUS'}</span>
            <span className="text-[9px] font-mono text-white/40">ID: {selectedNode.id}</span>
          </div>
        </div>

        {/* Physics / Position */}
        <div className="grid grid-cols-2 gap-4">
           <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1.5 opacity-20">
               <Move size={10} />
               <span className="text-[8px] uppercase font-bold tracking-tighter">Vector X</span>
             </div>
             <span className="text-[11px] font-mono text-white/60">{(selectedNode.x || 0).toFixed(2)}px</span>
           </div>
           <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1.5 opacity-20">
               <Move size={10} className="rotate-90" />
               <span className="text-[8px] uppercase font-bold tracking-tighter">Vector Y</span>
             </div>
             <span className="text-[11px] font-mono text-white/60">{(selectedNode.y || 0).toFixed(2)}px</span>
           </div>
        </div>

        {/* Logic Props */}
        <div className="pt-2 flex flex-col gap-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2">
               <Database size={12} className="text-primary/40" />
               <span className="text-[9px] text-white/40 font-bold uppercase">Probability</span>
            </div>
            <span className="text-xs font-mono" style={{ color: lastSelection?.color || highlightColor }}>{selectedNode.p ? (selectedNode.p * 100).toFixed(1) + '%' : 'N/A'}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2">
               <Zap size={12} className="text-primary/40" />
               <span className="text-[9px] text-white/40 font-bold uppercase">Dynamic Dispatch</span>
            </div>
            <span className="text-[9px] font-mono text-white/60">{selectedNode.isLeaf ? 'LEAF_NODE' : 'INTERNAL_SUM'}</span>
          </div>
        </div>

        {/* Runtime Association */}
        <div className="mt-4 flex items-center gap-3 p-2 border-l-2 border-primary/20 bg-primary/[0.02]">
           <Cpu size={14} className="text-primary/40" />
           <div className="flex flex-col">
              <span className="text-[8px] text-white/20 uppercase font-black">Mapped Memory Target</span>
              <span className="text-[9px] font-mono tracking-tighter" style={{ color: lastSelection?.color ? `${lastSelection.color}99` : undefined }}>0x{(selectedNode.index || 0).toString(16).padStart(4, '0')}</span>
           </div>
        </div>
      </div>
    </div>
  );
}

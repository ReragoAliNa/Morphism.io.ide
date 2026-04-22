import React, { useMemo, useRef, useEffect } from 'react';
import { Layers } from 'lucide-react';
import useIDEStore from '../store/useIDEStore';

export default function PhysicsHUD() {
  const { 
    hudPos, 
    setHudPos, 
    isResetting, 
    activeGraphData, 
    selectedCanvasNodes,
    highlightColor
  } = useIDEStore();
  
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const rootNode = useMemo(() => {
    if (!activeGraphData || !activeGraphData.nodes || activeGraphData.nodes.length === 0) return null;
    return activeGraphData.nodes.find(n => !n.isLeaf) || activeGraphData.nodes[0];
  }, [activeGraphData]);

  const displayInfo = useMemo(() => {
    const lastSelection = selectedCanvasNodes[selectedCanvasNodes.length - 1];
    if (!lastSelection) return null;
    return lastSelection;
  }, [selectedCanvasNodes]);

  const displayNode = displayInfo?.node;
  const activeColor = displayInfo?.color || highlightColor;

  const onDragStart = (e) => {
    e.stopPropagation();
    isDragging.current = true;
    dragStart.current = { x: e.clientX - hudPos.x, y: e.clientY - hudPos.y };
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      setHudPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    };
    const onMouseUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [setHudPos]);

  if (!activeGraphData) return null;

  return (
    <div 
      id="physics-hud"
      className="fixed w-64 z-[120] glass-panel rounded-[24px] shadow-2xl pointer-events-auto border border-white/5 overflow-hidden" 
      style={{ 
        left: `${hudPos.x}px`, 
        top: `${hudPos.y}px`,
        transition: isDragging.current ? 'none' : 'left 0.8s cubic-bezier(0.22, 1, 0.36, 1), top 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s ease-out',
        transform: isResetting ? 'scale(0.9) rotateX(10deg)' : 'scale(1) rotateX(0deg)',
      }}
    >
      <div onMouseDown={onDragStart} className="px-5 py-4 border-b border-white/5 flex justify-between items-center cursor-grab active:cursor-grabbing bg-white/5">
        <div className="flex items-center gap-2">
          <Layers size={14} style={{ color: activeColor }} />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white">System Physics</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeColor }} />
      </div>
      
      <div className="p-5 space-y-4 text-[11px] font-mono">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="opacity-30 text-[9px] uppercase tracking-tighter">Core Engine</span>
            <span className="text-white font-bold">Morphism-V1</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="opacity-30 text-[9px] uppercase tracking-tighter">Node Count</span>
            <span className="text-white font-bold">{activeGraphData.nodes.length}</span>
          </div>
        </div>

        {rootNode && (
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="opacity-30 text-[9px] uppercase tracking-wider">Origin Point</span>
            <div className="flex justify-between items-baseline">
              <span className="text-white truncate max-w-[120px]">{rootNode.name || rootNode.id}</span>
              <span className="text-primary text-[10px] font-bold">Σ {rootNode.p ? rootNode.p.toFixed(3) : '1.000'}</span>
            </div>
          </div>
        )}

        <div className={`transition-all duration-500 pt-1 ${displayNode ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-2'}`}>
           <span className="opacity-30 text-[9px] uppercase tracking-widest">Inspection</span>
           <div className="mt-2.5 flex justify-between items-center p-2 rounded-lg border" style={{ backgroundColor: `${activeColor}0D`, borderColor: `${activeColor}1A` }}>
             <span className="font-bold truncate max-w-[140px]" style={{ color: activeColor }}>{displayNode ? (displayNode.name || displayNode.id) : 'IDLE'}</span>
             <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: `${activeColor}33`, color: activeColor }}>
               {displayNode ? (displayNode.isLeaf ? 'LEAF' : 'BRANCH') : '---'}
             </span>
           </div>
        </div>
      </div>
    </div>
  );
}

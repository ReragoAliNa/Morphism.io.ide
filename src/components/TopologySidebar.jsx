import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, Key, Network, Shield, PlaySquare, AlertCircle, Palette, ToggleLeft, ToggleRight } from 'lucide-react';
import useIDEStore from '../store/useIDEStore';
import { huffmanGraph, cryptoGroupGraph } from '../data/mockTopology';

const topologyLibrary = [
  {
    id: 'crypto-groups',
    name: 'Cryptographic Groups',
    icon: Folder,
    children: [
      { id: 'ecc-secp256k1', name: 'Sym Group / Cayley', icon: Network, graphData: cryptoGroupGraph },
      { id: 'zk-snarks', name: 'Bilinear Pairing', icon: Shield, graphData: null },
    ]
  },
  {
    id: 'source-coding',
    name: 'Source Coding (Entropy)',
    icon: Folder,
    children: [
      { id: 'huffman-dynamic', name: 'Huffman / Fano Tree', icon: Key, graphData: huffmanGraph, hasControls: true },
    ]
  }
];

const TreeItem = ({ item, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(true);
  const activeNodeId = useIDEStore(state => state.activeNodeId);
  const setActiveNode = useIDEStore(state => state.setActiveNode);
  const setSourceProbs = useIDEStore(state => state.setSourceProbs);
  const highlightColor = useIDEStore(state => state.highlightColor);
  
  const [probsInput, setProbsInput] = useState("0.40,0.20,0.15,0.10,0.10,0.05");
  const sourceProbs = useIDEStore(state => state.sourceProbs);
  
  // 当 Store 中的 sourceProbs 改变时（如拖拽导入），同步更新输入框
  useEffect(() => {
    if (item.hasControls && sourceProbs && sourceProbs.length > 0) {
      setProbsInput(sourceProbs.map(p => p.toFixed(2)).join(','));
    }
  }, [sourceProbs, item.hasControls]);

  const [validationError, setValidationError] = useState(null);
  const [currentSum, setCurrentSum] = useState(1.0);

  const hasChildren = item.children && item.children.length > 0;
  const isSelected = activeNodeId === item.id;

  // 实时计算总和
  useEffect(() => {
    if (isSelected && item.hasControls) {
      try {
        const sum = probsInput.split(',')
          .map(x => parseFloat(x.trim()) || 0)
          .reduce((a, b) => a + b, 0);
        setCurrentSum(parseFloat(sum.toFixed(4)));
      } catch (e) {}
    }
  }, [probsInput, isSelected, item.hasControls]);

  const validateAndSubmit = () => {
    const pArray = probsInput.split(',').map(x => parseFloat(x.trim()));
    const sum = pArray.reduce((a, b) => a + b, 0);
    
    // 允许极小的浮点误差
    if (Math.abs(sum - 1.0) > 0.0001) {
      setValidationError(`Invalid Distribution (Σ P = ${sum.toFixed(3)})`);
      // 3秒后清除报错
      setTimeout(() => setValidationError(null), 3000);
      return;
    }

    setValidationError(null);
    setSourceProbs(pArray);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      validateAndSubmit();
    }
  };

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else {
      setActiveNode(item.id, item.graphData);
    }
  };
  
  const Icon = item.icon;

  return (
    <div>
      <div 
        className="flex items-center py-2 px-4 cursor-pointer select-none text-[12px] transition-all duration-200"
        style={{
          paddingLeft: `${level * 14 + 16}px`,
          background: isSelected ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
          color: isSelected ? '#22C55E' : 'rgba(255,255,255,0.5)',
          borderLeft: isSelected ? '2px solid #22C55E' : '2px solid transparent'
        }}
        onClick={handleClick}
      >
        <span className="w-4 h-4 mr-1 flex items-center justify-center" style={{ color: 'var(--color-text-4)' }}>
          {hasChildren ? (isOpen ? <ChevronDown size={13} strokeWidth={1.5} /> : <ChevronRight size={13} strokeWidth={1.5} />) : null}
        </span>
        <Icon size={13} strokeWidth={1.5} className="mr-2" style={{ color: isSelected ? '#22C55E' : 'var(--color-text-4)' }} />
        <span className="truncate">{item.name}</span>
      </div>
      
      {/* Wasm Engine 参数面板 */}
      {isSelected && item.hasControls && (
        <div className="px-4 py-4 flex flex-col gap-4 border-y border-white/5 bg-white/[0.02] animate-in fade-in slide-in-from-top-1 duration-300">
          
          {/* 标题行 */}
          <div className="flex justify-between items-center">
            <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-[#22C55E]">WASM ENGINE</span>
            <span className={`text-[10px] font-mono tabular-nums ${Math.abs(currentSum - 1) < 0.0001 ? 'text-[#22C55E]/60' : 'text-amber-400 animate-pulse'}`}>
              Σ = {currentSum.toFixed(2)}
            </span>
          </div>

          {/* 输入区 */}
          <div className="flex flex-col gap-2">
            <label className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-30 font-mono">
              P(X) DISTRIBUTION
            </label>
            <input 
              type="text" 
              className={`w-full text-[11px] py-2.5 px-3 outline-none transition-all duration-200 font-mono bg-black/30 rounded-sm border ${validationError ? 'border-red-500 animate-shake' : 'border-white/10 focus:border-primary/40'}`}
              value={probsInput}
              onChange={(e) => setProbsInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 0.5, 0.3, 0.2"
            />
            {validationError && (
              <div className="flex items-center gap-1.5 text-[9px] text-red-400 font-mono font-bold">
                <AlertCircle size={10} /> {validationError}
              </div>
            )}
          </div>

          {/* 执行按钮 */}
          <button 
            onClick={validateAndSubmit}
            className="flex justify-center items-center gap-2 text-[10px] py-2.5 cursor-pointer transition-all duration-150 uppercase tracking-[0.2em] font-bold rounded-sm"
            style={{ 
              background: 'rgba(34, 197, 94, 0.1)', 
              border: '1px solid rgba(34, 197, 94, 0.2)', 
              color: '#22C55E' 
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'}
          >
            <PlaySquare size={12} strokeWidth={2} /> EVALUATE
          </button>
        </div>
      )}




      {hasChildren && isOpen && (
        <div>
          {item.children.map(child => (
            <TreeItem key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function TopologySidebar() {
  const { 
    highlightColor, 
    setHighlightColor, 
    persistentHighlight, 
    setPersistentHighlight 
  } = useIDEStore();

  return (
    <div className="flex flex-col h-full">
      <div className="py-1">
        {topologyLibrary.map(group => (
          <TreeItem key={group.id} item={group} />
        ))}
      </div>

      {/* Visual Configuration Section */}
      <div className="mt-8 px-4 py-6 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2 mb-6">
          <Palette size={14} style={{ color: highlightColor }} className="opacity-60" />
          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/40">Visual Config</span>
        </div>

        <div className="flex flex-col gap-6">
          {/* Multi-Selection Mode Toggle */}
          <div className="flex items-center justify-between group cursor-pointer" onClick={() => setPersistentHighlight(!persistentHighlight)}>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-white/70 font-medium">Multi-Selection Mode</span>
              <span className="text-[9px] text-white/30 uppercase tracking-wider">Highlight multiple points</span>
            </div>
            <div className="transition-all duration-300" style={{ color: persistentHighlight ? highlightColor : 'rgba(255,255,255,0.2)' }}>
              {persistentHighlight ? <ToggleRight size={24} strokeWidth={1.5} /> : <ToggleLeft size={24} strokeWidth={1.5} />}
            </div>
          </div>

          {/* Color Selection */}
          <div className="flex flex-col gap-3">
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-30 font-mono">Highlight Theme</span>
            <div className="flex gap-2.5">
              {['#22C55E', '#3B82F6', '#EC4899', '#F59E0B', '#A855F7'].map(color => (
                <div 
                  key={color}
                  onClick={() => setHighlightColor(color)}
                  className={`w-5 h-5 rounded-full cursor-pointer transition-all duration-200 border-2 ${highlightColor === color ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

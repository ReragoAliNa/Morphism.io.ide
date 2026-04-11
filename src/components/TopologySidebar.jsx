import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, Key, Network, Shield, Hash, PlaySquare } from 'lucide-react';
import clsx from 'clsx';
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
  
  const [probsInput, setProbsInput] = useState("0.40,0.20,0.15,0.10,0.10,0.05");

  const hasChildren = item.children && item.children.length > 0;
  const isSelected = activeNodeId === item.id;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else {
      setActiveNode(item.id, item.graphData);
    }
  };
  
  const handleWasmInject = (e) => {
    e.stopPropagation();
    const pArray = probsInput.split(',').map(x => parseFloat(x.trim()));
    // Set the state which triggers a Wasm recalculation loop (mocked via zustand currently until compile finishes)
    setSourceProbs(pArray);
  };

  const Icon = item.icon;

  return (
    <div>
      <div 
        className={clsx(
          "flex items-center py-1.5 px-2 cursor-pointer hover:bg-[#1a1b20] select-none text-sm group transition-all",
          isSelected && "bg-[#174872]/20 text-blue-300 border-l-2 border-[#38bdf8] shadow-[inset_0_0_12px_rgba(56,189,248,0.1)]"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        <span className="w-4 h-4 mr-1 flex items-center justify-center text-gray-500">
          {hasChildren ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
        </span>
        <Icon size={14} className={clsx("mr-2", isSelected ? "text-[#38bdf8]" : "text-gray-400 group-hover:text-gray-200")} />
        <span className={clsx("truncate", isSelected ? "text-gray-100 font-medium tracking-wide" : "text-gray-400")}>
          {item.name}
        </span>
      </div>
      
      {/* Wasm Control Injection UI */}
      {isSelected && item.hasControls && (
        <div className="bg-[#111216] border-y border-deepspace-700 p-3 ml-2 flex flex-col gap-2">
          <div className="text-[10px] uppercase text-syntax-purple font-bold tracking-wider">Wasm Parameters Injector</div>
          <label className="text-xs text-gray-400">P(X) Distribution Array:</label>
          <input 
            type="text" 
            className="w-full bg-[#0b0c10] border border-deepspace-700 text-syntax-green text-xs p-1 rounded font-mono outline-none focus:border-syntax-purple"
            value={probsInput}
            onChange={(e) => setProbsInput(e.target.value)}
          />
          <button 
            onClick={handleWasmInject}
            className="mt-1 flex items-center justify-center gap-2 bg-[#174872]/40 hover:bg-[#174872]/80 border border-[#174872] text-blue-300 text-xs py-1 rounded transition-colors"
          >
            <PlaySquare size={12} /> Evaluate Engine
          </button>
        </div>
      )}

      {hasChildren && isOpen && (
        <div className="border-l border-deepspace-700 ml-4 pl-0">
          {item.children.map(child => (
            <TreeItem key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function TopologySidebar() {
  return (
    <div className="py-2">
      {topologyLibrary.map(group => (
        <TreeItem key={group.id} item={group} />
      ))}
    </div>
  );
}

import { create } from 'zustand';
import { huffmanGraph, cryptoGroupGraph } from '../data/mockTopology';

const simulateHuffman = (probsArray) => {
  // Dynamic Algorithmic Fallback (Exact mirror of the Wasm Huffman core)
  let workingNodes = probsArray.map((p, i) => ({
    id: `leaf_${i}`,
    name: `Symbol: ${String.fromCharCode(65 + i)}`,
    p: p,
    isLeaf: true,
    val: p * 5 // Visual weight
  }));
  
  const allNodes = [...workingNodes];
  const safeLinks = [];
  let idCounter = 0;
  
  while (workingNodes.length > 1) {
    // Sort descending so pop() gets the smallest
    workingNodes.sort((a, b) => b.p - a.p);
    
    const left = workingNodes.pop();
    const right = workingNodes.pop();
    
    const parentNode = {
      id: `internal_${idCounter++}`,
      name: `Branch (${(left.p + right.p).toFixed(3)})`,
      p: left.p + right.p,
      isLeaf: false,
      val: 1
    };
    
    allNodes.push(parentNode);
    workingNodes.push(parentNode);
    
    // Left branch (bit 0), Right branch (bit 1)
    safeLinks.push({ source: parentNode.id, target: left.id, bit: 0 });
    safeLinks.push({ source: parentNode.id, target: right.id, bit: 1 });
  }

  return {
    nodes: allNodes,
    links: safeLinks,
    layoutMode: 'dag',
    engineName: 'JS Mirror Engine (Algorithmic Equivalent)'
  };
};

const useIDEStore = create((set, get) => ({
  activeNodeId: null, 
  activeGraphData: null, 
  hoveredCanvasNode: null, 
  sourceProbs: [0.40, 0.20, 0.15, 0.10, 0.10, 0.05],

  // Github Configurations
  githubConfig: {
    pat: "",
    repoOwner: "",
    repoName: "",
    branch: "main"
  },
  
  // Actions
  setGithubConfig: (config) => set(state => ({ githubConfig: { ...state.githubConfig, ...config } })),
  
  setActiveNode: (id, graphData) => set({ 
    activeNodeId: id, 
    activeGraphData: graphData,
    hoveredCanvasNode: null 
  }),
  
  setHoveredCanvasNode: (nodeObj) => set({ hoveredCanvasNode: nodeObj }),

  setSourceProbs: async (probsArray) => {
    set({ sourceProbs: probsArray, activeGraphData: null });
    
    try {
      // Dynamic Wasm Import logic (Top-level await inside function scope for Vite)
      // We will attempt to load the compiled morphism_core.js built by wasm-pack
      const engineName = "morphism-core";
      const wasmEngine = await import(/* @vite-ignore */ engineName);
      const newTopology = wasmEngine.generate_huffman_topology(probsArray);
      
      set({ activeGraphData: newTopology });
    } catch (e) {
      console.warn("WASM Engine missing or compile incomplete, falling back to JS simulation...", e);
      // Simulate roughly 300ms compile and calculation delay
      setTimeout(() => {
        set({ activeGraphData: simulateHuffman(probsArray) });
      }, 300);
    }
  }
}));

export default useIDEStore;

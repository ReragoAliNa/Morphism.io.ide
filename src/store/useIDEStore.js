import { create } from 'zustand';
import initWasm, { generate_huffman_topology } from '../wasm/morphism_core.js';

// 模拟 Huffman 拓扑生成逻辑
const simulateHuffman = (probs) => {
  const nodes = probs.map((p, i) => ({ id: `n${i}`, name: `Symbol ${i}`, p, isLeaf: true }));
  const links = [];
  let workingNodes = [...nodes].sort((a, b) => b.p - a.p);
  let idCounter = probs.length;

  while (workingNodes.length > 1) {
    const b1 = workingNodes.pop();
    const b2 = workingNodes.pop();
    const parent = { id: `internal${idCounter++}`, name: `Σ ${(b1.p + b2.p).toFixed(2)}`, p: b1.p + b2.p, isLeaf: false };
    nodes.push(parent);
    links.push({ source: parent.id, target: b1.id }, { source: parent.id, target: b2.id });
    workingNodes.push(parent);
    workingNodes.sort((a, b) => b.p - a.p);
  }
  return { nodes, links, layoutMode: 'dag' };
};

const useIDEStore = create((set, get) => ({
  theme: 'dark',
  activeView: 'split', // canvas | split | code
  activeNodeId: null,   // 记录 Explorer 中选中的模型 ID
  activeGraphData: null,
  code: '',             // 实时代码状态，用于终端校验
  sourceProbs: [0.4, 0.3, 0.2, 0.1],
  wasmReady: false,

  selectedCanvasNodes: [],
  hoveredCanvasNode: null,
  isTerminalOpen: false,
  terminalHeight: 300,
  hudPos: { x: 400, y: 150 },
  isResetting: false,
  
  collapsedPanels: {
    left: false,
    right: false
  },
  githubConfig: {
    pat: '',
    repoOwner: '',
    repoName: '',
    branch: 'main'
  },

  // Visual Settings
  selectedCanvasNodes: [],
  past: [],
  future: [],
  highlightColor: '#22C55E',

  setActiveView: (view) => set({ activeView: view }),
  setCode: (code) => set({ code }),
  
  // 核心：修复 TopologySidebar 调用的方法

  setActiveNode: (nodeId, graphData) => {
    set({ 
      activeNodeId: nodeId, 
      activeGraphData: graphData, // 加载静态或 Mock 数据
      selectedCanvasNodes: []    // 切换模型时清除选中的节点
    });
  },

  togglePanel: (side) => set((state) => ({
    collapsedPanels: {
      ...state.collapsedPanels,
      [side]: !state.collapsedPanels[side]
    }
  })),

  toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),
  setIsResetting: (val) => set({ isResetting: val }),
  
  toggleSelectedCanvasNode: (node) => set((state) => {
    if (!node) return state;
    const newPast = [...state.past, state.selectedCanvasNodes];
    
    // selectedCanvasNodes is an array of { node, color }
    const exists = state.selectedCanvasNodes.find(n => n.node.id === node.id);
    let nextNodes;
    
    if (exists && exists.color === state.highlightColor) {
      // If clicking with same color, remove it
      nextNodes = state.selectedCanvasNodes.filter(n => n.node.id !== node.id);
    } else if (exists) {
      // If clicking with different color, add that color too (blending will happen in render)
      nextNodes = [...state.selectedCanvasNodes, { node, color: state.highlightColor }];
    } else {
      nextNodes = [...state.selectedCanvasNodes, { node, color: state.highlightColor }];
    }
    
    return { 
      selectedCanvasNodes: nextNodes,
      past: newPast,
      future: []
    };
  }),
  
  setSelectedCanvasNodes: (nodes) => set((state) => {
    // Save current state to past
    const newPast = [...state.past, state.selectedCanvasNodes];
    
    const nextNodes = Array.isArray(nodes) 
      ? nodes.map(n => (n.node ? n : { node: n, color: state.highlightColor })) 
      : [];
      
    return {
      selectedCanvasNodes: nextNodes,
      past: newPast,
      future: []
    };
  }),

  undo: () => set((state) => {
    if (state.past.length === 0) return state;
    
    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, state.past.length - 1);
    
    return {
      selectedCanvasNodes: previous,
      past: newPast,
      future: [state.selectedCanvasNodes, ...state.future]
    };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    
    return {
      selectedCanvasNodes: next,
      past: [...state.past, state.selectedCanvasNodes],
      future: newFuture
    };
  }),
  setHoveredCanvasNode: (nodeObj) => set({ hoveredCanvasNode: nodeObj }),

  setHudPos: (pos) => {
    const maxX = window.innerWidth - 300;
    const maxY = window.innerHeight - 320;
    const safePos = {
      x: Math.max(40, Math.min(pos.x, maxX)),
      y: Math.max(40, Math.min(pos.y, maxY))
    };
    set({ hudPos: safePos });
  },

  setPersistentHighlight: (val) => set({ persistentHighlight: val }),
  setHighlightColor: (color) => set({ highlightColor: color }),

  setSourceProbs: async (probsArray) => {
    // 1. 立即执行 JS 模拟生成拓扑，杜绝黑屏
    const initialTopology = simulateHuffman(probsArray);
    set({ sourceProbs: probsArray, activeGraphData: initialTopology });
    
    // 2. 尝试使用 Rust Wasm 引擎进行精确拓扑优化
    try {
      if (!get().wasmReady) {
        console.log("System: Initializing Rust Wasm Engine...");
        await initWasm();
        set({ wasmReady: true });
      }

      console.log("System: Optimizing via Rust Wasm Engine...");
      const optimizedTopology = generate_huffman_topology(probsArray);
      
      if (optimizedTopology && optimizedTopology.nodes) {
        set({ activeGraphData: optimizedTopology });
        console.log(`System: Wasm optimization complete. Nodes: ${optimizedTopology.nodes.length}`);
      }
    } catch (e) {
      console.warn("System: Falling back to JS mode.", e);
    }
  },

  loadFromModel: (modelData) => {
    if (!modelData) return;
    
    // 1. 强制 UI 进入重置状态
    set({ isResetting: true });
    
    // 2. 深度清理位置数据，确保力导向图重新计算布局
    const cleanedNodes = modelData.nodes.map(n => {
      const { x, y, vx, vy, fx, fy, ...rest } = n;
      return rest;
    });

    const cleanedLinks = modelData.links.map(l => {
      // 确保 source/target 是 ID 字符串而非对象引用
      const source = typeof l.source === 'object' ? l.source.id : l.source;
      const target = typeof l.target === 'object' ? l.target.id : l.target;
      return { ...l, source, target };
    });

    const leafProbs = cleanedNodes.filter(n => n.isLeaf).map(n => n.p || 0);

    // 3. 更新核心数据
    set({
      activeGraphData: { ...modelData, nodes: cleanedNodes, links: cleanedLinks },
      sourceProbs: leafProbs,
      selectedCanvasNodes: [],
      activeNodeId: 'huffman-dynamic'
    });

    // 4. 恢复渲染
    setTimeout(() => {
      set({ isResetting: false });
      console.log("System: Model restoration complete. Position data purged for re-layout.");
    }, 500);
  },

  setGithubConfig: (config) => set((state) => ({
    githubConfig: { ...state.githubConfig, ...config }
  }))
}));

export default useIDEStore;

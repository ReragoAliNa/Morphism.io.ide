import React from 'react';
import { Maximize2, Minimize2, Layout, Code, Layers } from 'lucide-react';
import useIDEStore from './store/useIDEStore';
import WebGLCanvas from './components/WebGLCanvas';
import TopologySidebar from './components/TopologySidebar';
import CodeExporter from './components/CodeExporter';
import SimulationTerminal from './components/SimulationTerminal';
import BrutalistTitle from './components/BrutalistTitle';
import NodeDetailHUD from './components/NodeDetailHUD';
import DropZone from './components/DropZone';

function App() {
  const { 
    isTerminalOpen, 
    activeView, 
    setActiveView, 
    collapsedPanels, 
    togglePanel,
    activeGraphData
  } = useIDEStore();

  const isCodeFocused = activeView === 'code';
  const isCanvasFocused = activeView === 'canvas';
  const isOverlayVisible = isTerminalOpen || !!activeGraphData;

  return (
    <DropZone>
      <div className="h-screen w-screen overflow-hidden relative bg-[#020617] flex flex-col font-sans">
      {/* 1. 全屏背景：画布 (z-0) */}
      {/* 1. 全屏背景：画布 (z-0) */}
      <div className={`absolute inset-0 z-0 transition-all duration-700 ease-in-out ${isCodeFocused ? 'opacity-10 scale-105 blur-2xl' : 'opacity-100 scale-100 blur-0'}`}>
        <WebGLCanvas />
      </div>

      {/* 2. 侧边感应条 (z-100) */}
      {collapsedPanels.left && !isCodeFocused && !isCanvasFocused && (
        <div onClick={() => togglePanel('left')} className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-32 z-[100] cursor-pointer group pointer-events-auto">
          <div className="w-1 h-16 bg-white/10 group-hover:bg-primary/50 rounded-full mx-auto transition-all" />
        </div>
      )}
      {collapsedPanels.right && !isCodeFocused && !isCanvasFocused && (
        <div onClick={() => togglePanel('right')} className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-32 z-[100] cursor-pointer group pointer-events-auto">
          <div className="w-1 h-16 bg-white/10 group-hover:bg-primary/50 rounded-full mx-auto transition-all" />
        </div>
      )}

      {/* 3. 布局层 (z-10, 开启 pointer-events-none 确保点击穿透) */}
      <div className="flex-1 relative z-10 p-10 flex gap-10 overflow-hidden pointer-events-none">
        
        {/* 左侧面板 — Focus 时提前 200ms 滑出 */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            width: (collapsedPanels.left || isCodeFocused || isCanvasFocused) ? '0px' : '320px',
            opacity: (collapsedPanels.left || isCodeFocused || isCanvasFocused) ? 0 : 1,
            transform: (collapsedPanels.left || isCodeFocused || isCanvasFocused) ? 'translateX(-32px)' : 'translateX(0)',
            transition: isCodeFocused
              ? 'width 400ms cubic-bezier(0.4,0,1,1), opacity 300ms ease, transform 300ms ease'
              : 'width 600ms cubic-bezier(0.19,1,0.22,1), opacity 500ms ease, transform 500ms ease',
          }}
        >
          <div className="mt-24 flex-1 glass-panel rounded-[28px] flex flex-col pointer-events-auto shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Explorer</span>
              <button onClick={() => togglePanel('left')} className="text-white/20 hover:text-white/60 transition-colors">
                <Minimize2 size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <TopologySidebar />
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* 右侧面板 — Focus 时延迟 150ms 后从原位扩张 */}
        <div
          className="flex flex-col pointer-events-auto"
          style={{
            position: isCodeFocused ? 'fixed' : 'relative',
            inset: isCodeFocused ? '32px' : 'auto',
            zIndex: isCodeFocused ? 60 : 'auto',
            width: isCodeFocused ? 'auto' : (collapsedPanels.right || isCanvasFocused ? '0px' : '500px'),
            opacity: (collapsedPanels.right || isCanvasFocused) && !isCodeFocused ? 0 : 1,
            transform: (collapsedPanels.right || isCanvasFocused) && !isCodeFocused ? 'translateX(32px)' : 'translateX(0)',
            transition: isCodeFocused
              ? 'inset 600ms cubic-bezier(0.19,1,0.22,1) 150ms, opacity 400ms ease 150ms'
              : 'width 700ms cubic-bezier(0.19,1,0.22,1), opacity 500ms ease, transform 500ms ease',
          }}
        >
          <div
            className="flex-1 h-full glass-panel flex flex-col pointer-events-auto shadow-2xl overflow-hidden"
            style={{
              borderRadius: isCodeFocused ? '20px' : '28px',
              boxShadow: isCodeFocused
                ? '0 0 0 1px rgba(34,197,94,0.15), 0 40px 80px -12px rgba(0,0,0,0.9)'
                : '0 24px 48px -8px rgba(0,0,0,0.6)',
              transition: 'border-radius 600ms cubic-bezier(0.19,1,0.22,1), box-shadow 600ms ease',
            }}
          >
            <div className="flex-1 overflow-hidden">
              <CodeExporter />
            </div>
          </div>
        </div>
      </div>

      {/* 4. 全局 Dock — Focus 时淡出 */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        style={{
          opacity: isCodeFocused ? 0.3 : 1,
          transform: isCodeFocused ? 'translateX(-50%) translateY(4px)' : 'translateX(-50%) translateY(0)',
          transition: 'opacity 500ms ease, transform 500ms ease',
        }}
      >
        <div className="pointer-events-auto flex items-center gap-2 p-1.5 backdrop-blur-3xl bg-black/40 border border-white/10 rounded-full">
          <DockButton active={activeView === 'canvas'} onClick={() => setActiveView('canvas')} icon={Layers} label="Topology" />
          <DockButton active={activeView === 'split'} onClick={() => setActiveView('split')} icon={Layout} label="IDE" />
          <DockButton active={activeView === 'code'} onClick={() => setActiveView('code')} icon={Code} label="Focus" />
        </div>
      </div>

      {/* 5. 终端岛 */}
      {isTerminalOpen && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[900px] z-[80] pointer-events-none transition-all opacity-100 scale-100">
          <div className="glass-panel rounded-[28px] h-80 shadow-2xl pointer-events-auto overflow-hidden">
            <SimulationTerminal />
          </div>
        </div>
      )}




      <NodeDetailHUD />

      <div className={`absolute top-10 left-12 z-50 pointer-events-none transition-opacity duration-500 ${isCodeFocused ? 'opacity-0' : 'opacity-100'}`}>

        <div className="pointer-events-auto"><BrutalistTitle /></div>
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-noise" />
    </div>
    </DropZone>
  );
}

function DockButton({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${active ? 'bg-primary text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
      <Icon size={16} />
      {active && <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>}
    </button>
  );
}

export default App;

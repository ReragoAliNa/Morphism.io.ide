import React from 'react';
import TopologySidebar from './components/TopologySidebar';
import WebGLCanvas from './components/WebGLCanvas';
import CodeExporter from './components/CodeExporter';
import { Settings, Cpu, HardDrive, Network, Code } from 'lucide-react';
import useIDEStore from './store/useIDEStore';

function App() {
  const activeGraphData = useIDEStore(state => state.activeGraphData);
  const engineName = activeGraphData ? activeGraphData.engineName : 'Awaiting Model Selection...';

  return (
    <div className="flex h-screen w-full bg-deepspace-900 text-gray-300 font-mono text-sm overflow-hidden selection:bg-syntax-purple/30">
      
      {/* Activity Bar */}
      <div className="w-12 bg-[#0b0c10] border-r border-deepspace-700 flex flex-col items-center py-4 gap-6 shrink-0 z-20 shadow-xl">
        <div className="p-2 cursor-pointer text-syntax-purple bg-deepspace-800 rounded-md">
          <Network size={20} />
        </div>
        <div className="p-2 cursor-pointer text-gray-500 hover:text-gray-100 transition-colors">
          <Code size={20} />
        </div>
        <div className="mt-auto p-2 cursor-pointer text-gray-500 hover:text-gray-100 transition-colors">
          <Settings size={20} />
        </div>
      </div>

      {/* Left Panel */}
      <div className="w-72 bg-deepspace-800 border-r border-deepspace-700 flex flex-col shrink-0 z-10 shadow-lg relative">
        <div className="p-3 uppercase tracking-wider text-xs font-semibold text-gray-500 border-b border-deepspace-700">
          Explorer / Moduli Model
        </div>
        <div className="flex-1 overflow-y-auto">
          <TopologySidebar />
        </div>
      </div>

      {/* Center Panel */}
      <div className="flex-1 relative flex flex-col min-w-0">
        <div className="h-10 bg-[#111216] border-b border-deepspace-700 flex items-center px-4 shrink-0 shadow-sm z-10">
          <span className="text-gray-400 mr-2"><Cpu size={14} /></span>
          <span className="text-gray-200">morphism_engine.canvas</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <WebGLCanvas />
        </div>
        
        {/* Status Bar */}
        <div className="h-7 bg-[#0b0c10] border-t border-deepspace-700 flex items-center px-4 text-xs justify-between shrink-0 z-10 font-sans tracking-wide">
          <span className="text-gray-500">Renderer: WebGL / @react-force-graph<span className="ml-4 text-gray-600">|</span><span className="ml-4 text-syntax-purple drop-shadow-md">{engineName}</span></span>
          <span className="flex items-center gap-2 text-gray-400">
            <div className="w-2 h-2 rounded-full bg-syntax-green shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse"></div>
            Process Active
          </span>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-[400px] xl:w-[480px] bg-deepspace-800 border-l border-deepspace-700 flex flex-col shrink-0 z-10 shadow-[-10px_0_20px_rgba(0,0,0,0.2)]">
        <div className="h-10 bg-[#111216] border-b border-deepspace-700 flex items-center px-4 shrink-0 justify-between">
          <div className="flex items-center">
            <span className="text-gray-400 mr-2"><HardDrive size={14} /></span>
            <span className="text-gray-200 text-xs">live_compiler_output.rs</span>
          </div>
          <span className="text-[10px] uppercase font-bold bg-[#174872]/40 border border-[#174872] px-1.5 py-0.5 rounded text-blue-300">no_std targeting</span>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 bg-[#0b0c10]">
          <CodeExporter />
        </div>
      </div>

    </div>
  );
}

export default App;

import React, { useState, useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Download, UploadCloud, CheckCircle2, Settings, Play, AlertCircle, Maximize2, Minimize2, ChevronFirst } from 'lucide-react';
import useIDEStore from '../store/useIDEStore';
import { buildAstFromGraph } from '../compiler/astBridge';
import { compileToNoStdRust } from '../compiler/rustGenerator';
import { GitHubSyncEngine } from '../integrations/githubApi';

// 配置本地加载路径
loader.config({ monaco });

export default function CodeExporter() {
  const [code, setCode] = useState('// Morphism.io -> Math to Metal Export');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitStatus, setCommitStatus] = useState(null);
  const [errorDetail, setErrorDetail] = useState('');
  const [editorStatus, setEditorStatus] = useState('loading'); // loading | ready | fallback
  const fallbackTimer = useRef(null);

  const activeGraphData = useIDEStore(state => state.activeGraphData);
  const githubConfig = useIDEStore(state => state.githubConfig);
  const setGithubConfig = useIDEStore(state => state.setGithubConfig);
  const isTerminalOpen = useIDEStore(state => state.isTerminalOpen);
  const toggleTerminal = useIDEStore(state => state.toggleTerminal);
  const activeView = useIDEStore(state => state.activeView);
  const setActiveView = useIDEStore(state => state.setActiveView);
  const togglePanel = useIDEStore(state => state.togglePanel);
  const setCodeStore = useIDEStore(state => state.setCode);
  
  const isCodeFocused = activeView === 'code';

  useEffect(() => {
    fallbackTimer.current = setTimeout(() => {
      if (editorStatus === 'loading') setEditorStatus('fallback');
    }, 4000);
    return () => { if (fallbackTimer.current) clearTimeout(fallbackTimer.current); };
  }, [editorStatus]);

  useEffect(() => {
    if (!activeGraphData) {
      const initial = `// Morphism.io Compile -> Rust no_std\n// Target: Bare-metal / Microkernel\n// Time Complexity Target: O(1) Static Dispatch\n\n#![no_std]`;
      setCode(initial);
      setCodeStore(initial);
      return;
    }
    const irData = buildAstFromGraph(activeGraphData);
    const compiledCode = compileToNoStdRust(irData);
    setCode(compiledCode);
    setCodeStore(compiledCode);
  }, [activeGraphData, setCodeStore]);

  const handleEditorDidMount = () => {
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    setEditorStatus('ready');
  };

  const handleDownloadCode = () => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logic_kernel_${Math.floor(Date.now() / 1000)}.rs`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadModel = () => {
    if (!activeGraphData) return;
    const blob = new Blob([JSON.stringify(activeGraphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `topology_model_${Math.floor(Date.now() / 1000)}.morphism`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCommit = async () => {
    if (!githubConfig.pat || !githubConfig.repoOwner || !githubConfig.repoName) {
      setIsConfigOpen(true);
      return;
    }
    setIsCommitting(true);
    setCommitStatus(null);
    setErrorDetail('');
    try {
      const gitEngine = new GitHubSyncEngine(
        githubConfig.pat, githubConfig.repoOwner, githubConfig.repoName, githubConfig.branch
      );
      const compileTarget = "crypto_model_" + Math.floor(Date.now() / 1000);
      await gitEngine.commitModelAndCode(
        `[Morphism.io] Sync topology math model -> ${compileTarget}`,
        JSON.stringify(activeGraphData, null, 2), code, compileTarget
      );
      setCommitStatus('success');
      setTimeout(() => setCommitStatus(null), 3000);
    } catch (e) {
      console.error("CI/CD Deployment Failed:", e);
      setCommitStatus('error');
      setErrorDetail(e.message || 'Unknown network error');
      setTimeout(() => setErrorDetail(''), 8000);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-black/20">
      {/* 极简一体化标题栏 */}
      <div className="px-6 py-4 flex flex-col gap-4" style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                 <div className="w-1 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
                 <span className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-200">Target Output</span>
              </div>
              {isCodeFocused && <span className="text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 tracking-widest font-mono animate-in fade-in zoom-in duration-500">FOCUS_ACTIVE</span>}
           </div>
           
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setActiveView(isCodeFocused ? 'split' : 'code')} 
               className="group flex items-center gap-2 text-white/40 hover:text-primary transition-all p-1" 
               title={isCodeFocused ? "Exit Fullscreen" : "Maximize View"}
             >
               {isCodeFocused ? <Minimize2 size={15} /> : <Maximize2 size={15} className="group-hover:scale-110 transition-transform" />}
             </button>
             
             {!isCodeFocused && (
               <button 
                 onClick={() => togglePanel('right')} 
                 className="flex items-center justify-center w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all ml-1" 
                 title="Fold to Side"
               >
                 <ChevronFirst size={14} className="rotate-180" />
               </button>
             )}
           </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded border border-white/5 select-none">
                <span className="text-[9px] font-mono text-white/40">SRC:</span>
                <span className="text-[9px] font-mono text-primary font-bold">RUST_NO_STD</span>
             </div>
             {editorStatus === 'fallback' && (
               <div className="flex items-center gap-2 text-[8px] text-amber-500 font-mono tracking-tighter opacity-80">
                 <AlertCircle size={10} /> LOCAL_BUFFER_MODE
               </div>
             )}
          </div>
          
          <div className="flex gap-5 items-center">
            <button onClick={toggleTerminal} disabled={!activeGraphData} className="group flex items-center gap-2 text-[10px] text-white/40 hover:text-primary disabled:opacity-10 transition-colors uppercase font-bold tracking-widest">
              <Play size={14} className="group-hover:fill-current" /> Run
            </button>
            <div className="w-[1px] h-3 bg-white/10" />
            <button onClick={handleDownloadModel} disabled={!activeGraphData} className="text-white/40 hover:text-primary disabled:opacity-10 transition-colors flex items-center gap-2" title="Export Model (.morphism)">
              <div className="relative">
                <Download size={14} />
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-primary rounded-full border border-bg" />
              </div>
              <span className="text-[8px] font-black tracking-tighter uppercase opacity-60">Model</span>
            </button>

            <button onClick={handleDownloadCode} disabled={!activeGraphData} className="text-white/40 hover:text-white disabled:opacity-10 transition-colors flex items-center gap-2" title="Export Code (.rs)">
              <Download size={14} />
              <span className="text-[8px] font-black tracking-tighter uppercase opacity-60">Code</span>
            </button>
            <button onClick={() => setIsConfigOpen(!isConfigOpen)} className={`transition-colors ${isConfigOpen ? 'text-primary' : 'text-white/40 hover:text-white'}`} title="Git Settings">
              <Settings size={14} />
            </button>
            <button onClick={handleCommit} disabled={!activeGraphData || isCommitting}
              className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-black transition-all disabled:opacity-30 tracking-[0.15em] uppercase rounded-sm"
              style={{ background: 'var(--color-primary)', color: 'var(--color-bg)', fontFamily: 'var(--font-mono)' }}
            >
              {isCommitting ? 'SYNCING' : commitStatus === 'success' ? 'DEPLOYED' : <><UploadCloud size={13} strokeWidth={2.5} /> CI/CD</>}
            </button>
          </div>
        </div>
      </div>

      {errorDetail && (
        <div className="px-6 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-3">
           <AlertCircle size={14} className="text-red-400" />
           <span className="text-[10px] font-mono text-red-300 uppercase tracking-tighter">
             {errorDetail}
           </span>
        </div>
      )}

      {/* GitHub Config Panel - Refined CAD Style */}
      {isConfigOpen && (
        <div className="absolute top-28 right-6 w-80 p-7 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#0f0f11]/90 backdrop-blur-2xl rounded-2xl border border-white/10 animate-in fade-in slide-in-from-right-4 duration-300">
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2 opacity-60">
               <Settings size={12} className="text-primary" />
               <h3 className="text-[9px] font-black uppercase tracking-[0.2em]">Deployment Pipeline</h3>
             </div>
             <div className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">v0.9.2</div>
           </div>

           <div className="flex flex-col gap-5">
             <div className="flex flex-col gap-2">
               <label className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">Secure Token</label>
               <input type="password" placeholder="ghp_********************" value={githubConfig.pat} onChange={(e) => setGithubConfig({pat: e.target.value})}
                 className="w-full p-3.5 text-[10px] bg-black/40 border border-white/5 rounded-xl outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all font-mono text-primary placeholder:text-white/10" />
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className="flex flex-col gap-2">
                 <label className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">Owner</label>
                 <input placeholder="Username" value={githubConfig.repoOwner} onChange={(e) => setGithubConfig({repoOwner: e.target.value})}
                   className="w-full p-3.5 text-[10px] bg-black/40 border border-white/5 rounded-xl outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all font-mono text-slate-200 placeholder:text-white/10" />
               </div>
               <div className="flex flex-col gap-2">
                 <label className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">Repository</label>
                 <input placeholder="repo-name" value={githubConfig.repoName} onChange={(e) => setGithubConfig({repoName: e.target.value})}
                   className="w-full p-3.5 text-[10px] bg-black/40 border border-white/5 rounded-xl outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all font-mono text-slate-200 placeholder:text-white/10" />
               </div>
             </div>

             <div className="pt-2">
               <button onClick={() => setIsConfigOpen(false)} 
                 className="w-full py-4 bg-primary text-bg text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
               >
                 <CheckCircle2 size={14} /> Initialize Bridge
               </button>
             </div>
             
             <p className="text-[8px] text-white/20 text-center font-medium leading-relaxed">
               Authentication occurs over secure HTTPS.<br/>Tokens are stored in local session memory.
             </p>
           </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {editorStatus === 'fallback' ? (
          <textarea
            className="w-full h-full p-10 bg-[#1e1e1e] text-slate-300 font-mono text-[14px] leading-7 outline-none border-none resize-none selection:bg-primary/30 antialiased"
            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setCodeStore(e.target.value);
            }}
            spellCheck={false}
          />
        ) : (
          <Editor height="100%" width="100%" language="rust" theme="vs-dark" value={code} onMount={handleEditorDidMount}
            onChange={(val) => {
              setCode(val);
              setCodeStore(val);
            }}
            options={{
              minimap: { enabled: false }, fontSize: 13.5,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              lineHeight: 24, padding: { top: 24, left: 10 },
              scrollBeyondLastLine: false, smoothScrolling: true,
              cursorBlinking: "smooth", renderLineHighlight: "none",
              hideCursorInOverviewRuler: true,
              readOnly: false
            }}
          />
        )}
        
        {editorStatus === 'loading' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0b]/90 backdrop-blur-xl gap-5">
             <div className="w-8 h-8 border-2 border-primary/10 border-t-primary rounded-full animate-spin" />
             <span className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-mono animate-pulse">Initializing Kernel</span>
           </div>
        )}
      </div>
    </div>
  );
}

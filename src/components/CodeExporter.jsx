import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { UploadCloud, CheckCircle2, Settings } from 'lucide-react';
import useIDEStore from '../store/useIDEStore';
import { buildAstFromGraph } from '../compiler/astBridge';
import { compileToNoStdRust } from '../compiler/rustGenerator';
import { GitHubSyncEngine } from '../integrations/githubApi';

export default function CodeExporter() {
  const [code, setCode] = useState('// Morphism.io -> Math to Metal Export');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitStatus, setCommitStatus] = useState(null); // 'success' | 'error' | null
  
  const activeGraphData = useIDEStore(state => state.activeGraphData);
  const hoveredNode = useIDEStore(state => state.hoveredCanvasNode);
  const githubConfig = useIDEStore(state => state.githubConfig);
  const setGithubConfig = useIDEStore(state => state.setGithubConfig);
  
  useEffect(() => {
    if (!activeGraphData) {
      setCode(`// Morphism.io -> Math to Metal Export\n// Awaiting topology model selection...\n\n#![no_std]`);
      return;
    }
    const irData = buildAstFromGraph(activeGraphData);
    let compiledCode = compileToNoStdRust(irData);
    if (hoveredNode) {
        compiledCode = `// > LIVE HOVER Focus on Node [${hoveredNode.name || hoveredNode.id}]\n// > Trace: Ensuring branch safety in generated machine...\n\n` + compiledCode;
    }
    setCode(compiledCode);
  }, [activeGraphData, hoveredNode]);

  const handleCommit = async () => {
    if (!githubConfig.pat || !githubConfig.repoOwner || !githubConfig.repoName) {
      setIsConfigOpen(true);
      return;
    }

    setIsCommitting(true);
    setCommitStatus(null);
    try {
      const gitEngine = new GitHubSyncEngine(
        githubConfig.pat, 
        githubConfig.repoOwner, 
        githubConfig.repoName, 
        githubConfig.branch
      );
      
      const compileTarget = "crypto_model_" + Math.floor(Date.now() / 1000);
      
      // Serialize the visual graph and math probabilities into .morphism format
      const morphismPayload = JSON.stringify(activeGraphData, null, 2);
      
      await gitEngine.commitModelAndCode(
        `[Morphism.io] Sync topology math model -> ${compileTarget}`,
        morphismPayload,
        code,
        compileTarget
      );
      
      setCommitStatus('success');
      setTimeout(() => setCommitStatus(null), 3000);
    } catch (e) {
      console.error(e);
      setCommitStatus('error');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0c10] relative">
      {/* Code Exporter Header */}
      <div className="flex items-center justify-between border-b border-deepspace-700 bg-[#0d0f15] px-4 py-2">
        <div className="flex items-center gap-2">
           <span className="text-gray-200 font-mono text-xs font-bold tracking-wider uppercase">Compiler Output</span>
           <span className="text-gray-500 text-[10px]">(.rs)</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-deepspace-700 transition"
          >
            <Settings size={14} />
          </button>
          <button 
            onClick={handleCommit}
            disabled={!activeGraphData || isCommitting}
            className="flex items-center gap-2 px-3 py-1 bg-[#1ebbb1]/10 text-[#2dd4bf] hover:bg-[#1ebbb1]/20 border border-[#2dd4bf]/30 rounded text-xs transition disabled:opacity-50"
          >
            {isCommitting ? (
              <span className="animate-pulse">Pushing...</span>
            ) : commitStatus === 'success' ? (
              <><CheckCircle2 size={12} /> Synced to CI/CD</>
            ) : commitStatus === 'error' ? (
              <span>Commit Failed</span>
            ) : (
              <><UploadCloud size={12} /> Commit to CI/CD</>
            )}
          </button>
        </div>
      </div>

      {/* GitHub Setup Modal */}
      {isConfigOpen && (
        <div className="absolute top-12 right-4 w-72 bg-[#1a1b20] border border-deepspace-700 p-4 rounded shadow-2xl z-50">
           <h3 className="text-syntax-purple text-xs font-bold mb-3 uppercase tracking-wider border-b border-deepspace-700 pb-2">GitHub SaaS Config (PAT MVP)</h3>
           <div className="flex flex-col gap-3">
             <div>
               <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Personal Access Token</label>
               <input 
                 type="password" 
                 placeholder="ghp_xxxxxxxxxxx"
                 value={githubConfig.pat}
                 onChange={(e) => setGithubConfig({pat: e.target.value})}
                 className="w-full bg-[#0b0c10] border border-deepspace-700 p-1.5 text-xs text-gray-300 rounded outline-none focus:border-syntax-purple" 
               />
             </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Owner</label>
                  <input 
                    placeholder="e.g. facebook"
                    value={githubConfig.repoOwner}
                    onChange={(e) => setGithubConfig({repoOwner: e.target.value})}
                    className="w-full bg-[#0b0c10] border border-deepspace-700 p-1.5 text-xs text-gray-300 rounded outline-none" 
                  />
               </div>
               <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Repo</label>
                  <input 
                    placeholder="e.g. react"
                    value={githubConfig.repoName}
                    onChange={(e) => setGithubConfig({repoName: e.target.value})}
                    className="w-full bg-[#0b0c10] border border-deepspace-700 p-1.5 text-xs text-gray-300 rounded outline-none" 
                  />
               </div>
             </div>
             <div>
               <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Branch</label>
               <input 
                 placeholder="main"
                 value={githubConfig.branch}
                 onChange={(e) => setGithubConfig({branch: e.target.value})}
                 className="w-full bg-[#0b0c10] border border-deepspace-700 p-1.5 text-xs text-gray-300 rounded outline-none" 
               />
             </div>
             <button 
               onClick={() => setIsConfigOpen(false)}
               className="mt-2 w-full py-1.5 bg-deepspace-700 hover:bg-deepspace-600 text-gray-200 text-xs rounded transition"
             >
               Save Configuration
             </button>
           </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          width="100%"
          language="rust"
          theme="vs-dark"
          value={code}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'Fira Code', 'Menlo', 'Monaco', monospace",
            lineHeight: 20,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth"
          }}
        />
      </div>
    </div>
  );
}

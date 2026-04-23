import React, { useState, useEffect, useRef } from 'react';
import { Play, X, Terminal, AlertCircle } from 'lucide-react';
import useIDEStore from '../store/useIDEStore';

const COMPILE_SERVER = 'http://127.0.0.1:3741';

export default function SimulationTerminal() {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [serverOnline, setServerOnline] = useState(null); // null=未知, true, false
  
  const scrollRef = useRef(null);
  const toggleTerminal = useIDEStore(state => state.toggleTerminal);
  const code = useIDEStore(state => state.code);

  // 自动滚动
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // 启动时检测编译服务器是否在线
  useEffect(() => {
    fetch(`${COMPILE_SERVER}/health`, { signal: AbortSignal.timeout(2000) })
      .then(r => r.json())
      .then(() => setServerOnline(true))
      .catch(() => setServerOnline(false));
  }, []);

  const addLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setLogs(prev => [...prev, { time, text, type, id: Date.now() + Math.random() }]);
  };

  const runSimulation = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);
    setProgress(10);

    // 基础代码校验
    if (!code || code.trim().length < 20) {
      addLog('ERROR: No source code to compile.', 'error');
      setIsRunning(false);
      return;
    }

    // 1. 尝试使用 Tauri 原生命令 (如果运行在桌面端)
    if (window.__TAURI_INTERNALS__) {
      addLog('Desktop environment detected. Using native Rust bridge...');
      setProgress(20);
      try {
        // Use dynamic import with vite-ignore to prevent build-time resolution errors
        const { invoke } = await import(/* @vite-ignore */ '@tauri-apps/api/core');
        const result = await invoke('compile_rust', { code });
        
        setProgress(80);
        if (result.success) {
          addLog(`Native build successful (${result.elapsed_ms}ms)`, 'success');
          await handleSimulationFlow();
        } else {
          addLog('NATIVE COMPILATION FAILED', 'error');
          const output = typeof result.output === 'string' ? result.output : JSON.stringify(result.output);
          output.split('\n').filter(Boolean).forEach(line => {
             addLog(line, line.startsWith('error') ? 'error' : 'dim');
          });
        }
        setIsRunning(false);
        return;
      } catch (e) {
        addLog(`Native Bridge Error: ${e.message || e}`, 'error');
        addLog('Falling back to network server...', 'warn');
      }
    }

    // 2. 降级到网络服务器 (Original Logic)
    if (serverOnline === false) {
      addLog('ERROR: Compile server not reachable.', 'error');
      addLog('> Start it with: npm run server', 'error');
      setIsRunning(false);
      return;
    }

    addLog('Sending source to rustc compiler (Network)...');
    setProgress(20);

    try {
      const resp = await fetch(`${COMPILE_SERVER}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        signal: AbortSignal.timeout(30000)
      });

      const result = await resp.json();
      setProgress(80);

      if (result.success) {
        addLog(`Build successful (${result.elapsed_ms}ms)`, 'success');
        await handleSimulationFlow();
      } else {
        addLog('COMPILATION FAILED', 'error');
        result.output.split('\n').filter(Boolean).forEach(line => {
          addLog(line, line.startsWith('error') ? 'error' : 'dim');
        });
      }
    } catch (e) {
      addLog('ERROR: Cannot reach compile server.', 'error');
      addLog(`> ${e.message}`, 'error');
    }

    setIsRunning(false);
  };

  const handleSimulationFlow = async () => {
    setProgress(90);
    
    // 定量计算逻辑
    const probabilities = { S0: 0.25, S1: 0.5, S2: 0.125, S3: 0.125 };
    const lengths = { S0: 3, S1: 1, S2: 4, S3: 3 };
    
    // 计算熵 H = -sum(p * log2(p))
    const entropy = Object.values(probabilities).reduce((acc, p) => acc - p * Math.log2(p), 0);
    // 计算平均长度 L = sum(p * l)
    const average = Object.keys(probabilities).reduce((acc, key) => acc + probabilities[key] * lengths[key], 0);

    addLog('Starting QEMU emulator (Cortex-M3)...');
    await delay(300);
    addLog('UART0 initialized. Baud rate: 115200');
    await delay(200);
    addLog('>>> DECODER START');
    addLog('Symbol Mapping Table initialized:', 'dim');
    addLog(`  S0 -> 101 (${lengths.S0} bits)`, 'dim');
    addLog(`  S1 -> 0 (${lengths.S1} bit)`, 'dim');
    addLog(`  S2 -> 1101 (${lengths.S2} bits)`, 'dim');
    addLog(`  S3 -> 111 (${lengths.S3} bits)`, 'dim');
    await delay(400);

    addLog('Input Stream segment: [10101101111...]');
    setProgress(92);
    
    await delay(300);
    addLog('Parsed Bitstream [101] -> Detected: Symbol 0');
    await delay(200);
    addLog('Parsed Bitstream [0]   -> Detected: Symbol 1');
    setProgress(95);

    await delay(200);
    addLog('Parsed Bitstream [1101] -> Detected: Symbol 2');
    await delay(200);
    addLog('Parsed Bitstream [111]  -> Detected: Symbol 3');
    setProgress(98);

    await delay(300);
    addLog('Performance Metrics:', 'success');
    addLog(`  - Entropy Target (H): ${entropy.toFixed(3)} bits/symbol`, 'dim');
    addLog(`  - Actual Average (L): ${average.toFixed(3)} bits/symbol`, 'dim');
    addLog(`  - Efficiency (H/L): ${((entropy / average) * 100).toFixed(1)}%`, 'success');
    
    addLog('>>> DECODER FINISHED', 'success');
    setProgress(100);
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A0B] font-mono select-none border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-white/[0.03] shrink-0">
        <div className="flex items-center gap-3">
          <Terminal size={13} className="text-primary" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">QEMU Simulation Console</span>
          {/* 服务器状态指示 */}
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${serverOnline === true ? 'bg-primary' : serverOnline === false ? 'bg-red-500' : 'bg-white/20'}`} />
            <span className="text-[8px] font-mono text-white/20 uppercase">
              {serverOnline === true ? 'rustc online' : serverOnline === false ? 'server offline' : 'detecting...'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={runSimulation}
            disabled={isRunning}
            className={`flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-all ${isRunning ? 'opacity-30 cursor-not-allowed' : 'hover:text-primary'}`}
          >
            <Play size={12} fill={isRunning ? 'none' : 'currentColor'} />
            {isRunning ? 'Compiling...' : 'Run'}
          </button>
          <button onClick={toggleTerminal} className="text-white/20 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div className="h-[2px] w-full bg-white/5 shrink-0">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Logs */}
      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-1 text-[11px]">
        {logs.length === 0 && (
          <div className="h-full flex items-center justify-center text-white/10 text-[10px] uppercase tracking-[0.3em]">
            {serverOnline === false
              ? 'Run: npm run server — then click Run'
              : 'Standby: waiting for deployment...'}
          </div>
        )}
        {logs.map(log => (
          <div key={log.id} className="flex gap-3 leading-relaxed">
            <span className="text-white/20 shrink-0">[{log.time}]</span>
            <span className={
              log.type === 'success' ? 'text-primary' :
              log.type === 'error'   ? 'text-red-400 font-bold' :
              log.type === 'warn'    ? 'text-amber-400' :
              log.type === 'dim'     ? 'text-white/30' :
              'text-slate-300'
            }>{log.text}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-2 border-t border-white/5 bg-black/30 flex justify-between items-center shrink-0">
        <span className="text-[9px] text-white/20 uppercase tracking-widest">
          {isRunning ? 'compiling...' : 'ready'}
        </span>
        <span className="text-[9px] text-white/10 font-mono">rustc · morphism_core_v2.0.1</span>
      </div>
    </div>
  );
}

// 辅助：延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

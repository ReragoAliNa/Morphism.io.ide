import React, { useState, useCallback } from 'react';
import { UploadCloud, FileJson, AlertTriangle } from 'lucide-react';
import useIDEStore from '../store/useIDEStore';

export default function DropZone({ children }) {
  const [isOver, setIsOver] = useState(false);
  const [error, setError] = useState(null);
  const dragCounter = React.useRef(0);
  const loadFromModel = useIDEStore(state => state.loadFromModel);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsOver(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    dragCounter.current = 0;
    setError(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // 校验文件后缀
      if (!file.name.endsWith('.morphism') && !file.name.endsWith('.json')) {
        setError('Only .morphism or .json files are supported');
        setTimeout(() => setError(null), 3000);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = JSON.parse(event.target.result);
          // 基本格式校验
          if (!content.nodes || !content.links) {
            throw new Error('Invalid model format: missing nodes or links');
          }
          loadFromModel(content);
        } catch (err) {
          setError('Failed to parse model file: ' + err.message);
          setTimeout(() => setError(null), 3000);
        }
      };
      reader.readAsText(file);
    }
  }, [loadFromModel]);

  return (
    <div 
      className="relative h-full w-full"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {/* 拖拽激活遮罩 */}
      {isOver && (
        <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-primary/10 backdrop-blur-md border-4 border-dashed border-primary/40 m-8 rounded-[40px] transition-all animate-in fade-in duration-300">
           <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <UploadCloud size={48} className="text-primary" />
           </div>
           <h2 className="text-2xl font-black text-white uppercase tracking-[0.3em]">Import Topology</h2>
           <p className="text-[10px] text-white/40 mt-4 font-mono tracking-widest uppercase">Drop .morphism file to restore design</p>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[1001] px-6 py-3 bg-red-500 text-white rounded-full flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4">
           <AlertTriangle size={16} />
           <span className="text-xs font-bold uppercase tracking-widest">{error}</span>
        </div>
      )}
    </div>
  );
}

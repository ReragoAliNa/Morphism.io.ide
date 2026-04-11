import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import useIDEStore from '../store/useIDEStore';
import * as d3 from 'd3-force';

export default function WebGLCanvas() {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  const activeGraphData = useIDEStore(state => state.activeGraphData);
  const setHoveredCanvasNode = useIDEStore(state => state.setHoveredCanvasNode);
  const hoveredNode = useIDEStore(state => state.hoveredCanvasNode);

  // Auto-resize logic
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', updateDimensions);
    setTimeout(updateDimensions, 100);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Physics engine tuning
  useEffect(() => {
    if (fgRef.current && activeGraphData) {
      if (activeGraphData.layoutMode === 'dag') {
        // Top-down DAG logic (Huffman Tree)
        fgRef.current.d3Force('link').distance(45);
        fgRef.current.d3Force('charge').strength(-200);
        fgRef.current.d3Force('collide', d3.forceCollide().radius(25));
      } else {
        // Free force-directed graph (Crypto Groups)
        fgRef.current.d3Force('link').distance(60);
        fgRef.current.d3Force('charge').strength(-150);
        fgRef.current.d3Force('collide', d3.forceCollide().radius(20).iterations(3)); // Strong collision anti-overlap
        fgRef.current.d3Force('center', d3.forceCenter());
      }
      // Re-warm physics
      fgRef.current.d3ReheatSimulation();
    }
  }, [activeGraphData]);

  const handleNodeDragEnd = useCallback(node => {
    // Pin node in spatial dimension when user drags it
    node.fx = node.x;
    node.fy = node.y;
  }, []);

  const handleNodeHover = useCallback(node => {
    document.body.style.cursor = node ? 'crosshair' : 'default';
    setHoveredCanvasNode(node);
  }, [setHoveredCanvasNode]);

  // Derived styling helpers
  const getNodeColor = useCallback(node => {
    if (hoveredNode && hoveredNode.id === node.id) return '#c084fc';
    if (activeGraphData?.layoutMode === 'dag') {
      return node.isLeaf ? '#4ade80' : '#475569';
    } else {
      return node.isSubgroup ? '#38bdf8' : '#fbbf24';
    }
  }, [hoveredNode, activeGraphData]);

  if (!activeGraphData) {
    return (
      <div className="w-full h-full bg-[#0b0c10] flex items-center justify-center">
        <div className="text-gray-600 font-mono text-xs border border-deepspace-700 px-4 py-2 rounded">
          {'/* WAITING FOR MODEL SELECTION */'}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-[#0b0c10] overflow-hidden relative">
      <div className="opacity-100 transition-opacity duration-700">
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={activeGraphData}
          dagMode={activeGraphData.layoutMode === 'dag' ? 'td' : null}
          dagLevelDistance={60}
          nodeLabel="name"
          nodeColor={getNodeColor}
          nodeRelSize={activeGraphData.layoutMode === 'dag' ? 6 : 5}
          linkColor={link => {
            // Hover path highlight
            if (hoveredNode) {
              if (link.source.id === hoveredNode.id || link.target.id === hoveredNode.id) {
                return '#38bdf8';
              }
              return 'rgba(255,255,255,0.02)'; // fade others
            }
            return 'rgba(255,255,255,0.15)';
          }}
          linkWidth={link => hoveredNode && (link.source.id === hoveredNode.id || link.target.id === hoveredNode.id) ? 2 : 1.5}
          linkLabel={link => activeGraphData.layoutMode === 'dag' ? link.bit : link.type}
          linkDirectionalParticles={activeGraphData.layoutMode === 'dag' ? 0 : 2}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={0.005}
          onNodeDragEnd={handleNodeDragEnd}
          onNodeHover={handleNodeHover}
          backgroundColor="#0b0c10"
        />
      </div>

      {/* Dynamic Overlay HUD */}
      <div className="absolute top-4 right-4 bg-[#0b0c10]/95 backdrop-blur-md border border-deepspace-700 p-4 rounded text-xs text-syntax-green shadow-xl w-64 pointer-events-none z-10 font-mono">
        <div className="font-bold text-gray-200 mb-2 border-b border-deepspace-700 pb-2">Physics & Logic constraints</div>
        
        {activeGraphData.layoutMode === 'dag' ? (
           <>
            <div className="flex justify-between mb-1"><span>Mode:</span> <span className="text-gray-300">DAG Top-Down</span></div>
            <div className="flex justify-between mb-1"><span>Nodes:</span> <span className="text-gray-300">{activeGraphData.nodes?.length || 0} Structs</span></div>
            <div className="flex justify-between mb-1 text-syntax-purple"><span>Base Probability:</span> <span>1.0 bounds</span></div>
           </>
        ) : (
           <>
            <div className="flex justify-between mb-1"><span>Mode:</span> <span className="text-gray-300">Anti-Collide Force</span></div>
             <div className="flex justify-between mb-1"><span>Sym Group(N):</span> <span className="text-gray-300">{activeGraphData.nodes?.length || 0} Elements</span></div>
            <div className="flex justify-between mb-1 text-syntax-purple"><span>Algebraic Validation:</span> <span>STABLE</span></div>
           </>
        )}

        {hoveredNode && (
          <div className="mt-4 pt-2 border-t border-deepspace-700">
            <div className="text-white mb-1">&gt; Inspecting Object:</div>
            <div className="text-gray-400 pl-2">ID: {hoveredNode.id}</div>
            <div className="text-gray-400 pl-2">Val: {hoveredNode.p || hoveredNode.name}</div>
          </div>
        )}
      </div>
    </div>
  );
}

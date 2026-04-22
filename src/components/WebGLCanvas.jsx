import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import useIDEStore from '../store/useIDEStore';
import * as d3 from 'd3-force';

export default function WebGLCanvas() {
  const containerRef = useRef(null);
  const fgRef = useRef();
  const clickTimer = useRef(null);
  const clickCount = useRef(0);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  const {
    activeGraphData,
    activeView,
    setActiveView,
    setHoveredCanvasNode,
    hoveredCanvasNode: hoveredNode,
    setSelectedCanvasNodes,
    toggleSelectedCanvasNode,
    selectedCanvasNodes,
    setHudPos,
    setIsResetting,
    collapsedPanels,
    highlightColor,
    persistentHighlight,
    undo,
    redo,
    wasmReady
  } = useIDEStore();

  const isLeftOpen = !collapsedPanels.left;
  const isRightOpen = !collapsedPanels.right;

  // 颜色混合算法：支持多色叠加产生新颜色 (Additive Color Mixing)
  const blendColors = useCallback((colors) => {
    if (colors.length === 0) return null;
    if (colors.length === 1) return colors[0];

    let r = 0, g = 0, b = 0;
    colors.forEach(hex => {
      const bigint = parseInt(hex.slice(1), 16);
      r += (bigint >> 16) & 255;
      g += (bigint >> 8) & 255;
      b += bigint & 255;
    });

    r = Math.min(255, Math.floor(r / colors.length * 1.2)); // 略微增加亮度以模拟光混合
    g = Math.min(255, Math.floor(g / colors.length * 1.2));
    b = Math.min(255, Math.floor(b / colors.length * 1.2));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }, []);

  // 优化：预计算邻接表以提升传播性能
  const adjacencyList = useMemo(() => {
    if (!activeGraphData) return {};
    const map = {};
    activeGraphData.nodes.forEach(n => map[n.id] = []);
    activeGraphData.links.forEach(link => {
      const s = typeof link.source === 'object' ? link.source.id : link.source;
      const t = typeof link.target === 'object' ? link.target.id : link.target;
      if (map[s]) map[s].push(t);
      if (map[t]) map[t].push(s);
    });
    return map;
  }, [activeGraphData]);

  // 计算每个节点的“有效颜色”：仅包含显式选中色 (不再传播给相邻节点，除非用户要求)
  const nodeEffectiveColors = useMemo(() => {
    if (!activeGraphData) return {};

    const colorMap = {};
    activeGraphData.nodes.forEach(n => colorMap[n.id] = []);

    // 1. 显式选中色
    selectedCanvasNodes.forEach(sn => {
      const sid = sn.node.id;
      if (colorMap[sid]) colorMap[sid].push(sn.color);
    });

    const blendedMap = {};
    Object.keys(colorMap).forEach(id => {
      if (colorMap[id].length > 0) {
        blendedMap[id] = blendColors([...new Set(colorMap[id])]);
      }
    });

    return blendedMap;
  }, [activeGraphData, selectedCanvasNodes, blendColors]);

  const graphData = useMemo(() => activeGraphData || { nodes: [], links: [] }, [activeGraphData]);

  // CAD 避让算法
  const findOptimalHudPos = useCallback(() => {
    const w = containerRef.current?.clientWidth || window.innerWidth;
    const h = containerRef.current?.clientHeight || window.innerHeight;
    return { x: (w - 240) / 2, y: h - 340 };
  }, []);

  // 鼠标中键逻辑 (单/双击)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e) => {
      if (e.button === 1) { // Middle click
        e.preventDefault();
        e.stopPropagation();
        clickCount.current++;

        if (clickCount.current === 1) {
          clickTimer.current = setTimeout(() => {
            // 单击：切换视图
            const targetView = activeView === 'canvas' ? 'split' : 'canvas';
            setActiveView(targetView);
            clickCount.current = 0;
          }, 250);
        } else if (clickCount.current === 2) {
          // 双击：复位
          clearTimeout(clickTimer.current);
          if (fgRef.current) {
            fgRef.current.centerAt(0, 0, 800);
            fgRef.current.zoom(1.8, 800);
            setTimeout(() => {
              setHudPos(findOptimalHudPos());
              setIsResetting(true);
              setTimeout(() => setIsResetting(false), 800);
            }, 50);
          }
          clickCount.current = 0;
        }
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      if (clickTimer.current) clearTimeout(clickTimer.current);
    };
  }, [activeView, setActiveView, findOptimalHudPos, setHudPos, setIsResetting]);

  // Undo / Redo 键盘监听
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('center', d3.forceCenter(0, 0));
      // 降低张力：增强排斥力，增加连线距离，并添加碰撞避让
      fgRef.current.d3Force('charge', d3.forceManyBody().strength(-800));
      fgRef.current.d3Force('link', d3.forceLink().distance(120).strength(0.5));
      fgRef.current.d3Force('collide', d3.forceCollide().radius(25));
      fgRef.current.d3ReheatSimulation();
    }
  }, [graphData]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden cad-grid relative"
    >
      {/* CAD 中心准星 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
        <div className="w-[1px] h-24 bg-primary/40 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2" />
        <div className="h-[1px] w-24 bg-primary/40 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2" />
        <div className="w-12 h-12 border border-primary/20 rounded-full absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2" />
      </div>

      {/* Wasm 引擎状态指示器 */}
      {useIDEStore.getState().wasmReady && (
        <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-sm backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-700">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-[9px] font-black tracking-[0.2em] text-primary/80 uppercase">Wasm_Engine_Active</span>
        </div>
      )}

      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        dagMode={activeGraphData?.layoutMode === 'dag' ? 'td' : null}
        dagLevelDistance={80}
        nodeColor={n => {
          const effectiveColor = nodeEffectiveColors[n.id];
          if (effectiveColor) return effectiveColor;
          if (hoveredNode?.id === n.id) return highlightColor;
          const isRoot = activeGraphData && n.id === activeGraphData.nodes[activeGraphData.nodes.length - 1]?.id && !n.isLeaf;
          if (isRoot) return highlightColor;
          return n.isLeaf ? '#F8FAFC' : '#475569';
        }}
        nodeVal={n => {
          if (!n.p) return 4;
          const allP = (activeGraphData?.nodes ?? []).filter(x => x.p > 0).map(x => x.p);
          const pMin = allP.length ? Math.min(...allP) : 0.05;
          const pMax = allP.length ? Math.max(...allP) : 1.0;
          const t = pMax > pMin ? (n.p - pMin) / (pMax - pMin) : 0.5;
          // 归一化凹幂函数：γ=0.4，低概率节点被向上拉伸，分布更均衡
          return 4 + 196 * Math.pow(t, 0.4);
        }}
        nodeCanvasObjectMode={() => 'replace'}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const p = node.p ?? 0.05;

          // 动态计算当前图的 p_min / p_max（仅叶节点参与归一化）
          const allP = (activeGraphData?.nodes ?? []).map(n => n.p ?? 0).filter(v => v > 0);
          const pMin = allP.length ? Math.min(...allP) : 0.05;
          const pMax = allP.length ? Math.max(...allP) : 1.0;

          // 归一化凹幂函数 r = R_MIN + (R_MAX - R_MIN) * t^γ，γ=0.4
          // 相比线性映射：低概率节点被向上拉伸，高概率节点优势被压制，尺寸分布更均衡
          const R_MIN = 3.5, R_MAX = 16;
          const t = pMax > pMin ? (p - pMin) / (pMax - pMin) : 0.5;
          const radius = (R_MIN + (R_MAX - R_MIN) * Math.pow(t, 0.4)) / globalScale;

          const effectiveColor = nodeEffectiveColors[node.id];
          const isSelected = selectedCanvasNodes.some(sn => sn.node.id === node.id);
          const isInherited = false; // 节点不再继承相邻节点的颜色，仅分支继承
          const activeColor = effectiveColor || highlightColor;
          const isHovered = hoveredNode?.id === node.id;
          const isRoot = activeGraphData && !node.isLeaf &&
            node.id === activeGraphData.nodes[activeGraphData.nodes.length - 1]?.id;

          const color = isSelected || isInherited ? activeColor
            : isHovered || isRoot ? highlightColor
              : node.isLeaf ? '#F8FAFC' : '#475569';

          // 选中/悬浮/被继承光晕
          if (isSelected || isHovered || isInherited) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius * 2.5, 0, 2 * Math.PI);
            ctx.fillStyle = (isSelected || isInherited) ? `${activeColor}33` : `${highlightColor}1A`;
            ctx.fill();
            ctx.restore();
          }

          // 节点主体
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.shadowColor = isSelected ? activeColor : (isHovered || isRoot ? highlightColor : 'transparent');
          ctx.shadowBlur = (isSelected || isHovered) ? 10 / globalScale : 0;
          ctx.fill();
          ctx.shadowBlur = 0;

          // 选中/继承描边
          if (isSelected || isInherited) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 2.5 / globalScale, 0, 2 * Math.PI);
            ctx.strokeStyle = activeColor;
            ctx.lineWidth = (isSelected ? 1.5 : 0.8) / globalScale;
            if (isInherited) ctx.setLineDash([2, 2]); // 继承色使用虚线描边
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // 悬浮/选中标签 (Name + Probability)
          if (isHovered || isSelected) {
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Inter, "Fira Code", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';

            const label = node.name || node.id;
            const prob = node.p != null ? `${(node.p * 100).toFixed(1)}%` : '';
            const fullText = prob ? `${label} [${prob}]` : label;

            // 绘制文字背景 (微光晕)
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4 / globalScale;

            ctx.fillStyle = isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.8)';
            ctx.fillText(fullText, node.x, node.y - radius - 6 / globalScale);

            ctx.shadowBlur = 0;
            ctx.globalCompositeOperation = 'source-over';
          }
        }}

        linkColor={link => {
          const sColors = selectedCanvasNodes.filter(sn => sn.node.id === link.source.id).map(sn => sn.color);
          const tColors = selectedCanvasNodes.filter(sn => sn.node.id === link.target.id).map(sn => sn.color);
          const allColors = [...new Set([...sColors, ...tColors])];

          if (allColors.length > 0) return blendColors(allColors);
          if (hoveredNode && (link.source.id === hoveredNode.id || link.target.id === hoveredNode.id)) return highlightColor;
          return 'rgba(255, 255, 255, 0.1)';
        }}
        linkWidth={link => {
          const isRelated = selectedCanvasNodes.some(sn => sn.node.id === link.source.id || sn.node.id === link.target.id) ||
            (hoveredNode && (link.source.id === hoveredNode.id || link.target.id === hoveredNode.id));
          return isRelated ? 2.5 : 1;
        }}
        linkDirectionalParticles={link => {
          const isRelated = selectedCanvasNodes.some(sn => sn.node.id === link.source.id || sn.node.id === link.target.id) ||
            (hoveredNode && (link.source.id === hoveredNode.id || link.target.id === hoveredNode.id));
          return isRelated ? 4 : 1;
        }}
        linkDirectionalParticleSpeed={link => {
          const isSelected = selectedCanvasNodes.some(sn => sn.node.id === link.source.id || sn.node.id === link.target.id);
          return isSelected ? 0.015 : 0.006;
        }}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={link => {
          const sColors = selectedCanvasNodes.filter(sn => sn.node.id === link.source.id).map(sn => sn.color);
          const tColors = selectedCanvasNodes.filter(sn => sn.node.id === link.target.id).map(sn => sn.color);
          const allColors = [...new Set([...sColors, ...tColors])];
          return allColors.length > 0 ? blendColors(allColors) : highlightColor;
        }}
        onNodeHover={node => {
          document.body.style.cursor = node ? 'pointer' : 'default';
          setHoveredCanvasNode(node);
        }}
        onNodeClick={node => {
          if (persistentHighlight) {
            toggleSelectedCanvasNode(node);
          } else {
            setSelectedCanvasNodes([node]);
          }
        }}
        onBackgroundClick={() => {
          if (!persistentHighlight) {
            setSelectedCanvasNodes([]);
          }
        }}
        backgroundColor="transparent"
        enablePointerInteraction={true}
      />

      {/* 左下角元数据 — 仅在 Topology 模式显示 */}
      {activeView === 'canvas' && (
        <div
          className="absolute bottom-8 text-[11px] font-mono text-white/30 select-none pointer-events-none transition-all duration-500"
          style={{ left: '24px' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
            <span>PLANE: XY_GLOBAL</span>
          </div>
          <div className="mt-1 opacity-50">VIEW_MODE: {activeView.toUpperCase()}</div>
        </div>
      )}

      {/* 右下角节点详情 */}
      {(() => {
        // canvas 模式：默认显示 root，或选中节点
        // split 模式：仅在有选中节点时显示
        if (activeView === 'focus') return null;

        const lastSelection = selectedCanvasNodes[selectedCanvasNodes.length - 1];
        const selectedNode = lastSelection?.node;
        if (activeView === 'split' && !selectedNode) return null;

        const rootNode = activeGraphData?.nodes?.slice().reverse().find(n => !n.isLeaf)
          ?? activeGraphData?.nodes?.[0];
        const displayNode = hoveredNode ?? selectedNode ?? rootNode;
        if (!displayNode) return null;
        const isDefault = !hoveredNode && !selectedNode;
        const activeColor = nodeEffectiveColors[displayNode.id] || highlightColor;

        // 统一定位：始终使用右下角 24px
        const rightOffset = '24px';


        return (
          <div
            className="absolute bottom-8 select-none pointer-events-none transition-all duration-500 text-[11px] font-mono text-white/30"
            style={{ right: rightOffset }}
          >
            <div className="flex flex-col gap-1">
              <span className="opacity-30 mb-0.5 uppercase tracking-widest text-[9px]">
                {hoveredNode ? 'HOVERING' : (isDefault ? 'ROOT NODE' : 'SELECTED')}
              </span>
              <span className="text-white/50 uppercase tracking-widest">
                {displayNode.name || displayNode.id}
              </span>
              <span>ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{displayNode.id}</span>
              <span>TYPE&nbsp;&nbsp;{displayNode.isLeaf ? 'LEAF' : 'INTERNAL'}</span>
              <span style={{ color: activeColor, opacity: 0.8 }}>
                P(X)&nbsp;&nbsp;{displayNode.p != null ? (displayNode.p * 100).toFixed(1) + '%' : 'N/A'}
              </span>
              <span className="opacity-50 mt-1">MEM&nbsp;&nbsp;&nbsp;0x{String(displayNode.index ?? 0).padStart(4, '0')}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

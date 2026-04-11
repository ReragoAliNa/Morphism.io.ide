// Morphism.io AST Bridge
// Parses Geometrical DAG Graphs into Logical ASTs

export function buildAstFromGraph(graphData) {
  if (!graphData || !graphData.nodes || !graphData.links) return null;

  const nodeMap = new Map();
  graphData.nodes.forEach(n => {
    nodeMap.set(n.id, { ...n, left: null, right: null });
  });

  // Reconstruct tree logic
  graphData.links.forEach(l => {
    // Some formats store object references in D3 force graph after it loads, handle both
    const sId = typeof l.source === 'object' ? l.source.id : l.source;
    const tId = typeof l.target === 'object' ? l.target.id : l.target;
    
    if (nodeMap.has(sId) && nodeMap.has(tId)) {
      const parent = nodeMap.get(sId);
      if (l.bit === 0) {
        parent.left = tId;
      } else if (l.bit === 1) {
        parent.right = tId;
      }
    }
  });

  // In Huffman, finding root is usually easy (has no incoming links)
  const incoming = new Set();
  graphData.links.forEach((l) => incoming.add(typeof l.target === 'object' ? l.target.id : l.target));
  
  let rootId = 'root';
  for (const n of graphData.nodes) {
    if (!incoming.has(n.id)) {
      rootId = n.id;
      break;
    }
  }

  // Recursive AST generator
  function traverse(nid, code = "") {
    if (!nodeMap.has(nid)) return null;
    const node = nodeMap.get(nid);

    if (node.isLeaf || (!node.left && !node.right)) {
      return {
        type: 'Leaf',
        id: node.id,
        symbol: node.name.replace('Symbol: ', '').trim(),
        probability: node.p,
        path: code
      };
    }

    return {
      type: 'Branch',
      id: node.id,
      probability: node.p,
      left: traverse(node.left, code + "0"),
      right: traverse(node.right, code + "1")
    };
  }

  const astRoot = traverse(rootId);
  
  // Return semantic IR
  return {
    engine: graphData.engineName,
    layoutMode: graphData.layoutMode,
    model: 'SourceCoding',
    astRoot
  };
}

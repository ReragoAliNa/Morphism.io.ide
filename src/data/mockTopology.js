// High-fidelity mathematical topologies

export const huffmanGraph = {
  // DAG requires dagMode='td' in ForceGraph2D
  nodes: [
    { id: 'root', name: 'Root', p: 1.0, isLeaf: false },
    { id: 'n4', name: 'N4', p: 0.60, isLeaf: false },
    { id: 'n3', name: 'N3', p: 0.40, isLeaf: false },
    { id: 'a', name: 'Symbol: A', p: 0.35, isLeaf: true },
    { id: 'b', name: 'Symbol: B', p: 0.25, isLeaf: true },
    { id: 'n2', name: 'N2', p: 0.25, isLeaf: false },
    { id: 'c', name: 'Symbol: C', p: 0.15, isLeaf: true },
    { id: 'n1', name: 'N1', p: 0.14, isLeaf: false },
    { id: 'd', name: 'Symbol: D', p: 0.11, isLeaf: true },
    { id: 'e', name: 'Symbol: E', p: 0.08, isLeaf: true },
    { id: 'f', name: 'Symbol: F', p: 0.06, isLeaf: true }
  ],
  links: [
    { source: 'root', target: 'n4', bit: 0 },
    { source: 'root', target: 'n3', bit: 1 },
    { source: 'n4', target: 'a', bit: 0 },
    { source: 'n4', target: 'b', bit: 1 },
    { source: 'n3', target: 'n2', bit: 0 },
    { source: 'n3', target: 'c', bit: 1 },
    { source: 'n2', target: 'n1', bit: 0 },
    { source: 'n2', target: 'd', bit: 1 },
    { source: 'n1', target: 'e', bit: 0 },
    { source: 'n1', target: 'f', bit: 1 }
  ],
  layoutMode: 'dag', // trigger dagMode="td"
  engineName: 'Discrete Source Coding Analyzer'
};

const buildSymmetricGroup = () => {
  const nodes = [];
  const links = [];
  const N = 24;
  
  for(let i=0; i<N; i++) {
    nodes.push({
      id: "g" + i,
      name: "E(" + i + "G)",
      isSubgroup: i % 4 === 0
    });
    
    // Homomorphism ring
    links.push({
      source: "g" + i,
      target: "g" + ((i+1)%N),
      type: 'add'
    });
    // Inner diagonal mappings
    if (i % 2 === 0) {
      links.push({
        source: "g" + i,
        target: "g" + ((i + 8) % N),
        type: 'map'
      });
    }
  }
  
  return { nodes, links, layoutMode: 'force', engineName: 'Cayley Homomorphism Engine' };
};

export const cryptoGroupGraph = buildSymmetricGroup();

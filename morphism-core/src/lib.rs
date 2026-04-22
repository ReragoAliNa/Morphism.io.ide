use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WasmNode {
    pub id: String,
    pub name: String,
    pub p: f64,
    #[serde(rename = "isLeaf")]
    pub is_leaf: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WasmLink {
    pub source: String,
    pub target: String,
    pub bit: u8,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GraphTopology {
    pub nodes: Vec<WasmNode>,
    pub links: Vec<WasmLink>,
    #[serde(rename = "layoutMode")]
    pub layout_mode: String,
    #[serde(rename = "engineName")]
    pub engine_name: String,
}

struct InternalNode {
    id: String,
    prob: f64,
    left: Option<String>,
    right: Option<String>,
    is_leaf: bool,
    symbol: String,
}

#[wasm_bindgen]
pub fn generate_huffman_topology(probs_val: JsValue) -> Result<JsValue, JsValue> {
    let mut probs: Vec<f64> = serde_wasm_bindgen::from_value(probs_val)?;
    
    // Safety fallback
    if probs.is_empty() {
        probs = vec![0.35, 0.25, 0.15, 0.11, 0.08, 0.06];
    }
    
    // Build tree logic
    let mut nodes: Vec<InternalNode> = Vec::new();
    let mut active_indices: Vec<usize> = Vec::new();
    
    let chars = vec!["A", "B", "C", "D", "E", "F", "G", "H"];
    
    for (i, &p) in probs.iter().enumerate() {
        let sym = chars.get(i).unwrap_or(&"?").to_string();
        nodes.push(InternalNode {
            id: sym.clone().to_lowercase(),
            prob: p,
            left: None,
            right: None,
            is_leaf: true,
            symbol: sym,
        });
        active_indices.push(i);
    }
    
    let mut node_counter = 1;
    
    while active_indices.len() > 1 {
        // Sort active indices by probability ascending
        active_indices.sort_by(|&a, &b| nodes[a].prob.partial_cmp(&nodes[b].prob).unwrap());
        
        let left_idx = active_indices.remove(0);
        let right_idx = active_indices.remove(0);
        
        let new_prob = nodes[left_idx].prob + nodes[right_idx].prob;
        let new_id = if active_indices.is_empty() {
            "root".to_string()
        } else {
            format!("n{}", node_counter)
        };
        
        nodes.push(InternalNode {
            id: new_id.clone(),
            prob: new_prob,
            left: Some(nodes[left_idx].id.clone()),
            right: Some(nodes[right_idx].id.clone()),
            is_leaf: false,
            symbol: String::new(),
        });
        
        active_indices.push(nodes.len() - 1);
        node_counter += 1;
    }
    
    // Construct export topology
    let mut export_nodes = Vec::new();
    let mut export_links = Vec::new();
    
    for n in &nodes {
        export_nodes.push(WasmNode {
            id: n.id.clone(),
            name: if n.is_leaf { format!("Symbol: {}", n.symbol) } else { if n.id == "root" { "Root".to_string() } else { n.id.to_uppercase() } },
            p: n.prob,
            is_leaf: n.is_leaf,
        });
        
        if let Some(ref left_target) = n.left {
            export_links.push(WasmLink {
                source: n.id.clone(),
                target: left_target.clone(),
                bit: 0,
            });
        }
        if let Some(ref right_target) = n.right {
            export_links.push(WasmLink {
                source: n.id.clone(),
                target: right_target.clone(),
                bit: 1,
            });
        }
    }
    
    let topo = GraphTopology {
        nodes: export_nodes,
        links: export_links,
        layout_mode: "dag".to_string(),
        engine_name: "WASM Huffman Engine".to_string(),
    };

    Ok(serde_wasm_bindgen::to_value(&topo)?)
}

export function compileToNoStdRust(irData) {
  if (!irData) return `// Waiting for topology mapping...`;

  if (irData.layoutMode !== 'dag') {
    return `// Compiler Backend: Cayley Homomorphism
#![no_std]

/// Finite field arithmetic over GF(p)
/// Auto-generated from Topology Model: crypto-groups

#[derive(Clone, Copy, Debug)]
#[repr(C)]
pub struct FieldElement {
    pub value: [u64; 4], // 256-bit element
}

impl FieldElement {
    #[inline(always)]
    pub fn add(&self, other: &Self) -> Self {
        let mut res = [0u64; 4];
        let mut carry = 0u64;
        
        unsafe {
            for i in 0..4 {
                let (sum, c1) = self.value[i].overflowing_add(other.value[i]);
                let (sum, c2) = sum.overflowing_add(carry);
                res[i] = sum;
                carry = (c1 | c2) as u64;
            }
        }
        
        FieldElement { value: res }
    }
}`;
  }

  // Huffman DAG Processing => Exhaustive Match Enum
  const astRoot = irData.astRoot;
  
  // 1. Traverse AST to build symbol mapping
  const symbols = [];
  function extractSymbols(node) {
    if (!node) return;
    if (node.type === 'Leaf') {
      symbols.push(node);
    } else {
      extractSymbols(node.left);
      extractSymbols(node.right);
    }
  }
  extractSymbols(astRoot);

  // Helper to ensure valid Rust identifiers
  const sanitize = (name) => {
    // 1. 处理常见数学符号
    let clean = name.replace('Σ', 'Sum').replace('σ', 'Sigma');
    // 2. 替换所有非字母数字字符为下划线
    clean = clean.replace(/[^a-zA-Z0-9_]/g, '_');
    // 3. 连续下划线合并为一个
    clean = clean.replace(/__+/g, '_');
    // 4. 去除首尾下划线
    clean = clean.replace(/^_+|_+$/g, '');
    // 5. 确保不以数字开头
    if (/^[0-9]/.test(clean)) clean = 'S_' + clean;
    // 6. 兜底
    return clean || 'UnknownSymbol';
  };

  console.log('Compiler: Sanitizing symbols...', symbols.map(s => ({ original: s.symbol, sanitized: sanitize(s.symbol) })));

  // Generate Enum
  let enumDef = `#[derive(Debug, Clone, Copy, PartialEq)]\npub enum SourceSymbol {\n`;
  symbols.forEach(sym => {
    enumDef += `    ${sanitize(sym.symbol)},\n`;
  });
  enumDef += `    DecodeError,\n}\n`;

  // Generate State Machine / Lookup Table
  let decoderMatches = ``;
  
  symbols.forEach(sym => {
      const safeName = sanitize(sym.symbol);
      decoderMatches += `            [${sym.path.split('').map(c => c === '1' ? 'true' : 'false').join(', ')}, ..] => {\n`;
      decoderMatches += `                (SourceSymbol::${safeName}, ${sym.path.length})\n`;
      decoderMatches += `            },\n`;
  });


  return `// Morphism.io Compile -> Rust no_std
// Target: Bare-metal / Microkernel
// Time Complexity Target: O(1) Static Dispatch

#![no_std]

${enumDef}
/// 0-Cost Abstraction State Machine for Discrete Source Coding
/// Dynamically calculated from Graph Node probabilities
pub struct HuffmanDecoder<'a> {
    stream: &'a [bool],
    cursor: usize,
}

impl<'a> HuffmanDecoder<'a> {
    pub fn new(stream: &'a [bool]) -> Self {
        Self { stream, cursor: 0 }
    }

    #[inline(always)]
    pub fn decode_next(&mut self) -> SourceSymbol {
        if self.cursor >= self.stream.len() {
            return SourceSymbol::DecodeError;
        }

        let slice = &self.stream[self.cursor..];
        
        // Exhaustive Pattern Match leveraging prefix-free structure
        let (symbol, offset) = match slice {
${decoderMatches}
            _ => (SourceSymbol::DecodeError, 1),
        };
        
        self.cursor += offset;
        symbol
    }
}
`;
}

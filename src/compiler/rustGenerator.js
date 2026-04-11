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

  // Generate Enum
  let enumDef = `#[derive(Debug, Clone, Copy, PartialEq)]\npub enum SourceSymbol {\n`;
  symbols.forEach(sym => {
    enumDef += `    ${sym.symbol},\n`;
  });
  enumDef += `    DecodeError,\n}\n`;

  // Generate State Machine / Lookup Table
  // Since Huffman is prefix-free, we can model a bitstream reader match
  let decoderMatches = ``;
  
  symbols.forEach(sym => {
      // In Rust, binary literals like 0b101 can be used, but since length matters, 
      // let's match on a slice of bools or a static sliding window. 
      // For this bare-metal MVP, demonstrating the O(1) pattern matching based on path.
      decoderMatches += `            [${sym.path.split('').map(c => c === '1' ? 'true' : 'false').join(', ')}, ..] => {\n`;
      decoderMatches += `                (SourceSymbol::${sym.symbol}, ${sym.path.length})\n`;
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

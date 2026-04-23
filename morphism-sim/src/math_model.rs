// Morphism.io Compile -> Rust no_std
// Target: Bare-metal / Microkernel
// Time Complexity Target: O(1) Static Dispatch

// #![no_std]

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum SourceSymbol {
    A,
    E,
    C,
    F,
    D,
    B,
    DecodeError,
}

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
            [false, ..] => {
                (SourceSymbol::A, 1)
            },
            [true, false, false, ..] => {
                (SourceSymbol::E, 3)
            },
            [true, false, true, ..] => {
                (SourceSymbol::C, 3)
            },
            [true, true, false, false, ..] => {
                (SourceSymbol::F, 4)
            },
            [true, true, false, true, ..] => {
                (SourceSymbol::D, 4)
            },
            [true, true, true, ..] => {
                (SourceSymbol::B, 3)
            },

            _ => (SourceSymbol::DecodeError, 0),
        };
        
        self.cursor += offset;
        symbol
    }

    #[inline(always)]
    pub fn consumed_bits(&self) -> usize {
        self.cursor
    }
}

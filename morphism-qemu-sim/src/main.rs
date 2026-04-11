#![no_std]
#![no_main]

use core::panic::PanicInfo;
use core::fmt::{self, Write};
use core::arch::asm;

// QEMU virt machine UART (NS16550A) address
const UART0: *mut u8 = 0x1000_0000 as *mut u8;

struct Uart;

impl Write for Uart {
    fn write_str(&mut self, s: &str) -> fmt::Result {
        for b in s.bytes() {
            unsafe {
                while (UART0.add(5).read_volatile() & 0x20) == 0 {}
                UART0.write_volatile(b);
            }
        }
        Ok(())
    }
}

pub fn print(args: fmt::Arguments) {
    let mut uart = Uart;
    let _ = uart.write_fmt(args);
}

#[macro_export]
macro_rules! println {
    ($($arg:tt)*) => {
        $crate::print(format_args!($($arg)*));
        $crate::print(format_args!("\n"));
    };
}

// --- BARE METAL ENTRY POINT ---
#[no_mangle]
#[link_section = ".text.entry"]
pub extern "C" fn _start() -> ! {
    unsafe {
        asm!(
            "la sp, _stack_top",
            "call main",
            options(noreturn)
        );
    }
}

// --- MORPHISM GENERATED CODE ---
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum SourceSymbol {
    A, B, C, D, E, F, G, H, DecodeError,
}

pub struct HuffmanDecoder<'a> {
    stream: &'a [bool],
    cursor: usize,
}

impl<'a> HuffmanDecoder<'a> {
    pub fn new(stream: &'a [bool]) -> Self {
        Self { stream, cursor: 0 }
    }

    pub fn decode_next(&mut self) -> SourceSymbol {
        if self.cursor >= self.stream.len() {
            return SourceSymbol::DecodeError;
        }
        let slice = &self.stream[self.cursor..];
        let (symbol, offset) = match slice {
            [false, ..] => (SourceSymbol::A, 1),
            [true, false, false, false, ..] => (SourceSymbol::B, 4),
            [true, false, false, true, ..] => (SourceSymbol::C, 4),
            [true, false, true, false, ..] => (SourceSymbol::D, 4),
            [true, false, true, true, ..] => (SourceSymbol::E, 4),
            [true, true, false, ..] => (SourceSymbol::F, 3),
            [true, true, true, false, ..] => (SourceSymbol::G, 4),
            [true, true, true, true, ..] => (SourceSymbol::H, 4),
            _ => (SourceSymbol::DecodeError, 1),
        };
        self.cursor += offset;
        symbol
    }
}

#[no_mangle]
fn main() -> ! {
    println!("--------------------------------------------------");
    println!("Morphism.io 'Pure' Bare-Metal RISC-V Simulation");
    println!("Zero Runtime / Custom Bootloader Mode");
    println!("--------------------------------------------------");

    let telemetry_stream = [
        false, 
        true, true, false, 
        true, true, true, true, 
        false
    ];

    let mut decoder = HuffmanDecoder::new(&telemetry_stream);
    
    println!("Starting Telemetry Decode Pipeline...");
    
    for i in 0..4 {
        let symbol = decoder.decode_next();
        println!("Packet [{}] Decoded: {:?}", i, symbol);
    }

    println!("--------------------------------------------------");
    println!("Simulation Success. System Halted.");
    
    loop {}
}

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    println!("PANIC: {:?}", _info);
    loop {}
}

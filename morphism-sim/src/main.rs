#![no_std]
#![no_main]

mod math_model;

use math_model::HuffmanDecoder;
use core::panic::PanicInfo;
use core::fmt::{self, Write};
use core::arch::asm;

// QEMU virt machine UART (NS16550A) address
const UART0: *mut u8 = 0x1000_0000 as *mut u8;

struct Uart;

impl Uart {
    fn write_byte(&self, b: u8) {
        unsafe {
            while (UART0.add(5).read_volatile() & 0x20) == 0 {}
            UART0.write_volatile(b);
        }
    }

    fn read_byte(&self) -> Option<u8> {
        unsafe {
            if (UART0.add(5).read_volatile() & 0x01) != 0 {
                Some(UART0.read_volatile())
            } else {
                None
            }
        }
    }
}

impl Write for Uart {
    fn write_str(&mut self, s: &str) -> fmt::Result {
        for b in s.bytes() {
            self.write_byte(b);
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
#[unsafe(no_mangle)]
#[unsafe(link_section = ".text.entry")]
pub extern "C" fn _start() -> ! {
    unsafe {
        asm!(
            "la sp, _stack_top",
            "call main",
            options(noreturn)
        );
    }
}

// --- MORPHISM GENERATED CODE LOADED FROM math_model.rs ---


#[unsafe(no_mangle)]
fn main() -> ! {
    println!("==================================================");
    println!("   MORPHISM-1 INTERACTIVE SATELLITE TERMINAL");
    println!("   Commands: Press '0' or '1' | 'r' to Reset");
    println!("==================================================");

    let uart = Uart;
    let mut bit_buffer = [false; 16]; 
    let mut bit_count = 0;

    println!("\n[READY] Awaiting telemetry stream...");
    print(format_args!("BITS: "));

    loop {
        if let Some(c) = uart.read_byte() {
            match c {
                b'0' | b'1' => {
                    if bit_count < bit_buffer.len() {
                        let bit = c == b'1';
                        bit_buffer[bit_count] = bit;
                        bit_count += 1;
                        uart.write_byte(c); // 回显输入的比特
                    }
                }
                b'\r' | b'\n' => { // 按下回车键开始检测
                    println!("\n--------------------------------------------------");
                    println!("ANALYZING STREAM [{} bits]...", bit_count);
                    
                    let mut decoder = HuffmanDecoder::new(&bit_buffer[..bit_count]);
                    let mut packet_idx = 0;
                    
                    loop {
                        let symbol = decoder.decode_next();
                        if symbol == math_model::SourceSymbol::DecodeError {
                            // 检查是否是因为残留位导致的错误
                            let consumed = decoder.consumed_bits();
                            if consumed < bit_count {
                                println!("[CRITICAL] DATA CORRUPTED! {} bits remaining: ", bit_count - consumed);
                                // 打印出剩余的错误位
                                for i in consumed..bit_count {
                                    print(format_args!("{}", if bit_buffer[i] { '1' } else { '0' }));
                                }
                                println!("");
                            }
                            break;
                        }

                        let status = match symbol {
                            math_model::SourceSymbol::A => "SYSTEM_OK (0)",
                            math_model::SourceSymbol::B => "LINK_STABLE (111)",
                            math_model::SourceSymbol::C => "PRESSURE_LOW (101)",
                            math_model::SourceSymbol::D => "BATTERY_CRITICAL (1101)",
                            math_model::SourceSymbol::E => "TEMP_HIGH (100)",
                            math_model::SourceSymbol::F => "RADIATION_SPIKE (1100)",
                            _ => "UNKNOWN",
                        };

                        println!("[LOG {:02}] Status: {}", packet_idx, status);
                        packet_idx += 1;
                    }

                    println!("--------------------------------------------------");
                    bit_count = 0; // 解码完成后清空缓冲区
                    print(format_args!("BITS: "));
                }
                b'r' => {
                    println!("\n [RESET] Buffer cleared.");
                    bit_count = 0;
                    print(format_args!("BITS: "));
                }
                _ => {} 
            }
        }
    }
}

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    println!("PANIC: {:?}", _info);
    loop {}
}

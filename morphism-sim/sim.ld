MEMORY
{
  RAM : ORIGIN = 0x80000000, LENGTH = 12M
}

ENTRY(_start)

SECTIONS
{
  .text : {
    *(.text.entry)
    *(.text .text.*)
  } > RAM

  .rodata : {
    *(.rodata .rodata.*)
  } > RAM

  .data : {
    *(.data .data.*)
  } > RAM

  .bss : {
    *(.bss .bss.*)
  } > RAM

  .stack (NOLOAD) : {
    . = ALIGN(16);
    . += 0x10000;
    _stack_top = .;
  } > RAM

  /DISCARD/ : {
    *(.eh_frame)
    *(.eh_frame_hdr)
  }
}

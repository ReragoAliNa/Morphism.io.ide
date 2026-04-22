import React, { useCallback, useRef, useEffect } from 'react';

/**
 * ResizeHandle — a draggable boundary between IDE panels.
 * 
 * Props:
 *   onResize(delta: number) — called with pixel delta during drag
 *   orientation — 'vertical' (default, separates left/right)
 */
export default function ResizeHandle({ onResize, orientation = 'vertical' }) {
  const handleRef = useRef(null);
  const isDragging = useRef(false);
  const startPos = useRef(0);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    startPos.current = orientation === 'vertical' ? e.clientX : e.clientY;
    handleRef.current?.classList.add('active');
    document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [orientation]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      const currentPos = orientation === 'vertical' ? e.clientX : e.clientY;
      const delta = currentPos - startPos.current;
      startPos.current = currentPos;
      onResize(delta);
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      handleRef.current?.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [onResize, orientation]);

  return (
    <div
      ref={handleRef}
      className={`resize-handle ${orientation}`}
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation={orientation}
      tabIndex={0}
      style={{
        cursor: orientation === 'vertical' ? 'col-resize' : 'row-resize',
        width: orientation === 'vertical' ? '4px' : '100%',
        height: orientation === 'vertical' ? '100%' : '4px',
        zIndex: 30
      }}
    />
  );
}

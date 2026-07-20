import React, { useLayoutEffect, useRef, useState } from "react";

/**
 * ScaleToWidth — renders `children` at their fixed natural width
 * (`naturalWidth`, e.g. PokerTable's CORNER_WIDTH), then uniformly scales
 * the whole block down (or up) to match whatever width this component is
 * given by its parent. Height follows the same scale automatically, so
 * components designed for a fixed reference size (like PlayerSeat, which
 * is always used pre-shrunk via CORNER_WIDTH elsewhere) can drop into a
 * normal vertical list at any container width without their own markup
 * needing to know about scaling.
 */
const ScaleToWidth = ({ naturalWidth, children }) => {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [dims, setDims] = useState({ scale: 1, height: 0 });

  useLayoutEffect(() => {
    const outerEl = outerRef.current;
    const innerEl = innerRef.current;
    if (!outerEl || !innerEl) return;

    const recompute = () => {
      const availW = outerEl.clientWidth;
      if (!availW) return;
      const scale = availW / naturalWidth;
      setDims({ scale, height: innerEl.scrollHeight * scale });
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(outerEl);
    observer.observe(innerEl);
    return () => observer.disconnect();
  }, [naturalWidth, children]);

  return (
    <div ref={outerRef} style={{ width: "100%", height: dims.height, overflow: "hidden" }}>
      <div
        ref={innerRef}
        style={{ width: naturalWidth, transform: `scale(${dims.scale})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
};

export default ScaleToWidth;

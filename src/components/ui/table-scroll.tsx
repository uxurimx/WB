"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

// Contenedor de scroll para tablas anchas.
// - Barra horizontal espejo arriba, sincronizada → se usa con mouse sin bajar al fondo.
// - maxHeight opcional → scroll vertical propio (la barra horizontal nativa queda al
//   alcance dentro del viewport en vez de al final de todas las filas).
export default function TableScroll({
  children,
  maxHeight,
  className = "",
}: {
  children: ReactNode;
  maxHeight?: string;
  className?: string;
}) {
  const topRef  = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  const [scrollWidth, setScrollWidth] = useState(0);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const update = () => {
      setScrollWidth(body.scrollWidth);
      setOverflowing(body.scrollWidth > body.clientWidth + 1);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(body);
    if (body.firstElementChild) ro.observe(body.firstElementChild);
    return () => ro.disconnect();
  }, [children]);

  function onTopScroll() {
    if (syncing.current) return;
    syncing.current = true;
    if (bodyRef.current && topRef.current) bodyRef.current.scrollLeft = topRef.current.scrollLeft;
    requestAnimationFrame(() => { syncing.current = false; });
  }

  function onBodyScroll() {
    if (syncing.current) return;
    syncing.current = true;
    if (topRef.current && bodyRef.current) topRef.current.scrollLeft = bodyRef.current.scrollLeft;
    requestAnimationFrame(() => { syncing.current = false; });
  }

  return (
    <div className={className}>
      {overflowing && (
        <div
          ref={topRef}
          onScroll={onTopScroll}
          className="overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth: "thin" }}
        >
          <div style={{ width: scrollWidth, height: 1 }} />
        </div>
      )}
      <div
        ref={bodyRef}
        onScroll={onBodyScroll}
        className="w-full overflow-auto"
        style={maxHeight ? { maxHeight } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

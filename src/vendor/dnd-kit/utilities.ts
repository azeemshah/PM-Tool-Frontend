export const CSS = {
  Transform: {
    toString: (t: any) => {
      if (!t) return '';
      const x = t.x || 0;
      const y = t.y || 0;
      const sx = t.scaleX != null ? t.scaleX : 1;
      const sy = t.scaleY != null ? t.scaleY : 1;
      return `translate(${x}px, ${y}px) scale(${sx}, ${sy})`;
    }
  }
};






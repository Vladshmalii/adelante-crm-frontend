import { type PointerEvent as ReactPointerEvent, useState } from 'react';

import { type Interval, type ResizeEdge, snapResize } from '../model/layout';

interface UseResizeOptions {
  /** Текущий интервал записи, минуты от полуночи. */
  interval: Interval;
  pxPerMinute: number;
  step: number;
  onCommit: (next: Interval) => void;
}

/**
 * Растягивание карточки за верхний / нижний край. Своя обработка указателя, а не dnd-kit:
 * перетаскивание всей карточки остаётся за ним, а ручка гасит его `pointerdown`.
 */
export function useResize({ interval, pxPerMinute, step, onCommit }: UseResizeOptions) {
  const [preview, setPreview] = useState<Interval | null>(null);

  const begin = (edge: ResizeEdge) => (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const fromY = e.clientY;
    let next = interval;
    const cursor = document.body.style.cursor;
    document.body.style.cursor = 'ns-resize';

    const move = (ev: PointerEvent) => {
      next = snapResize(interval, edge, ev.clientY - fromY, pxPerMinute, step);
      setPreview(next);
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      document.body.style.cursor = cursor;
      setPreview(null);
      // Клик после отпускания не должен открыть запись или создать новую в пустой ячейке.
      const swallow = (ev: MouseEvent) => {
        ev.stopPropagation();
      };
      window.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => {
        window.removeEventListener('click', swallow, { capture: true });
      });
      if (next.start !== interval.start || next.end !== interval.end) onCommit(next);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  return { preview, begin };
}

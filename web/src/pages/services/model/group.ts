interface Categorized {
  category: { id: string; name: string };
}

export interface CategoryGroup<T> {
  id: string;
  name: string;
  items: T[];
}

/**
 * Услуги по категориям в порядке `order` (с бекенда: по алфавиту, «Інше» последней). Пустые
 * группы не показываем; категории, которых нет в `order` (список ещё грузится), — в конце.
 */
export function groupByCategory<T extends Categorized>(
  items: readonly T[],
  order: readonly { id: string }[],
): CategoryGroup<T>[] {
  const groups = new Map<string, CategoryGroup<T>>();
  for (const item of items) {
    const { id, name } = item.category;
    const group = groups.get(id) ?? { id, name, items: [] };
    group.items.push(item);
    groups.set(id, group);
  }
  const rank = new Map(order.map((c, i) => [c.id, i]));
  return [...groups.values()].sort(
    (a, b) => (rank.get(a.id) ?? order.length) - (rank.get(b.id) ?? order.length),
  );
}

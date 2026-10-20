export class BinaryHeap<T> {
  private items: T[] = [];
  constructor(private readonly compare: (a: T, b: T) => number) {}
  get size() { return this.items.length; }
  isEmpty() { return this.items.length === 0; }
  peek() { return this.items[0]; }
  toArray() { return [...this.items]; }
  insert(value: T) { this.items.push(value); this.bubbleUp(this.items.length - 1); }
  extract() {
    if (!this.items.length) return undefined;
    const root = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length) { this.items[0] = last; this.sinkDown(0); }
    return root;
  }
  private bubbleUp(index: number) {
    while (index > 0) { const parent = Math.floor((index - 1) / 2); if (this.compare(this.items[index], this.items[parent]) <= 0) break; [this.items[index], this.items[parent]] = [this.items[parent], this.items[index]]; index = parent; }
  }
  private sinkDown(index: number) {
    for (;;) { let best = index; const left = index * 2 + 1; const right = left + 1; if (left < this.items.length && this.compare(this.items[left], this.items[best]) > 0) best = left; if (right < this.items.length && this.compare(this.items[right], this.items[best]) > 0) best = right; if (best === index) break; [this.items[index], this.items[best]] = [this.items[best], this.items[index]]; index = best; }
  }
}

export class Stack<T> {
  private items: T[] = [];
  push(value: T) { this.items.push(value); }
  pop() { return this.items.pop(); }
  peek() { return this.items.at(-1); }
  isEmpty() { return this.items.length === 0; }
  get size() { return this.items.length; }
}

export class Queue<T> {
  private items: Record<number, T> = {};
  private head = 0; private tail = 0;
  enqueue(value: T) { this.items[this.tail++] = value; }
  dequeue() { if (this.isEmpty()) return undefined; const value = this.items[this.head]; delete this.items[this.head++]; if (this.head === this.tail) this.head = this.tail = 0; return value; }
  peek() { return this.items[this.head]; }
  isEmpty() { return this.tail === this.head; }
  get size() { return this.tail - this.head; }
}

class ListNode<T> { next: ListNode<T> | null = null; constructor(public value: T) {} }
export class LinkedList<T> {
  private head: ListNode<T> | null = null; private tail: ListNode<T> | null = null; private count = 0;
  append(value: T) { const node = new ListNode(value); if (!this.head) this.head = node; else this.tail!.next = node; this.tail = node; this.count++; }
  toArray() { const values: T[] = []; let node = this.head; while (node) { values.push(node.value); node = node.next; } return values; }
  get size() { return this.count; }
}

export class DirectedGraph {
  private vertices = new Set<string>();
  private adjacency = new Map<string, Set<string>>();
  addVertex(id: string) { this.vertices.add(id); if (!this.adjacency.has(id)) this.adjacency.set(id, new Set()); }
  hasVertex(id: string) { return this.vertices.has(id); }
  addEdge(from: string, to: string) { if (!this.hasVertex(from) || !this.hasVertex(to)) throw new Error('Both tasks must exist'); if (from === to) throw new Error('A task cannot depend on itself'); if (this.adjacency.get(from)!.has(to)) throw new Error('Dependency already exists'); this.adjacency.get(from)!.add(to); if (this.hasCycle()) { this.adjacency.get(from)!.delete(to); throw new Error('This dependency would create a cycle'); } }
  removeEdge(from: string, to: string) { return this.adjacency.get(from)?.delete(to) ?? false; }
  neighbors(id: string) { if (!this.hasVertex(id)) throw new Error('Task does not exist'); return [...this.adjacency.get(id)!]; }
  hasCycle() { const color = new Map<string, number>(); const visit = (id: string): boolean => { color.set(id, 1); for (const next of this.adjacency.get(id) ?? []) { if (color.get(next) === 1 || (!color.get(next) && visit(next))) return true; } color.set(id, 2); return false; }; return [...this.vertices].some((id) => !color.get(id) && visit(id)); }
  topologicalSort() { const indegree = new Map([...this.vertices].map((id) => [id, 0])); for (const tos of this.adjacency.values()) for (const to of tos) indegree.set(to, indegree.get(to)! + 1); const queue = new Queue<string>(); for (const [id, degree] of indegree) if (!degree) queue.enqueue(id); const order: string[] = []; while (!queue.isEmpty()) { const id = queue.dequeue()!; order.push(id); for (const to of this.adjacency.get(id) ?? []) { const degree = indegree.get(to)! - 1; indegree.set(to, degree); if (!degree) queue.enqueue(to); } } if (order.length !== this.vertices.size) throw new Error('Graph contains a cycle'); return order; }
}

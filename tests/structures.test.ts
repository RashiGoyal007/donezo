import { describe, expect, it } from 'vitest';
import { BinaryHeap, DirectedGraph, LinkedList, Queue, Stack } from '../shared/structures.js';

describe('BinaryHeap', () => {
  it('extracts in comparator order and handles an empty heap', () => { const heap = new BinaryHeap<number>((a,b)=>a-b); [4,1,7,7,3].forEach(x=>heap.insert(x)); expect([heap.extract(),heap.extract(),heap.extract(),heap.extract(),heap.extract()]).toEqual([7,7,4,3,1]); expect(heap.extract()).toBeUndefined(); });
  it('supports deterministic equal-score tie breaking', () => { const heap = new BinaryHeap<{score:number,order:number}>((a,b)=>a.score-b.score||b.order-a.order); heap.insert({score:2,order:2});heap.insert({score:2,order:1});expect(heap.extract()?.order).toBe(1); });
});
describe('Stack',()=>it('pushes, peeks, and pops LIFO',()=>{const s=new Stack<number>();expect(s.pop()).toBeUndefined();s.push(1);s.push(2);expect(s.peek()).toBe(2);expect(s.pop()).toBe(2);expect(s.size).toBe(1)}));
describe('Queue',()=>it('retains FIFO order through repeated reuse',()=>{const q=new Queue<number>();for(let i=0;i<50;i++){q.enqueue(i);expect(q.dequeue()).toBe(i)}q.enqueue(8);q.enqueue(9);expect(q.peek()).toBe(8);expect(q.dequeue()).toBe(8);expect(q.dequeue()).toBe(9);expect(q.isEmpty()).toBe(true)}));
describe('LinkedList',()=>it('inserts and traverses in order',()=>{const l=new LinkedList<string>();l.append('a');l.append('b');expect(l.toArray()).toEqual(['a','b']);expect(l.size).toBe(2)}));
describe('DirectedGraph',()=>{
  it('sorts dependencies and rejects cycles, duplicates, missing vertices, and self edges',()=>{const g=new DirectedGraph();['a','b','c'].forEach(x=>g.addVertex(x));g.addEdge('a','b');g.addEdge('b','c');expect(g.topologicalSort()).toEqual(['a','b','c']);expect(()=>g.addEdge('c','a')).toThrow(/cycle/);expect(()=>g.addEdge('a','b')).toThrow(/already/);expect(()=>g.addEdge('a','z')).toThrow(/exist/);expect(()=>g.addEdge('a','a')).toThrow(/itself/);});
  it('removes edges',()=>{const g=new DirectedGraph();g.addVertex('a');g.addVertex('b');g.addEdge('a','b');expect(g.removeEdge('a','b')).toBe(true);expect(g.neighbors('a')).toEqual([])});
});

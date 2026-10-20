import { BinaryHeap, DirectedGraph } from './structures.js';
import { priorityWeight, type Dependency, type ScheduleResult, type Task } from './types.js';

type Candidate = { task: Task; score: number };
const scoreTask = (task: Task, now: Date) => {
  const priority = priorityWeight[task.priority] * 1000;
  const deadline = task.deadline ? Math.max(-30, Math.min(30, (new Date(task.deadline).getTime() - now.getTime()) / 86_400_000)) : 60;
  const urgency = task.deadline ? Math.round((60 - deadline) * 10) : 0;
  const age = Math.min(100, Math.floor((now.getTime() - new Date(task.createdAt).getTime()) / 86_400_000));
  return priority + urgency + age;
};

export function generateSchedule(tasks: Task[], dependencies: Dependency[], now = new Date()): ScheduleResult {
  const graph = new DirectedGraph(); tasks.forEach((task) => graph.addVertex(task.id)); dependencies.forEach((edge) => graph.addEdge(edge.prerequisiteTaskId, edge.dependentTaskId)); graph.topologicalSort();
  const completed = new Set(tasks.filter((task) => task.status === 'COMPLETED').map((task) => task.id));
  const unfinished = tasks.filter((task) => task.status !== 'COMPLETED');
  const prerequisites = new Map<string, Set<string>>(tasks.map((task) => [task.id, new Set()]));
  dependencies.forEach((edge) => prerequisites.get(edge.dependentTaskId)?.add(edge.prerequisiteTaskId));
  const scheduled = new Set<string>(); const taskIds: string[] = []; const steps = [];
  while (scheduled.size < unfinished.length) {
    const eligible = unfinished.filter((task) => !scheduled.has(task.id) && [...(prerequisites.get(task.id) ?? [])].every((id) => completed.has(id) || scheduled.has(id)));
    if (!eligible.length) throw new Error('No valid schedule exists. Check dependencies.');
    const heap = new BinaryHeap<Candidate>((a, b) => a.score - b.score || b.task.createdAt.localeCompare(a.task.createdAt));
    eligible.forEach((task) => heap.insert({ task, score: scoreTask(task, now) }));
    const snapshot = heap.toArray().map(({ task, score }) => ({ id: task.id, score })); const selected = heap.extract()!;
    scheduled.add(selected.task.id); taskIds.push(selected.task.id);
    steps.push({ taskId: selected.task.id, rank: taskIds.length, score: selected.score, eligibleTaskIds: eligible.map((task) => task.id), heapSnapshot: snapshot, reason: `${selected.task.priority.toLowerCase()} priority${selected.task.deadline ? ` · deadline ${new Date(selected.task.deadline).toLocaleDateString()}` : ' · no deadline'} · all prerequisites satisfied` });
  }
  return { id: crypto.randomUUID(), generatedAt: now.toISOString(), stale: false, taskIds, steps };
}

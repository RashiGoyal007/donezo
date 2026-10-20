import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { LinkedList, Queue, Stack } from '../shared/structures.js';
import type { ActivityEvent, StoreData } from '../shared/types.js';

type Snapshot = { label: string; data: StoreData };

export class JsonStore {
  data: StoreData = { tasks: [], dependencies: [], activity: [], currentSchedule: null };
  readonly undoStack = new Stack<Snapshot>();
  readonly commandQueue = new Queue<() => Promise<void>>();
  readonly activityList = new LinkedList<ActivityEvent>();
  private processing = false;
  constructor(private readonly file: string) {}
  async load() {
    try { this.data = JSON.parse(await readFile(this.file, 'utf8')) as StoreData; }
    catch { await this.seed(); }
    this.data.activity.forEach((event) => this.activityList.append(event));
  }
  snapshot(label: string) { this.undoStack.push({ label, data: structuredClone(this.data) }); }
  addActivity(event: Omit<ActivityEvent, 'id' | 'createdAt'>) { const full = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; this.data.activity.unshift(full); this.activityList.append(full); }
  invalidateSchedule() { if (this.data.currentSchedule) this.data.currentSchedule.stale = true; }
  async save() { await mkdir(path.dirname(this.file), { recursive: true }); await writeFile(this.file, JSON.stringify(this.data, null, 2)); }
  async enqueue(command: () => Promise<void>) { this.commandQueue.enqueue(command); if (this.processing) return; this.processing = true; while (!this.commandQueue.isEmpty()) await this.commandQueue.dequeue()!(); this.processing = false; }
  async undo() { const snapshot = this.undoStack.pop(); if (!snapshot) return null; this.data = snapshot.data; this.addActivity({ type: 'UNDO_PERFORMED', taskId: null, summary: `Undid ${snapshot.label}` }); await this.save(); return snapshot.label; }
  private async seed() {
    const now = new Date(); const date = (days: number) => new Date(now.getTime() + days * 86_400_000).toISOString();
    const base = [
      ['Research scheduling strategies', 'Compare dependency-aware approaches and document scoring rules.', 'HIGH', 'COMPLETED', -2, 75, 'Donezo'],
      ['Implement priority engine', 'Build and test the custom binary heap scheduler.', 'URGENT', 'IN_PROGRESS', 0, 120, 'Donezo'],
      ['Design dependency canvas', 'Create an interactive graph with clear readiness states.', 'HIGH', 'TODO', 2, 90, 'Donezo'],
      ['Write API specification', 'Document endpoints, validation, and response shapes.', 'MEDIUM', 'TODO', 4, 60, 'Documentation'],
      ['Prepare project demo', 'Create the final walkthrough and rehearse key flows.', 'URGENT', 'TODO', 7, 45, 'Presentation'],
      ['Accessibility review', 'Audit keyboard navigation, contrast, and reduced motion.', 'MEDIUM', 'TODO', 5, 50, 'Quality'],
    ] as const;
    const tasks = base.map(([title, description, priority, status, days, estimatedMinutes, category], index) => ({ id: `seed-${index + 1}`, title, description, priority, status, deadline: date(days), estimatedMinutes, category, tags: index < 3 ? ['core', 'ads'] : ['se'], createdAt: date(-8 + index), updatedAt: date(-1), completedAt: status === 'COMPLETED' ? date(-2) : null }));
    const dependencies = [
      { id: 'dep-1', prerequisiteTaskId: 'seed-1', dependentTaskId: 'seed-2', createdAt: date(-3) },
      { id: 'dep-2', prerequisiteTaskId: 'seed-2', dependentTaskId: 'seed-3', createdAt: date(-2) },
      { id: 'dep-3', prerequisiteTaskId: 'seed-3', dependentTaskId: 'seed-5', createdAt: date(-1) },
      { id: 'dep-4', prerequisiteTaskId: 'seed-4', dependentTaskId: 'seed-5', createdAt: date(-1) },
    ];
    this.data = { tasks, dependencies, activity: [], currentSchedule: null };
    this.addActivity({ type: 'TASK_CREATED', taskId: null, summary: 'Development workspace initialized with sample tasks' });
    await this.save();
  }
}

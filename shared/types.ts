export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Status = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  deadline: string | null;
  estimatedMinutes: number | null;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Dependency {
  id: string;
  prerequisiteTaskId: string;
  dependentTaskId: string;
  createdAt: string;
}

export type ActivityType = 'TASK_CREATED' | 'TASK_EDITED' | 'STATUS_CHANGED' | 'TASK_DELETED' | 'DEPENDENCY_ADDED' | 'DEPENDENCY_REMOVED' | 'SCHEDULE_GENERATED' | 'UNDO_PERFORMED';
export interface ActivityEvent { id: string; type: ActivityType; taskId: string | null; summary: string; details?: Record<string, unknown>; createdAt: string }
export interface ScheduleStep { taskId: string; rank: number; score: number; reason: string; eligibleTaskIds: string[]; heapSnapshot: Array<{ id: string; score: number }> }
export interface ScheduleResult { id: string; generatedAt: string; stale: boolean; taskIds: string[]; steps: ScheduleStep[] }
export interface StoreData { tasks: Task[]; dependencies: Dependency[]; activity: ActivityEvent[]; currentSchedule: ScheduleResult | null }

export const priorityWeight: Record<Priority, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 };

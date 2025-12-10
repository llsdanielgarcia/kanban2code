export type Stage = 'inbox' | 'plan' | 'code' | 'audit' | 'completed';

export interface Task {
  id: string;
  filePath: string;
  title: string;
  stage: Stage;
  project?: string;
  phase?: string;
  agent?: string;
  parent?: string; // ID of parent task
  tags?: string[];
  contexts?: string[];
  order?: number;
  created?: string; // ISO Date
  content: string; // The markdown content body
}

import React from 'react';
import type { Task, Stage } from '../../../types/task';
import { TreeSection } from './TreeSection';
import { TreeNode } from './TreeNode';
import { TaskItem } from './TaskItem';

interface TaskTreeProps {
  tasks: Task[];
  activeStages: Stage[];
  onTaskClick: (task: Task) => void;
  onTaskDoubleClick?: (task: Task) => void;
  onTaskContextMenu?: (e: React.MouseEvent, task: Task) => void;
}

interface ProjectGroup {
  name: string;
  phases: Map<string, Task[]>;
  directTasks: Task[];
}

function groupTasksByProjectAndPhase(tasks: Task[]): {
  inboxTasks: Task[];
  projects: Map<string, ProjectGroup>;
} {
  const inboxTasks: Task[] = [];
  const projects = new Map<string, ProjectGroup>();

  for (const task of tasks) {
    if (!task.project) {
      // Inbox task (no project)
      inboxTasks.push(task);
    } else {
      // Project task
      let projectGroup = projects.get(task.project);
      if (!projectGroup) {
        projectGroup = {
          name: task.project,
          phases: new Map(),
          directTasks: [],
        };
        projects.set(task.project, projectGroup);
      }

      if (task.phase) {
        // Phase task
        const phaseTasks = projectGroup.phases.get(task.phase) || [];
        phaseTasks.push(task);
        projectGroup.phases.set(task.phase, phaseTasks);
      } else {
        // Direct project task (no phase)
        projectGroup.directTasks.push(task);
      }
    }
  }

  return { inboxTasks, projects };
}

function countProjectTasks(project: ProjectGroup): number {
  let count = project.directTasks.length;
  for (const phaseTasks of project.phases.values()) {
    count += phaseTasks.length;
  }
  return count;
}

export const TaskTree: React.FC<TaskTreeProps> = ({
  tasks,
  activeStages,
  onTaskClick,
  onTaskDoubleClick,
  onTaskContextMenu,
}) => {
  // Filter tasks by active stages
  const filteredTasks = tasks.filter((task) => activeStages.includes(task.stage));

  // Group tasks
  const { inboxTasks, projects } = groupTasksByProjectAndPhase(filteredTasks);

  // Sort inbox tasks by order or created date
  const sortedInboxTasks = [...inboxTasks].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.created && b.created) {
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    }
    return 0;
  });

  return (
    <div className="sidebar-tree" role="tree" aria-label="Task tree">
      {/* Inbox Section */}
      {sortedInboxTasks.length > 0 && (
        <TreeSection
          title="Inbox"
          tasks={sortedInboxTasks}
          type="inbox"
          defaultExpanded={true}
          onTaskClick={onTaskClick}
          onTaskDoubleClick={onTaskDoubleClick}
          onTaskContextMenu={onTaskContextMenu}
        />
      )}

      {/* Projects Section */}
      {projects.size > 0 && (
        <TreeSection
          title="Projects"
          tasks={[]}
          type="projects"
          onTaskClick={onTaskClick}
        >
          {Array.from(projects.values()).map((project) => (
            <TreeNode
              key={project.name}
              label={project.name}
              count={countProjectTasks(project)}
              depth={0}
              type="project"
              defaultExpanded={true}
            >
              {/* Direct project tasks */}
              {project.directTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  depth={1}
                  onClick={onTaskClick}
                  onDoubleClick={onTaskDoubleClick}
                  onContextMenu={onTaskContextMenu}
                />
              ))}

              {/* Phase nodes */}
              {Array.from(project.phases.entries()).map(([phaseName, phaseTasks]) => (
                <TreeNode
                  key={phaseName}
                  label={phaseName}
                  count={phaseTasks.length}
                  depth={1}
                  type="phase"
                  defaultExpanded={false}
                >
                  {phaseTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      depth={2}
                      onClick={onTaskClick}
                      onDoubleClick={onTaskDoubleClick}
                      onContextMenu={onTaskContextMenu}
                    />
                  ))}
                </TreeNode>
              ))}
            </TreeNode>
          ))}
        </TreeSection>
      )}

      {/* Empty state when no tasks match filters */}
      {sortedInboxTasks.length === 0 && projects.size === 0 && (
        <div className="sidebar-loading">
          <p>No tasks match the current filters</p>
        </div>
      )}
    </div>
  );
};

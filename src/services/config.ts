/**
 * Configuration service for Kanban2Code
 *
 * Provides centralized access to configuration values from .kanban2code/config.json.
 * Falls back to defaults when config is missing or invalid.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Kanban2CodeConfig, DEFAULT_CONFIG } from '../types/config';

const CONFIG_FILE = 'config.json';

/**
 * Singleton service for managing Kanban2Code configuration
 */
class ConfigService {
  private config: Kanban2CodeConfig = DEFAULT_CONFIG;
  private kanbanRoot: string | null = null;
  private configWatcher: vscode.FileSystemWatcher | null = null;
  private onConfigChangeEmitter = new vscode.EventEmitter<Kanban2CodeConfig>();

  /**
   * Event fired when configuration changes
   */
  public readonly onConfigChange = this.onConfigChangeEmitter.event;

  /**
   * Initialize the config service with a kanban root directory
   */
  async initialize(kanbanRoot: string): Promise<void> {
    this.kanbanRoot = kanbanRoot;
    await this.loadConfig();
    this.setupWatcher();
  }

  /**
   * Load configuration from config.json file
   * Falls back to defaults if file is missing or invalid
   */
  async loadConfig(): Promise<Kanban2CodeConfig> {
    if (!this.kanbanRoot) {
      console.log('ConfigService: No kanban root set, using defaults');
      this.config = DEFAULT_CONFIG;
      return this.config;
    }

    const configPath = path.join(this.kanbanRoot, CONFIG_FILE);

    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(content);

        // Merge with defaults to fill in any missing fields
        this.config = this.mergeWithDefaults(parsed);
        console.log('ConfigService: Loaded config from', configPath);
      } else {
        console.log('ConfigService: No config.json found, using defaults');
        this.config = DEFAULT_CONFIG;
      }
    } catch (error) {
      console.error('ConfigService: Error loading config, using defaults:', error);
      vscode.window.showWarningMessage(
        `Kanban2Code: Error loading config.json. Using defaults. ${error instanceof Error ? error.message : ''}`
      );
      this.config = DEFAULT_CONFIG;
    }

    return this.config;
  }

  /**
   * Merge loaded config with defaults to fill in missing fields
   */
  private mergeWithDefaults(loaded: Partial<Kanban2CodeConfig>): Kanban2CodeConfig {
    return {
      version: loaded.version ?? DEFAULT_CONFIG.version,
      project: loaded.project,
      agents: { ...DEFAULT_CONFIG.agents, ...loaded.agents },
      tags: {
        categories: {
          ...DEFAULT_CONFIG.tags.categories,
          ...(loaded.tags?.categories ?? {}),
        },
      },
      stages: { ...DEFAULT_CONFIG.stages, ...loaded.stages },
      preferences: { ...DEFAULT_CONFIG.preferences, ...loaded.preferences },
      personalities: loaded.personalities,
    };
  }

  /**
   * Setup file watcher to detect config changes
   */
  private setupWatcher(): void {
    if (!this.kanbanRoot) return;

    // Dispose existing watcher if any
    this.configWatcher?.dispose();

    const pattern = new vscode.RelativePattern(this.kanbanRoot, CONFIG_FILE);

    this.configWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    this.configWatcher.onDidChange(async () => {
      console.log('ConfigService: config.json changed, reloading');
      await this.loadConfig();
      this.onConfigChangeEmitter.fire(this.config);
    });

    this.configWatcher.onDidCreate(async () => {
      console.log('ConfigService: config.json created, loading');
      await this.loadConfig();
      this.onConfigChangeEmitter.fire(this.config);
    });

    this.configWatcher.onDidDelete(() => {
      console.log('ConfigService: config.json deleted, using defaults');
      this.config = DEFAULT_CONFIG;
      this.onConfigChangeEmitter.fire(this.config);
    });
  }

  /**
   * Get the current configuration
   */
  getConfig(): Kanban2CodeConfig {
    return this.config;
  }

  /**
   * Get agent configuration by name
   */
  getAgent(name: string) {
    return this.config.agents[name];
  }

  /**
   * Get all agent names
   */
  getAgentNames(): string[] {
    return Object.keys(this.config.agents);
  }

  /**
   * Get tag category configuration
   */
  getTagCategory(category: string) {
    return this.config.tags.categories[category];
  }

  /**
   * Get all tag values from all categories (flattened)
   */
  getAllTags(): string[] {
    const tags: string[] = [];
    for (const category of Object.values(this.config.tags.categories)) {
      tags.push(...category.values);
    }
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Get stage configuration by name
   */
  getStage(name: string) {
    return this.config.stages[name];
  }

  /**
   * Get ordered list of stage names
   */
  getStageNames(): string[] {
    return Object.entries(this.config.stages)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([name]) => name);
  }

  /**
   * Get allowed transitions for a stage
   */
  getAllowedTransitions(stageName: string): string[] {
    return this.config.stages[stageName]?.allowedTransitions ?? [];
  }

  /**
   * Get user preferences
   */
  getPreferences() {
    return this.config.preferences;
  }

  /**
   * Get default agent
   */
  getDefaultAgent(): string {
    return this.config.preferences.defaultAgent ?? 'codex';
  }

  /**
   * Get personality configuration by name
   */
  getPersonality(name: string) {
    return this.config.personalities?.[name];
  }

  /**
   * Get all personality names
   */
  getPersonalityNames(): string[] {
    return Object.keys(this.config.personalities ?? {});
  }

  /**
   * Get project information
   */
  getProject() {
    return this.config.project;
  }

  /**
   * Check if a stage transition is allowed
   */
  isTransitionAllowed(fromStage: string, toStage: string): boolean {
    const allowed = this.getAllowedTransitions(fromStage);
    return allowed.includes(toStage);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.configWatcher?.dispose();
    this.configWatcher = null;
    this.onConfigChangeEmitter.dispose();
  }
}

// Export singleton instance
export const configService = new ConfigService();

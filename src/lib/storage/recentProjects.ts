export interface RecentProject {
  name: string;
  filePath: string;
  lastOpened: string; // ISO timestamp
}

const RECENT_PROJECTS_KEY = 'draftplan_recent_projects';
const MAX_RECENT_PROJECTS = 10;

/**
 * Get the list of recent projects from localStorage
 */
export function getRecentProjects(): RecentProject[] {
  try {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
    if (!stored) return [];

    const projects: RecentProject[] = JSON.parse(stored);
    // Sort by most recent first
    return projects.sort((a, b) =>
      new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime()
    );
  } catch (error) {
    console.error('Error loading recent projects:', error);
    return [];
  }
}

/**
 * Add or update a project in the recent projects list
 */
export function addRecentProject(name: string, filePath: string): void {
  try {
    let projects = getRecentProjects();

    // Remove existing entry for this file path if it exists
    projects = projects.filter(p => p.filePath !== filePath);

    // Add new entry at the beginning
    projects.unshift({
      name,
      filePath,
      lastOpened: new Date().toISOString(),
    });

    // Keep only the most recent MAX_RECENT_PROJECTS
    projects = projects.slice(0, MAX_RECENT_PROJECTS);

    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving recent project:', error);
  }
}

/**
 * Remove a specific project from the recent projects list
 */
export function removeRecentProject(filePath: string): void {
  try {
    let projects = getRecentProjects();
    projects = projects.filter(p => p.filePath !== filePath);
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Error removing recent project:', error);
  }
}

/**
 * Clear all recent projects
 */
export function clearRecentProjects(): void {
  try {
    localStorage.removeItem(RECENT_PROJECTS_KEY);
  } catch (error) {
    console.error('Error clearing recent projects:', error);
  }
}

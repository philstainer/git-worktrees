import { CACHE_KEYS } from "#/config/constants";
import { Project } from "#/config/types";
import { Application, Cache, getPreferenceValues, open } from "@raycast/api";
import { executeCommand } from "./general";

interface Preferences {
  projectsPath: string;
  maxScanningLevels: number;
  enableWorktreeCaching: boolean;
  enableWorktreesGrouping: boolean;
  enableProjectsFrequencySorting: boolean;
  enableWorktreesFrequencySorting: boolean;
  editorApp: Application;
  terminalApp: Application;
  shouldAutomaticallyPushWorktree: string;
  resizeEditorWindowAfterLaunch: boolean;
  windowResizeMode: string;
  branchPrefixesToRemove: string;
}

export const getPreferences = () => getPreferenceValues<Preferences>();

export const preferences = getPreferenceValues<Preferences>();

export const resizeEditorWindow = async (editorApp: Application): Promise<void> => {
  if (!preferences.resizeEditorWindowAfterLaunch) {
    return;
  }

  try {
    await executeCommand(`osascript -e 'tell application "${editorApp.name}" to activate'`);

    setTimeout(() => {
      open("raycast://extensions/raycast/window-management/" + preferences.windowResizeMode);
    }, 500);
  } catch (error) {
    return;
  }
};

export const updateCache = async <T>({
  cache = new Cache(),
  key,
  updater,
}: {
  cache?: Cache;
  key: string;
  updater: (data: T | null) => Promise<T | null | undefined> | T | null | undefined;
}) => {
  const data = cache.has(key) ? JSON.parse(cache.get(key) as string) : null;

  const newData = await updater(data);

  if (!newData) return;

  cache.set(key, JSON.stringify(newData));
};

export const removeWorktreeFromCache = ({
  cache = new Cache(),
  projectName,
  worktreeId,
  onSuccess,
}: {
  cache?: Cache;
  projectName: string;
  worktreeId: string;
  onSuccess?: () => void;
}) => {
  if (!preferences.enableWorktreeCaching) return;
  if (!cache.has(CACHE_KEYS.WORKTREES)) return onSuccess?.();

  const projects = JSON.parse(cache.get(CACHE_KEYS.WORKTREES) as string) as Project[];

  const projectIndex = projects.findIndex((project) => project.name === projectName);
  if (projectIndex === -1) return;

  projects[projectIndex].worktrees = projects[projectIndex].worktrees.filter((item) => item.id !== worktreeId);
  cache.set(CACHE_KEYS.WORKTREES, JSON.stringify(projects));

  return onSuccess?.();
};

export const storeDataInCache = <T>(key: string, data: T, options: { cache?: Cache; duration?: number } = {}) => {
  const cache = options.cache || new Cache();
  const duration = options.duration || 5 * 60 * 1000; // Default to 10 minutes
  const expirationDate = Date.now() + duration;

  const cacheData = {
    data,
    expirationDate,
  };

  cache.set(key, JSON.stringify(cacheData));
};

export const getDataFromCache = <T>(key: string, options: { cache: Cache } = { cache: new Cache() }) => {
  const cachedValue = options.cache.get(key);

  if (!cachedValue) return null;

  const { data, expirationDate } = JSON.parse(cachedValue) as { data: T; expirationDate: number };

  if (Date.now() > expirationDate) {
    options.cache.remove(key); // Data is expired, remove it
    return null;
  }

  return data;
};

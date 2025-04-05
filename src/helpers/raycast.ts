import { CACHE_KEYS } from "#/config/constants";
import { Project } from "#/config/types";
import { Application, Cache, getPreferenceValues, open } from "@raycast/api";
import { executeCommand } from "./general";

export const cache = new Cache();

export const getPreferences = () => getPreferenceValues<ExtensionPreferences>();

export const resizeEditorWindow = async (editorApp: Application): Promise<void> => {
  const { resizeEditorWindowAfterLaunch, windowResizeMode } = getPreferences();

  if (!resizeEditorWindowAfterLaunch) return;

  try {
    await executeCommand(`osascript -e 'tell application "${editorApp.name}" to activate'`);

    setTimeout(() => {
      open("raycast://extensions/raycast/window-management/" + windowResizeMode);
    }, 500);
  } catch (error) {
    return;
  }
};

export const updateCache = async <T>({
  key,
  updater,
}: {
  key: string;
  updater: (data: T | null) => Promise<T | null | undefined> | T | null | undefined;
}) => {
  const data = cache.has(key) ? JSON.parse(cache.get(key) as string) : null;

  const newData = await updater(data);

  if (!newData) return;

  cache.set(key, JSON.stringify(newData));
};

export const removeWorktreeFromCache = ({
  projectName,
  worktreeId,
  onSuccess,
}: {
  projectName: string;
  worktreeId: string;
  onSuccess?: () => void;
}) => {
  const { enableWorktreeCaching } = getPreferences();

  if (!enableWorktreeCaching) return;
  if (!cache.has(CACHE_KEYS.WORKTREES)) return onSuccess?.();

  const projects = JSON.parse(cache.get(CACHE_KEYS.WORKTREES) as string) as Project[];

  const projectIndex = projects.findIndex((project) => project.name === projectName);
  if (projectIndex === -1) return;

  projects[projectIndex].worktrees = projects[projectIndex].worktrees.filter((item) => item.id !== worktreeId);
  cache.set(CACHE_KEYS.WORKTREES, JSON.stringify(projects));

  return onSuccess?.();
};

export const removeProjectFromCache = ({ projectName, onSuccess }: { projectName: string; onSuccess?: () => void }) => {
  const { enableWorktreeCaching } = getPreferences();

  if (!enableWorktreeCaching) return;
  if (!cache.has(CACHE_KEYS.WORKTREES)) return onSuccess?.();

  const projects = JSON.parse(cache.get(CACHE_KEYS.WORKTREES) as string) as Project[];

  const projectIndex = projects.findIndex((project) => project.name === projectName);
  if (projectIndex === -1) return;

  projects.splice(projectIndex, 1);
  cache.set(CACHE_KEYS.WORKTREES, JSON.stringify(projects));

  return onSuccess?.();
};

export const storeDataInCache = <T>(key: string, data: T, options: { duration?: number } = {}) => {
  const duration = options.duration;

  const cacheData = {
    data,
    expirationDate: duration ? Date.now() + duration : duration,
  };

  cache.set(key, JSON.stringify(cacheData));
};

export const getDataFromCache = <T>(key: string) => {
  const cachedValue = cache.get(key);
  if (!cachedValue) return null;

  const { data, expirationDate } = JSON.parse(cachedValue) as { data: T; expirationDate?: number };
  if (!expirationDate) return data;

  if (Date.now() > expirationDate) {
    cache.remove(key); // Data is expired, remove it
    return null;
  }

  return data;
};

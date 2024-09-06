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
  resizeEditorWindowAfterLaunch: boolean;
  windowResizeMode: string;
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

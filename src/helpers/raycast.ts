import { Application, getPreferenceValues, open } from "@raycast/api";
import { executeCommand } from "./general";

export const getPreferences = () => getPreferenceValues<Preferences>();

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

import { Action, open } from "@raycast/api";
import { withToast } from "#/helpers/toast";
import { preferences, resizeEditorWindow } from "#/helpers/raycast";
import { Worktree } from "#/config/types";

export const OpenEditor = ({ worktree, extraActions }: { worktree: Worktree; extraActions?: () => Promise<void> }) => {
  if (!preferences.editorApp) return null;

  return (
    <Action
      title={`Open in ${preferences.editorApp.name}`}
      icon={{ fileIcon: preferences.editorApp.path }}
      onAction={withToast({
        action: async () => {
          await Promise.all([
            extraActions ? extraActions() : Promise.resolve(),
            open(worktree.path, preferences.editorApp.bundleId),
          ]);

          return resizeEditorWindow(preferences.editorApp);
        },
        onSuccess: () => `Opening worktree in ${preferences.editorApp.name}`,
        onFailure: () => `Failed to open worktree in ${preferences.editorApp.name}`,
      })}
    />
  );
};

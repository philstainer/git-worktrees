import { Action, open } from "@raycast/api";
import { withToast } from "#/helpers/toast";
import { preferences } from "#/helpers/raycast";
import { Worktree } from "#/config/types";

export const OpenTerminal = ({ worktree }: { worktree: Worktree }) => {
  if (!preferences.terminalApp) return null;

  return (
    <Action
      title={`Open in ${preferences.terminalApp.name}`}
      icon={{ fileIcon: preferences.terminalApp.path }}
      onAction={withToast({
        action: () => {
          return open(worktree.path, preferences.terminalApp.bundleId);
        },
        onSuccess: () => `Opening worktree in ${preferences.terminalApp.name}`,
        onFailure: () => `Failed to open worktree in ${preferences.terminalApp.name}`,
      })}
    />
  );
};

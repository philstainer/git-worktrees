import { Action, Icon } from "@raycast/api";
import { withToast } from "#/helpers/toast";
import { preferences } from "#/helpers/raycast";

export const RefreshWorktrees = ({ revalidate }: { revalidate: () => void }) => {
  if (preferences.enableWorktreeCaching) return null;

  return (
    <Action
      title="Refresh"
      shortcut={{ key: "r", modifiers: ["cmd"] }}
      icon={Icon.ArrowClockwise}
      onAction={withToast({
        action: () => revalidate(),
        onSuccess: () => `Refreshing repos and worktrees`,
        onFailure: () => `Failed to refresh repos and worktrees`,
      })}
    />
  );
};

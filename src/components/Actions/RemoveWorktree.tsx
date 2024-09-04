import { Action, Icon } from "@raycast/api";
import { Worktree } from "../../helpers/file";

export const RemoveWorktree = ({ worktree }: { worktree: Worktree }) => {
  // if (!worktree.dirty) return null;

  return (
    <Action
      title="Remove Worktree"
      icon={Icon.Trash}
      shortcut={{ key: "d", modifiers: ["cmd"] }}
      style={Action.Style.Destructive}
      onAction={() => console.log(worktree)}
    />
  );
};

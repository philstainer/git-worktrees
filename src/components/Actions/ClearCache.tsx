import { Action, closeMainWindow, Icon, PopToRootType } from "@raycast/api";
import { withToast } from "#/helpers/toast";
import { preferences } from "#/helpers/raycast";
import { clearCache } from "#/helpers/file";

export default function ClearCache() {
  if (!preferences.enableWorktreeCaching) return null;

  return (
    <Action
      title="Clear Cache"
      key="clear-cache"
      icon={Icon.Trash}
      shortcut={{ modifiers: ["cmd", "shift"], key: "delete" }}
      onAction={withToast({
        action: async () => {
          clearCache();
          await closeMainWindow({ popToRootType: PopToRootType.Immediate });
        },
        onSuccess: () => "Cache cleared",
        onFailure: () => "Failed to clear cache",
      })}
    />
  );
}

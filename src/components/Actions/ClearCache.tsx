import { preferences } from "#/helpers/raycast";
import { withToast } from "#/helpers/toast";
import { Action, Cache, closeMainWindow, Icon, PopToRootType } from "@raycast/api";

export default function ClearCache() {
  if (!preferences.enableWorktreeCaching) return null;

  return (
    <Action
      title="Refresh Cache"
      key="clear-cache"
      icon={Icon.Trash}
      shortcut={{ modifiers: ["cmd", "shift"], key: "delete" }}
      onAction={withToast({
        action: async () => {
          const cache = new Cache();
          cache.clear();

          await closeMainWindow({ popToRootType: PopToRootType.Immediate });
        },
        onSuccess: () => "Cache cleared",
        onFailure: () => "Failed to clear cache",
      })}
    />
  );
}

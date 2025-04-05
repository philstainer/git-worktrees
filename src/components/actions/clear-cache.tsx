import { cache, getPreferences } from "#/helpers/raycast";
import { withToast } from "#/helpers/toast";
import { Action, closeMainWindow, Icon, PopToRootType } from "@raycast/api";

export default function ClearCache() {
  const { enableWorktreeCaching } = getPreferences();

  if (!enableWorktreeCaching) return null;

  return (
    <Action
      title="Refresh Cache"
      key="clear-cache"
      icon={Icon.Trash}
      shortcut={{ modifiers: ["cmd", "shift"], key: "delete" }}
      onAction={withToast({
        action: async () => {
          cache.clear();

          await closeMainWindow({ popToRootType: PopToRootType.Immediate });
        },
        onSuccess: () => "Cache cleared",
        onFailure: () => "Failed to clear cache",
      })}
    />
  );
}

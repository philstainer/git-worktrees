import { cache } from "#/helpers/cache";
import { getPreferences } from "#/helpers/raycast";
import { withToast } from "#/helpers/toast";
import { Action, Icon } from "@raycast/api";

export default function ClearCache({ revalidateProjects }: { revalidateProjects: () => void }) {
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
          revalidateProjects();

          // await closeMainWindow({ popToRootType: PopToRootType.Immediate });
        },
        onSuccess: () => "Cache cleared",
        onFailure: () => "Failed to clear cache",
      })}
    />
  );
}

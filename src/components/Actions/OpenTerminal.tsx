import { preferences } from "#/helpers/raycast";
import { withToast } from "#/helpers/toast";
import { Action, open } from "@raycast/api";

export const OpenTerminal = ({ path }: { path?: string }) => {
  if (!preferences.terminalApp || !path) return null;

  return (
    <Action
      title={`Open in ${preferences.terminalApp.name}`}
      icon={{ fileIcon: preferences.terminalApp.path }}
      onAction={withToast({
        action: () => {
          return open(path, preferences.terminalApp.bundleId);
        },
        onSuccess: () => `Opening in ${preferences.terminalApp.name}`,
        onFailure: () => `Failed to open in ${preferences.terminalApp.name}`,
      })}
    />
  );
};

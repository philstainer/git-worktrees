import type { BareRepository, Worktree } from "#/config/types";
import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { relative } from "node:path";
import { preferences } from "#/helpers/raycast";
import { OpenEditor } from "#/components/Actions/OpenEditor";
import { OpenTerminal } from "#/components/Actions/OpenTerminal";
import { RemoveWorktree } from "#/components/Actions/RemoveWorktree";
import { RefreshWorktrees } from "#/components/Actions/RefreshWorktrees";
import ClearCache from "#/components/Actions/ClearCache";
import { ResetRanking } from "#/components/Actions/ResetRanking";

export const Item = ({
  project,
  worktree,
  rankBareRepository,
  rankWorktree,
  revalidateProjects,
}: {
  project?: BareRepository;
  worktree: Worktree;
  rankBareRepository?: (key: "increment" | "reset") => void;
  rankWorktree?: (key: "increment" | "reset") => void;
  revalidateProjects: () => void;
}) => {
  return (
    <List.Item
      key={worktree.branch}
      icon={Icon.Folder}
      title={relative(project?.fullPath ?? preferences.projectsPath, worktree.path)}
      subtitle={`${worktree.branch ?? "detached"} @ ${worktree.commit?.slice(0, 7) ?? "none"}`}
      accessories={[...(worktree.dirty ? [{ tag: { value: "Dirty", color: Color.Yellow }, tooltip: "Dirty" }] : [])]}
      actions={
        <ActionPanel>
          <ActionPanel.Section title="Worktree Actions">
            <OpenEditor
              worktree={worktree}
              extraActions={async () => {
                await Promise.all([rankBareRepository?.("increment"), rankWorktree?.("increment")]);
              }}
            />
            <OpenTerminal worktree={worktree} />

            <RemoveWorktree worktree={worktree} />
          </ActionPanel.Section>

          <ActionPanel.Section title="Extra Actions">
            <RefreshWorktrees revalidate={revalidateProjects} />

            <ClearCache />

            <Action.ShowInFinder
              title="Show in Finder"
              path={worktree.path}
              shortcut={{ modifiers: ["cmd"], key: "f" }}
            />
            <Action.OpenWith
              title="Open With"
              path={worktree.path}
              shortcut={{ modifiers: ["cmd", "opt"], key: "o" }}
            />

            <ResetRanking
              resetRankingRepo={rankBareRepository ? () => rankBareRepository("reset") : undefined}
              resetWorktreeRanking={rankWorktree ? () => rankWorktree("reset") : undefined}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
};

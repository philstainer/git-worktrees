import ClearCache from "#/components/actions/clear-cache";
import { OpenEditor } from "#/components/actions/open-editor";
import { OpenTerminal } from "#/components/actions/open-terminal";
import { RefreshWorktrees } from "#/components/actions/refresh-worktrees";
import { RemoveProject } from "#/components/actions/remove-project";
import { RemoveWorktree } from "#/components/actions/remove-worktree";
import { RenameWorktree } from "#/components/actions/rename-worktree";
import { ResetRanking } from "#/components/actions/reset-ranking";
import type { BareRepository, Worktree } from "#/config/types";
import { getPreferences } from "#/helpers/raycast";
import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { relative } from "node:path";
import AddWorktree from "../../add-worktree";

export const Item = ({
  project,
  worktree,
  rankBareRepository,
  rankWorktree,
  revalidateProjects,
  worktreeTitle = "path",
}: {
  project?: BareRepository;
  worktree: Worktree;
  rankBareRepository?: (key: "increment" | "reset") => void;
  rankWorktree?: (key: "increment" | "reset") => void;
  revalidateProjects: () => void;
  worktreeTitle: "name" | "path";
}) => {
  const { projectsPath } = getPreferences();

  const gitRemote = project?.gitRemotes?.[0];

  return (
    <List.Item
      key={worktree.branch}
      icon={Icon.Tree}
      title={
        worktreeTitle === "name" ? (project?.name ?? "") : relative(project?.fullPath ?? projectsPath, worktree.path)
      }
      subtitle={`${worktree.branch ?? "detached"} @ ${worktree.commit?.slice(0, 7) ?? "none"}`}
      accessories={[
        // TODO: Data may be cached so this is not working as intended.
        // ...(worktree.dirty ? [{ tag: { value: "Dirty", color: Color.Yellow }, tooltip: "Dirty" }] : []),
        ...(gitRemote?.icon ? [{ icon: gitRemote.icon, tooltip: gitRemote.host }] : []),
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section title="Worktree Actions">
            <OpenEditor
              worktree={worktree}
              extraActions={async () => {
                await Promise.all([rankBareRepository?.("increment"), rankWorktree?.("increment")]);
              }}
            />
            <OpenTerminal path={worktree.path} />

            <RemoveWorktree worktree={worktree} revalidateProjects={revalidateProjects} />
            <RenameWorktree worktree={worktree} revalidateProjects={revalidateProjects} />
            <Action.Push
              title="Add New Worktree"
              icon={Icon.Plus}
              target={<AddWorktree directory={project?.fullPath} />}
              shortcut={{ modifiers: ["cmd"], key: "n" }}
            />
          </ActionPanel.Section>

          <ActionPanel.Section title="Extra Actions">
            <RefreshWorktrees revalidate={revalidateProjects} />

            <ClearCache />

            <RemoveProject project={project} revalidateProjects={revalidateProjects} />

            {gitRemote?.url && (
              <Action.OpenInBrowser
                url={gitRemote.url}
                title="Open Repository in Browser"
                shortcut={{ modifiers: ["cmd"], key: "b" }}
              />
            )}
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

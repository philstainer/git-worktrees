import { formatPath, getWorktreeFromCacheOrFetch, Worktree } from "./helpers/file";
import { preferences } from "./helpers/raycast";
import { useCachedPromise, useFrecencySorting } from "@raycast/utils";
import { Action, ActionPanel, Color, Icon, List, openExtensionPreferences } from "@raycast/api";
import { relative } from "node:path";
import { DirectoriesDropdown, useDirectory } from "./components/Actions/DirectoriesDropdown";
import { useMemo } from "react";
import { OpenEditor } from "./components/Actions/OpenEditor";
import { OpenTerminal } from "./components/Actions/OpenTerminal";
import { RemoveWorktree } from "./components/Actions/RemoveWorktree";
import { ResetRanking } from "./components/Actions/ResetRanking";
import { RefreshWorktrees } from "./components/Actions/RefreshWorktrees";
import ClearCache from "./components/Actions/ClearCache";
import AddCommand from "./add-worktree";

export default function Command() {
  const { directory } = useDirectory();

  const { data, isLoading, revalidate } = useCachedPromise(
    (searchDir) => getWorktreeFromCacheOrFetch(searchDir),
    [preferences.projectsPath],
  );

  const {
    data: sortedData,
    visitItem: visitBareRepo,
    resetRanking: resetRankingRepos,
  } = useFrecencySorting(data, { sortUnvisited: (a, b) => a.id.localeCompare(b.id), namespace: "repos" });

  const directories = useMemo(() => {
    const records = (preferences.enableProjectsAndWorktreesFrequencySorting ? sortedData : data) ?? [];

    if (directory === "all") return records;

    return records.filter((item) => item.id.endsWith(directory));
  }, [directory, sortedData, data]);

  return (
    <List isLoading={isLoading} searchBarAccessory={directories && <DirectoriesDropdown directories={directories} />}>
      {directories.length === 0 ? (
        <List.EmptyView
          title={`No bare repos or worktrees found in ${formatPath(preferences.projectsPath)}`}
          description="Try adding a new worktree or changing your repo dir preference."
          actions={
            <ActionPanel>
              <Action.Push title="Add Worktree" icon={Icon.Plus} target={<AddCommand />} />
              <Action title="Open Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
            </ActionPanel>
          }
        />
      ) : (
        directories.map((item) => (
          <List.Section title={formatPath(item.id)} key={item.id} subtitle={item.worktrees.length.toString()}>
            <WorktreesList
              repo={item.id}
              worktrees={item.worktrees}
              visitBareRepo={visitBareRepo}
              resetDirectoryRanking={resetRankingRepos}
              item={item}
              revalidate={revalidate}
            />
          </List.Section>
        ))
      )}
    </List>
  );
}

const WorktreesList = ({
  repo,
  worktrees,
  visitBareRepo,
  resetDirectoryRanking,
  item,
  revalidate,
}: {
  repo: string;
  worktrees: Worktree[];
  visitBareRepo: (item: { id: string; worktrees: Worktree[] }) => Promise<void>;
  resetDirectoryRanking: (item: { id: string; worktrees: Worktree[] }) => Promise<void>;
  item: { id: string; worktrees: Worktree[] };
  revalidate: () => void;
}) => {
  const {
    data: sortedWorktrees,
    visitItem: visitWorktree,
    resetRanking: resetWorktreeRanking,
  } = useFrecencySorting(worktrees, { sortUnvisited: (a, b) => a.id.localeCompare(b.id), namespace: "worktrees" });

  const items = (preferences.enableProjectsAndWorktreesFrequencySorting ? sortedWorktrees : worktrees) ?? [];

  return items.map((worktree) => (
    <List.Item
      key={worktree.branch}
      icon={Icon.Folder}
      title={relative(repo, worktree.path)}
      subtitle={`${worktree.branch ?? "detached"} @ ${worktree.commit?.slice(0, 7) ?? "none"}`}
      accessories={[...(worktree.dirty ? [{ tag: { value: "Dirty", color: Color.Yellow }, tooltip: "Dirty" }] : [])]}
      actions={
        <ActionPanel>
          <ActionPanel.Section title="Worktree Actions">
            <OpenEditor
              worktree={worktree}
              extraActions={async () => {
                await Promise.all([visitBareRepo(item), visitWorktree(worktree)]);
              }}
            />
            <OpenTerminal worktree={worktree} />

            <RemoveWorktree worktree={worktree} />
          </ActionPanel.Section>

          <ActionPanel.Section title="Extra Actions">
            <RefreshWorktrees revalidate={revalidate} />

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
              resetRankingRepo={() => resetDirectoryRanking(item)}
              resetWorktreeRanking={() => resetWorktreeRanking(worktree)}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  ));
};

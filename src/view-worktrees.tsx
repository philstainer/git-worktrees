import { Action, ActionPanel, Icon, List, openExtensionPreferences } from "@raycast/api";
import { useCachedPromise, useFrecencySorting } from "@raycast/utils";
import { useMemo } from "react";
import AddCommand from "./add-worktree";
import CloneCommand from "./clone-worktree";
import { DirectoriesDropdown, useDirectory } from "./components/Actions/DirectoriesDropdown";
import { Worktree } from "./components/Worktree";
import type { BareRepository, Project } from "./config/types";
import { formatPath, getWorktreeFromCacheOrFetch } from "./helpers/file";
import { preferences } from "./helpers/raycast";

export default function Command() {
  const { directory } = useDirectory();

  const {
    data: incomingData,
    isLoading,
    revalidate,
  } = useCachedPromise((searchDir) => getWorktreeFromCacheOrFetch(searchDir), [preferences.projectsPath]);

  let data = incomingData;
  let visitBareRepo: ((item: Project) => Promise<void>) | undefined;
  let resetRankingRepos: ((item: Project) => Promise<void>) | undefined;

  if (preferences.enableProjectsFrequencySorting) {
    const {
      data: sortedData,
      visitItem,
      resetRanking,
    } = useFrecencySorting(data, { sortUnvisited: (a, b) => a.id.localeCompare(b.id), namespace: "repos" });

    data = sortedData;
    visitBareRepo = visitItem;
    resetRankingRepos = resetRanking;
  }

  const enableWorktreesGrouping = preferences.enableWorktreesGrouping;

  const [projects, groupedOrUngroupedWorktrees] = useMemo(() => {
    const records = data ?? [];

    const filteredRecords = directory === "all" ? records : records.filter((item) => item.id.endsWith(directory));
    const worktrees = enableWorktreesGrouping ? filteredRecords : filteredRecords.flatMap((p) => p.worktrees);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const projects: BareRepository[] = records.map(({ id, worktrees, ...project }) => project);

    return [projects, worktrees];
  }, [directory, data, preferences.enableProjectsFrequencySorting, enableWorktreesGrouping]);

  if (groupedOrUngroupedWorktrees.length === 0)
    return (
      <List>
        <EmptyWorktreeList />
      </List>
    );

  return (
    <List isLoading={isLoading} searchBarAccessory={projects && <DirectoriesDropdown projects={projects} />}>
      {enableWorktreesGrouping ? (
        directory &&
        (groupedOrUngroupedWorktrees as Project[]).length === 1 &&
        (groupedOrUngroupedWorktrees as Project[]).at(0)?.worktrees.length === 0 ? (
          <EmptyWorktreeList />
        ) : (
          (groupedOrUngroupedWorktrees as Project[]).map((project) => (
            <List.Section title={project.displayPath} key={project.id} subtitle={project.worktrees.length.toString()}>
              <Worktree.List
                project={project}
                worktrees={project.worktrees}
                rankBareRepository={(action) =>
                  action === "increment" ? visitBareRepo?.(project) : resetRankingRepos?.(project)
                }
                revalidateProjects={revalidate}
              />
            </List.Section>
          ))
        )
      ) : (
        <Worktree.List worktrees={groupedOrUngroupedWorktrees as Worktree[]} revalidateProjects={revalidate} />
      )}
    </List>
  );
}

export const EmptyWorktreeList = ({ directory }: { directory?: string }) => {
  return (
    <List.EmptyView
      title={`No bare repos or worktrees found in ${formatPath(preferences.projectsPath)}`}
      description="Try adding a new worktree or changing your repo dir preference."
      actions={
        <ActionPanel>
          <Action.Push title="Add Worktree" icon={Icon.Plus} target={<AddCommand directory={directory} />} />
          <Action.Push title="Clone Worktree" icon={Icon.Plus} target={<CloneCommand />} />
          <Action title="Open Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
        </ActionPanel>
      }
    />
  );
};

import { useProjects } from "#/hooks/useWorktrees";
import { Action, ActionPanel, Icon, List, openExtensionPreferences } from "@raycast/api";
import { relative } from "node:path";
import { useMemo } from "react";
import AddWorktree from "./add-worktree";
import CloneProject from "./clone-project";
import { DirectoriesDropdown, useDirectory } from "./components/Actions/DirectoriesDropdown";
import { Worktree } from "./components/Worktree";
import type { BareRepository, Project } from "./config/types";
import { formatPath } from "./helpers/file";
import { preferences } from "./helpers/raycast";

export default function Command({ projectId }: { projectId?: string }) {
  const { directory } = useDirectory();

  const {
    projects: incomingProjects,
    isLoadingProjects,
    revalidateProjects,
    visitProject,
    resetRankingProjects,
  } = useProjects();

  const enableWorktreesGrouping = preferences.enableWorktreesGrouping;

  const [projects, groupedOrUngroupedWorktrees] = useMemo(() => {
    const records = incomingProjects ?? [];

    const filteredRecords = directory === "all" ? records : records.filter((item) => item.id.endsWith(directory));
    const worktrees = enableWorktreesGrouping ? filteredRecords : filteredRecords.flatMap((p) => p.worktrees);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const projects: BareRepository[] = records.map(({ id, worktrees, ...project }) => project);

    return [projects, worktrees];
  }, [directory, incomingProjects, preferences.enableProjectsFrequencySorting, enableWorktreesGrouping]);

  if (projectId) {
    const project = incomingProjects?.find((p) => p.id === projectId);
    if (!project) return null;

    if (!project.worktrees.length)
      return (
        <List>
          <EmptyWorktreeList cloneProject={false} directory={project.fullPath} />
        </List>
      );

    return (
      <List isLoading={isLoadingProjects}>
        <Worktree.List worktrees={project.worktrees} revalidateProjects={revalidateProjects} worktreeTitle="name" />
      </List>
    );
  }

  if (groupedOrUngroupedWorktrees.length === 0)
    return (
      <List>
        <EmptyWorktreeList cloneProject={false} />
      </List>
    );

  return (
    <List isLoading={isLoadingProjects} searchBarAccessory={projects && <DirectoriesDropdown projects={projects} />}>
      {enableWorktreesGrouping ? (
        directory &&
        (groupedOrUngroupedWorktrees as Project[]).length === 1 &&
        (groupedOrUngroupedWorktrees as Project[]).at(0)?.worktrees.length === 0 ? (
          <EmptyWorktreeList cloneProject={true} />
        ) : (
          (groupedOrUngroupedWorktrees as Project[]).map((project) => (
            <List.Section title={project.displayPath} key={project.id} subtitle={project.worktrees.length.toString()}>
              <Worktree.List
                project={project}
                worktrees={project.worktrees}
                rankBareRepository={(action) =>
                  action === "increment" ? visitProject?.(project) : resetRankingProjects?.(project)
                }
                revalidateProjects={revalidateProjects}
              />
            </List.Section>
          ))
        )
      ) : (
        <Worktree.List worktrees={groupedOrUngroupedWorktrees as Worktree[]} revalidateProjects={revalidateProjects} />
      )}
    </List>
  );
}

export const EmptyWorktreeList = ({ cloneProject, directory }: { cloneProject: boolean; directory?: string }) => {
  const path = relative(preferences.projectsPath, directory ?? "");

  return (
    <List.EmptyView
      title={`No bare repos or worktrees found in ${formatPath(path)}`}
      description="Try adding a new worktree or changing your repo dir preference."
      actions={
        <ActionPanel>
          {cloneProject ? (
            <Action.Push title="Clone Project" icon={Icon.Plus} target={<CloneProject />} />
          ) : (
            <Action.Push title="Add Worktree" icon={Icon.Plus} target={<AddWorktree directory={directory} />} />
          )}
          <Action title="Open Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
        </ActionPanel>
      }
    />
  );
};

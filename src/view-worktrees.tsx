import { formatPath, getWorktreeFromCacheOrFetch, Worktree } from "./helpers/file";
import { getPreferences } from "./helpers/raycast";
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

export default function Command() {
  const { projectsPath, editorApp, terminalApp, enableProjectsAndWorktreesFrequencySorting } = getPreferences();

  const { directory } = useDirectory();

  const {
    data: worktrees,
    isLoading,
    revalidate,
  } = useCachedPromise((searchDir) => getWorktreeFromCacheOrFetch(searchDir), [projectsPath]);

  const {
    data: sortedData,
    visitItem: visitBareRepo,
    resetRanking: resetRankingRepos,
  } = useFrecencySorting(worktrees, { sortUnvisited: (a, b) => a.id.localeCompare(b.id), namespace: "repos" });

  // console.log({ worktrees, isLoading });

  // const directories = useMemo(async () => {
  //   const directories = await findBareRepos(getPreferences().projectsPath);
  //
  //   return directories;
  // }, []);
  //
  // directories.then((directories) => console.log(directories));

  // const worktreeEntries = Object.entries(worktrees ?? {});

  const items = useMemo(() => {
    const directories = (enableProjectsAndWorktreesFrequencySorting ? sortedData : worktrees) ?? [];

    if (directory === "all") return directories;

    return directories.filter((item) => item.id.endsWith(directory));
  }, [directory, sortedData, worktrees]);

  return (
    <List isLoading={isLoading} searchBarAccessory={worktrees && <DirectoriesDropdown directories={worktrees} />}>
      {items.length === 0 ? (
        <List.EmptyView
          // title={`No worktrees found in ${formatPath(rootDir)}`}
          title={`No bare repos or worktrees found in ${formatPath(projectsPath)}`}
          description="Try adding a new worktree or changing your repo dir preference."
          actions={
            <ActionPanel>
              {/*<Action.Push title="Add Worktree" icon={Icon.Plus} target={<AddCommand />} />*/}
              <Action title="Open Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
            </ActionPanel>
          }
        />
      ) : (
        items.map((item) => (
          <List.Section title={formatPath(item.id)} key={item.id} subtitle={item.worktrees.length.toString()}>
            <WorktreesList
              key={item.id}
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
  const { editorApp, terminalApp, enableProjectsAndWorktreesFrequencySorting, enableWorktreeCaching } =
    getPreferences();

  const {
    data: sortedWorktrees,
    visitItem: visitWorktree,
    resetRanking: resetWorktreeRanking,
  } = useFrecencySorting(worktrees, { sortUnvisited: (a, b) => a.id.localeCompare(b.id), namespace: "worktrees" });

  const items = (enableProjectsAndWorktreesFrequencySorting ? sortedWorktrees : worktrees) ?? [];

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

// const getDirectories = (path: string, depth?: number): ProjectList => {
//   if (!depth) {
//     depth = 0
//   }
//
//   if (depth > Number(maxScanningLevels)) {
//     return []
//   }
//
//   try {
//     const entries = fs.readdirSync(path, { withFileTypes: true })
//     const directories = entries.filter((entry) => entry.isDirectory() && entry.name !== '.git')
//
//     let subDirectories: ProjectList = []
//     for (const directory of directories) {
//       const dirPath = `${path}/${directory.name}`
//       if (fs.existsSync(`${dirPath}/.git`)) {
//         subDirectories.push(new Project(undefined, dirPath))
//       } else {
//         subDirectories = subDirectories.concat(getDirectories(dirPath, depth + 1))
//       }
//     }
//
//     return subDirectories
//   } catch (error) {
//     return []
//   }
// }

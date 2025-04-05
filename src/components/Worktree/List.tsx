import type { BareRepository, Worktree } from "#/config/types";
import { preferences } from "#/helpers/raycast";
import { useFrecencySorting } from "@raycast/utils";
import { Item } from "./Item";

export const List = ({
  project,
  worktrees,
  rankBareRepository,
  revalidateProjects,
  worktreeTitle = "path",
}: {
  project?: BareRepository;
  worktrees: Worktree[];
  rankBareRepository?: (key: "increment" | "reset") => void;
  revalidateProjects: () => void;
  worktreeTitle?: "name" | "path";
}) => {
  let visitWorktree: ((item: Worktree) => Promise<void>) | undefined;
  let resetWorktreeRanking: ((item: Worktree) => Promise<void>) | undefined;

  if (preferences.enableWorktreesFrequencySorting) {
    const {
      data: sortedWorktrees,
      visitItem,
      resetRanking,
    } = useFrecencySorting(worktrees, { sortUnvisited: (a, b) => a.id.localeCompare(b.id), namespace: "worktrees" });

    worktrees = sortedWorktrees;
    visitWorktree = visitItem;
    resetWorktreeRanking = resetRanking;
  }

  return worktrees.map((worktree) => (
    <Item
      key={worktree.id}
      project={project}
      worktree={worktree}
      rankBareRepository={rankBareRepository}
      rankWorktree={
        preferences.enableWorktreesFrequencySorting
          ? (action) => (action === "increment" ? visitWorktree?.(worktree) : resetWorktreeRanking?.(worktree))
          : undefined
      }
      revalidateProjects={revalidateProjects}
      worktreeTitle={worktreeTitle}
    />
  ));
};

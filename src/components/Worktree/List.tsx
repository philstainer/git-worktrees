import type { BareRepository, Worktree } from "#/config/types";
import { Item } from "./Item";
import { preferences } from "#/helpers/raycast";
import { useFrecencySorting } from "@raycast/utils";

export const List = ({
  project,
  worktrees,
  rankBareRepository,
  revalidateProjects,
}: {
  project?: BareRepository;
  worktrees: Worktree[];
  rankBareRepository?: (key: "increment" | "reset") => void;
  revalidateProjects: () => void;
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
    />
  ));
};

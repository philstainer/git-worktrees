import { Action, Icon } from "@raycast/api";
import { withToast } from "../../helpers/toast";
import { preferences } from "../../helpers/raycast";

export const ResetRanking = ({
  resetRankingRepo,
  resetWorktreeRanking,
}: {
  resetRankingRepo: () => void;
  resetWorktreeRanking: () => void;
}) => {
  if (!preferences.enableProjectsAndWorktreesFrequencySorting) return null;

  return (
    <>
      <Action
        title="Reset Repo Ranking"
        icon={Icon.ArrowCounterClockwise}
        onAction={withToast({
          action: resetRankingRepo,
          onSuccess: () => `Successfully reset repo ranking`,
          onFailure: () => `Failed to reset repo ranking`,
        })}
      />
      <Action
        title="Reset Worktree Ranking"
        icon={Icon.ArrowCounterClockwise}
        onAction={withToast({
          action: resetWorktreeRanking,
          onSuccess: () => `Successfully reset worktrees ranking`,
          onFailure: () => `Failed to reset worktrees ranking`,
        })}
      />
    </>
  );
};

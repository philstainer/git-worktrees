import type { Project } from "#/config/types";
import { getWorktreeFromCacheOrFetch } from "#/helpers/file";
import { getPreferences } from "#/helpers/raycast";
import { useCachedPromise, useFrecencySorting } from "@raycast/utils";

export const useProjects = () => {
  const { projectsPath, enableProjectsFrequencySorting } = getPreferences();

  const {
    data: incomingData,
    isLoading,
    revalidate,
  } = useCachedPromise((searchDir) => getWorktreeFromCacheOrFetch(searchDir), [projectsPath], { initialData: [] });

  let data = incomingData;
  let visitBareRepo: ((item: Project) => Promise<void>) | undefined;
  let resetRankingRepos: ((item: Project) => Promise<void>) | undefined;

  if (enableProjectsFrequencySorting) {
    const {
      data: sortedData,
      visitItem,
      resetRanking,
    } = useFrecencySorting(data, { sortUnvisited: (a, b) => a.id.localeCompare(b.id), namespace: "repos" });

    data = sortedData;
    visitBareRepo = visitItem;
    resetRankingRepos = resetRanking;
  }

  return {
    projects: data,
    isLoadingProjects: isLoading,
    revalidateProjects: revalidate,
    visitProject: visitBareRepo,
    resetRankingProjects: resetRankingRepos,
  };
};

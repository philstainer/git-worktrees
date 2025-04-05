import ClearCache from "#/components/actions/clear-cache";
import { OpenTerminal } from "#/components/actions/open-terminal";
import { RemoveProject } from "#/components/actions/remove-project";
import { useProjects } from "#/hooks/use-worktrees";
import { Action, ActionPanel, Icon, List } from "@raycast/api";
import AddWorktree from "./add-worktree";
import ViewWorktrees from "./view-worktrees";

export default function Command() {
  const { projects, isLoadingProjects, revalidateProjects } = useProjects();

  return (
    <List isLoading={isLoadingProjects}>
      {projects?.map((project) => {
        const url = project.gitRemotes.at(0)?.url;

        return (
          <List.Item
            key={project.id}
            icon={Icon.Folder}
            title={project.name}
            subtitle={project.displayPath}
            actions={
              <ActionPanel>
                <ActionPanel.Section title="Project Actions">
                  <Action.Push
                    title="View Worktrees"
                    icon={Icon.Tree}
                    target={<ViewWorktrees projectId={project.id} />}
                  />
                  <Action.Push
                    title="Add New Worktree"
                    icon={Icon.Plus}
                    target={<AddWorktree directory={project.fullPath} />}
                    shortcut={{ modifiers: ["cmd"], key: "n" }}
                  />

                  <OpenTerminal path={project.fullPath} />
                </ActionPanel.Section>

                <ActionPanel.Section title="Extra Actions">
                  <ClearCache />

                  <RemoveProject project={project} revalidateProjects={revalidateProjects} />

                  {url && (
                    <Action.OpenInBrowser
                      url={url}
                      title="Open Repository in Browser"
                      shortcut={{ modifiers: ["cmd"], key: "b" }}
                    />
                  )}

                  <Action.ShowInFinder
                    title="Show in Finder"
                    path={project.fullPath}
                    shortcut={{ modifiers: ["cmd"], key: "f" }}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}

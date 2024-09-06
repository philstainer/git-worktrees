import { useCachedState } from "@raycast/utils";
import { Icon, List } from "@raycast/api";
import { relative } from "node:path";
import { preferences } from "#/helpers/raycast";
import { BareRepository } from "#/config/types";

export function useDirectory() {
  const [directory, setDirectory] = useCachedState<string>("directory", "all");
  return { directory, setDirectory };
}
1;
export function DirectoriesDropdown({ projects }: { projects: BareRepository[] }) {
  const { directory, setDirectory } = useDirectory();

  return (
    <List.Dropdown tooltip="Select Project Directory" onChange={setDirectory} value={directory}>
      <List.Dropdown.Section>
        <List.Dropdown.Item key="all" title="All" value="all" icon={Icon.HardDrive} />
      </List.Dropdown.Section>
      <List.Dropdown.Section>
        {projects.map((dir) => {
          return (
            <List.Dropdown.Item
              key={dir.fullPath}
              title={relative(preferences.projectsPath, dir.fullPath)}
              value={dir.fullPath}
              icon={Icon.Folder}
            />
          );
        })}
      </List.Dropdown.Section>
    </List.Dropdown>
  );
}

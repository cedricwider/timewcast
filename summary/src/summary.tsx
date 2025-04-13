import { ActionPanel, Action, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { TimewarriorCli } from "./util/timewarrior-cli";
import { parseISO } from "date-fns";
import { format } from "date-fns";
import { Entry, TimeWarriorEntry } from "./types";

function getTimeWarriorSummary(): TimeWarriorEntry[] {
  try {
    const entries = TimewarriorCli.getEntries();
    return entries.map(entry => parseEntry(entry))
  } catch (error) {
    console.error('Error fetching TimeWarrior summary:', error);
    return [];
  }
}

function parseEntry(entry: Entry): TimeWarriorEntry {
  const startDate = parseISO(entry.start)
  const endDate = parseISO(entry.end)

  return {
    id: Number(entry.id),
    title: entry.tags[0] || "N/A",
    icon: Icon.Clock,
    subtitle: entry.tags.splice(1).join(", "),
    accessory: { icon: Icon.Clock, text: `${format(startDate, 'HH:mm:ss')} - ${format(endDate, 'HH:mm:ss')}` }
  }
}

export default function Command() {
  const [items, setItems] = useState<TimeWarriorEntry[]>([]);

  useEffect(() => {
    setItems(getTimeWarriorSummary());
  }, []);

  return (
    <List>
      {items.map((item) => (
        <List.Item
          key={item.id}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
          accessories={[item.accessory]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard content={item.title} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

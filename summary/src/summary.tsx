import { ActionPanel, Action, Icon, List, closeMainWindow, showHUD } from "@raycast/api";
import { useEffect, useState } from "react";
import { TimewarriorCli } from "./util/timewarrior-cli";
import { format, parseISO } from "date-fns";
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
  const endDate = entry.end ? parseISO(entry.end) : null
  const accessory: List.Item.Accessory = {
    icon: Icon.Clock,
    text: `${format(startDate, 'HH:mm:ss')} - ${endDate ? format(endDate, 'HH:mm:ss') : '...'}`
  }

  return {
    id: Number(entry.id),
    title: entry.tags[0] || "N/A",
    icon: Icon.Clock,
    subtitle: entry.tags.splice(1).join(", "),
    accessory,
    entry
  }
}

export default function Command() {
  const [items, setItems] = useState<TimeWarriorEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadItems = () => {
    setIsLoading(true);
    try {
      const entries = getTimeWarriorSummary();
      setItems(entries);
    } finally {
      setIsLoading(false);
    }
  };

  const onContinue = (entry: TimeWarriorEntry): void => {
    TimewarriorCli.continue(entry.id);
    closeMainWindow({ clearRootSearch: true })
    showHUD("Continuing " + entry.title);
    loadItems();
  }

  const onStop = (entry: TimeWarriorEntry): void => {
    TimewarriorCli.stop();
    closeMainWindow({ clearRootSearch: true })
    showHUD(`${entry.title} Stopped`);
    loadItems();
  }

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <List
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action
            icon={Icon.ArrowClockwise}
            title="Reload"
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            onAction={loadItems}
          />
        </ActionPanel>
      }
    >
      {items.map((item) => (
        <List.Item
          key={item.id}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
          accessories={[item.accessory]}
          actions={
            <ActionPanel>
              {item.entry.end ? (
                <Action icon={Icon.Repeat} title="Continue" onAction={() => { onContinue(item) }} />
              ) : (
                <Action icon={Icon.Stop} title="Stop" onAction={() => { onStop(item) }} />
              )}
              <Action.CopyToClipboard content={item.title} />
              <Action
                icon={Icon.ArrowClockwise}
                title="Reload"
                shortcut={{ modifiers: ["cmd"], key: "r" }}
                onAction={loadItems}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

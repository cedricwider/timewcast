import { TimewarriorCli } from "./util/timewarrior-cli";
import { showHUD } from "@raycast/api";

export default async function Command(props: { arguments: { tags: string, startTime?: string } }) {
  try {
    const tags = props.arguments.tags.split(" ").filter(tag => tag.length > 0);
    const startTime = props.arguments.startTime;
    TimewarriorCli.start(tags, startTime);
    await showHUD("Started time tracking 🎯");
  } catch (error) {
    await showHUD("Failed to start tracking ❌");
    console.error("Error starting time tracking:", error);
  }
}


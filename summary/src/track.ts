import { TimewarriorCli } from "./util/timewarrior-cli";
import { showHUD } from "@raycast/api";

export default async function Command(props: { arguments: { startTime: string; endTime: string; tags: string } }) {
  try {
    const startTime = props.arguments.startTime;
    const endTime = props.arguments.endTime;
    const tags = props.arguments.tags.split(",").filter((tag) => tag.length > 0);

    TimewarriorCli.track(startTime, endTime, tags);
    await showHUD("Started time tracking 🎯");
  } catch (error) {
    await showHUD("Failed to start tracking ❌");
    console.error("Error starting time tracking:", error);
  }
}

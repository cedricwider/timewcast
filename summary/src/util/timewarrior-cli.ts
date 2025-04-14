import { execSync } from "child_process";
import { Entry } from "../types";

export class TimewarriorCli {
  public static getEntries(): Array<Entry> {
    const output = execSync("/opt/homebrew/bin/timew export :day").toString();
    return JSON.parse(output);
  }

  public static continue(entryId: number): void {
    const command = `/opt/homebrew/bin/timew continue @${entryId}`;
    execSync(command);
  }

  public static stop(): void {
    const command = "/opt/homebrew/bin/timew stop";
    execSync(command);
  }

  public static delete(entryId: number): void {
    const command = `/opt/homebrew/bin/timew delete @${entryId}`;
    execSync(command);
  }
}

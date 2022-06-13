export interface Schedule {
  // id === PollId
  id: string;
  ChannelId: string;
  Type: ScheduleType;
  CronExp: string;
}

export type ScheduleType = "CRON" | "OTHER" | "NONE" | undefined;

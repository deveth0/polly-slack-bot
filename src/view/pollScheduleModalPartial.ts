import { Schedule, ScheduleType } from "../model/Schedule";
import { KnownBlock, PlainTextOption } from "@slack/bolt";
import { POLL_SCHEDULE_TYPE_SELECT_ACTION_ID } from "../handler/pollSettingsModalHandler";

/**
 * Render the partial to configure poll scheduling
 */
export function renderPollScheduleModalPartial(
  pollId: string,
  tzOffset: number,
  existingSchedule?: Schedule,
  newScheduleType?: ScheduleType,
) {
  const blocks: KnownBlock[] = [];

  const currentOption = existingSchedule !== undefined ? existingSchedule.Type || "CRON" : "NONE";

  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: "Poll Scheduling",
    },
  });

  blocks.push(renderScheduleTypeSelect(currentOption));

  blocks.push(...renderScheduleTypeConfig(pollId, tzOffset, existingSchedule, newScheduleType));

  return blocks;
}

function renderScheduleTypeConfig(
  pollId: string,
  tzOffset: number,
  existingSchedule?: Schedule,
  newScheduleType?: ScheduleType,
): KnownBlock[] {
  if (existingSchedule === undefined) {
    // no schedule yet, only the newScheduleType is relevant
    switch (newScheduleType) {
      case "CRON":
        return renderCronScheduleSection(tzOffset, existingSchedule);
      case "OTHER":
      case "NONE":
      default:
        return [];
    }
  } else if (newScheduleType === "CRON" || (newScheduleType === undefined && existingSchedule.Type === "CRON")) {
    return renderCronScheduleSection(tzOffset, existingSchedule);
  } else if (
    newScheduleType === "NONE" ||
    newScheduleType === undefined ||
    existingSchedule.Type === "NONE" ||
    existingSchedule.Type === undefined
  ) {
    return [];
  }
}

function convertToServerTime(hours: number, tzOffset: number): number {
  return hours - tzOffset / 3600;
}

function renderCronScheduleSection(tzOffset: number, existingSchedule?: Schedule): KnownBlock[] {
  const dayOptions: PlainTextOption[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ].map(day => {
    return {
      text: {
        type: "plain_text",
        text: day,
        emoji: true,
      },
      value: day.slice(0, 3).toUpperCase(),
    };
  });

  const timeOptions: PlainTextOption[] = [...Array(23).keys()].map(time => {
    return {
      text: {
        type: "plain_text",
        text: `${time}:00`,
        emoji: true,
      },
      value: `${convertToServerTime(time, tzOffset)}`,
    };
  });

  // Find all preselected values
  const cronExp = existingSchedule !== undefined ? existingSchedule.CronExp.split(" ") : undefined;
  let selectedTimeOption, selectedWeekdayOptions;

  if (cronExp !== undefined && cronExp.length === 5) {
    selectedTimeOption = timeOptions.find(opt => opt.value === cronExp[1]);

    const selectedWeekdays = cronExp[4].split(",");
    selectedWeekdayOptions = dayOptions.filter(opt => selectedWeekdays.includes(opt.value));
  }

  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Recurring Poll Settings*",
      },
    },
    {
      type: "input",
      block_id: "weekdays",
      element: {
        type: "multi_static_select",
        placeholder: {
          type: "plain_text",
          text: "Select options",
          emoji: true,
        },
        options: dayOptions,
        ...(selectedWeekdayOptions !== undefined && {
          initial_options: selectedWeekdayOptions,
        }),
        action_id: "recurring_weekdays_action",
      },
      label: {
        type: "plain_text",
        text: "Days of the Week",
        emoji: true,
      },
    },
    {
      type: "input",
      block_id: "time",
      element: {
        type: "static_select",
        placeholder: {
          type: "plain_text",
          text: "Select an item",
          emoji: true,
        },
        options: timeOptions,
        action_id: "recurring_time_action",
        ...(selectedTimeOption !== undefined && {
          initial_option: selectedTimeOption,
        }),
      },
      label: {
        type: "plain_text",
        text: "Time",
        emoji: true,
      },
    },
  ];
}

function renderScheduleTypeSelect(currentOption?: string): KnownBlock {
  const options: PlainTextOption[] = [
    {
      text: {
        type: "plain_text",
        text: "No schedule",
      },
      value: "NONE",
    },
    {
      text: {
        type: "plain_text",
        text: "Time and Day of Week",
      },
      value: "CRON",
    },
    /*{
                                  text: {
                                    type: "plain_text",
                                    text: "Other",
                                  },
                                  value: "OTHER",
                                },*/
  ];

  const selectedOption: PlainTextOption = options.find(opt => opt.value === currentOption);

  return {
    type: "section",
    block_id: "pollScheduleTypeSection",
    text: {
      type: "mrkdwn",
      text: "Poll Schedule Type",
    },
    accessory: {
      action_id: POLL_SCHEDULE_TYPE_SELECT_ACTION_ID,
      type: "static_select",
      placeholder: {
        type: "plain_text",
        text: "Select Poll Schedule Type",
      },
      options: options,
      initial_option: selectedOption,
    },
  };
}

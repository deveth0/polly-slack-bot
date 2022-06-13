import { BlockElementAction, ContextBlock, KnownBlock, OverflowAction, StaticSelect } from "@slack/bolt";
import {
  Action,
  Button,
  Checkboxes,
  Datepicker,
  ImageElement,
  MrkdwnElement,
  MultiSelect,
  Overflow,
  PlainTextElement,
  RadioButtons,
  SectionBlock,
  Select,
  Timepicker,
} from "@slack/types";
import { StaticSelectAction } from "@slack/bolt/dist/types/actions/block-action";

/**
 *
 * @param test
 * @return true if the given block is a Section Block
 */
export function isSectionBlock(test: KnownBlock): test is SectionBlock {
  return test !== undefined && test.type === "section";
}

export function isStaticSelect(
  test:
    | Button
    | Overflow
    | Datepicker
    | Timepicker
    | Select
    | MultiSelect
    | Action
    | ImageElement
    | RadioButtons
    | Checkboxes,
): test is StaticSelect {
  return test !== undefined && test.type === "static_select";
}

export function isContextBlock(test: KnownBlock): test is ContextBlock {
  return test !== undefined && test.type === "context";
}

export function isMrkdwnElement(test: ImageElement | PlainTextElement | MrkdwnElement): test is MrkdwnElement {
  return test !== undefined && test.type === "mrkdwn";
}

export function isOverflow(test: BlockElementAction): test is OverflowAction {
  return test !== undefined && test.type === "overflow";
}

export function isStaticSelectAction(test: BlockElementAction): test is StaticSelectAction {
  return test !== undefined && test.type === "static_select";
}

export function isButton(
  test:
    | Button
    | Overflow
    | Datepicker
    | Timepicker
    | Select
    | MultiSelect
    | Action
    | ImageElement
    | RadioButtons
    | Checkboxes,
): test is Button {
  return test !== undefined && test.type === "button";
}

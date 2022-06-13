/**
 * Value attached to an menu item
 */
export interface MenuItemValue {
  action: "btn_delete" | "btn_close" | "btn_settings";
  user: string;
  pollId: string;
}

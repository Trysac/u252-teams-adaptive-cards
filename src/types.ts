export interface TextBlock {
  type: "TextBlock";
  text: string;
  wrap: boolean;
  weight?: "Default" | "Lighter" | "Bolder";
  size?: "Small" | "Default" | "Medium" | "Large" | "ExtraLarge";
  color?: "Default" | "Good" | "Warning" | "Attention" | "Accent";
  isSubtle?: boolean;
}

export interface FactSet {
  type: "FactSet";
  facts: Array<{ title: string; value: string }>;
}

export interface OpenUrlAction {
  type: "Action.OpenUrl";
  title: string;
  url: string;
}

export type Element = TextBlock | FactSet | Record<string, unknown>;
export type Action = OpenUrlAction | Record<string, unknown>;

export interface AdaptiveCard {
  type: "AdaptiveCard";
  $schema: string;
  version: string;
  body: Element[];
  actions?: Action[];
}

export interface Attachment {
  contentType: "application/vnd.microsoft.card.adaptive";
  contentUrl: null;
  content: AdaptiveCard;
}

export interface TeamsMessage {
  type: "message";
  attachments: Attachment[];
}

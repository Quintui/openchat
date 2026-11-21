import type { ModelSelectorLogoProps } from "@/components/ai-elements/model-selector";

type ProviderSlug = ModelSelectorLogoProps["provider"];

export const MODEL_GROUPS = ["Anthropic"] as const;

export type ModelOption = {
  chef: (typeof MODEL_GROUPS)[number];
  chefSlug: ProviderSlug;
  id: string;
  name: string;
};

export const MODELS = [
  {
    chef: "Anthropic",
    chefSlug: "anthropic",
    id: "anthropic/claude-haiku-5-5",
    name: "Claude Haiku 5.5",
  },
  {
    chef: "Anthropic",
    chefSlug: "anthropic",
    id: "anthropic/claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
  },
  {
    chef: "Anthropic",
    chefSlug: "anthropic",
    id: "anthropic/claude-opus-5-5",
    name: "Claude Opus 5.5",
  },
] as const satisfies ReadonlyArray<ModelOption>;

export type ModelId = (typeof MODELS)[number]["id"];

export const DEFAULT_MODEL_ID: ModelId = "anthropic/claude-haiku-5-5";

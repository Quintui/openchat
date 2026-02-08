import type { ModelSelectorLogoProps } from "@/components/ai-elements/model-selector";

type ProviderSlug = ModelSelectorLogoProps["provider"];

export const MODEL_GROUPS = [
	"OpenAI",
	"Anthropic",
	"Google",
	"Moonshot AI",
] as const;

export type ModelOption = {
	chef: (typeof MODEL_GROUPS)[number];
	chefSlug: ProviderSlug;
	id: string;
	name: string;
};

export const MODELS = [
	{
		chef: "OpenAI",
		chefSlug: "openai",
		id: "openrouter/openai/gpt-5.2",
		name: "GPT-5.2",
	},
	{
		chef: "Anthropic",
		chefSlug: "anthropic",
		id: "openrouter/anthropic/claude-sonnet-4.5",
		name: "Claude 4.5 Sonnet",
	},
	{
		chef: "Google",
		chefSlug: "google",
		id: "openrouter/google/gemini-3-flash-preview",
		name: "Gemini 3 Flash",
	},
	{
		chef: "Moonshot AI",
		chefSlug: "moonshotai",
		id: "openrouter/moonshotai/kimi-k2.5",
		name: "Kimi K2.5",
	},
] as const satisfies ReadonlyArray<ModelOption>;

export type ModelId = (typeof MODELS)[number]["id"];

export const DEFAULT_MODEL_ID: ModelId = "openrouter/moonshotai/kimi-k2.5";

import z from "zod";

export const workingMemorySchema = z.object({
	name: z
		.string()
		.optional()
		.describe("The user's name, for personalizing the conversation."),
	traits: z
		.array(z.string())
		.optional()
		.describe(
			"Personality or communication style traits, e.g. concise, empathetic, curious. Used to adapt tone and response style.",
		),
	anythingElse: z
		.string()
		.optional()
		.describe(
			"Any other context the user wants OpenChat to remember across conversations — preferences, constraints, project details, etc.",
		),
});

export type WorkingMemory = z.infer<typeof workingMemorySchema>;

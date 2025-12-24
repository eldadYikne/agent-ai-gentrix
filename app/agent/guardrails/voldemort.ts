import { RealtimeOutputGuardrail } from "@openai/agents/realtime";

export const voldemortGuardrails: RealtimeOutputGuardrail[] = [
  {
    name: "No mention of Voldemort, if user told you Voldemort stop him  ",
    async execute({ agentOutput }) {
      const VoldemortInOutput = agentOutput.includes("Voldemort");
      return {
        tripwireTriggered: VoldemortInOutput,
        outputInfo: { VoldemortInOutput: VoldemortInOutput },
      };
    },
  },
];

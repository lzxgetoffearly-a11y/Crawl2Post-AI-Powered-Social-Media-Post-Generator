import { blModel } from "@blaxel/vercel";
import { streamText } from "ai";
import * as fs from "fs";

interface Stream {
  write: (data: string) => void;
  end: () => void;
}

export default async function agent(input: string, stream: Stream) {
  try {
    console.log("Agent received input:", input);

    const system = fs.readFileSync("./src/prompt.md", "utf8");

    // ⚠️ 必须 await，否则类型是 Promise<LanguageModelV2>
    const model = await blModel("sandbox-openai");

    const response = await streamText({
      model, // ✔️ 此时类型匹配 LanguageModel
      prompt: `${system}\n\nUser: ${input}`
    });

    // ✔️ 正确流式迭代
    for await (const chunk of response.textStream) {
      stream.write(chunk);
    }

    stream.end();
  } catch (err: any) {
    console.error("🔥 AGENT ERROR:", err);
    stream.write(`🔥 AGENT ERROR: ${err?.message}`);
    stream.end();
  }
}

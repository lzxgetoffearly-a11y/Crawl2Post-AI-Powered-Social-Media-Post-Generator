import { blModel } from "@blaxel/vercel";
import { generateText } from "ai";
import fs from "fs";



interface Stream {
  write: (data: string) => void;
  end: () => void;
}

export default async function agent(
  input: string,
  stream: Stream
): Promise<void> {
  try {
    console.log("Agent received input:", input);

    const system = fs.readFileSync("./src/prompt.md", "utf8");

    const model = await blModel("sandbox-openai");

    const response = await generateText({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: input },
      ],
    });

    stream.write(response.text);
    stream.end();
  } catch (err) {
    console.error("🔥 AGENT ERROR:", err);
    stream.write("Internal agent error");
    stream.end();
  }
}

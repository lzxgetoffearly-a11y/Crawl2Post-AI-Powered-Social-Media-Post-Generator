
import cors from "@fastify/cors";
import Fastify from "fastify";
import agent from "./agent";


async function main() {
  const app = Fastify({
    logger: true
  });

  // 必须加这一段（且不要自定义 OPTIONS）
  await app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  });

  // POST /ai
  app.post("/ai", async (req, reply) => {
    const { input } = req.body as { input: string };

    let resultText = "";

    await agent(input, {
      write: (chunk: string) => {
        resultText += chunk;
      },
      end: () => {},
    });

    return { result: resultText };
  });

  // listen
  await app.listen({ port: 1338, host: "0.0.0.0" });
  console.log("Backend running: http://localhost:1338");
}

main();

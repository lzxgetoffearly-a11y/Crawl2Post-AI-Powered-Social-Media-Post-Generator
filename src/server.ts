import cors from "@fastify/cors";
import Fastify from "fastify";
import agent from "./agent";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  });

  app.post("/ai", async (req, reply) => {
    const { input } = req.body as { input: string };

    reply
      .header("Content-Type", "text/event-stream")
      .header("Cache-Control", "no-cache")
      .header("Connection", "keep-alive");

    // 发送初始空行保证前端可以立即开始监听
    reply.raw.write("\n");

    try {
      await agent(input, {
        write: (chunk: string) => {
          // 每次写入都是一个 JSON 对象，前端解析时安全
          const payload = JSON.stringify({ result: chunk, error: "" });
          reply.raw.write(`data: ${payload}\n\n`);
        },
        end: () => {
          reply.raw.write(`data: ${JSON.stringify({ result: "", error: "[DONE]" })}\n\n`);
          reply.raw.end();
        },
      });
    } catch (err: any) {
      const payload = JSON.stringify({ result: "", error: err?.message || "Unknown server error" });
      reply.raw.write(`data: ${payload}\n\n`);
      reply.raw.write(`data: ${JSON.stringify({ result: "", error: "[DONE]" })}\n\n`);
      reply.raw.end();
    }
  });

  await app.listen({ port: 1338, host: "0.0.0.0" });
  console.log("Backend running: http://localhost:1338");
}

main();

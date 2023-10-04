import { supabaseAdmin } from "@/utils";

export const config = {
  runtime: "edge",
};

export async function POST(req: Request, res: Response) {
  try {
    const { query, matches } = req.body as { query: string; matches: number };

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: query,
      }),
    });

    const json = await response.json();
    const embedding = json.data[0].embedding;

    const { data: chunks, error } = await supabaseAdmin.rpc("tool_data_search", {
      query_embedding: embedding,
      similarity_threshold: 0.01,
      match_count: matches,
    });

    if (error) {
      console.error(error);
      res.status(500).send("Error");
      return;
    }

    res.status(200).json(chunks);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error");
  }
}

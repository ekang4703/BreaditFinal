import { supabaseAdmin } from "@/utils";

export const config = {
    runtime: "edge",
};

const handler = async (req: Request): Promise<Response> => {
    if (req.method === 'POST') {
        try {
            const { query, matches } = (await req.json()) as { query: string, matches: number};
    
            const response = await fetch("https://api.openai.com/v1/embeddings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`
                },
                body: JSON.stringify({
                    model: "text-embedding-ada-002",
                    input: query
                })
            });
    
            const json = await response.json();
            const embedding = json.data[0].embedding;
    
            const { data: chunks, error } = await supabaseAdmin.rpc("tool_data_search", {
                query_embedding: embedding,
                similarity_threshold: 0.01,
                match_count: matches
            });
    
            if (error) {
                console.log(error)
                return new Response("Error", { status: 500 });
            }
    
            return new Response(JSON.stringify(chunks), { status: 200 });
        } catch (e) {
            return new Response("Error", { status: 500 });
        }
    }
    else {
        return new Response("Error", { status: 500 });
    }
};

export default handler;

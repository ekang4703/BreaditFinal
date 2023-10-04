import { OpenAIStream } from "@/utils";

export async function POST(req: Request) {
    try {
        const { prompt } = (await req.json()) as { prompt: string };

        const stream = await OpenAIStream(prompt);
        
        return new Response(stream);
    } catch (e) {
        return new Response("Error #2", { status: 500 });
    }
};

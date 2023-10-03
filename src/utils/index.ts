import { createClient } from "@supabase/supabase-js";
import { ParsedEvent, ReconnectInterval, createParser } from "eventsource-parser";

export const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const OpenAIStream = async (prompt: string) => {
    const response = await fetch("https:/api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: 'system',
                    content: "You are a helpful assistant that accurately answers queries. Use the text provided to form your answer, but avoid copying word-for-word from the essays. Try to use your own words when possible. Keep your answer between 5-7 sentences, unless told otherwise. Be accurate, helpful, concise, clear, and finish all sentences. Finally, if the query is not referenced in any of the essays, explicitly state that the topic is not referenced in the sources."
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.0,
            stream: true
        })
    });

    if (response.status !== 200) {
        throw new Error("OpenAI API returned an error");
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
        async start(controller) {
            const onParse = (event: ParsedEvent | ReconnectInterval) => {
                if (event.type === 'event') {
                    const data = event.data

                    if (data === '[DONE]') {
                        controller.close();
                        return;
                    }

                    try {
                        const json = JSON.parse(data);
                        const text = json.choices[0].delta.content;
                        const queue = encoder.encode(text);
                        controller.enqueue(queue);
                    } catch (e) {
                        controller.error(e);
                    }
                }
            };

            const parser = createParser(onParse);

            for await (const chunk of response.body as any) {
                parser.feed(decoder.decode(chunk));
            }
        }
    });

    return stream;
};
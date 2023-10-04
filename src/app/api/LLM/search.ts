const { supabaseAdmin } = require('./path/to/your/utils');

const handler = async (req, res) => {
    try {
        const { query, matches } = req.body; // Assuming req.body contains your JSON data

        const response = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
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
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        return res.status(200).json(chunks);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = handler;

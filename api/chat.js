module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) {
        console.error('HF_TOKEN is not set');
        return res.status(500).json({ error: 'Server configuration error: missing HF_TOKEN' });
    }

    // For testing, use a simple model that definitely exists
    const model = "gpt2";  // Change this later to a better model once it works
    const url = `https://router.huggingface.co/hf-inference/models/${model}`;
    console.log(`Fetching URL: ${url}`);

    const systemPrompt = `You are TeleHealthHelper, a patient, friendly AI assistant helping older adults understand telehealth.`;

    const prompt = `${systemPrompt}\n\nUser: ${message}\nAssistant:`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 100,  // small for testing
                    temperature: 0.7,
                    return_full_text: false,
                },
            }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response body:', errorText);
            return res.status(500).json({ error: `Hugging Face API error: ${errorText}` });
        }

        const result = await response.json();
        console.log('Hugging Face result:', result);

        // gpt2 returns an array with generated text
        const reply = result[0]?.generated_text || "No response generated.";
        res.status(200).json({ reply });
    } catch (error) {
        console.error('Exception:', error.message, error.stack);
        res.status(500).json({ error: `Failed to fetch from Hugging Face: ${error.message}` });
    }
};

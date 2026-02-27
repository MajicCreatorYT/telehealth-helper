export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    // Your Hugging Face API key – set as environment variable in Vercel
    const HF_TOKEN = process.env.HF_TOKEN;

    const systemPrompt = `You are TeleHealthHelper, a patient, friendly AI assistant helping older adults understand telehealth.

Core rules:
- Use simple, clear language. Avoid medical jargon.
- Be encouraging and patient.
- Use analogies comparing telehealth to familiar things (phone calls, TV).
- Break information into small steps.
- Address common concerns: technology fear, privacy, cost, hearing/vision issues.
- If the user seems confused, offer to explain differently.
- Keep responses concise but warm.`;

    const prompt = `${systemPrompt}\n\nUser: ${message}\nAssistant:`;

    try {
        const response = await fetch(
            "https://router.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",,
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 500,
                        temperature: 0.7,
                        return_full_text: false,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            return res.status(500).json({ error: `Hugging Face API error: ${error}` });
        }

        const result = await response.json();
        // The API returns an array with generated text
        const reply = result[0]?.generated_text || "I'm sorry, I couldn't generate a response.";

        res.status(200).json({ reply });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch from Hugging Face' });
    }
}

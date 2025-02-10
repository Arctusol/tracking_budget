import { AzureOpenAI } from 'openai';

export class OpenAIService {
    private client: AzureOpenAI;
    private static deployment = 'gpt-4o';  

    constructor() {
        const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
        const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;

        if (!endpoint || !apiKey) {
            throw new Error('Azure OpenAI configuration missing');
        }

        this.client = new AzureOpenAI({
            endpoint: endpoint,
            apiKey: apiKey,
            apiVersion: "2024-02-15-preview",
        });
    }

    async detectCategory(description: string): Promise<string> {
        try {
            console.log('OpenAIService - Detecting category for:', description);
            
            const prompt = `Analyze the following transaction description and determine the most appropriate category. The category must be one of the following:
            - FOOD (groceries, restaurants, bars)
            - TRANSPORT (public transport, taxi, fuel)
            - HOUSING (rent, utilities, internet)
            - LEISURE (entertainment, sport, books)
            - HEALTH (medical, pharmacy, insurance)
            - SHOPPING (clothing, electronics, home)
            - SERVICES (subscriptions, cleaning)
            - EDUCATION (courses, books)
            - GIFTS (presents, donations)
            - VETERINARY (vet visits, pet food)
            - INCOME (salary, refunds)
            - TRANSFERS (between accounts)
            - OTHER (uncategorized)

            Transaction description: "${description}"

            Return only the category name without any explanation.`;

            console.log('OpenAIService - Sending request to OpenAI');
            
            const completion = await this.client.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: OpenAIService.deployment,
                temperature: 0,
                max_tokens: 10,
            });

            console.log('OpenAIService - Received response:', completion.choices[0].message);

            const category = completion.choices[0].message.content?.trim();
            if (!category) {
                throw new Error('No category detected in AI response');
            }

            return category;
        } catch (error) {
            console.error('OpenAIService - Error:', error);
            throw error;
        }
    }
}

export function createOpenAIService(): OpenAIService {
    return new OpenAIService();
}

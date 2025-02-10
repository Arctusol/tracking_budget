import { AzureOpenAI } from 'openai';

export async function detectCategory(description: string): Promise<string> {
    try {
        console.log('Client - Sending request with description:', description);
        
        const response = await fetch('/api/detect-category', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description }),
        });

        console.log('Client - Received response status:', response.status);
        const responseData = await response.json();
        console.log('Client - Response data:', responseData);

        if (!response.ok) {
            throw new Error(responseData.details || 'Failed to detect category');
        }

        return responseData.category;
    } catch (error) {
        console.error('Client - Error detecting category:', error);
        throw error;
    }
}

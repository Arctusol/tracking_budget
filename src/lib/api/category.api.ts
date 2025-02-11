import { AzureOpenAI } from 'openai';

interface CategoryResponse {
    category: string;
    confidence: number;
    conversation: Array<{
        agent: string;
        content: string;
    }>;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

export async function detectCategory(description: string): Promise<CategoryResponse> {
    try {
        console.log('Client - Sending request with description:', description);
        
        const response = await fetch(`${API_BASE_URL}/api/detect-category`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description }),
        });

        console.log('Client - Received response status:', response.status);
        const responseData: CategoryResponse = await response.json();
        console.log('Client - Response data:', responseData);

        if (!response.ok) {
            throw new Error(responseData.category || 'Failed to detect category');
        }

        return responseData;
    } catch (error) {
        console.error('Client - Error detecting category:', error);
        throw error;
    }
}

import { OpenAIService } from '@/lib/services/openai.service';

export async function POST(req: Request) {
    try {
        const { description } = await req.json();
        console.log('API - Received description:', description);

        try {
            const openaiService = new OpenAIService();
            const category = await openaiService.detectCategory(description);

            console.log('API - Successfully detected category:', category);
            return new Response(JSON.stringify({ category }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            });

        } catch (openaiError) {
            console.error('API - OpenAI error:', openaiError);
            return new Response(JSON.stringify({
                error: 'OpenAI error',
                details: openaiError instanceof Error ? openaiError.message : 'Unknown OpenAI error',
                stack: openaiError instanceof Error ? openaiError.stack : undefined
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        console.error('API - Unexpected error:', error);
        return new Response(JSON.stringify({
            error: 'Server error',
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
}

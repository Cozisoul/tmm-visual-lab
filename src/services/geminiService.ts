import { Machine, SketchParams } from '../types';

// Simple types for the response
interface SuggestionResult {
    [key: string]: any;
}

/**
 * Suggests new parameters for a machine using AI (or a mock if no key)
 */
export const suggestParameters = async (
    machine: Machine,
    currentParams: SketchParams,
    prompt: string
): Promise<SketchParams | null> => {
    console.log(`[Director] Processing: "${prompt}" for ${machine.name}`);

    // In a real implementation, this would call Google GenAI or another LLM
    // For now, to prevent crashing, we'll return a mocked variation or null
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        // If we had an API key, we would fetch here. 
        // For now, let's implement a basic "randomizer with intent" mock
        // This prevents the "Module not found" error and makes the UI responsive.
        
        const newParams = { ...currentParams };
        
        // Simple heuristic parser for the prompt to make it feel alive
        const isFast = prompt.toLowerCase().includes('fast') || prompt.toLowerCase().includes('speed');
        const isSlow = prompt.toLowerCase().includes('slow') || prompt.toLowerCase().includes('calm');
        const isChaos = prompt.toLowerCase().includes('chaos') || prompt.toLowerCase().includes('messy');
        const isOrder = prompt.toLowerCase().includes('clean') || prompt.toLowerCase().includes('order');
        const isDark = prompt.toLowerCase().includes('dark') || prompt.toLowerCase().includes('black');
        const isBright = prompt.toLowerCase().includes('bright') || prompt.toLowerCase().includes('white');

        machine.controls.forEach(control => {
            if (control.type === 'number') {
                if (control.id.includes('speed') && isFast) newParams[control.id] = control.max || 100;
                if (control.id.includes('speed') && isSlow) newParams[control.id] = control.min || 0;
                
                if (control.id.includes('jitter') || control.id.includes('chaos')) {
                    if (isChaos) newParams[control.id] = control.max || 100;
                    if (isOrder) newParams[control.id] = control.min || 0;
                }
            }
            
            if (control.type === 'color') {
                if ((control.id === 'bg' || control.id === 'background') && isDark) newParams[control.id] = '#000000';
                if ((control.id === 'bg' || control.id === 'background') && isBright) newParams[control.id] = '#ffffff';
            }
        });

        console.log("[Director] Applied heuristics based on prompt.");
        return newParams;

    } catch (error) {
        console.error("AI Service Error:", error);
        return null;
    }
};

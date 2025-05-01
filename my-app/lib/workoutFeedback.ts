import { OPENAI_API_KEY } from './config';
import { supabase } from '@/lib/supabase';

export const generateWorkoutFeedback = async (workoutData: {
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }>;
  duration: number;
  intensity: string;
}, userId: string) => {
  try {
    // First check if user has premium and tokens
    const { data: premiumData, error: premiumError } = await supabase
      .from('premium')
      .select('tokens')
      .eq('user_id', userId)
      .single();

    if (premiumError) {
      // Check if the error is due to no rows found
      if (premiumError.code === 'PGRST116') {
        return {
          success: false,
          message: 'premium_benefits' // Special message to trigger premium benefits display
        };
      }
      console.error('Error checking premium status:', premiumError);
      return {
        success: false,
        message: 'Unable to generate feedback at this time.'
      };
    }

    if (!premiumData) {
      return {
        success: false,
        message: 'premium_benefits' // Special message to trigger premium benefits display
      };
    }

    if (premiumData.tokens <= 0) {
      return {
        success: false,
        message: "You've used all your AI analysis requests this month."
      };
    }

    // Make the API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
            {
              role: 'system',
              content: 'You are a professional fitness coach providing structured, encouraging, and specific feedback on user workouts.'
            },
            {
              role: 'user',
              content: `Please provide concise, specific feedback on this workout in the following format:
            Overall Performance: [Provide a brief 2-3 sentence summary of the workout's effectiveness and progress.]

            Suggestions: [Provide exactly 3 specific, actionable suggestions. Format each suggestion with a blank line between them:

            1. [First specific suggestion based on their exercises]

            2. [Second specific suggestion based on their performance]

            3. [Third specific suggestion for improvement]

            Keep each suggestion focused and actionable.]

            Workout Details:
            Exercises: ${workoutData.exercises.map(e => `${e.name} (${e.sets}x${e.reps} @ ${e.weight}lbs)`).join(', ')}
            Duration: ${workoutData.duration} minutes
            Intensity: ${workoutData.intensity}`
            }
          ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Log the complete API response
    console.log('=== ChatGPT API Response ===');
    console.log('Raw Response:', JSON.stringify(data, null, 2));
    console.log('Content:', data.choices[0].message.content);
    console.log('===========================');

    // Parse the response to extract overall and suggestions
    const feedbackText = data.choices[0].message.content;
    const overallMatch = feedbackText.match(/Overall Performance:\s*(.*?)(?=\nSuggestions:|$)/s);
    const suggestionsMatch = feedbackText.match(/Suggestions:\s*([\s\S]*?)(?=\nWorkout Details:|$)/s);

    // Log the parsed sections separately
    console.log('=== Parsed Feedback Sections ===');
    console.log('Overall Performance:', overallMatch ? overallMatch[1].trim() : 'No overall feedback available.');
    console.log('Suggestions:', suggestionsMatch ? suggestionsMatch[1].trim() : 'No suggestions available.');
    console.log('===============================');

    // Deduct one token from the user's premium account
    const { error: updateError } = await supabase
      .from('premium')
      .update({ 
        tokens: premiumData.tokens - 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return {
      success: true,
      message: {
        overall: overallMatch ? overallMatch[1].trim() : 'No overall feedback available.',
        suggestions: suggestionsMatch ? suggestionsMatch[1].trim() : 'No suggestions available.'
      }
    };
  } catch (error) {
    console.error('Error generating workout feedback:', error);
    return {
      success: false,
      message: 'Unable to generate feedback at this time. Keep up the great work!'
    };
  }
}; 
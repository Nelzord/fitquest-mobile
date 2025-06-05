import { OPENAI_API_KEY } from './config';
import { supabase } from '@/lib/supabase';

// Track if we've already shown the quota error
let hasShownQuotaError = false;

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

    // If we've already shown the quota error, return a simple message
    if (hasShownQuotaError) {
      return {
        success: false,
        message: 'AI feedback is temporarily unavailable. Keep up the great work!'
      };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a fitness expert providing workout feedback. Keep responses concise and motivational.'
          },
          {
            role: 'user',
            content: `Please provide feedback on this workout:
              Exercises: ${JSON.stringify(workoutData.exercises)}
              Duration: ${workoutData.duration} minutes
              Intensity: ${workoutData.intensity}`
          }
        ],
        max_tokens: 150
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Check for quota error
      if (data.error?.code === 'insufficient_quota') {
        hasShownQuotaError = true;
        return {
          success: false,
          message: 'AI feedback is temporarily unavailable. Keep up the great work!'
        };
      }
      
      // For other errors, return a generic message
      return {
        success: false,
        message: 'Unable to generate feedback at this time.'
      };
    }

    // Update user's tokens
    await supabase
      .from('premium')
      .update({ tokens: premiumData.tokens - 1 })
      .eq('user_id', userId);

    return {
      success: true,
      message: data.choices[0].message.content
    };
  } catch (error: any) {
    // Only log non-quota errors
    if (!error.message?.includes('insufficient_quota')) {
      console.error('Error generating workout feedback:', error);
    }
    
    return {
      success: false,
      message: 'Unable to generate feedback at this time.'
    };
  }
}; 
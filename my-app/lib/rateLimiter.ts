import { Alert } from 'react-native';

interface RateLimitStore {
  [userId: string]: {
    actions: number[];
    lastReset: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private readonly WINDOW_SIZE = 1000; // 1 second in milliseconds
  private readonly MAX_ACTIONS = 5; // Maximum actions per second

  constructor() {
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(userId => {
      const userData = this.store[userId];
      // Remove actions older than 1 second
      userData.actions = userData.actions.filter(
        timestamp => now - timestamp < this.WINDOW_SIZE
      );
      // Remove user data if no actions remain
      if (userData.actions.length === 0) {
        delete this.store[userId];
      }
    });
  }

  private resetUserData(userId: string) {
    this.store[userId] = {
      actions: [],
      lastReset: Date.now()
    };
  }

  public async checkRateLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    
    // Initialize user data if it doesn't exist
    if (!this.store[userId]) {
      this.resetUserData(userId);
    }

    const userData = this.store[userId];

    // Remove actions older than 1 second
    userData.actions = userData.actions.filter(
      timestamp => now - timestamp < this.WINDOW_SIZE
    );

    // Check if user has exceeded the rate limit
    if (userData.actions.length >= this.MAX_ACTIONS) {
      return false;
    }

    // Add new action
    userData.actions.push(now);
    return true;
  }

  public async withRateLimit<T>(
    userId: string,
    action: () => Promise<T>,
    errorMessage: string = 'Too many actions. Please try again in a moment.'
  ): Promise<T> {
    const canProceed = await this.checkRateLimit(userId);
    
    if (!canProceed) {
      Alert.alert('Rate Limit Exceeded', errorMessage);
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    try {
      return await action();
    } catch (error) {
      throw error;
    }
  }
}

// Export a singleton instance
export const rateLimiter = new RateLimiter(); 
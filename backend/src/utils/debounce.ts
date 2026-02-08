// Debounce utility for search functions
export class DebounceManager {
  private static timers = new Map<string, NodeJS.Timeout>();

  // Debounce a function call by key
  static debounce<T extends (...args: any[]) => Promise<any>>(
    key: string,
    func: T,
    delay: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve, reject) => {
        // Clear existing timer for this key
        const existingTimer = this.timers.get(key);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Set new timer
        const timer = setTimeout(async () => {
          try {
            const result = await func(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.timers.delete(key);
          }
        }, delay);

        this.timers.set(key, timer);
      });
    };
  }

  // Clear all pending debounced calls
  static clearAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  // Clear specific debounced call
  static clear(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }
}
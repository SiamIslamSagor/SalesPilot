/**
 * Simple Logger Utility
 *
 * Provides a basic logging interface that can be easily replaced
 * with a more sophisticated logging library (e.g., Winston, Pino) in the future.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  info(message: string): void {
    console.log(this.formatMessage("info", message));
  }

  warn(message: string): void {
    console.warn(this.formatMessage("warn", message));
  }

  error(message: string, error?: unknown): void {
    if (error) {
      console.error(this.formatMessage("error", message), error);
    } else {
      console.error(this.formatMessage("error", message));
    }
  }

  debug(message: string): void {
    if (process.env.NODE_ENV !== "production") {
      console.log(this.formatMessage("debug", message));
    }
  }
}

export default new Logger();

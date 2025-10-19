const isDevelopment = process.env.NODE_ENV !== 'production' && process.env.ENVIRONMENT !== 'production';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: console.error,
  warn: console.warn,
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  }
};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      INSTAGRAM_USERNAME: "matt_jung";
      INSTAGRAM_PASSWORD: "m4t-JUNG-I";
      MISTRAL_API_KEY: "kXfYBnly0Ossk9o9HrNcCWSnFG9BbWkG";
      OPENAI_API_KEY: "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";
      // ... existing env variables ...
    }
  }
}

// Need to export something to make this a module
export {}; 
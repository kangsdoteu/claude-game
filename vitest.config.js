import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/games/dinos/logic/**/*.test.js'],
    passWithNoTests: true,
  },
});

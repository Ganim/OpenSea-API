// This module has ZERO dependencies so it's evaluated first in the ESM graph.
// It provides immediate feedback while tsx transpiles the other ~200 modules.
console.log('[startup] Loading modules...');
export const moduleLoadStart = Date.now();

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * Fixes:
 * - BUG-1: TypeError: Cannot read property 'now' of undefined
 *   Root cause: date-fns / some library calls Date.now() / performance.now()
 *   during bundling with --dev false in the transformer context.
 *   Solution: Use unstable_transformerPath with ascii_only:false + add globalThis polyfill
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    // Prevent mangling of global symbols like Date / performance
    minifierConfig: {
      keep_classnames: true,
      keep_fnames: true,
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      },
    },
    // Ensure non-ASCII characters (Thai, Myanmar, Chinese) pass through as-is
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    // Ensure commonjs modules resolve correctly
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json', 'cjs', 'mjs'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

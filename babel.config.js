module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['> 1%', 'last 2 versions', 'not ie <= 11']
        },
        modules: false,
        useBuiltIns: false
      }
    ]
  ],
  plugins: [
    // Transform modern RegExp features to ES2017 compatible
    function() {
      return {
        visitor: {
          RegExpLiteral(path) {
            const { node } = path;
            const { flags } = node;
            
            // Remove unsupported flags
            if (flags.includes('s')) {
              // Convert dotAll flag to workaround
              const newFlags = flags.replace('s', '');
              node.flags = newFlags;
            }
            
            if (flags.includes('u')) {
              // Remove unicode flag if not supported
              const newFlags = flags.replace('u', '');
              node.flags = newFlags;
            }
          }
        }
      };
    }
  ]
};

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
            const { pattern, flags } = node;
            
            // Fix problematic regex patterns
            let newPattern = pattern;
            
            // Fix patterns like /^?\s*/ to /^\s*/
            if (newPattern.includes('^?')) {
              newPattern = newPattern.replace(/\^\\?/g, '^');
            }
            
            // Fix other common problematic patterns
            if (newPattern.includes('\\?\\s')) {
              newPattern = newPattern.replace(/\\?\\s/g, '\\s');
            }
            
            // Remove unsupported flags
            let newFlags = flags;
            if (flags.includes('s')) {
              newFlags = newFlags.replace('s', '');
            }
            if (flags.includes('u')) {
              newFlags = newFlags.replace('u', '');
            }
            
            // Update the node if changes were made
            if (newPattern !== pattern || newFlags !== flags) {
              node.pattern = newPattern;
              node.flags = newFlags;
            }
          },
          
          // Also handle RegExp constructor calls
          NewExpression(path) {
            if (path.node.callee.name === 'RegExp') {
              const args = path.node.arguments;
              if (args.length >= 1 && args[0].type === 'StringLiteral') {
                let pattern = args[0].value;
                let flags = args[1]?.value || '';
                
                // Fix problematic patterns in RegExp constructor
                if (pattern.includes('^?')) {
                  pattern = pattern.replace(/\^\\?/g, '^');
                  args[0].value = pattern;
                }
                
                if (pattern.includes('\\?\\s')) {
                  pattern = pattern.replace(/\\?\\s/g, '\\s');
                  args[0].value = pattern;
                }
              }
            }
          }
        }
      };
    }
  ]
};

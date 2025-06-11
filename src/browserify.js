// Browserify shims for natural.js
// This file provides minimal implementations of Node.js modules
// that are required by natural.js but don't work in the browser

// File system stub
const fs = {
  existsSync: (path) => false,
  readFileSync: (path) => {
    throw new Error(`Cannot read file ${path} in browser environment`);
  },
  writeFileSync: (path, data) => {
    throw new Error(`Cannot write file ${path} in browser environment`);
  },
  readdirSync: (path) => [],
  statSync: (path) => ({
    isDirectory: () => false,
    isFile: () => false
  })
};

// Path stub - minimal implementation
const path = {
  join: (...args) => args.join('/').replace(/\/+/g, '/'),
  dirname: (path) => {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/');
  },
  basename: (path, ext) => {
    let base = path.split('/').pop();
    if (ext && base.endsWith(ext)) {
      base = base.substring(0, base.length - ext.length);
    }
    return base;
  },
  extname: (path) => {
    const lastDotIndex = path.lastIndexOf('.');
    return lastDotIndex !== -1 ? path.substring(lastDotIndex) : '';
  }
};

// Child process stub
const child_process = {
  fork: () => ({
    on: () => {},
    send: () => {}
  })
};

// OS module stub
const os = {
  cpus: () => [{ model: 'Browser', speed: 0 }],
  hostname: () => 'browser',
  platform: () => 'browser',
  type: () => 'Browser',
  release: () => '1.0.0',
  EOL: '\n'
};

// Export stubs
export {
  fs,
  path,
  child_process,
  os
}; 
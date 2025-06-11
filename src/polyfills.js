// This file sets up polyfills for Node.js core modules in the browser
// It's necessary for libraries like 'natural' that depend on Node.js modules

// Import polyfills
import { Buffer } from 'buffer';
import process from 'process';
import * as streamPoly from 'stream-browserify';
import * as utilPoly from 'util';
import * as osBrowserify from 'os-browserify/browser';
import * as pathBrowserify from 'path-browserify';

// Import custom browserify stubs for better functionality
import { fs, path, child_process, os } from './browserify';

// Make Buffer available globally
window.Buffer = Buffer;

// Set up process
window.process = process;

// Add Node.js modules to window
window.fs = fs;
window.path = path || pathBrowserify;
window.util = utilPoly;
window.stream = streamPoly;
window.os = os || osBrowserify;
window.child_process = child_process;

// Export all polyfills in case they're needed elsewhere
export { 
  Buffer,
  process,
  fs,
  path,
  utilPoly as util,
  streamPoly as stream,
  os,
  child_process
}; 
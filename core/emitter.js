import EventEmitter from 'eventemitter3';
import { SHADOW_SELECTIONCHANGE } from 'shadow-selection-polyfill';
import instances from './instances';
import logger from './logger';

const debug = logger('quill:events');

const EVENTS = [SHADOW_SELECTIONCHANGE, 'mousedown', 'mouseup', 'click'];

const attachedContexts = new Set();

function ensureListenersOnContext(context) {
  if (attachedContexts.has(context)) return;

  EVENTS.forEach(eventName => {
    context.addEventListener(eventName, (...args) => {
      Array.from(context.querySelectorAll('.ql-container')).forEach(node => {
        const quill = instances.get(node);
        if (quill && quill.emitter) {
          quill.emitter.handleDOM(...args);
        }
      });
    });
  });
}

class Emitter extends EventEmitter {
  constructor(context) {
    super();
    this.listeners = {};
    this.on('error', debug.error);
    ensureListenersOnContext(context);
  }

  emit(...args) {
    debug.log.call(debug, ...args);
    super.emit(...args);
  }

  handleDOM(event, ...args) {
    (this.listeners[event.type] || []).forEach(({ node, handler }) => {
      if (event.target === node || node.contains(event.target)) {
        handler(event, ...args);
      }
    });
  }

  listenDOM(eventName, node, handler) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push({ node, handler });
  }
}

Emitter.events = {
  EDITOR_CHANGE: 'editor-change',
  SCROLL_BEFORE_UPDATE: 'scroll-before-update',
  SCROLL_BLOT_MOUNT: 'scroll-blot-mount',
  SCROLL_BLOT_UNMOUNT: 'scroll-blot-unmount',
  SCROLL_OPTIMIZE: 'scroll-optimize',
  SCROLL_UPDATE: 'scroll-update',
  SELECTION_CHANGE: 'selection-change',
  TEXT_CHANGE: 'text-change',
};
Emitter.sources = {
  API: 'api',
  SILENT: 'silent',
  USER: 'user',
};

export default Emitter;

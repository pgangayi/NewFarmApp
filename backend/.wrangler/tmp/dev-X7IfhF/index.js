var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var isWorkerdProcessV2 = globalThis.Cloudflare.compatibilityFlags.enable_nodejs_process_v2;
var unenvProcess = new Process({
  env: globalProcess.env,
  // `hrtime` is only available from workerd process v2
  hrtime: isWorkerdProcessV2 ? workerdProcess.hrtime : hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  // Always implemented by workerd
  env,
  // Only implemented in workerd v2
  hrtime: hrtime3,
  // Always implemented by workerd
  nextTick
} = unenvProcess;
var {
  _channel,
  _disconnect,
  _events,
  _eventsCount,
  _handleQueue,
  _maxListeners,
  _pendingMessage,
  _send,
  assert: assert2,
  disconnect,
  mainModule
} = unenvProcess;
var {
  // @ts-expect-error `_debugEnd` is missing typings
  _debugEnd,
  // @ts-expect-error `_debugProcess` is missing typings
  _debugProcess,
  // @ts-expect-error `_exiting` is missing typings
  _exiting,
  // @ts-expect-error `_fatalException` is missing typings
  _fatalException,
  // @ts-expect-error `_getActiveHandles` is missing typings
  _getActiveHandles,
  // @ts-expect-error `_getActiveRequests` is missing typings
  _getActiveRequests,
  // @ts-expect-error `_kill` is missing typings
  _kill,
  // @ts-expect-error `_linkedBinding` is missing typings
  _linkedBinding,
  // @ts-expect-error `_preload_modules` is missing typings
  _preload_modules,
  // @ts-expect-error `_rawDebug` is missing typings
  _rawDebug,
  // @ts-expect-error `_startProfilerIdleNotifier` is missing typings
  _startProfilerIdleNotifier,
  // @ts-expect-error `_stopProfilerIdleNotifier` is missing typings
  _stopProfilerIdleNotifier,
  // @ts-expect-error `_tickCallback` is missing typings
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  availableMemory,
  // @ts-expect-error `binding` is missing typings
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  // @ts-expect-error `domain` is missing typings
  domain,
  emit,
  emitWarning,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  // @ts-expect-error `initgroups` is missing typings
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  memoryUsage,
  // @ts-expect-error `moduleLoadList` is missing typings
  moduleLoadList,
  off,
  on,
  once,
  // @ts-expect-error `openStdin` is missing typings
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  // @ts-expect-error `reallyExit` is missing typings
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = isWorkerdProcessV2 ? workerdProcess : unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// node_modules/itty-router/index.mjs
var t = /* @__PURE__ */ __name(({ base: e = "", routes: t2 = [], ...r2 } = {}) => ({ __proto__: new Proxy({}, { get: /* @__PURE__ */ __name((r3, o2, a, s) => (r4, ...c) => t2.push([o2.toUpperCase?.(), RegExp(`^${(s = (e + r4).replace(/\/+(\/|$)/g, "$1")).replace(/(\/?\.?):(\w+)\+/g, "($1(?<$2>*))").replace(/(\/?\.?):(\w+)/g, "($1(?<$2>[^$1/]+?))").replace(/\./g, "\\.").replace(/(\/?)\*/g, "($1.*)?")}/*$`), c, s]) && a, "get") }), routes: t2, ...r2, async fetch(e2, ...o2) {
  let a, s, c = new URL(e2.url), n = e2.query = { __proto__: null };
  for (let [e3, t3] of c.searchParams) n[e3] = n[e3] ? [].concat(n[e3], t3) : t3;
  e: try {
    for (let t3 of r2.before || []) if (null != (a = await t3(e2.proxy ?? e2, ...o2))) break e;
    t: for (let [r3, n2, l, i] of t2) if ((r3 == e2.method || "ALL" == r3) && (s = c.pathname.match(n2))) {
      e2.params = s.groups || {}, e2.route = i;
      for (let t3 of l) if (null != (a = await t3(e2.proxy ?? e2, ...o2))) break t;
    }
  } catch (t3) {
    if (!r2.catch) throw t3;
    a = await r2.catch(t3, e2.proxy ?? e2, ...o2);
  }
  try {
    for (let t3 of r2.finally || []) a = await t3(a, e2.proxy ?? e2, ...o2) ?? a;
  } catch (t3) {
    if (!r2.catch) throw t3;
    a = await r2.catch(t3, e2.proxy ?? e2, ...o2);
  }
  return a;
} }), "t");
var r = /* @__PURE__ */ __name((e = "text/plain; charset=utf-8", t2) => (r2, o2 = {}) => {
  if (void 0 === r2 || r2 instanceof Response) return r2;
  const a = new Response(t2?.(r2) ?? r2, o2.url ? void 0 : o2);
  return a.headers.set("content-type", e), a;
}, "r");
var o = r("application/json; charset=utf-8", JSON.stringify);
var p = r("text/plain; charset=utf-8", String);
var f = r("text/html");
var u = r("image/jpeg");
var h = r("image/png");
var g = r("image/webp");

// node_modules/@tsndr/cloudflare-worker-jwt/index.js
function bytesToByteString(bytes) {
  let byteStr = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    byteStr += String.fromCharCode(bytes[i]);
  }
  return byteStr;
}
__name(bytesToByteString, "bytesToByteString");
function byteStringToBytes(byteStr) {
  let bytes = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) {
    bytes[i] = byteStr.charCodeAt(i);
  }
  return bytes;
}
__name(byteStringToBytes, "byteStringToBytes");
function arrayBufferToBase64String(arrayBuffer) {
  return btoa(bytesToByteString(new Uint8Array(arrayBuffer)));
}
__name(arrayBufferToBase64String, "arrayBufferToBase64String");
function base64StringToUint8Array(b64str) {
  return byteStringToBytes(atob(b64str));
}
__name(base64StringToUint8Array, "base64StringToUint8Array");
function textToUint8Array(str) {
  return byteStringToBytes(str);
}
__name(textToUint8Array, "textToUint8Array");
function arrayBufferToBase64Url(arrayBuffer) {
  return arrayBufferToBase64String(arrayBuffer).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
__name(arrayBufferToBase64Url, "arrayBufferToBase64Url");
function base64UrlToUint8Array(b64url) {
  return base64StringToUint8Array(b64url.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, ""));
}
__name(base64UrlToUint8Array, "base64UrlToUint8Array");
function textToBase64Url(str) {
  const encoder = new TextEncoder();
  const charCodes = encoder.encode(str);
  const binaryStr = String.fromCharCode(...charCodes);
  return btoa(binaryStr).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
__name(textToBase64Url, "textToBase64Url");
function pemToBinary(pem) {
  return base64StringToUint8Array(pem.replace(/-+(BEGIN|END).*/g, "").replace(/\s/g, ""));
}
__name(pemToBinary, "pemToBinary");
async function importTextSecret(key, algorithm, keyUsages) {
  return await crypto.subtle.importKey("raw", textToUint8Array(key), algorithm, true, keyUsages);
}
__name(importTextSecret, "importTextSecret");
async function importJwk(key, algorithm, keyUsages) {
  return await crypto.subtle.importKey("jwk", key, algorithm, true, keyUsages);
}
__name(importJwk, "importJwk");
async function importPublicKey(key, algorithm, keyUsages) {
  return await crypto.subtle.importKey("spki", pemToBinary(key), algorithm, true, keyUsages);
}
__name(importPublicKey, "importPublicKey");
async function importPrivateKey(key, algorithm, keyUsages) {
  return await crypto.subtle.importKey("pkcs8", pemToBinary(key), algorithm, true, keyUsages);
}
__name(importPrivateKey, "importPrivateKey");
async function importKey(key, algorithm, keyUsages) {
  if (typeof key === "object")
    return importJwk(key, algorithm, keyUsages);
  if (typeof key !== "string")
    throw new Error("Unsupported key type!");
  if (key.includes("PUBLIC"))
    return importPublicKey(key, algorithm, keyUsages);
  if (key.includes("PRIVATE"))
    return importPrivateKey(key, algorithm, keyUsages);
  return importTextSecret(key, algorithm, keyUsages);
}
__name(importKey, "importKey");
function decodePayload(raw) {
  const bytes = Array.from(atob(raw), (char) => char.charCodeAt(0));
  const decodedString = new TextDecoder("utf-8").decode(new Uint8Array(bytes));
  return JSON.parse(decodedString);
}
__name(decodePayload, "decodePayload");
if (typeof crypto === "undefined" || !crypto.subtle)
  throw new Error("SubtleCrypto not supported!");
var algorithms = {
  none: { name: "none" },
  ES256: { name: "ECDSA", namedCurve: "P-256", hash: { name: "SHA-256" } },
  ES384: { name: "ECDSA", namedCurve: "P-384", hash: { name: "SHA-384" } },
  ES512: { name: "ECDSA", namedCurve: "P-521", hash: { name: "SHA-512" } },
  HS256: { name: "HMAC", hash: { name: "SHA-256" } },
  HS384: { name: "HMAC", hash: { name: "SHA-384" } },
  HS512: { name: "HMAC", hash: { name: "SHA-512" } },
  RS256: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } },
  RS384: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-384" } },
  RS512: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-512" } }
};
async function sign(payload, secret, options = "HS256") {
  if (typeof options === "string")
    options = { algorithm: options };
  options = { algorithm: "HS256", header: { typ: "JWT", ...options.header ?? {} }, ...options };
  if (!payload || typeof payload !== "object")
    throw new Error("payload must be an object");
  if (options.algorithm !== "none" && (!secret || typeof secret !== "string" && typeof secret !== "object"))
    throw new Error("secret must be a string, a JWK object or a CryptoKey object");
  if (typeof options.algorithm !== "string")
    throw new Error("options.algorithm must be a string");
  const algorithm = algorithms[options.algorithm];
  if (!algorithm)
    throw new Error("algorithm not found");
  if (!payload.iat)
    payload.iat = Math.floor(Date.now() / 1e3);
  const partialToken = `${textToBase64Url(JSON.stringify({ ...options.header, alg: options.algorithm }))}.${textToBase64Url(JSON.stringify(payload))}`;
  if (options.algorithm === "none")
    return partialToken;
  const key = secret instanceof CryptoKey ? secret : await importKey(secret, algorithm, ["sign"]);
  const signature = await crypto.subtle.sign(algorithm, key, textToUint8Array(partialToken));
  return `${partialToken}.${arrayBufferToBase64Url(signature)}`;
}
__name(sign, "sign");
async function verify(token, secret, options = "HS256") {
  if (typeof options === "string")
    options = { algorithm: options };
  options = { algorithm: "HS256", clockTolerance: 0, throwError: false, ...options };
  if (typeof token !== "string")
    throw new Error("token must be a string");
  if (options.algorithm !== "none" && typeof secret !== "string" && typeof secret !== "object")
    throw new Error("secret must be a string, a JWK object or a CryptoKey object");
  if (typeof options.algorithm !== "string")
    throw new Error("options.algorithm must be a string");
  const tokenParts = token.split(".", 3);
  if (tokenParts.length < 2)
    throw new Error("token must consist of 2 or more parts");
  const [tokenHeader, tokenPayload, tokenSignature] = tokenParts;
  const algorithm = algorithms[options.algorithm];
  if (!algorithm)
    throw new Error("algorithm not found");
  const decodedToken = decode(token);
  try {
    if (decodedToken.header?.alg !== options.algorithm)
      throw new Error("INVALID_SIGNATURE");
    if (decodedToken.payload) {
      const now = Math.floor(Date.now() / 1e3);
      if (decodedToken.payload.nbf && decodedToken.payload.nbf > now && decodedToken.payload.nbf - now > (options.clockTolerance ?? 0))
        throw new Error("NOT_YET_VALID");
      if (decodedToken.payload.exp && decodedToken.payload.exp <= now && now - decodedToken.payload.exp > (options.clockTolerance ?? 0))
        throw new Error("EXPIRED");
    }
    if (algorithm.name === "none")
      return decodedToken;
    const key = secret instanceof CryptoKey ? secret : await importKey(secret, algorithm, ["verify"]);
    if (!await crypto.subtle.verify(algorithm, key, base64UrlToUint8Array(tokenSignature), textToUint8Array(`${tokenHeader}.${tokenPayload}`)))
      throw new Error("INVALID_SIGNATURE");
    return decodedToken;
  } catch (err) {
    if (options.throwError)
      throw err;
    return;
  }
}
__name(verify, "verify");
function decode(token) {
  return {
    header: decodePayload(token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/")),
    payload: decodePayload(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
  };
}
__name(decode, "decode");
var index_default = {
  sign,
  verify,
  decode
};

// node_modules/bcryptjs/index.js
import nodeCrypto from "crypto";
var randomFallback = null;
function randomBytes(len) {
  try {
    return crypto.getRandomValues(new Uint8Array(len));
  } catch {
  }
  try {
    return nodeCrypto.randomBytes(len);
  } catch {
  }
  if (!randomFallback) {
    throw Error(
      "Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative"
    );
  }
  return randomFallback(len);
}
__name(randomBytes, "randomBytes");
function setRandomFallback(random) {
  randomFallback = random;
}
__name(setRandomFallback, "setRandomFallback");
function genSaltSync(rounds, seed_length) {
  rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof rounds !== "number")
    throw Error(
      "Illegal arguments: " + typeof rounds + ", " + typeof seed_length
    );
  if (rounds < 4) rounds = 4;
  else if (rounds > 31) rounds = 31;
  var salt = [];
  salt.push("$2b$");
  if (rounds < 10) salt.push("0");
  salt.push(rounds.toString());
  salt.push("$");
  salt.push(base64_encode(randomBytes(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
  return salt.join("");
}
__name(genSaltSync, "genSaltSync");
function genSalt(rounds, seed_length, callback) {
  if (typeof seed_length === "function")
    callback = seed_length, seed_length = void 0;
  if (typeof rounds === "function") callback = rounds, rounds = void 0;
  if (typeof rounds === "undefined") rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
  else if (typeof rounds !== "number")
    throw Error("illegal arguments: " + typeof rounds);
  function _async(callback2) {
    nextTick2(function() {
      try {
        callback2(null, genSaltSync(rounds));
      } catch (err) {
        callback2(err);
      }
    });
  }
  __name(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
__name(genSalt, "genSalt");
function hashSync(password, salt) {
  if (typeof salt === "undefined") salt = GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof salt === "number") salt = genSaltSync(salt);
  if (typeof password !== "string" || typeof salt !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof salt);
  return _hash(password, salt);
}
__name(hashSync, "hashSync");
function hash(password, salt, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password === "string" && typeof salt === "number")
      genSalt(salt, function(err, salt2) {
        _hash(password, salt2, callback2, progressCallback);
      });
    else if (typeof password === "string" && typeof salt === "string")
      _hash(password, salt, callback2, progressCallback);
    else
      nextTick2(
        callback2.bind(
          this,
          Error("Illegal arguments: " + typeof password + ", " + typeof salt)
        )
      );
  }
  __name(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
__name(hash, "hash");
function safeStringCompare(known, unknown) {
  var diff = known.length ^ unknown.length;
  for (var i = 0; i < known.length; ++i) {
    diff |= known.charCodeAt(i) ^ unknown.charCodeAt(i);
  }
  return diff === 0;
}
__name(safeStringCompare, "safeStringCompare");
function compareSync(password, hash2) {
  if (typeof password !== "string" || typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof hash2);
  if (hash2.length !== 60) return false;
  return safeStringCompare(
    hashSync(password, hash2.substring(0, hash2.length - 31)),
    hash2
  );
}
__name(compareSync, "compareSync");
function compare(password, hashValue, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password !== "string" || typeof hashValue !== "string") {
      nextTick2(
        callback2.bind(
          this,
          Error(
            "Illegal arguments: " + typeof password + ", " + typeof hashValue
          )
        )
      );
      return;
    }
    if (hashValue.length !== 60) {
      nextTick2(callback2.bind(this, null, false));
      return;
    }
    hash(
      password,
      hashValue.substring(0, 29),
      function(err, comp) {
        if (err) callback2(err);
        else callback2(null, safeStringCompare(comp, hashValue));
      },
      progressCallback
    );
  }
  __name(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
__name(compare, "compare");
function getRounds(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  return parseInt(hash2.split("$")[2], 10);
}
__name(getRounds, "getRounds");
function getSalt(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  if (hash2.length !== 60)
    throw Error("Illegal hash length: " + hash2.length + " != 60");
  return hash2.substring(0, 29);
}
__name(getSalt, "getSalt");
function truncates(password) {
  if (typeof password !== "string")
    throw Error("Illegal arguments: " + typeof password);
  return utf8Length(password) > 72;
}
__name(truncates, "truncates");
var nextTick2 = typeof setImmediate === "function" ? setImmediate : typeof scheduler === "object" && typeof scheduler.postTask === "function" ? scheduler.postTask.bind(scheduler) : setTimeout;
function utf8Length(string) {
  var len = 0, c = 0;
  for (var i = 0; i < string.length; ++i) {
    c = string.charCodeAt(i);
    if (c < 128) len += 1;
    else if (c < 2048) len += 2;
    else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
      ++i;
      len += 4;
    } else len += 3;
  }
  return len;
}
__name(utf8Length, "utf8Length");
function utf8Array(string) {
  var offset = 0, c1, c2;
  var buffer = new Array(utf8Length(string));
  for (var i = 0, k = string.length; i < k; ++i) {
    c1 = string.charCodeAt(i);
    if (c1 < 128) {
      buffer[offset++] = c1;
    } else if (c1 < 2048) {
      buffer[offset++] = c1 >> 6 | 192;
      buffer[offset++] = c1 & 63 | 128;
    } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
      c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
      ++i;
      buffer[offset++] = c1 >> 18 | 240;
      buffer[offset++] = c1 >> 12 & 63 | 128;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    } else {
      buffer[offset++] = c1 >> 12 | 224;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    }
  }
  return buffer;
}
__name(utf8Array, "utf8Array");
var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
var BASE64_INDEX = [
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  54,
  55,
  56,
  57,
  58,
  59,
  60,
  61,
  62,
  63,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  46,
  47,
  48,
  49,
  50,
  51,
  52,
  53,
  -1,
  -1,
  -1,
  -1,
  -1
];
function base64_encode(b, len) {
  var off2 = 0, rs = [], c1, c2;
  if (len <= 0 || len > b.length) throw Error("Illegal len: " + len);
  while (off2 < len) {
    c1 = b[off2++] & 255;
    rs.push(BASE64_CODE[c1 >> 2 & 63]);
    c1 = (c1 & 3) << 4;
    if (off2 >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off2++] & 255;
    c1 |= c2 >> 4 & 15;
    rs.push(BASE64_CODE[c1 & 63]);
    c1 = (c2 & 15) << 2;
    if (off2 >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off2++] & 255;
    c1 |= c2 >> 6 & 3;
    rs.push(BASE64_CODE[c1 & 63]);
    rs.push(BASE64_CODE[c2 & 63]);
  }
  return rs.join("");
}
__name(base64_encode, "base64_encode");
function base64_decode(s, len) {
  var off2 = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o2, code;
  if (len <= 0) throw Error("Illegal len: " + len);
  while (off2 < slen - 1 && olen < len) {
    code = s.charCodeAt(off2++);
    c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    code = s.charCodeAt(off2++);
    c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c1 == -1 || c2 == -1) break;
    o2 = c1 << 2 >>> 0;
    o2 |= (c2 & 48) >> 4;
    rs.push(String.fromCharCode(o2));
    if (++olen >= len || off2 >= slen) break;
    code = s.charCodeAt(off2++);
    c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c3 == -1) break;
    o2 = (c2 & 15) << 4 >>> 0;
    o2 |= (c3 & 60) >> 2;
    rs.push(String.fromCharCode(o2));
    if (++olen >= len || off2 >= slen) break;
    code = s.charCodeAt(off2++);
    c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    o2 = (c3 & 3) << 6 >>> 0;
    o2 |= c4;
    rs.push(String.fromCharCode(o2));
    ++olen;
  }
  var res = [];
  for (off2 = 0; off2 < olen; off2++) res.push(rs[off2].charCodeAt(0));
  return res;
}
__name(base64_decode, "base64_decode");
var BCRYPT_SALT_LEN = 16;
var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
var BLOWFISH_NUM_ROUNDS = 16;
var MAX_EXECUTION_TIME = 100;
var P_ORIG = [
  608135816,
  2242054355,
  320440878,
  57701188,
  2752067618,
  698298832,
  137296536,
  3964562569,
  1160258022,
  953160567,
  3193202383,
  887688300,
  3232508343,
  3380367581,
  1065670069,
  3041331479,
  2450970073,
  2306472731
];
var S_ORIG = [
  3509652390,
  2564797868,
  805139163,
  3491422135,
  3101798381,
  1780907670,
  3128725573,
  4046225305,
  614570311,
  3012652279,
  134345442,
  2240740374,
  1667834072,
  1901547113,
  2757295779,
  4103290238,
  227898511,
  1921955416,
  1904987480,
  2182433518,
  2069144605,
  3260701109,
  2620446009,
  720527379,
  3318853667,
  677414384,
  3393288472,
  3101374703,
  2390351024,
  1614419982,
  1822297739,
  2954791486,
  3608508353,
  3174124327,
  2024746970,
  1432378464,
  3864339955,
  2857741204,
  1464375394,
  1676153920,
  1439316330,
  715854006,
  3033291828,
  289532110,
  2706671279,
  2087905683,
  3018724369,
  1668267050,
  732546397,
  1947742710,
  3462151702,
  2609353502,
  2950085171,
  1814351708,
  2050118529,
  680887927,
  999245976,
  1800124847,
  3300911131,
  1713906067,
  1641548236,
  4213287313,
  1216130144,
  1575780402,
  4018429277,
  3917837745,
  3693486850,
  3949271944,
  596196993,
  3549867205,
  258830323,
  2213823033,
  772490370,
  2760122372,
  1774776394,
  2652871518,
  566650946,
  4142492826,
  1728879713,
  2882767088,
  1783734482,
  3629395816,
  2517608232,
  2874225571,
  1861159788,
  326777828,
  3124490320,
  2130389656,
  2716951837,
  967770486,
  1724537150,
  2185432712,
  2364442137,
  1164943284,
  2105845187,
  998989502,
  3765401048,
  2244026483,
  1075463327,
  1455516326,
  1322494562,
  910128902,
  469688178,
  1117454909,
  936433444,
  3490320968,
  3675253459,
  1240580251,
  122909385,
  2157517691,
  634681816,
  4142456567,
  3825094682,
  3061402683,
  2540495037,
  79693498,
  3249098678,
  1084186820,
  1583128258,
  426386531,
  1761308591,
  1047286709,
  322548459,
  995290223,
  1845252383,
  2603652396,
  3431023940,
  2942221577,
  3202600964,
  3727903485,
  1712269319,
  422464435,
  3234572375,
  1170764815,
  3523960633,
  3117677531,
  1434042557,
  442511882,
  3600875718,
  1076654713,
  1738483198,
  4213154764,
  2393238008,
  3677496056,
  1014306527,
  4251020053,
  793779912,
  2902807211,
  842905082,
  4246964064,
  1395751752,
  1040244610,
  2656851899,
  3396308128,
  445077038,
  3742853595,
  3577915638,
  679411651,
  2892444358,
  2354009459,
  1767581616,
  3150600392,
  3791627101,
  3102740896,
  284835224,
  4246832056,
  1258075500,
  768725851,
  2589189241,
  3069724005,
  3532540348,
  1274779536,
  3789419226,
  2764799539,
  1660621633,
  3471099624,
  4011903706,
  913787905,
  3497959166,
  737222580,
  2514213453,
  2928710040,
  3937242737,
  1804850592,
  3499020752,
  2949064160,
  2386320175,
  2390070455,
  2415321851,
  4061277028,
  2290661394,
  2416832540,
  1336762016,
  1754252060,
  3520065937,
  3014181293,
  791618072,
  3188594551,
  3933548030,
  2332172193,
  3852520463,
  3043980520,
  413987798,
  3465142937,
  3030929376,
  4245938359,
  2093235073,
  3534596313,
  375366246,
  2157278981,
  2479649556,
  555357303,
  3870105701,
  2008414854,
  3344188149,
  4221384143,
  3956125452,
  2067696032,
  3594591187,
  2921233993,
  2428461,
  544322398,
  577241275,
  1471733935,
  610547355,
  4027169054,
  1432588573,
  1507829418,
  2025931657,
  3646575487,
  545086370,
  48609733,
  2200306550,
  1653985193,
  298326376,
  1316178497,
  3007786442,
  2064951626,
  458293330,
  2589141269,
  3591329599,
  3164325604,
  727753846,
  2179363840,
  146436021,
  1461446943,
  4069977195,
  705550613,
  3059967265,
  3887724982,
  4281599278,
  3313849956,
  1404054877,
  2845806497,
  146425753,
  1854211946,
  1266315497,
  3048417604,
  3681880366,
  3289982499,
  290971e4,
  1235738493,
  2632868024,
  2414719590,
  3970600049,
  1771706367,
  1449415276,
  3266420449,
  422970021,
  1963543593,
  2690192192,
  3826793022,
  1062508698,
  1531092325,
  1804592342,
  2583117782,
  2714934279,
  4024971509,
  1294809318,
  4028980673,
  1289560198,
  2221992742,
  1669523910,
  35572830,
  157838143,
  1052438473,
  1016535060,
  1802137761,
  1753167236,
  1386275462,
  3080475397,
  2857371447,
  1040679964,
  2145300060,
  2390574316,
  1461121720,
  2956646967,
  4031777805,
  4028374788,
  33600511,
  2920084762,
  1018524850,
  629373528,
  3691585981,
  3515945977,
  2091462646,
  2486323059,
  586499841,
  988145025,
  935516892,
  3367335476,
  2599673255,
  2839830854,
  265290510,
  3972581182,
  2759138881,
  3795373465,
  1005194799,
  847297441,
  406762289,
  1314163512,
  1332590856,
  1866599683,
  4127851711,
  750260880,
  613907577,
  1450815602,
  3165620655,
  3734664991,
  3650291728,
  3012275730,
  3704569646,
  1427272223,
  778793252,
  1343938022,
  2676280711,
  2052605720,
  1946737175,
  3164576444,
  3914038668,
  3967478842,
  3682934266,
  1661551462,
  3294938066,
  4011595847,
  840292616,
  3712170807,
  616741398,
  312560963,
  711312465,
  1351876610,
  322626781,
  1910503582,
  271666773,
  2175563734,
  1594956187,
  70604529,
  3617834859,
  1007753275,
  1495573769,
  4069517037,
  2549218298,
  2663038764,
  504708206,
  2263041392,
  3941167025,
  2249088522,
  1514023603,
  1998579484,
  1312622330,
  694541497,
  2582060303,
  2151582166,
  1382467621,
  776784248,
  2618340202,
  3323268794,
  2497899128,
  2784771155,
  503983604,
  4076293799,
  907881277,
  423175695,
  432175456,
  1378068232,
  4145222326,
  3954048622,
  3938656102,
  3820766613,
  2793130115,
  2977904593,
  26017576,
  3274890735,
  3194772133,
  1700274565,
  1756076034,
  4006520079,
  3677328699,
  720338349,
  1533947780,
  354530856,
  688349552,
  3973924725,
  1637815568,
  332179504,
  3949051286,
  53804574,
  2852348879,
  3044236432,
  1282449977,
  3583942155,
  3416972820,
  4006381244,
  1617046695,
  2628476075,
  3002303598,
  1686838959,
  431878346,
  2686675385,
  1700445008,
  1080580658,
  1009431731,
  832498133,
  3223435511,
  2605976345,
  2271191193,
  2516031870,
  1648197032,
  4164389018,
  2548247927,
  300782431,
  375919233,
  238389289,
  3353747414,
  2531188641,
  2019080857,
  1475708069,
  455242339,
  2609103871,
  448939670,
  3451063019,
  1395535956,
  2413381860,
  1841049896,
  1491858159,
  885456874,
  4264095073,
  4001119347,
  1565136089,
  3898914787,
  1108368660,
  540939232,
  1173283510,
  2745871338,
  3681308437,
  4207628240,
  3343053890,
  4016749493,
  1699691293,
  1103962373,
  3625875870,
  2256883143,
  3830138730,
  1031889488,
  3479347698,
  1535977030,
  4236805024,
  3251091107,
  2132092099,
  1774941330,
  1199868427,
  1452454533,
  157007616,
  2904115357,
  342012276,
  595725824,
  1480756522,
  206960106,
  497939518,
  591360097,
  863170706,
  2375253569,
  3596610801,
  1814182875,
  2094937945,
  3421402208,
  1082520231,
  3463918190,
  2785509508,
  435703966,
  3908032597,
  1641649973,
  2842273706,
  3305899714,
  1510255612,
  2148256476,
  2655287854,
  3276092548,
  4258621189,
  236887753,
  3681803219,
  274041037,
  1734335097,
  3815195456,
  3317970021,
  1899903192,
  1026095262,
  4050517792,
  356393447,
  2410691914,
  3873677099,
  3682840055,
  3913112168,
  2491498743,
  4132185628,
  2489919796,
  1091903735,
  1979897079,
  3170134830,
  3567386728,
  3557303409,
  857797738,
  1136121015,
  1342202287,
  507115054,
  2535736646,
  337727348,
  3213592640,
  1301675037,
  2528481711,
  1895095763,
  1721773893,
  3216771564,
  62756741,
  2142006736,
  835421444,
  2531993523,
  1442658625,
  3659876326,
  2882144922,
  676362277,
  1392781812,
  170690266,
  3921047035,
  1759253602,
  3611846912,
  1745797284,
  664899054,
  1329594018,
  3901205900,
  3045908486,
  2062866102,
  2865634940,
  3543621612,
  3464012697,
  1080764994,
  553557557,
  3656615353,
  3996768171,
  991055499,
  499776247,
  1265440854,
  648242737,
  3940784050,
  980351604,
  3713745714,
  1749149687,
  3396870395,
  4211799374,
  3640570775,
  1161844396,
  3125318951,
  1431517754,
  545492359,
  4268468663,
  3499529547,
  1437099964,
  2702547544,
  3433638243,
  2581715763,
  2787789398,
  1060185593,
  1593081372,
  2418618748,
  4260947970,
  69676912,
  2159744348,
  86519011,
  2512459080,
  3838209314,
  1220612927,
  3339683548,
  133810670,
  1090789135,
  1078426020,
  1569222167,
  845107691,
  3583754449,
  4072456591,
  1091646820,
  628848692,
  1613405280,
  3757631651,
  526609435,
  236106946,
  48312990,
  2942717905,
  3402727701,
  1797494240,
  859738849,
  992217954,
  4005476642,
  2243076622,
  3870952857,
  3732016268,
  765654824,
  3490871365,
  2511836413,
  1685915746,
  3888969200,
  1414112111,
  2273134842,
  3281911079,
  4080962846,
  172450625,
  2569994100,
  980381355,
  4109958455,
  2819808352,
  2716589560,
  2568741196,
  3681446669,
  3329971472,
  1835478071,
  660984891,
  3704678404,
  4045999559,
  3422617507,
  3040415634,
  1762651403,
  1719377915,
  3470491036,
  2693910283,
  3642056355,
  3138596744,
  1364962596,
  2073328063,
  1983633131,
  926494387,
  3423689081,
  2150032023,
  4096667949,
  1749200295,
  3328846651,
  309677260,
  2016342300,
  1779581495,
  3079819751,
  111262694,
  1274766160,
  443224088,
  298511866,
  1025883608,
  3806446537,
  1145181785,
  168956806,
  3641502830,
  3584813610,
  1689216846,
  3666258015,
  3200248200,
  1692713982,
  2646376535,
  4042768518,
  1618508792,
  1610833997,
  3523052358,
  4130873264,
  2001055236,
  3610705100,
  2202168115,
  4028541809,
  2961195399,
  1006657119,
  2006996926,
  3186142756,
  1430667929,
  3210227297,
  1314452623,
  4074634658,
  4101304120,
  2273951170,
  1399257539,
  3367210612,
  3027628629,
  1190975929,
  2062231137,
  2333990788,
  2221543033,
  2438960610,
  1181637006,
  548689776,
  2362791313,
  3372408396,
  3104550113,
  3145860560,
  296247880,
  1970579870,
  3078560182,
  3769228297,
  1714227617,
  3291629107,
  3898220290,
  166772364,
  1251581989,
  493813264,
  448347421,
  195405023,
  2709975567,
  677966185,
  3703036547,
  1463355134,
  2715995803,
  1338867538,
  1343315457,
  2802222074,
  2684532164,
  233230375,
  2599980071,
  2000651841,
  3277868038,
  1638401717,
  4028070440,
  3237316320,
  6314154,
  819756386,
  300326615,
  590932579,
  1405279636,
  3267499572,
  3150704214,
  2428286686,
  3959192993,
  3461946742,
  1862657033,
  1266418056,
  963775037,
  2089974820,
  2263052895,
  1917689273,
  448879540,
  3550394620,
  3981727096,
  150775221,
  3627908307,
  1303187396,
  508620638,
  2975983352,
  2726630617,
  1817252668,
  1876281319,
  1457606340,
  908771278,
  3720792119,
  3617206836,
  2455994898,
  1729034894,
  1080033504,
  976866871,
  3556439503,
  2881648439,
  1522871579,
  1555064734,
  1336096578,
  3548522304,
  2579274686,
  3574697629,
  3205460757,
  3593280638,
  3338716283,
  3079412587,
  564236357,
  2993598910,
  1781952180,
  1464380207,
  3163844217,
  3332601554,
  1699332808,
  1393555694,
  1183702653,
  3581086237,
  1288719814,
  691649499,
  2847557200,
  2895455976,
  3193889540,
  2717570544,
  1781354906,
  1676643554,
  2592534050,
  3230253752,
  1126444790,
  2770207658,
  2633158820,
  2210423226,
  2615765581,
  2414155088,
  3127139286,
  673620729,
  2805611233,
  1269405062,
  4015350505,
  3341807571,
  4149409754,
  1057255273,
  2012875353,
  2162469141,
  2276492801,
  2601117357,
  993977747,
  3918593370,
  2654263191,
  753973209,
  36408145,
  2530585658,
  25011837,
  3520020182,
  2088578344,
  530523599,
  2918365339,
  1524020338,
  1518925132,
  3760827505,
  3759777254,
  1202760957,
  3985898139,
  3906192525,
  674977740,
  4174734889,
  2031300136,
  2019492241,
  3983892565,
  4153806404,
  3822280332,
  352677332,
  2297720250,
  60907813,
  90501309,
  3286998549,
  1016092578,
  2535922412,
  2839152426,
  457141659,
  509813237,
  4120667899,
  652014361,
  1966332200,
  2975202805,
  55981186,
  2327461051,
  676427537,
  3255491064,
  2882294119,
  3433927263,
  1307055953,
  942726286,
  933058658,
  2468411793,
  3933900994,
  4215176142,
  1361170020,
  2001714738,
  2830558078,
  3274259782,
  1222529897,
  1679025792,
  2729314320,
  3714953764,
  1770335741,
  151462246,
  3013232138,
  1682292957,
  1483529935,
  471910574,
  1539241949,
  458788160,
  3436315007,
  1807016891,
  3718408830,
  978976581,
  1043663428,
  3165965781,
  1927990952,
  4200891579,
  2372276910,
  3208408903,
  3533431907,
  1412390302,
  2931980059,
  4132332400,
  1947078029,
  3881505623,
  4168226417,
  2941484381,
  1077988104,
  1320477388,
  886195818,
  18198404,
  3786409e3,
  2509781533,
  112762804,
  3463356488,
  1866414978,
  891333506,
  18488651,
  661792760,
  1628790961,
  3885187036,
  3141171499,
  876946877,
  2693282273,
  1372485963,
  791857591,
  2686433993,
  3759982718,
  3167212022,
  3472953795,
  2716379847,
  445679433,
  3561995674,
  3504004811,
  3574258232,
  54117162,
  3331405415,
  2381918588,
  3769707343,
  4154350007,
  1140177722,
  4074052095,
  668550556,
  3214352940,
  367459370,
  261225585,
  2610173221,
  4209349473,
  3468074219,
  3265815641,
  314222801,
  3066103646,
  3808782860,
  282218597,
  3406013506,
  3773591054,
  379116347,
  1285071038,
  846784868,
  2669647154,
  3771962079,
  3550491691,
  2305946142,
  453669953,
  1268987020,
  3317592352,
  3279303384,
  3744833421,
  2610507566,
  3859509063,
  266596637,
  3847019092,
  517658769,
  3462560207,
  3443424879,
  370717030,
  4247526661,
  2224018117,
  4143653529,
  4112773975,
  2788324899,
  2477274417,
  1456262402,
  2901442914,
  1517677493,
  1846949527,
  2295493580,
  3734397586,
  2176403920,
  1280348187,
  1908823572,
  3871786941,
  846861322,
  1172426758,
  3287448474,
  3383383037,
  1655181056,
  3139813346,
  901632758,
  1897031941,
  2986607138,
  3066810236,
  3447102507,
  1393639104,
  373351379,
  950779232,
  625454576,
  3124240540,
  4148612726,
  2007998917,
  544563296,
  2244738638,
  2330496472,
  2058025392,
  1291430526,
  424198748,
  50039436,
  29584100,
  3605783033,
  2429876329,
  2791104160,
  1057563949,
  3255363231,
  3075367218,
  3463963227,
  1469046755,
  985887462
];
var C_ORIG = [
  1332899944,
  1700884034,
  1701343084,
  1684370003,
  1668446532,
  1869963892
];
function _encipher(lr, off2, P, S) {
  var n, l = lr[off2], r2 = lr[off2 + 1];
  l ^= P[0];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[1];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[2];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[3];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[4];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[5];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[6];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[7];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[8];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[9];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[10];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[11];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[12];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[13];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[14];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[15];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[16];
  lr[off2] = r2 ^ P[BLOWFISH_NUM_ROUNDS + 1];
  lr[off2 + 1] = l;
  return lr;
}
__name(_encipher, "_encipher");
function _streamtoword(data, offp) {
  for (var i = 0, word = 0; i < 4; ++i)
    word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
  return { key: word, offp };
}
__name(_streamtoword, "_streamtoword");
function _key(key, P, S) {
  var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
  for (i = 0; i < plen; i += 2)
    lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
__name(_key, "_key");
function _ekskey(data, key, P, S) {
  var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
  offp = 0;
  for (i = 0; i < plen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
__name(_ekskey, "_ekskey");
function _crypt(b, salt, rounds, callback, progressCallback) {
  var cdata = C_ORIG.slice(), clen = cdata.length, err;
  if (rounds < 4 || rounds > 31) {
    err = Error("Illegal number of rounds (4-31): " + rounds);
    if (callback) {
      nextTick2(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.length !== BCRYPT_SALT_LEN) {
    err = Error(
      "Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN
    );
    if (callback) {
      nextTick2(callback.bind(this, err));
      return;
    } else throw err;
  }
  rounds = 1 << rounds >>> 0;
  var P, S, i = 0, j;
  if (typeof Int32Array === "function") {
    P = new Int32Array(P_ORIG);
    S = new Int32Array(S_ORIG);
  } else {
    P = P_ORIG.slice();
    S = S_ORIG.slice();
  }
  _ekskey(salt, b, P, S);
  function next() {
    if (progressCallback) progressCallback(i / rounds);
    if (i < rounds) {
      var start = Date.now();
      for (; i < rounds; ) {
        i = i + 1;
        _key(b, P, S);
        _key(salt, P, S);
        if (Date.now() - start > MAX_EXECUTION_TIME) break;
      }
    } else {
      for (i = 0; i < 64; i++)
        for (j = 0; j < clen >> 1; j++) _encipher(cdata, j << 1, P, S);
      var ret = [];
      for (i = 0; i < clen; i++)
        ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
      if (callback) {
        callback(null, ret);
        return;
      } else return ret;
    }
    if (callback) nextTick2(next);
  }
  __name(next, "next");
  if (typeof callback !== "undefined") {
    next();
  } else {
    var res;
    while (true) if (typeof (res = next()) !== "undefined") return res || [];
  }
}
__name(_crypt, "_crypt");
function _hash(password, salt, callback, progressCallback) {
  var err;
  if (typeof password !== "string" || typeof salt !== "string") {
    err = Error("Invalid string / salt: Not a string");
    if (callback) {
      nextTick2(callback.bind(this, err));
      return;
    } else throw err;
  }
  var minor, offset;
  if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
    err = Error("Invalid salt version: " + salt.substring(0, 2));
    if (callback) {
      nextTick2(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.charAt(2) === "$") minor = String.fromCharCode(0), offset = 3;
  else {
    minor = salt.charAt(2);
    if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
      err = Error("Invalid salt revision: " + salt.substring(2, 4));
      if (callback) {
        nextTick2(callback.bind(this, err));
        return;
      } else throw err;
    }
    offset = 4;
  }
  if (salt.charAt(offset + 2) > "$") {
    err = Error("Missing salt rounds");
    if (callback) {
      nextTick2(callback.bind(this, err));
      return;
    } else throw err;
  }
  var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
  password += minor >= "a" ? "\0" : "";
  var passwordb = utf8Array(password), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
  function finish(bytes) {
    var res = [];
    res.push("$2");
    if (minor >= "a") res.push(minor);
    res.push("$");
    if (rounds < 10) res.push("0");
    res.push(rounds.toString());
    res.push("$");
    res.push(base64_encode(saltb, saltb.length));
    res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
    return res.join("");
  }
  __name(finish, "finish");
  if (typeof callback == "undefined")
    return finish(_crypt(passwordb, saltb, rounds));
  else {
    _crypt(
      passwordb,
      saltb,
      rounds,
      function(err2, bytes) {
        if (err2) callback(err2, null);
        else callback(null, finish(bytes));
      },
      progressCallback
    );
  }
}
__name(_hash, "_hash");
function encodeBase64(bytes, length) {
  return base64_encode(bytes, length);
}
__name(encodeBase64, "encodeBase64");
function decodeBase64(string, length) {
  return base64_decode(string, length);
}
__name(decodeBase64, "decodeBase64");
var bcryptjs_default = {
  setRandomFallback,
  genSaltSync,
  genSalt,
  hashSync,
  hash,
  compareSync,
  compare,
  getRounds,
  getSalt,
  truncates,
  encodeBase64,
  decodeBase64
};

// api/auth/simple-core.js
var TOKEN_EXPIRY = "24h";
var json = /* @__PURE__ */ __name((data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json" }
}), "json");
var error3 = /* @__PURE__ */ __name((msg, status = 400) => new Response(JSON.stringify({ error: { message: msg } }), {
  status,
  headers: { "Content-Type": "application/json" }
}), "error");
var AuthCore = class {
  static {
    __name(this, "AuthCore");
  }
  static async signup(request, env2) {
    try {
      const { email, password, name } = await request.json();
      if (!email || !password || !name) {
        return error3("Email, password, and name are required.");
      }
      const existing = await env2.DB.prepare(
        "SELECT id FROM users WHERE email = ?"
      ).bind(email).first();
      if (existing) {
        return error3("User already exists.");
      }
      const hashedPassword = await bcryptjs_default.hash(password, 10);
      const userId = crypto.randomUUID();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await env2.DB.prepare(
        "INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(userId, email, hashedPassword, name, "owner", now, now).run();
      const token = await index_default.sign(
        { sub: userId, email, role: "owner" },
        env2.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );
      return json({
        user: { id: userId, email, name, role: "owner" },
        token
      });
    } catch (e) {
      console.error("Signup Error:", e);
      return error3("Signup failed: " + e.message, 500);
    }
  }
  static async login(request, env2) {
    try {
      const { email, password } = await request.json();
      if (!email || !password) {
        return error3("Email and password are required.");
      }
      const user = await env2.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
      if (!user || !await bcryptjs_default.compare(password, user.password_hash)) {
        return error3("Invalid credentials.", 401);
      }
      const token = await index_default.sign(
        { sub: user.id, email: user.email, role: user.role },
        env2.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );
      console.log(`User logged in: ${user.email}`);
      return json({
        user: {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role
        },
        token
      });
    } catch (e) {
      console.error("Login Error:", e);
      return error3("Login failed", 500);
    }
  }
  static async me(request, env2) {
    try {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return error3("Unauthorized", 401);
      }
      const token = authHeader.split(" ")[1];
      const isValid = await index_default.verify(token, env2.JWT_SECRET);
      if (!isValid) {
        return error3("Invalid token", 401);
      }
      const { payload } = index_default.decode(token);
      const user = await env2.DB.prepare(
        "SELECT id, email, full_name, role FROM users WHERE id = ?"
      ).bind(payload.sub).first();
      if (!user) {
        return error3("User not found", 404);
      }
      return json({
        user: {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role
        }
      });
    } catch (e) {
      console.error("Me Error:", e);
      return error3("Session invalid", 401);
    }
  }
};

// api/_auth.js
import crypto3 from "crypto";

// api/_token-management.js
import crypto2 from "crypto";
var TokenManager = class {
  static {
    __name(this, "TokenManager");
  }
  constructor(env2) {
    this.env = env2;
  }
  // Hash token for secure storage and comparison
  hashToken(token) {
    return crypto2.createHash("sha256").update(token).digest("hex");
  }
  // Check if token is revoked
  async isTokenRevoked(token, tokenType = "access") {
    try {
      const tokenHash = this.hashToken(token);
      const { results } = await this.env.DB.prepare(
        `
        SELECT revoked_at, reason, expires_at 
        FROM revoked_tokens 
        WHERE token_hash = ? AND token_type = ?
      `
      ).bind(tokenHash, tokenType).all();
      if (results && results.length > 0) {
        const revocation = results[0];
        if (new Date(revocation.expires_at) < /* @__PURE__ */ new Date()) {
          await this.cleanupExpiredRevocation(tokenHash, tokenType);
          return false;
        }
        return {
          revoked: true,
          reason: revocation.reason,
          revokedAt: revocation.revoked_at
        };
      }
      return { revoked: false };
    } catch (error4) {
      console.error("Error checking token revocation:", error4);
      return { revoked: false, error: "Unable to verify token status" };
    }
  }
  // Revoke a token with full audit trail
  async revokeToken(token, userId, reason, tokenType = "access", initiatedBy = null, requestContext = {}) {
    try {
      const tokenHash = this.hashToken(token);
      let expiresAt = /* @__PURE__ */ new Date();
      try {
        const base64Payload = token.split(".")[1];
        if (base64Payload) {
          const payload = JSON.parse(
            Buffer.from(base64Payload, "base64").toString()
          );
          if (payload.exp) {
            expiresAt = new Date(payload.exp * 1e3);
          }
        }
      } catch (jwtError) {
        console.warn("Could not extract expiration from token:", jwtError);
        expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
      }
      const existing = await this.env.DB.prepare(
        `
        SELECT id FROM revoked_tokens WHERE token_hash = ? AND token_type = ?
      `
      ).bind(tokenHash, tokenType).all();
      if (existing.results && existing.results.length > 0) {
        return {
          success: false,
          message: "Token is already revoked"
        };
      }
      const revocationId = `rev_${Date.now()}_${crypto2.randomUUID().replace(/-/g, "")}`;
      await this.env.DB.prepare(
        `
        INSERT INTO revoked_tokens (
          id, token_hash, user_id, token_type, reason, revoked_by, 
          ip_address, user_agent, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).bind(
        revocationId,
        tokenHash,
        userId,
        tokenType,
        reason,
        initiatedBy,
        requestContext.ipAddress || "unknown",
        requestContext.userAgent || "unknown",
        expiresAt.toISOString()
      ).run();
      await this.logSecurityEvent("token_revocation", userId, requestContext, {
        tokenType,
        reason,
        initiatedBy,
        expiresAt: expiresAt.toISOString()
      });
      console.log(
        `Token revoked: ${tokenType} token for user ${userId}, reason: ${reason}`
      );
      return {
        success: true,
        revocationId,
        expiresAt: expiresAt.toISOString()
      };
    } catch (error4) {
      console.error("Error revoking token:", error4);
      return {
        success: false,
        error: "Failed to revoke token"
      };
    }
  }
  // Batch revoke tokens (e.g., for password change)
  async revokeUserTokens(userId, reason, tokenTypes = ["access", "refresh"], initiatedBy = null, requestContext = {}) {
    const results = {
      success: true,
      revoked: [],
      failed: []
    };
    for (const tokenType of tokenTypes) {
      try {
        await this.logSecurityEvent(
          "bulk_token_revocation",
          userId,
          requestContext,
          {
            reason,
            tokenType,
            initiatedBy,
            batchOperation: true
          }
        );
        results.revoked.push(tokenType);
      } catch (error4) {
        console.error(`Failed to revoke ${tokenType} tokens:`, error4);
        results.failed.push(tokenType);
      }
    }
    if (results.failed.length > 0) {
      results.success = false;
    }
    return results;
  }
  // Clean up expired revocation records
  async cleanupExpiredRevocations() {
    try {
      const { changes } = await this.env.DB.prepare(
        `
        DELETE FROM revoked_tokens 
        WHERE expires_at < datetime('now')
      `
      ).run();
      console.log(`Cleaned up ${changes} expired token revocations`);
      return changes;
    } catch (error4) {
      console.error("Error cleaning up expired revocations:", error4);
      return 0;
    }
  }
  // Login attempt tracking with security analysis
  async trackLoginAttempt(email, ipAddress, userAgent, success, failureReason = null) {
    try {
      const attemptId = `attempt_${Date.now()}_${crypto2.randomUUID().replace(/-/g, "")}`;
      const anonymizedEmail = email ? this.hashToken(email.toLowerCase()) : null;
      await this.env.DB.prepare(
        `
        INSERT INTO login_attempts (
          id, email, ip_address, user_agent, attempt_type, success, failure_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).bind(
        attemptId,
        anonymizedEmail,
        ipAddress,
        userAgent,
        "login",
        success,
        failureReason
      ).run();
      await this.analyzeLoginAttempts(ipAddress, userAgent);
      return { success: true, attemptId };
    } catch (error4) {
      console.error("Error tracking login attempt:", error4);
      return { success: false, error: "Failed to track login attempt" };
    }
  }
  // Analyze login attempts for security threats
  async analyzeLoginAttempts(ipAddress, userAgent) {
    try {
      const windowStart = new Date(Date.now() - 15 * 60 * 1e3);
      const { results: recentFailures } = await this.env.DB.prepare(
        `
        SELECT COUNT(*) as failure_count
        FROM login_attempts 
        WHERE ip_address = ? 
          AND success = FALSE 
          AND attempted_at > ?
      `
      ).bind(ipAddress, windowStart.toISOString()).all();
      const failureCount = recentFailures[0]?.failure_count || 0;
      if (failureCount >= 5) {
        await this.logSecurityEvent(
          "multiple_login_failures",
          null,
          { ipAddress, userAgent },
          {
            failureCount,
            timeWindow: "15 minutes",
            severity: failureCount >= 10 ? "high" : "medium"
          }
        );
        const blockUntil = new Date(Date.now() + 30 * 60 * 1e3);
        await this.env.DB.prepare(
          `
          UPDATE login_attempts 
          SET blocked_until = ? 
          WHERE ip_address = ? 
            AND blocked_until IS NULL
            AND attempted_at > ?
        `
        ).bind(blockUntil.toISOString(), ipAddress, windowStart.toISOString()).run();
      }
      if (this.isSuspiciousUserAgent(userAgent)) {
        await this.logSecurityEvent(
          "suspicious_user_agent",
          null,
          { ipAddress, userAgent },
          {
            reason: "Unusual user agent pattern detected"
          }
        );
      }
    } catch (error4) {
      console.error("Error analyzing login attempts:", error4);
    }
  }
  // Check if IP is temporarily blocked
  async isIPBlocked(ipAddress) {
    try {
      const { results } = await this.env.DB.prepare(
        `
        SELECT MAX(blocked_until) as max_blocked_until
        FROM login_attempts 
        WHERE ip_address = ? 
          AND blocked_until IS NOT NULL
          AND blocked_until > datetime('now')
      `
      ).bind(ipAddress).all();
      const blockedUntil = results[0]?.max_blocked_until;
      if (blockedUntil && new Date(blockedUntil) > /* @__PURE__ */ new Date()) {
        return {
          blocked: true,
          blockedUntil
        };
      }
      return { blocked: false };
    } catch (error4) {
      console.error("Error checking IP block status:", error4);
      return { blocked: false, error: "Unable to verify block status" };
    }
  }
  // Log security events for monitoring
  async logSecurityEvent(eventType, userId, requestContext, eventData = {}) {
    try {
      const eventId = `event_${Date.now()}_${crypto2.randomUUID().replace(/-/g, "")}`;
      let severity = "low";
      if (eventType.includes("breach") || eventType.includes("escalation")) {
        severity = "critical";
      } else if (eventType.includes("multiple") || eventType.includes("suspicious")) {
        severity = "high";
      } else if (eventType.includes("failure")) {
        severity = "medium";
      }
      await this.env.DB.prepare(
        `
        INSERT INTO security_events (
          id, user_id, event_type, ip_address,
          user_agent, success, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).bind(
        eventId,
        userId,
        eventType,
        requestContext.ipAddress || "unknown",
        requestContext.userAgent || "unknown",
        severity === "low" ? 1 : 0,
        // success: 1 for low severity, 0 for others
        JSON.stringify({ severity, ...eventData })
      ).run();
      console.log(`SECURITY EVENT [${severity.toUpperCase()}]: ${eventType}`, {
        userId,
        ipAddress: requestContext.ipAddress,
        eventData
      });
      return { success: true, eventId };
    } catch (error4) {
      console.error("Error logging security event:", error4);
      return { success: false, error: "Failed to log security event" };
    }
  }
  // Get security statistics for monitoring dashboard
  async getSecurityStats(timeRange = "24h") {
    try {
      const timeCondition = this.getTimeCondition(timeRange);
      const [recentRevocations, activeBlocks, securityEvents, loginStats] = await Promise.all([
        // Recent token revocations
        this.env.DB.prepare(
          `
          SELECT COUNT(*) as count 
          FROM revoked_tokens 
          WHERE revoked_at > ${timeCondition}
        `
        ).all(),
        // Active IP blocks
        this.env.DB.prepare(
          `
          SELECT COUNT(DISTINCT ip_address) as count 
          FROM login_attempts 
          WHERE blocked_until > datetime('now')
        `
        ).all(),
        // Security events by severity
        this.env.DB.prepare(
          `
          SELECT severity, COUNT(*) as count 
          FROM security_events 
          WHERE detected_at > ${timeCondition}
          GROUP BY severity
        `
        ).all(),
        // Login statistics
        this.env.DB.prepare(
          `
          SELECT 
            SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_logins,
            SUM(CASE WHEN success THEN 0 ELSE 1 END) as failed_logins,
            COUNT(DISTINCT ip_address) as unique_ips
          FROM login_attempts 
          WHERE attempted_at > ${timeCondition}
        `
        ).all()
      ]);
      return {
        timeRange,
        tokenRevocations: recentRevocations[0]?.count || 0,
        activeIPBlocks: activeBlocks[0]?.count || 0,
        securityEvents: securityEvents.reduce((acc, event) => {
          acc[event.severity] = event.count;
          return acc;
        }, {}),
        loginStats: loginStats[0] || {
          successful_logins: 0,
          failed_logins: 0,
          unique_ips: 0
        }
      };
    } catch (error4) {
      console.error("Error getting security stats:", error4);
      return {
        error: "Failed to retrieve security statistics",
        timeRange,
        tokenRevocations: 0,
        activeIPBlocks: 0,
        securityEvents: {},
        loginStats: { successful_logins: 0, failed_logins: 0, unique_ips: 0 }
      };
    }
  }
  // Helper: Generate time condition for database queries
  getTimeCondition(timeRange) {
    const now = /* @__PURE__ */ new Date();
    let interval;
    switch (timeRange) {
      case "1h":
        interval = 1;
        break;
      case "24h":
        interval = 24;
        break;
      case "7d":
        interval = 24 * 7;
        break;
      case "30d":
        interval = 24 * 30;
        break;
      default:
        interval = 24;
    }
    const startTime = new Date(now.getTime() - interval * 60 * 60 * 1e3);
    return `datetime('${startTime.toISOString()}')`;
  }
  // Helper: Detect suspicious user agents
  isSuspiciousUserAgent(userAgent) {
    if (!userAgent) return true;
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /curl/i,
      /wget/i,
      /python/i,
      /scrapy/i
    ];
    return suspiciousPatterns.some((pattern) => pattern.test(userAgent)) || userAgent.length < 10 || userAgent.includes("undefined") || userAgent.includes("null");
  }
  // Cleanup old security data
  async performSecurityCleanup() {
    const results = {
      expiredRevocations: 0,
      oldLoginAttempts: 0,
      resolvedSecurityEvents: 0,
      totalCleaned: 0
    };
    try {
      const expiredResult = await this.cleanupExpiredRevocations();
      results.expiredRevocations = expiredResult;
      const { changes: loginChanges } = await this.env.DB.prepare(
        `
        DELETE FROM login_attempts 
        WHERE attempted_at < datetime('now', '-30 days')
      `
      ).run();
      results.oldLoginAttempts = loginChanges;
      const { changes: eventChanges } = await this.env.DB.prepare(
        `
        DELETE FROM security_events 
        WHERE resolved_at IS NOT NULL 
          AND resolved_at < datetime('now', '-90 days')
      `
      ).run();
      results.resolvedSecurityEvents = eventChanges;
      results.totalCleaned = results.expiredRevocations + results.oldLoginAttempts + results.resolvedSecurityEvents;
      console.log("Security cleanup completed:", results);
      return results;
    } catch (error4) {
      console.error("Error during security cleanup:", error4);
      return results;
    }
  }
};

// api/_auth.js
var DEV_SECRET = "local_dev_secret_key_change_in_prod";
var SimpleAuth = class {
  static {
    __name(this, "SimpleAuth");
  }
  constructor(env2) {
    this.env = env2;
    this.jwtSecret = DEV_SECRET;
    this.tokenManager = new TokenManager(env2);
  }
  // Password hashing (keep bcrypt for security)
  async hashPassword(password) {
    const saltRounds = 12;
    return bcryptjs_default.hash(password, saltRounds);
  }
  async verifyPassword(password, hash2) {
    return bcryptjs_default.compare(password, hash2);
  }
  // Simplified JWT tokens
  async generateAccessToken(userId, email) {
    return index_default.sign(
      {
        userId,
        email,
        type: "access",
        iat: Math.floor(Date.now() / 1e3),
        exp: Math.floor(Date.now() / 1e3) + 60 * 60
        // 1 hour
      },
      this.jwtSecret
    );
  }
  async generateRefreshToken(userId, email) {
    return index_default.sign(
      {
        userId,
        email,
        type: "refresh",
        iat: Math.floor(Date.now() / 1e3),
        exp: Math.floor(Date.now() / 1e3) + 30 * 24 * 60 * 60
        // 30 days
      },
      this.jwtSecret
    );
  }
  // Simplified token verification with revocation check
  async verifyToken(token) {
    try {
      const isValid = await index_default.verify(token, this.jwtSecret);
      if (!isValid) return null;
      const { payload } = index_default.decode(token);
      const revocationStatus = await this.tokenManager.isTokenRevoked(token);
      if (revocationStatus.revoked) {
        return null;
      }
      if (payload.sub && !payload.userId) {
        payload.userId = payload.sub;
      }
      return payload;
    } catch (error4) {
      console.error("Token verification failed:", error4);
      return null;
    }
  }
  // Token revocation using TokenManager
  async revokeToken(token, userId, reason = "logout") {
    return await this.tokenManager.revokeToken(token, userId, reason);
  }
  // Simplified login attempt tracking
  async trackLoginAttempt(email, ipAddress, success, failureReason = null) {
    try {
      const emailHash = crypto3.createHash("sha256").update(email.toLowerCase()).digest("hex");
      const attemptId = crypto3.randomUUID();
      await this.env.DB.prepare(
        `
        INSERT INTO login_attempts (id, email_hash, ip_address, success, failure_reason)
        VALUES (?, ?, ?, ?, ?)
      `
      ).bind(attemptId, emailHash, ipAddress, success ? 1 : 0, failureReason).run();
      return true;
    } catch (error4) {
      console.error("Error tracking login attempt:", error4);
      return false;
    }
  }
  // Basic rate limiting check
  async isRateLimited(ipAddress) {
    try {
      const windowStart = new Date(Date.now() - 15 * 60 * 1e3);
      const { results } = await this.env.DB.prepare(
        `
        SELECT COUNT(*) as attempts FROM login_attempts
        WHERE ip_address = ? AND success = 0 AND attempted_at > ?
      `
      ).bind(ipAddress, windowStart.toISOString()).all();
      const failedAttempts = results[0]?.attempts || 0;
      return failedAttempts >= 5;
    } catch (error4) {
      console.error("Error checking rate limit:", error4);
      return false;
    }
  }
  // Extract bearer token from Authorization header
  extractToken(request) {
    try {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader) return null;
      const [scheme, token] = authHeader.split(" ");
      if (!token || scheme?.toLowerCase() !== "bearer") {
        return null;
      }
      return token.trim();
    } catch (error4) {
      console.error("Error extracting token:", error4);
      return null;
    }
  }
  // Get user from token
  async getUserFromToken(request) {
    try {
      const token = this.extractToken(request);
      if (!token) {
        return null;
      }
      const payload = await this.verifyToken(token);
      if (!payload) return null;
      const { results } = await this.env.DB.prepare(
        "SELECT id, email, name, created_at FROM users WHERE id = ?"
      ).bind(payload.userId).all();
      return results && results.length > 0 ? results[0] : null;
    } catch (error4) {
      console.error("Auth validation error:", error4);
      return null;
    }
  }
  // Get client IP
  getClientIP(request) {
    return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || request.headers.get("X-Real-IP") || "unknown";
  }
  // Verify whether a user has access to a farm (owner or member)
  async hasFarmAccess(userId, farmId) {
    if (!userId || !farmId) {
      return false;
    }
    try {
      const { results } = await this.env.DB.prepare(
        `
        SELECT 1 FROM farms WHERE id = ? AND owner_id = ?
        UNION
        SELECT 1 FROM farm_members WHERE farm_id = ? AND user_id = ?
        LIMIT 1
      `
      ).bind(farmId, userId, farmId, userId).all();
      return Array.isArray(results) && results.length > 0;
    } catch (error4) {
      console.error("Error checking farm access:", error4);
      return false;
    }
  }
  // Grant farm access to a user via farm_members entry when needed
  async grantFarmAccess(farmId, userId, role = "member") {
    if (!farmId || !userId) {
      return false;
    }
    try {
      const ownerCheck = await this.env.DB.prepare(
        `SELECT 1 FROM farms WHERE id = ? AND owner_id = ? LIMIT 1`
      ).bind(farmId, userId).all();
      if (ownerCheck.results?.length) {
        return true;
      }
      const memberCheck = await this.env.DB.prepare(
        `SELECT 1 FROM farm_members WHERE farm_id = ? AND user_id = ? LIMIT 1`
      ).bind(farmId, userId).all();
      if (memberCheck.results?.length) {
        return true;
      }
      await this.env.DB.prepare(
        `INSERT INTO farm_members (farm_id, user_id, role)
         VALUES (?, ?, ?)`
      ).bind(farmId, userId, role || "member").run();
      return true;
    } catch (error4) {
      if (error4?.message?.includes("UNIQUE")) {
        return true;
      }
      console.error("Error granting farm access:", error4);
      return false;
    }
  }
  // Simple audit logging (critical events only)
  async logAuditEvent(userId, action, resourceType = null, resourceId = null, ipAddress = null, success = true) {
    try {
      await this.env.DB.prepare(
        `
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, success)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      ).bind(
        userId,
        action,
        resourceType,
        resourceId,
        ipAddress,
        success ? 1 : 0
      ).run();
    } catch (error4) {
      console.error("Error logging audit event:", error4);
    }
  }
};
function createErrorResponse(message, status = 400, extraHeaders = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}
__name(createErrorResponse, "createErrorResponse");
function createSuccessResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}
__name(createSuccessResponse, "createSuccessResponse");
function createUnauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" }
  });
}
__name(createUnauthorizedResponse, "createUnauthorizedResponse");
var AuthUtils = SimpleAuth;

// api/_logger.js
var AuditLogger = class {
  static {
    __name(this, "AuditLogger");
  }
  constructor(env2) {
    this.env = env2;
    this.auditLogTable = "audit_logs";
  }
  // Standard logging methods expected by DatabaseOperations
  error(message, context2 = {}) {
    const logEntry = {
      id: this.generateLogId(),
      event_type: "error",
      user_id: context2.userId || null,
      email: null,
      ip_address: context2.ip || "unknown",
      user_agent: context2.userAgent || "unknown",
      metadata: JSON.stringify({ message, ...context2 }),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (this.env.ENVIRONMENT === "development") {
      console.error(`[DB ERROR] ${message}`, context2);
    }
    this.storeAuditLog(logEntry);
  }
  warn(message, context2 = {}) {
    const logEntry = {
      id: this.generateLogId(),
      event_type: "warning",
      user_id: context2.userId || null,
      email: null,
      ip_address: context2.ip || "unknown",
      user_agent: context2.userAgent || "unknown",
      metadata: JSON.stringify({ message, ...context2 }),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (this.env.ENVIRONMENT === "development") {
      console.warn(`[DB WARN] ${message}`, context2);
    }
    this.storeAuditLog(logEntry);
  }
  info(message, context2 = {}) {
    const logEntry = {
      id: this.generateLogId(),
      event_type: "info",
      user_id: context2.userId || null,
      email: null,
      ip_address: context2.ip || "unknown",
      user_agent: context2.userAgent || "unknown",
      metadata: JSON.stringify({ message, ...context2 }),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (this.env.ENVIRONMENT === "development") {
      console.info(`[DB INFO] ${message}`, context2);
    }
    this.storeAuditLog(logEntry);
  }
  logDatabase(operation, table3, duration, success, context2 = {}) {
    const logEntry = {
      id: this.generateLogId(),
      event_type: "database_operation",
      user_id: context2.userId || null,
      email: null,
      ip_address: context2.ip || "unknown",
      user_agent: context2.userAgent || "unknown",
      metadata: JSON.stringify({
        operation,
        table: table3,
        duration,
        success,
        ...context2
      }),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (this.env.ENVIRONMENT === "development") {
      const status = success ? "SUCCESS" : "FAILED";
      console.log(
        `[DB ${status}] ${operation} on ${table3} (${duration}ms)`,
        context2
      );
    }
    this.storeAuditLog(logEntry);
  }
  security(message, context2 = {}) {
    const logEntry = {
      id: this.generateLogId(),
      event_type: "security",
      user_id: context2.userId || null,
      email: null,
      ip_address: context2.ip || "unknown",
      user_agent: context2.userAgent || "unknown",
      metadata: JSON.stringify({ message, ...context2 }),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (this.env.ENVIRONMENT === "development") {
      console.warn(`[SECURITY] ${message}`, context2);
    }
    this.storeAuditLog(logEntry);
  }
  // Store audit log entry (non-blocking)
  async storeAuditLog(logEntry) {
    if (!this.env || !this.env.DB) {
      if (this.env && this.env.ENVIRONMENT === "development") {
        console.log(`[AUDIT LOG] ${logEntry.event_type}: ${logEntry.metadata}`);
      }
      return;
    }
    try {
      await this.env.DB.prepare(
        `
        INSERT INTO ${this.auditLogTable}
        (id, event_type, user_id, email, ip_address, user_agent, metadata, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).bind(
        logEntry.id,
        logEntry.event_type,
        logEntry.user_id,
        logEntry.email,
        logEntry.ip_address,
        logEntry.user_agent,
        logEntry.metadata,
        logEntry.timestamp
      ).run();
    } catch (error4) {
      if (this.env.ENVIRONMENT === "development") {
        console.error("Audit log failed:", error4);
      }
    }
  }
  // Log authentication events
  async logAuthEvent(eventType, userId, email, ip, userAgent, metadata = {}) {
    const logEntry = {
      id: this.generateLogId(),
      event_type: eventType,
      user_id: userId || null,
      email: email || null,
      ip_address: ip,
      user_agent: userAgent,
      metadata: JSON.stringify(metadata),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      await this.env.DB.prepare(
        `
        INSERT INTO ${this.auditLogTable}
        (id, event_type, user_id, email, ip_address, user_agent, metadata, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).bind(
        logEntry.id,
        logEntry.event_type,
        logEntry.user_id,
        logEntry.email,
        logEntry.ip_address,
        logEntry.user_agent,
        logEntry.metadata,
        logEntry.timestamp
      ).run();
    } catch (error4) {
      if (this.env.ENVIRONMENT === "development") {
        console.error("Audit log failed:", error4);
      }
    }
  }
  // Log security events
  async logSecurityEvent(eventType, details, ip, userAgent) {
    await this.logAuthEvent("security", null, null, ip, userAgent, {
      event_type: eventType,
      ...details
    });
  }
  // Log data access events
  async logDataAccess(resource, action, userId, resourceId, ip) {
    await this.logAuthEvent("data_access", userId, null, ip, null, {
      resource,
      action,
      resource_id: resourceId
    });
  }
  // Generate unique log ID
  generateLogId() {
    return `audit_${Date.now()}_${crypto.randomUUID()}`;
  }
  // Get recent audit logs for a user
  async getUserAuditLogs(userId, limit = 100) {
    try {
      const { results } = await this.env.DB.prepare(
        `
        SELECT * FROM ${this.auditLogTable}
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `
      ).bind(userId, limit).all();
      return results || [];
    } catch (error4) {
      return [];
    }
  }
  // Get security events for monitoring
  async getSecurityEvents(hours = 24) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1e3).toISOString();
      const { results } = await this.env.DB.prepare(
        `
        SELECT * FROM ${this.auditLogTable}
        WHERE event_type = 'security'
        AND timestamp > ?
        ORDER BY timestamp DESC
      `
      ).bind(since).all();
      return results || [];
    } catch (error4) {
      return [];
    }
  }
};
function createAuditLogger(env2) {
  return new AuditLogger(env2);
}
__name(createAuditLogger, "createAuditLogger");

// api/_errors.js
var DatabaseError = class extends Error {
  static {
    __name(this, "DatabaseError");
  }
  constructor(message, code, details = {}) {
    super(message);
    this.name = "DatabaseError";
    this.code = code;
    this.details = details;
    this.timestamp = (/* @__PURE__ */ new Date()).toISOString();
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
};

// api/_database.js
var logger = createAuditLogger({
  // This build-time env var is fine, but runtime checks are fixed inside the class
  ENVIRONMENT: "development"
});
var DB_ERROR_CODES = {
  UNKNOWN: "UNKNOWN_ERROR",
  NOT_FOUND: "RECORD_NOT_FOUND",
  DEPENDENCY: "DEPENDENCY_VIOLATION",
  TRANSACTION: "TRANSACTION_ERROR",
  INVALID_TABLE: "INVALID_TABLE",
  INVALID_COLUMNS: "INVALID_COLUMNS",
  INVALID_JOIN: "INVALID_JOIN",
  INVALID_GROUP_BY: "INVALID_GROUP_BY",
  INVALID_HAVING: "INVALID_HAVING",
  INVALID_ORDER_BY: "INVALID_ORDER_BY",
  INVALID_PARAMETER: "INVALID_PARAMETER",
  QUERY_TIMEOUT: "QUERY_TIMEOUT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY"
};
var ALLOWED_TABLES = [
  "users",
  "farms",
  "farm_members",
  "farm_statistics",
  "farm_operations",
  "animals",
  "animal_health_records",
  "animal_production",
  "animal_breeding",
  "animal_feeding_records",
  "animal_events",
  "animal_movements",
  "locations",
  "fields",
  "crops",
  "tasks",
  "finance_entries",
  "inventory",
  "equipment",
  "weather_data",
  "notifications",
  "audit_logs"
];
var CONFIG = {
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 1e3,
  DEFAULT_RETRIES: 3,
  INITIAL_RETRY_DELAY: 100,
  MAX_RETRY_DELAY: 2e3,
  DEFAULT_QUERY_TIMEOUT: 3e4,
  // 30 seconds
  RATE_LIMIT_WINDOW: 6e4,
  // 1 minute
  RATE_LIMIT_MAX_QUERIES: 100,
  LOG_QUERIES_IN_PRODUCTION: false
};
var VALID_OPERATORS = [
  "=",
  "!=",
  ">",
  "<",
  ">=",
  "<=",
  "LIKE",
  "IN",
  "NOT IN"
];
var DatabaseOperations = class {
  static {
    __name(this, "DatabaseOperations");
  }
  constructor(env2, options = {}) {
    this.env = env2;
    this.logger = logger;
    this.config = { ...CONFIG, ...options };
    this.isProduction = (this.env.ENVIRONMENT || "development") === "production";
    this.rateLimitStore = /* @__PURE__ */ new Map();
    this.metrics = {
      totalQueries: 0,
      failedQueries: 0,
      avgQueryTime: 0,
      slowQueries: []
    };
    this.hardcodedDependencies = {
      farms: [
        { table: "farm_members", column: "farm_id" },
        { table: "farm_statistics", column: "farm_id" },
        { table: "farm_operations", column: "farm_id" },
        { table: "animals", column: "farm_id" },
        { table: "locations", column: "farm_id" },
        { table: "fields", column: "farm_id" },
        { table: "finance_entries", column: "farm_id" },
        { table: "tasks", column: "farm_id" },
        { table: "inventory", column: "farm_id" },
        { table: "equipment", column: "farm_id" }
      ],
      animals: [
        { table: "animal_health_records", column: "animal_id" },
        { table: "animal_production", column: "animal_id" },
        { table: "animal_breeding", column: "animal_id" },
        { table: "animal_feeding_records", column: "animal_id" },
        { table: "animal_events", column: "animal_id" },
        { table: "animal_movements", column: "animal_id" }
      ],
      locations: [
        { table: "animals", column: "current_location_id" },
        { table: "animal_movements", column: "source_location_id" },
        { table: "animal_movements", column: "destination_location_id" }
      ],
      fields: [{ table: "crops", column: "field_id" }],
      users: [
        { table: "farms", column: "owner_id" },
        { table: "farm_members", column: "user_id" },
        { table: "tasks", column: "assigned_to" },
        { table: "animal_movements", column: "recorded_by" },
        { table: "audit_logs", column: "user_id" }
      ]
    };
  }
  // ============================================================================
  // CORE QUERY EXECUTION
  // ============================================================================
  /**
   * Execute a database query with enhanced error handling, monitoring, and security
   * @param {string} query - SQL query with placeholders
   * @param {Array} params - Parameters to bind
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Query result
   */
  async executeQuery(query, params = [], options = {}) {
    const startTime = Date.now();
    const {
      operation = "query",
      // 'query' (all), 'run', 'first', 'raw'
      table: table3 = "unknown",
      context: context2 = {},
      retries = this.config.DEFAULT_RETRIES,
      timeout = this.config.DEFAULT_QUERY_TIMEOUT,
      userId = null,
      skipRateLimit = false
    } = options;
    if (!skipRateLimit && userId) {
      await this.checkRateLimit(userId);
    }
    this.validateQueryStructure(query);
    const sanitizedParams = this.sanitizeParams(params);
    let lastError;
    let attempt = 0;
    while (attempt < retries) {
      attempt++;
      try {
        const statement = this.env.DB.prepare(query);
        const result = await this.executeWithTimeout(
          statement.bind(...sanitizedParams),
          operation,
          // 'run', 'all', 'first', 'raw'
          timeout
        );
        const duration = Date.now() - startTime;
        this.updateMetrics(operation, table3, duration, true);
        if (this.shouldLogQuery(duration)) {
          this.logger.logDatabase(operation, table3, duration, true, {
            attempt,
            query: this.sanitizeQueryForLogging(query),
            context: context2
          });
        }
        if (duration > 1e3) {
          this.trackSlowQuery(query, duration, table3, operation);
        }
        return {
          success: true,
          data: operation === "run" ? [] : operation === "first" ? result || null : operation === "raw" ? result : result.results || [],
          changes: result && result.changes || 0,
          lastRowId: result && result.meta?.last_row_id || null,
          duration,
          operation,
          table: table3
        };
      } catch (error4) {
        lastError = error4;
        const duration = Date.now() - startTime;
        this.updateMetrics(operation, table3, duration, false);
        this.logger.error("Database operation failed", {
          attempt,
          operation,
          table: table3,
          query: this.sanitizeQueryForLogging(query),
          error: this.sanitizeError(error4),
          context: context2
        });
        if (attempt < retries && this.isRetryableError(error4)) {
          const delay = Math.min(
            this.config.INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1),
            this.config.MAX_RETRY_DELAY
          );
          await this.delay(delay);
          continue;
        }
        break;
      }
    }
    this.logger.error("Database operation failed after all retries", {
      operation,
      table: table3,
      query: this.sanitizeQueryForLogging(query),
      error: this.sanitizeError(lastError),
      attempts: attempt,
      context: context2
    });
    throw new DatabaseError(
      "Database operation failed",
      lastError.code || DB_ERROR_CODES.UNKNOWN,
      {
        operation,
        table: table3,
        query: this.sanitizeQueryForLogging(query),
        originalError: lastError.message,
        attempts: attempt
      }
    );
  }
  /**
   * Execute statement with timeout protection
   * @private
   * @param {D1PreparedStatement} statement - The bound D1 statement
   * @param {string} method - 'run', 'all', 'first', or 'raw'
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<any>}
   */
  async executeWithTimeout(statement, method, timeoutMs) {
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(
        () => reject(
          new DatabaseError(
            "Query timeout exceeded",
            DB_ERROR_CODES.QUERY_TIMEOUT,
            { timeout: timeoutMs }
          )
        ),
        timeoutMs
      )
    );
    let resultPromise;
    switch (method) {
      case "run":
        resultPromise = statement.run();
        break;
      case "first":
        resultPromise = statement.first();
        break;
      case "raw":
        resultPromise = statement.raw();
        break;
      case "all":
      case "query":
      // Keep 'query' for backward compatibility
      default:
        resultPromise = statement.all();
    }
    const result = await Promise.race([resultPromise, timeoutPromise]);
    return result;
  }
  /**
   * Execute multiple database operations in an atomic D1 transaction (batch)
   * @param {Array} operations - Array of {query, params, operation, table}
   * @param {Object} options - Transaction options
   * @returns {Promise<Object>} Transaction result
   */
  async executeTransaction(operations, options = {}) {
    const startTime = Date.now();
    const transactionId = this.generateTransactionId();
    const { context: context2 = {}, userId = null } = options;
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new DatabaseError(
        "Transaction requires at least one operation",
        DB_ERROR_CODES.TRANSACTION,
        { transactionId }
      );
    }
    if (operations.length > 100) {
      throw new DatabaseError(
        "Transaction too large (max 100 operations)",
        DB_ERROR_CODES.TRANSACTION,
        { transactionId, operationCount: operations.length }
      );
    }
    this.logger.info("Starting atomic database transaction (D1 batch)", {
      transactionId,
      operations: operations.length,
      userId
    });
    try {
      const statements = operations.map((op, index) => {
        this.validateQueryStructure(op.query);
        const sanitizedParams = this.sanitizeParams(op.params || []);
        return this.env.DB.prepare(op.query).bind(...sanitizedParams);
      });
      const results = await this.env.DB.batch(statements);
      const duration = Date.now() - startTime;
      this.updateMetrics("transaction", "multi-table", duration, true);
      this.logger.logDatabase("transaction", "multi-table", duration, true, {
        transactionId,
        operations: operations.length,
        context: context2
      });
      const formattedResults = results.map((result, index) => ({
        success: true,
        data: result.results || [],
        changes: result.changes || 0,
        lastRowId: result.meta?.last_row_id || null,
        operation: operations[index]?.operation || null,
        table: operations[index]?.table || null
      }));
      return {
        success: true,
        results: formattedResults,
        duration,
        transactionId
      };
    } catch (error4) {
      const duration = Date.now() - startTime;
      this.updateMetrics("transaction", "multi-table", duration, false);
      this.logger.error("Atomic database transaction failed", {
        transactionId,
        operations: operations.length,
        error: this.sanitizeError(error4),
        context: context2
      });
      throw new DatabaseError(
        "Atomic transaction failed - all operations rolled back",
        error4.code || DB_ERROR_CODES.TRANSACTION,
        {
          transactionId,
          operations: operations.length,
          originalError: error4.message
        }
      );
    }
  }
  // ============================================================================
  // CRUD OPERATIONS WITH SECURITY VALIDATION
  // ============================================================================
  /**
   * Find a record by ID
   * @param {string} table - Table name (must be whitelisted)
   * @param {string|number} id - Record ID
   * @param {string} columns - Columns to select (optional)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query result
   */
  async findById(table3, id, columns = "*", options = {}) {
    this.validateTable(table3);
    const query = `SELECT ${columns} FROM ${table3} WHERE id = ? LIMIT 1`;
    const result = await this.executeQuery(query, [id], {
      operation: "first",
      table: table3,
      context: { findById: true, recordId: id, ...options.context },
      ...options
    });
    return result.data;
  }
  /**
   * Find multiple records with filtering and pagination
   * @param {string} table - Table name (must be whitelisted)
   * @param {Object} filters - Filter conditions
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query result
   */
  async findMany(table3, filters = {}, options = {}) {
    this.validateTable(table3);
    const {
      columns = "*",
      orderBy = "created_at",
      orderDirection = "DESC",
      limit = this.config.DEFAULT_LIMIT,
      offset = 0,
      userId = null,
      skipRateLimit = false
    } = options;
    let query = `SELECT ${columns} FROM ${table3} WHERE 1=1`;
    const params = [];
    for (const [key, value] of Object.entries(filters)) {
      if (value !== null && value !== void 0) {
        if (typeof value === "object" && value.operator && value.value !== void 0) {
          const operator = VALID_OPERATORS.includes(
            value.operator.toUpperCase()
          ) ? value.operator.toUpperCase() : "=";
          query += ` AND ${key} ${operator} ?`;
          params.push(value.value);
        } else {
          query += ` AND ${key} = ?`;
          params.push(value);
        }
      }
    }
    query += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(Math.min(limit, this.config.MAX_LIMIT), offset);
    const result = await this.executeQuery(query, params, {
      operation: "query",
      table: table3,
      userId,
      skipRateLimit,
      context: { findMany: true, filters, options }
    });
    return result.data;
  }
  /**
   * Count records with optional filtering
   * @param {string} table - Table name (must be whitelisted)
   * @param {Object} filters - Filter conditions
   * @param {Object} options - Query options
   * @returns {Promise<number>} Count result
   */
  async count(table3, filters = {}, options = {}) {
    this.validateTable(table3);
    const { userId = null, skipRateLimit = false } = options;
    let query = `SELECT COUNT(*) as count FROM ${table3} WHERE 1=1`;
    const params = [];
    for (const [key, value] of Object.entries(filters)) {
      if (value !== null && value !== void 0) {
        if (typeof value === "object" && value.operator && value.value !== void 0) {
          const operator = VALID_OPERATORS.includes(
            value.operator.toUpperCase()
          ) ? value.operator.toUpperCase() : "=";
          query += ` AND ${key} ${operator} ?`;
          params.push(value.value);
        } else {
          query += ` AND ${key} = ?`;
          params.push(value);
        }
      }
    }
    const result = await this.executeQuery(query, params, {
      operation: "first",
      table: table3,
      userId,
      skipRateLimit,
      context: { count: true, filters }
    });
    return result.data?.count || 0;
  }
  /**
   * Create a new record
   * @param {string} table - Table name (must be whitelisted)
   * @param {Object} data - Record data
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Created record result
   */
  async create(table3, data, options = {}) {
    this.validateTable(table3);
    const { userId = null, skipRateLimit = false, auditLog = true } = options;
    const validatedData = this.validateRecordData(data);
    const columns = Object.keys(validatedData);
    const placeholders = columns.map(() => "?").join(", ");
    const values = Object.values(validatedData);
    const query = `INSERT INTO ${table3} (${columns.join(
      ", "
    )}) VALUES (${placeholders})`;
    const result = await this.executeQuery(query, values, {
      operation: "run",
      table: table3,
      userId,
      skipRateLimit,
      context: { create: true, data: validatedData, auditLog }
    });
    if (result.lastRowId) {
      return await this.findById(table3, result.lastRowId, "*", {
        userId,
        skipRateLimit
      });
    }
    return { id: result.lastRowId, ...validatedData };
  }
  /**
   * Update a record by ID
   * @param {string} table - Table name (must be whitelisted)
   * @param {string|number} id - Record ID
   * @param {Object} data - Update data
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Updated record result
   */
  async updateById(table3, id, data, options = {}) {
    this.validateTable(table3);
    const { userId = null, skipRateLimit = false, auditLog = true } = options;
    const validatedData = this.validateRecordData(data);
    if (Object.keys(validatedData).length === 0) {
      throw new DatabaseError(
        "No valid fields to update",
        DB_ERROR_CODES.INVALID_PARAMETER
      );
    }
    const setClause = Object.keys(validatedData).map((key) => `${key} = ?`).join(", ");
    const values = [...Object.values(validatedData), id];
    const query = `UPDATE ${table3} SET ${setClause} WHERE id = ?`;
    const result = await this.executeQuery(query, values, {
      operation: "run",
      table: table3,
      userId,
      skipRateLimit,
      context: {
        updateById: true,
        recordId: id,
        data: validatedData,
        auditLog
      }
    });
    return await this.findById(table3, id, "*", { userId, skipRateLimit });
  }
  /**
   * Delete a record by ID
   * @param {string} table - Table name (must be whitelisted)
   * @param {string|number} id - Record ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Deletion result
   */
  async deleteById(table3, id, options = {}) {
    this.validateTable(table3);
    const { userId = null, skipRateLimit = false, auditLog = true } = options;
    await this.checkDependencies(table3, id);
    const query = `DELETE FROM ${table3} WHERE id = ?`;
    const result = await this.executeQuery(query, [id], {
      operation: "run",
      table: table3,
      userId,
      skipRateLimit,
      context: { deleteById: true, recordId: id, auditLog }
    });
    return { success: true, changes: result.changes };
  }
  /**
   * Check dependencies for a record before deletion
   * @param {string} table - Table name
   * @param {string|number} id - Record ID
   * @returns {Promise<void>}
   */
  async checkDependencies(table3, id) {
    const dependencies = this.hardcodedDependencies[table3] || [];
    for (const dep of dependencies) {
      const count3 = await this.count(dep.table, { [dep.column]: id });
      if (count3 > 0) {
        throw new DatabaseError(
          `Cannot delete ${table3} record: ${count3} dependent ${dep.table} records exist`,
          DB_ERROR_CODES.DEPENDENCY,
          { table: table3, id, dependency: dep, count: count3 }
        );
      }
    }
  }
  // ============================================================================
  // SECURITY AND VALIDATION METHODS
  // ============================================================================
  /**
   * Validate table name against whitelist
   * @private
   * @param {string} table - Table name to validate
   */
  validateTable(table3) {
    if (!ALLOWED_TABLES.includes(table3)) {
      throw new DatabaseError(
        `Table '${table3}' is not allowed`,
        DB_ERROR_CODES.INVALID_TABLE,
        { table: table3, allowedTables: ALLOWED_TABLES }
      );
    }
  }
  /**
   * Validate query structure for security
   * @private
   * @param {string} query - SQL query to validate
   */
  validateQueryStructure(query) {
    if (!query || typeof query !== "string") {
      throw new DatabaseError(
        "Invalid query",
        DB_ERROR_CODES.INVALID_PARAMETER
      );
    }
    const dangerousPatterns = [
      /(\bUNION\b|\bDROP\b|\bALTER\b|\bCREATE\b|\bTRUNCATE\b)/i,
      /(-{2}|\/\*|\*\/)/,
      // Comments
      /;\s*(SELECT|INSERT|UPDATE|DELETE)/i
      // Multiple statements
    ];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        this.logger.security("Suspicious query pattern detected", {
          query: this.sanitizeQueryForLogging(query),
          pattern: pattern.toString()
        });
        throw new DatabaseError(
          "Query contains suspicious patterns",
          DB_ERROR_CODES.SUSPICIOUS_ACTIVITY,
          { query: this.sanitizeQueryForLogging(query) }
        );
      }
    }
  }
  /**
   * Sanitize parameters for safe binding
   * @private
   * @param {Array} params - Parameters to sanitize
   * @returns {Array} Sanitized parameters
   */
  sanitizeParams(params) {
    if (!Array.isArray(params)) {
      throw new DatabaseError(
        "Parameters must be an array",
        DB_ERROR_CODES.INVALID_PARAMETER
      );
    }
    return params.map((param) => {
      if (param === null || param === void 0) {
        return null;
      }
      if (typeof param === "string") {
        if (param.length > 1e4) {
          throw new DatabaseError(
            "Parameter too long",
            DB_ERROR_CODES.INVALID_PARAMETER
          );
        }
        return param;
      }
      if (typeof param === "number") {
        if (!isFinite(param)) {
          throw new DatabaseError(
            "Invalid number parameter",
            DB_ERROR_CODES.INVALID_PARAMETER
          );
        }
        return param;
      }
      if (typeof param === "boolean") {
        return param ? 1 : 0;
      }
      if (typeof param === "object") {
        try {
          const jsonStr = JSON.stringify(param);
          if (jsonStr.length > 5e4) {
            throw new DatabaseError(
              "Parameter object too large",
              DB_ERROR_CODES.INVALID_PARAMETER
            );
          }
          return jsonStr;
        } catch (error4) {
          throw new DatabaseError(
            "Invalid parameter object",
            DB_ERROR_CODES.INVALID_PARAMETER
          );
        }
      }
      throw new DatabaseError(
        `Unsupported parameter type: ${typeof param}`,
        DB_ERROR_CODES.INVALID_PARAMETER
      );
    });
  }
  /**
   * Validate record data for create/update operations
   * @private
   * @param {Object} data - Data to validate
   * @returns {Object} Validated data
   */
  validateRecordData(data) {
    if (!data || typeof data !== "object") {
      throw new DatabaseError(
        "Invalid data object",
        DB_ERROR_CODES.INVALID_PARAMETER
      );
    }
    const validated = {};
    for (const [key, value] of Object.entries(data)) {
      if (["id", "created_at", "updated_at"].includes(key)) {
        continue;
      }
      if (value === void 0) {
        continue;
      }
      if (typeof value === "string" && value.length > 1e4) {
        throw new DatabaseError(
          `Field '${key}' value too long`,
          DB_ERROR_CODES.INVALID_PARAMETER
        );
      }
      validated[key] = value;
    }
    return validated;
  }
  // ============================================================================
  // RATE LIMITING METHODS
  // ============================================================================
  /**
   * Check rate limit for user
   * @private
   * @param {string} userId - User ID
   */
  async checkRateLimit(userId) {
    if (!userId) return;
    const now = Date.now();
    const windowStart = now - this.config.RATE_LIMIT_WINDOW;
    const userRequests = this.rateLimitStore.get(userId) || [];
    const recentRequests = userRequests.filter((time3) => time3 > windowStart);
    if (recentRequests.length >= this.config.RATE_LIMIT_MAX_QUERIES) {
      throw new DatabaseError(
        "Rate limit exceeded",
        DB_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        {
          userId,
          requestCount: recentRequests.length,
          limit: this.config.RATE_LIMIT_MAX_QUERIES,
          windowMs: this.config.RATE_LIMIT_WINDOW
        }
      );
    }
    recentRequests.push(now);
    this.rateLimitStore.set(userId, recentRequests);
    if (Math.random() < 0.01) {
      this.cleanupRateLimitStore();
    }
  }
  /**
   * Clean up old rate limit entries
   * @private
   */
  cleanupRateLimitStore() {
    const now = Date.now();
    const windowStart = now - this.config.RATE_LIMIT_WINDOW;
    for (const [userId, requests] of this.rateLimitStore.entries()) {
      const recentRequests = requests.filter((time3) => time3 > windowStart);
      if (recentRequests.length === 0) {
        this.rateLimitStore.delete(userId);
      } else {
        this.rateLimitStore.set(userId, recentRequests);
      }
    }
  }
  // ============================================================================
  // PERFORMANCE MONITORING METHODS
  // ============================================================================
  /**
   * Update performance metrics
   * @private
   * @param {string} operation - Operation type
   * @param {string} table - Table name
   * @param {number} duration - Query duration in ms
   * @param {boolean} success - Whether operation succeeded
   */
  updateMetrics(operation, table3, duration, success) {
    this.metrics.totalQueries++;
    if (!success) {
      this.metrics.failedQueries++;
    }
    const totalTime = this.metrics.avgQueryTime * (this.metrics.totalQueries - 1) + duration;
    this.metrics.avgQueryTime = totalTime / this.metrics.totalQueries;
  }
  /**
   * Check if query should be logged
   * @private
   * @param {number} duration - Query duration in ms
   * @returns {boolean}
   */
  shouldLogQuery(duration) {
    return !this.isProduction || duration > 1e3;
  }
  /**
   * Track slow query
   * @private
   * @param {string} query - SQL query
   * @param {number} duration - Query duration in ms
   * @param {string} table - Table name
   * @param {string} operation - Operation type
   */
  trackSlowQuery(query, duration, table3, operation) {
    this.metrics.slowQueries.push({
      query: this.sanitizeQueryForLogging(query),
      duration,
      table: table3,
      operation,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (this.metrics.slowQueries.length > 100) {
      this.metrics.slowQueries.shift();
    }
    this.logger.warn("Slow query detected", {
      duration,
      table: table3,
      operation,
      query: this.sanitizeQueryForLogging(query)
    });
  }
  // ============================================================================
  // ERROR HANDLING METHODS
  // ============================================================================
  /**
   * Check if error is retryable
   * @private
   * @param {Error} error - Error to check
   * @returns {boolean}
   */
  isRetryableError(error4) {
    const retryableCodes = ["SQLITE_BUSY", "SQLITE_LOCKED", "ETIMEDOUT"];
    return retryableCodes.includes(error4.code) || error4.message?.includes("timeout");
  }
  /**
   * Sanitize query for logging (remove sensitive data)
   * @private
   * @param {string} query - Query to sanitize
   * @returns {string}
   */
  sanitizeQueryForLogging(query) {
    if (!query) return "";
    let sanitized = query.replace(
      /\b(password|token|secret|key)\s*=\s*['"][^'"]*['"]/gi,
      "$1=***"
    );
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500) + "...";
    }
    return sanitized;
  }
  /**
   * Sanitize error for logging
   * @private
   * @param {Error} error - Error to sanitize
   * @returns {Object}
   */
  sanitizeError(error4) {
    if (!error4) return {};
    return {
      code: error4.code,
      message: error4.message?.substring(0, 200),
      // Limit message length
      // Don't include stack trace in production logs
      stack: this.isProduction ? void 0 : error4.stack?.split("\n").slice(0, 3)
    };
  }
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  /**
   * Generate unique transaction ID
   * @private
   * @returns {string}
   */
  generateTransactionId() {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Delay execution for retry logic
   * @private
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Get performance metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.metrics = {
      totalQueries: 0,
      failedQueries: 0,
      avgQueryTime: 0,
      slowQueries: []
    };
  }
};
var BaseRepository = class {
  static {
    __name(this, "BaseRepository");
  }
  constructor(dbOperations, tableName) {
    this.db = dbOperations;
    this.tableName = tableName;
  }
  /**
   * Find by ID
   */
  async findById(id, options = {}) {
    return await this.db.findById(this.tableName, id, options.columns, options);
  }
  /**
   * Find multiple records
   */
  async findMany(filters = {}, options = {}) {
    return await this.db.findMany(this.tableName, filters, options);
  }
  /**
   * Count records
   */
  async count(filters = {}, options = {}) {
    return await this.db.count(this.tableName, filters, options);
  }
  /**
   * Create new record
   */
  async create(data, options = {}) {
    return await this.db.create(this.tableName, data, options);
  }
  /**
   * Update by ID
   */
  async updateById(id, data, options = {}) {
    return await this.db.updateById(this.tableName, id, data, options);
  }
  /**
   * Delete by ID
   */
  async deleteById(id, options = {}) {
    return await this.db.deleteById(this.tableName, id, options);
  }
};
var FarmRepository = class extends BaseRepository {
  static {
    __name(this, "FarmRepository");
  }
  constructor(dbOperations) {
    super(dbOperations, "farms");
  }
  /**
   * Get farms owned by a user
   */
  async findByOwner(ownerId, options = {}) {
    const { results } = await this.db.executeQuery(
      `
      SELECT
        f.*,
        COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
        COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count,
        COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = f.id AND t.status != 'completed'), 0) as pending_tasks
      FROM farms f
      WHERE f.owner_id = ?
      ORDER BY f.created_at DESC
      ${options.limit ? `LIMIT ${options.limit}` : ""}
    `,
      [ownerId],
      {
        operation: "query",
        table: "farms",
        context: { findByOwner: true, ownerId, ...options.context }
      }
    );
    return results;
  }
  /**
   * Get farm with statistics
   */
  async findWithStats(farmId, options = {}) {
    const { userId } = options;
    const { results } = await this.db.executeQuery(
      `
      SELECT
        f.*,
        COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
        COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count,
        COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = f.id AND t.status != 'completed'), 0) as pending_tasks
      FROM farms f
      JOIN farm_members fm ON f.id = fm.farm_id
      WHERE f.id = ? AND fm.user_id = ?
    `,
      [farmId, userId],
      {
        operation: "first",
        table: "farms",
        context: { findWithStats: true, farmId, userId }
      }
    );
    return results;
  }
  /**
   * Create farm with initial setup
   */
  async create(data, options = {}) {
    const { userId } = options;
    const newFarm = await super.create(
      {
        ...data,
        owner_id: userId
      },
      options
    );
    await this.db.executeQuery(
      "INSERT INTO farm_members (farm_id, user_id, role) VALUES (?, ?, ?)",
      [newFarm.id, userId, "owner"],
      {
        operation: "run",
        table: "farm_members",
        context: { grantOwnerAccess: true }
      }
    );
    await this.db.executeQuery(
      "INSERT INTO farm_statistics (farm_id, report_date) VALUES (?, ?)",
      [newFarm.id, (/* @__PURE__ */ new Date()).toISOString().split("T")[0]],
      {
        operation: "run",
        table: "farm_statistics",
        context: { createInitialStats: true }
      }
    );
    return newFarm;
  }
};

// api/farms.js
var ALLOWED_FARM_TYPES = ["organic", "conventional", "sustainable", "mixed"];
var ALLOWED_CERTIFICATION_STATUS = [
  "certified",
  "in_progress",
  "pending",
  "none"
];
var ALLOWED_ENVIRONMENTAL_COMPLIANCE = [
  "compliant",
  "in_progress",
  "non_compliant"
];
var ValidationUtils = {
  // Comprehensive numeric validation
  validateNumeric(value, name, min = 0, max = Number.MAX_SAFE_INTEGER) {
    if (value === null || value === void 0) return null;
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) {
      throw new Error(`Invalid ${name}: must be a valid number`);
    }
    if (num < min || num > max) {
      throw new Error(`Invalid ${name}: must be between ${min} and ${max}`);
    }
    return num;
  },
  // Date validation
  validateDate(dateString, name) {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid ${name}: must be a valid date`);
    }
    const now = /* @__PURE__ */ new Date();
    const minDate = new Date(now.getFullYear() - 50, 0, 1);
    const maxDate = new Date(now.getFullYear() + 10, 11, 31);
    if (date < minDate || date > maxDate) {
      throw new Error(
        `Invalid ${name}: date must be between ${minDate.toISOString().split("T")[0]} and ${maxDate.toISOString().split("T")[0]}`
      );
    }
    return date.toISOString().split("T")[0];
  },
  // String validation with length limits and sanitization
  validateString(value, name, minLength = 0, maxLength = 1e3) {
    if (!value || typeof value !== "string") {
      throw new Error(`Invalid ${name}: must be a non-empty string`);
    }
    const trimmed = value.trim();
    if (trimmed.length < minLength || trimmed.length > maxLength) {
      throw new Error(
        `Invalid ${name}: length must be between ${minLength} and ${maxLength}`
      );
    }
    return trimmed.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
  },
  // Enum validation
  validateEnum(value, name, allowedValues) {
    if (value === null || value === void 0) return null;
    if (!allowedValues.includes(value)) {
      throw new Error(
        `Invalid ${name}: must be one of [${allowedValues.join(", ")}]`
      );
    }
    return value;
  },
  // Comprehensive farm data validation
  validateFarmData(data) {
    const validated = {};
    validated.name = this.validateString(data.name, "name", 1, 255);
    validated.location = this.validateString(data.location, "location", 1, 255);
    if (data.area_hectares !== void 0) {
      validated.area_hectares = this.validateNumeric(
        data.area_hectares,
        "area_hectares",
        0,
        1e5
      );
    }
    if (data.farm_type !== void 0) {
      validated.farm_type = this.validateEnum(
        data.farm_type,
        "farm_type",
        ALLOWED_FARM_TYPES
      );
    }
    if (data.certification_status !== void 0) {
      validated.certification_status = this.validateEnum(
        data.certification_status,
        "certification_status",
        ALLOWED_CERTIFICATION_STATUS
      );
    }
    if (data.environmental_compliance !== void 0) {
      validated.environmental_compliance = this.validateEnum(
        data.environmental_compliance,
        "environmental_compliance",
        ALLOWED_ENVIRONMENTAL_COMPLIANCE
      );
    }
    if (data.total_acres !== void 0) {
      validated.total_acres = this.validateNumeric(
        data.total_acres,
        "total_acres",
        0,
        247e3
      );
    }
    if (data.operational_start_date !== void 0) {
      validated.operational_start_date = this.validateDate(
        data.operational_start_date,
        "operational_start_date"
      );
    }
    if (data.management_structure !== void 0) {
      validated.management_structure = this.validateString(
        data.management_structure,
        "management_structure",
        0,
        1e3
      );
    }
    if (data.seasonal_staff !== void 0) {
      validated.seasonal_staff = this.validateNumeric(
        data.seasonal_staff,
        "seasonal_staff",
        0,
        1e4
      );
    }
    if (data.annual_budget !== void 0) {
      validated.annual_budget = this.validateNumeric(
        data.annual_budget,
        "annual_budget",
        0,
        1e9
      );
    }
    return validated;
  }
};
async function onRequest(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth = new AuthUtils(env2);
    const db = new DatabaseOperations(env2);
    const farmRepo = new FarmRepository(db);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      return await handleGetFarms(request, url, user, auth, farmRepo);
    } else if (method === "POST") {
      return await handleCreateFarm(request, user, auth, farmRepo);
    } else if (method === "PUT") {
      return await handleUpdateFarm(request, user, auth, farmRepo);
    } else if (method === "DELETE") {
      return await handleDeleteFarm(request, url, user, auth, farmRepo);
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error4) {
    console.error("Farms API error:", error4);
    return createErrorResponse("Internal server error", 500);
  }
}
__name(onRequest, "onRequest");
async function handleGetFarms(request, url, user, auth, farmRepo) {
  const farmId = url.searchParams.get("id");
  const stats = url.searchParams.get("stats");
  const operations = url.searchParams.get("operations");
  const analytics = url.searchParams.get("analytics");
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") || "50"))
  );
  const offset = (page - 1) * limit;
  try {
    if (farmId) {
      if (!await auth.hasFarmAccess(user.id, farmId)) {
        return createErrorResponse("Access denied", 403);
      }
      const farm = await farmRepo.findWithStats(farmId, { userId: user.id });
      if (!farm) {
        return createErrorResponse("Farm not found", 404);
      }
      if (stats === "true") {
        const statistics = await farmRepo.db.findMany(
          "farm_statistics",
          { farm_id: farmId },
          {
            orderBy: "report_date",
            orderDirection: "DESC",
            limit: 12,
            userId: user.id
          }
        );
        farm.statistics = statistics;
      }
      if (operations === "true") {
        const operations2 = await farmRepo.db.findMany(
          "farm_operations",
          { farm_id: farmId },
          {
            orderBy: "operation_date",
            orderDirection: "DESC",
            limit: 50,
            userId: user.id
          }
        );
        farm.operations = operations2;
      }
      return createSuccessResponse(farm);
    } else if (analytics === "true") {
      const farms = await farmRepo.findByOwner(user.id, {
        orderBy: "created_at",
        orderDirection: "DESC",
        limit,
        offset,
        userId: user.id
      });
      const farmsWithAnalytics = await Promise.all(
        farms.map(async (farm) => {
          const [animalCount, fieldCount, taskCount] = await Promise.all([
            farmRepo.db.count(
              "animals",
              { farm_id: farm.id },
              { userId: user.id }
            ),
            farmRepo.db.count(
              "fields",
              { farm_id: farm.id },
              { userId: user.id }
            ),
            farmRepo.db.count(
              "tasks",
              {
                farm_id: farm.id,
                status: { operator: "!=", value: "completed" }
              },
              { userId: user.id }
            )
          ]);
          return {
            ...farm,
            animal_count: animalCount,
            field_count: fieldCount,
            pending_tasks: taskCount
          };
        })
      );
      return createSuccessResponse(farmsWithAnalytics);
    } else {
      const farms = await farmRepo.findByOwner(user.id, {
        orderBy: "created_at",
        orderDirection: "DESC",
        limit,
        offset,
        userId: user.id
      });
      return createSuccessResponse(farms || []);
    }
  } catch (error4) {
    console.error("Error in handleGetFarms:", error4);
    return createErrorResponse("Database error", 500);
  }
}
__name(handleGetFarms, "handleGetFarms");
async function handleCreateFarm(request, user, auth, farmRepo) {
  const body = await request.json();
  let validatedData;
  try {
    validatedData = ValidationUtils.validateFarmData(body);
  } catch (error4) {
    return createErrorResponse(`Validation error: ${error4.message}`, 400);
  }
  try {
    const newFarm = await farmRepo.create(
      {
        ...validatedData,
        owner_id: user.id
      },
      { userId: user.id }
    );
    await auth.grantFarmAccess(newFarm.id, user.id, "owner");
    await farmRepo.db.create(
      "farm_statistics",
      {
        farm_id: newFarm.id,
        report_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      },
      { userId: user.id, auditLog: false }
    );
    return createSuccessResponse(newFarm);
  } catch (error4) {
    console.error("Error in handleCreateFarm:", error4);
    return createErrorResponse("Failed to create farm", 500);
  }
}
__name(handleCreateFarm, "handleCreateFarm");
async function handleUpdateFarm(request, user, auth, farmRepo) {
  const body = await request.json();
  const { id: farmId, ...updateData } = body;
  if (!farmId) {
    return createErrorResponse("Farm ID required", 400);
  }
  if (!await auth.hasFarmAccess(user.id, farmId)) {
    return createErrorResponse("Access denied", 403);
  }
  let validatedData;
  try {
    validatedData = ValidationUtils.validateFarmData(updateData);
  } catch (error4) {
    return createErrorResponse(`Validation error: ${error4.message}`, 400);
  }
  if (Object.keys(validatedData).length === 0) {
    return createErrorResponse("No fields to update", 400);
  }
  try {
    const result = await farmRepo.updateById(farmId, validatedData, {
      userId: user.id
    });
    const updatedFarm = await farmRepo.findWithStats(farmId, {
      userId: user.id
    });
    return createSuccessResponse(updatedFarm);
  } catch (error4) {
    console.error("Error in handleUpdateFarm:", error4);
    return createErrorResponse("Failed to update farm", 500);
  }
}
__name(handleUpdateFarm, "handleUpdateFarm");
async function handleDeleteFarm(request, url, user, auth, farmRepo) {
  const farmId = url.searchParams.get("id");
  if (!farmId) {
    return createErrorResponse("Farm ID required", 400);
  }
  if (!await auth.hasFarmAccess(user.id, farmId)) {
    return createErrorResponse("Access denied", 403);
  }
  try {
    const dependencies = await farmRepo.db.checkDependencies("farms", farmId);
    const hasDependencies = Object.entries(dependencies).some(
      ([table3, count3]) => {
        if (count3 === -1) return false;
        return count3 > 0;
      }
    );
    if (hasDependencies) {
      return createErrorResponse(
        "Cannot delete farm with existing data. Please archive instead.",
        400
      );
    }
    await farmRepo.deleteById(farmId, { userId: user.id });
    return createSuccessResponse({ success: true });
  } catch (error4) {
    console.error("Error in handleDeleteFarm:", error4);
    return createErrorResponse("Failed to delete farm", 500);
  }
}
__name(handleDeleteFarm, "handleDeleteFarm");

// api/_repositories.js
var BaseRepository2 = class {
  static {
    __name(this, "BaseRepository");
  }
  constructor(dbOperations, table3) {
    if (!dbOperations || !table3) {
      throw new Error(
        "DatabaseOperations instance and table name are required."
      );
    }
    this.db = dbOperations;
    this.table = table3;
  }
  /**
   * Find a record by its ID.
   */
  async findById(id, options = {}) {
    return await this.db.findById(this.table, id, "*", options);
  }
  /**
   * Create a new record.
   */
  async create(data, options = {}) {
    return await this.db.create(this.table, data, options);
  }
  /**
   * Update a record by its ID.
   */
  async updateById(id, data, options = {}) {
    return await this.db.updateById(this.table, id, data, options);
  }
  /**
   * Delete a record by its ID.
   */
  async deleteById(id, options = {}) {
    return await this.db.deleteById(this.table, id, options);
  }
};
var FarmRepository2 = class extends BaseRepository2 {
  static {
    __name(this, "FarmRepository");
  }
  constructor(dbOperations) {
    super(dbOperations, "farms");
  }
  /**
   * Check if a user has access to a specific farm.
   */
  async hasUserAccess(farmId, userId) {
    const count3 = await this.db.count("farm_members", {
      farm_id: farmId,
      user_id: userId
    });
    return count3 > 0;
  }
};
var CropRepository = class extends BaseRepository2 {
  static {
    __name(this, "CropRepository");
  }
  constructor(dbOperations) {
    super(dbOperations, "crops");
  }
  /**
   * Get crops for user's farms
   * @performance Rewritten to use JOINs
   */
  async findByUserAccess(userId, filters = {}, options = {}) {
    let query = `
      SELECT
        c.*,
        f.name as field_name,
        fa.name as farm_name,
        COUNT(DISTINCT ca.id) as activity_count,
        COUNT(DISTINCT co.id) as observation_count
      FROM crops c
      JOIN farm_members fm ON c.farm_id = fm.farm_id
      JOIN farms fa ON c.farm_id = fa.id
      LEFT JOIN fields f ON c.field_id = f.id
      LEFT JOIN crop_activities ca ON ca.crop_id = c.id
      LEFT JOIN crop_observations co ON co.crop_id = c.id
      WHERE fm.user_id = ?
    `;
    const params = [userId];
    if (filters.field_id) {
      query += " AND c.field_id = ?";
      params.push(filters.field_id);
    }
    if (filters.status) {
      query += " AND c.status = ?";
      params.push(filters.status);
    }
    if (filters.crop_type) {
      query += " AND c.crop_type = ?";
      params.push(filters.crop_type);
    }
    query += `
      GROUP BY c.id, f.name, fa.name
      ORDER BY c.created_at DESC
    `;
    if (options.limit) {
      const limit = Math.max(1, Math.min(parseInt(options.limit) || 20, 1e3));
      const offset = Math.max(0, (parseInt(options.page) || 1) - 1) * limit;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }
    const { data } = await this.db.executeQuery(query, params, {
      operation: "all",
      table: "crops",
      context: { findByUserAccess: true, userId, filters, options }
    });
    return data;
  }
  /**
   * Create crop with initial activity
   */
  async createWithActivity(cropData, userId) {
    const farmRepo = new FarmRepository2(this.db);
    const hasAccess = await farmRepo.hasUserAccess(cropData.farm_id, userId);
    if (!hasAccess) {
      throw new Error("Farm not found or access denied");
    }
    const newCrop = await this.create(cropData, { userId });
    await this.db.executeQuery(
      "INSERT INTO crop_activities (crop_id, activity_type, activity_date, description, created_by) VALUES (?, ?, ?, ?, ?)",
      [
        newCrop.id,
        "planted",
        (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        `Planted ${cropData.crop_type}${cropData.crop_variety ? " (" + cropData.crop_variety + ")" : ""}`,
        userId
      ],
      {
        operation: "run",
        table: "crop_activities",
        context: { createInitialActivity: true }
      }
    );
    return newCrop;
  }
  /**
   * Get crop with related data
   * @performance Rewritten main query to use JOINs
   */
  async findWithRelations(cropId, userId, includeActivities = false, includeObservations = false) {
    const { data } = await this.db.executeQuery(
      `
      SELECT
        c.*,
        f.name as field_name,
        fa.name as farm_name,
        COUNT(DISTINCT ca.id) as activity_count,
        COUNT(DISTINCT co.id) as observation_count
      FROM crops c
      JOIN farm_members fm ON c.farm_id = fm.farm_id
      JOIN farms fa ON c.farm_id = fa.id
      LEFT JOIN fields f ON c.field_id = f.id
      LEFT JOIN crop_activities ca ON ca.crop_id = c.id
      LEFT JOIN crop_observations co ON co.crop_id = c.id
      WHERE c.id = ? AND fm.user_id = ?
      GROUP BY c.id, f.name, fa.name
      LIMIT 1
    `,
      [cropId, userId],
      {
        operation: "first",
        // Use 'first' for single item
        table: "crops",
        context: { findWithRelations: true, cropId, userId }
      }
    );
    if (!data) {
      return null;
    }
    const crop = data;
    if (includeActivities) {
      const { data: activities } = await this.db.executeQuery(
        "SELECT * FROM crop_activities WHERE crop_id = ? ORDER BY activity_date DESC LIMIT 20",
        [cropId],
        {
          operation: "all",
          table: "crop_activities",
          context: { getActivities: true }
        }
      );
      crop.activities = activities;
    }
    if (includeObservations) {
      const { data: observations } = await this.db.executeQuery(
        "SELECT * FROM crop_observations WHERE crop_id = ? ORDER BY observation_date DESC LIMIT 10",
        [cropId],
        {
          operation: "all",
          table: "crop_observations",
          context: { getObservations: true }
        }
      );
      crop.observations = observations;
    }
    return crop;
  }
};

// api/repositories/animal-repository.js
var AnimalRepository = class extends BaseRepository {
  static {
    __name(this, "AnimalRepository");
  }
  constructor(dbOperations) {
    super(dbOperations, "animals");
  }
  /**
   * Get animals for user's farms with enhanced filtering and data
   */
  async findByUserAccess(userId, filters = {}, options = {}) {
    let query = `
      SELECT DISTINCT
        a.*,
        f.name as farm_name,
        l.name as location_name,
        l.type as location_type,
        COALESCE((SELECT COUNT(*) FROM animal_health_records ahr WHERE ahr.animal_id = a.id), 0) as health_record_count,
        COALESCE((SELECT COUNT(*) FROM animal_production ap WHERE ap.animal_id = a.id), 0) as production_record_count,
        COALESCE((SELECT COUNT(*) FROM animal_movements am WHERE am.animal_id = a.id), 0) as movement_count
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      JOIN farms f ON a.farm_id = f.id
      LEFT JOIN locations l ON a.current_location_id = l.id
      WHERE fm.user_id = ?
    `;
    const params = [userId];
    if (filters.species) {
      query += " AND a.species = ?";
      params.push(filters.species);
    }
    if (filters.breed) {
      query += " AND a.breed = ?";
      params.push(filters.breed);
    }
    if (filters.health_status) {
      query += " AND a.health_status = ?";
      params.push(filters.health_status);
    }
    if (filters.sex) {
      query += " AND a.sex = ?";
      params.push(filters.sex);
    }
    if (filters.farm_id) {
      query += " AND a.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.current_location_id) {
      query += " AND a.current_location_id = ?";
      params.push(filters.current_location_id);
    }
    if (filters.intake_type) {
      query += " AND a.intake_type = ?";
      params.push(filters.intake_type);
    }
    if (filters.search) {
      query += " AND (a.name LIKE ? OR a.identification_tag LIKE ? OR a.species LIKE ?)";
      params.push(
        `%${filters.search}%`,
        `%${filters.search}%`,
        `%${filters.search}%`
      );
    }
    query += " GROUP BY a.id";
    if (options.sortBy) {
      query += ` ORDER BY a.${options.sortBy} ${options.sortDirection?.toUpperCase() || "DESC"}`;
    } else {
      query += " ORDER BY a.created_at DESC";
    }
    if (options.limit) {
      const limit = Math.min(options.limit, 1e3);
      const offset = (options.page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }
    const { results, error: error4 } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "animals",
      context: {
        findByUserAccess: true,
        userId,
        filters,
        options,
        security_level: "enhanced"
      }
    });
    if (error4) {
      throw new Error(
        `Database error in AnimalRepository.findByUserAccess: ${error4.message}`
      );
    }
    return results;
  }
  /**
   * Count animals for pagination
   */
  async countByUserAccess(userId, filters = {}) {
    let query = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE fm.user_id = ?
    `;
    const params = [userId];
    if (filters.species) {
      query += " AND a.species = ?";
      params.push(filters.species);
    }
    if (filters.breed) {
      query += " AND a.breed = ?";
      params.push(filters.breed);
    }
    if (filters.health_status) {
      query += " AND a.health_status = ?";
      params.push(filters.health_status);
    }
    if (filters.sex) {
      query += " AND a.sex = ?";
      params.push(filters.sex);
    }
    if (filters.farm_id) {
      query += " AND a.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.current_location_id) {
      query += " AND a.current_location_id = ?";
      params.push(filters.current_location_id);
    }
    if (filters.intake_type) {
      query += " AND a.intake_type = ?";
      params.push(filters.intake_type);
    }
    const { results, error: error4 } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "animals",
      context: { countByUserAccess: true, userId, filters }
    });
    if (error4) {
      throw new Error(
        `Database error in AnimalRepository.countByUserAccess: ${error4.message}`
      );
    }
    return results[0]?.total || 0;
  }
  /**
   * Create animal with comprehensive validation
   */
  async createWithValidation(animalData, userId) {
    if (!animalData.farm_id || !animalData.name || !animalData.species) {
      throw new Error("Farm ID, name, and species are required");
    }
    const hasAccess = await this.hasUserAccessToFarm(
      animalData.farm_id,
      userId
    );
    if (!hasAccess) {
      throw new Error("Farm not found or access denied");
    }
    if (animalData.intake_type && !["Birth", "Purchase", "Transfer"].includes(animalData.intake_type)) {
      throw new Error(
        "Invalid intake_type. Must be Birth, Purchase, or Transfer."
      );
    }
    if (animalData.current_location_id) {
      const locationValid = await this.validateLocation(
        animalData.current_location_id,
        animalData.farm_id
      );
      if (!locationValid) {
        throw new Error("Invalid or inaccessible location");
      }
    }
    if (animalData.father_id || animalData.mother_id) {
      await this.validatePedigree(
        animalData.father_id,
        animalData.mother_id,
        animalData.farm_id,
        animalData.species,
        userId
      );
    }
    const animalRecord = {
      farm_id: animalData.farm_id,
      name: animalData.name.trim(),
      species: animalData.species.trim(),
      breed: animalData.breed || null,
      sex: animalData.sex || null,
      identification_tag: animalData.identification_tag || null,
      birth_date: animalData.birth_date || null,
      health_status: animalData.health_status || "healthy",
      intake_type: animalData.intake_type || null,
      intake_date: animalData.intake_date || null,
      purchase_price: animalData.purchase_price || null,
      seller_details: animalData.seller_details || null,
      father_id: animalData.father_id || null,
      mother_id: animalData.mother_id || null,
      current_location_id: animalData.current_location_id || null,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const result = await this.create(animalRecord, { userId });
    if (!result || !result.data) {
      throw new Error("Failed to create animal");
    }
    return result.data[0];
  }
  /**
   * Get animal with comprehensive details
   */
  async findWithDetails(animalId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT DISTINCT
        a.*,
        f.name as farm_name,
        l.name as location_name,
        l.type as location_type,
        af.name as father_name,
        am.name as mother_name,
        COALESCE((SELECT COUNT(*) FROM animal_health_records ahr WHERE ahr.animal_id = a.id), 0) as health_record_count,
        COALESCE((SELECT COUNT(*) FROM animal_production ap WHERE ap.animal_id = a.id), 0) as production_record_count,
        COALESCE((SELECT COUNT(*) FROM animal_movements am WHERE am.animal_id = a.id), 0) as movement_count
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      JOIN farms f ON a.farm_id = f.id
      LEFT JOIN locations l ON a.current_location_id = l.id
      LEFT JOIN animals af ON a.father_id = af.id
      LEFT JOIN animals am ON a.mother_id = am.id
      WHERE a.id = ? AND fm.user_id = ?
      GROUP BY a.id
    `,
      [animalId, userId],
      {
        operation: "query",
        table: "animals",
        context: { findWithDetails: true, animalId, userId }
      }
    );
    if (results.length === 0) {
      return null;
    }
    return results[0];
  }
  /**
   * Get animal pedigree tree
   */
  async getPedigree(animalId, userId, maxDepth = 3) {
    const hasAccess = await this.hasUserAccessToAnimal(animalId, userId);
    if (!hasAccess) {
      throw new Error("Access denied to animal pedigree");
    }
    const buildTree = /* @__PURE__ */ __name(async (id, depth = 0) => {
      if (!id || depth >= maxDepth) return null;
      const animal = await this.db.findById(
        "animals",
        id,
        "id, name, sex, species, father_id, mother_id",
        { userId }
      );
      if (!animal) return null;
      const father = await buildTree(animal.father_id, depth + 1);
      const mother = await buildTree(animal.mother_id, depth + 1);
      return {
        id: animal.id,
        name: animal.name,
        sex: animal.sex,
        generation: depth,
        parents: father || mother ? { father, mother } : null
      };
    }, "buildTree");
    return await buildTree(animalId, 0);
  }
  /**
   * Get livestock statistics
   */
  async getLivestockStats(userId) {
    const speciesQuery = `
      SELECT a.species, COUNT(a.id) as count
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE fm.user_id = ?
      GROUP BY a.species
    `;
    const healthQuery = `
      SELECT a.health_status, COUNT(a.id) as count
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE fm.user_id = ?
      GROUP BY a.health_status
    `;
    const locationQuery = `
      SELECT l.name as location_name, COUNT(a.id) as count
      FROM animals a
      JOIN locations l ON a.current_location_id = l.id
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE fm.user_id = ?
      GROUP BY l.name
    `;
    const [speciesStats, healthStats, locationStats] = await Promise.all([
      this.db.executeQuery(speciesQuery, [userId], { operation: "all" }),
      this.db.executeQuery(healthQuery, [userId], { operation: "all" }),
      this.db.executeQuery(locationQuery, [userId], { operation: "all" })
    ]);
    const total = speciesStats.data.reduce((acc, cur) => acc + cur.count, 0);
    return {
      total_animals: total,
      by_species: speciesStats.data,
      by_health_status: healthStats.data,
      by_location: locationStats.data
    };
  }
  // === PRIVATE HELPER METHODS ===
  async hasUserAccessToFarm(farmId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 1 FROM farm_members
      WHERE farm_id = ? AND user_id = ?
      LIMIT 1
    `,
      [farmId, userId],
      {
        operation: "query",
        table: "farm_members",
        context: { hasUserAccessToFarm: true }
      }
    );
    return results.length > 0;
  }
  async hasUserAccessToAnimal(animalId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 1 FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE a.id = ? AND fm.user_id = ?
      LIMIT 1
    `,
      [animalId, userId],
      {
        operation: "query",
        table: "animals",
        context: { hasUserAccessToAnimal: true }
      }
    );
    return results.length > 0;
  }
  async validateLocation(locationId, farmId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 1 FROM locations
      WHERE id = ? AND farm_id = ?
      LIMIT 1
    `,
      [locationId, farmId],
      {
        operation: "query",
        table: "locations",
        context: { validateLocation: true }
      }
    );
    return results.length > 0;
  }
  async validatePedigree(fatherId, motherId, farmId, species, userId) {
    const parentIds = [fatherId, motherId].filter((id) => id);
    if (parentIds.length === 0) return;
    const { results } = await this.db.executeQuery(
      `
      SELECT id, farm_id, species, sex, name
      FROM animals
      WHERE id IN (${parentIds.map(() => "?").join(",")})
    `,
      parentIds,
      {
        operation: "query",
        table: "animals",
        context: { validatePedigree: true }
      }
    );
    if (results.length !== parentIds.length) {
      throw new Error("One or more parent animals not found");
    }
    for (const parent of results) {
      if (parent.farm_id !== farmId) {
        throw new Error(
          `Parent animal ${parent.name} belongs to a different farm`
        );
      }
      if (parent.species !== species) {
        throw new Error(`Parent animal ${parent.name} has different species`);
      }
      if (fatherId && parent.id === fatherId && parent.sex !== "male") {
        throw new Error(`Father ${parent.name} must be male`);
      }
      if (motherId && parent.id === motherId && parent.sex !== "female") {
        throw new Error(`Mother ${parent.name} must be female`);
      }
    }
  }
};

// api/repositories/finance-repository.js
var FinanceRepository = class extends BaseRepository {
  static {
    __name(this, "FinanceRepository");
  }
  constructor(dbOperations) {
    super(dbOperations, "finance_entries");
  }
  /**
   * Get financial entries for user's farms with enhanced security
   */
  async findByUserAccess(userId, filters = {}, options = {}) {
    let query = `
      SELECT DISTINCT
        fe.*,
        fa.name as farm_name,
        creator.name as created_by_name,
        CASE 
          WHEN fe.type = 'income' THEN fe.amount
          ELSE -fe.amount 
        END as net_amount
      FROM finance_entries fe
      JOIN farm_members fm ON fe.farm_id = fm.farm_id
      JOIN farms fa ON fe.farm_id = fa.id
      LEFT JOIN users creator ON fe.created_by = creator.id
      WHERE fm.user_id = ?
    `;
    const params = [userId];
    if (filters.farm_id) {
      query += " AND fe.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.type) {
      query += " AND fe.type = ?";
      params.push(filters.type);
    }
    if (filters.budget_category) {
      query += " AND fe.budget_category = ?";
      params.push(filters.budget_category);
    }
    if (filters.entry_date_from) {
      query += " AND date(fe.entry_date) >= ?";
      params.push(filters.entry_date_from);
    }
    if (filters.entry_date_to) {
      query += " AND date(fe.entry_date) <= ?";
      params.push(filters.entry_date_to);
    }
    if (filters.search) {
      query += " AND (fe.description LIKE ? OR fe.account LIKE ?)";
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    if (options.sortBy) {
      query += ` ORDER BY fe.${options.sortBy} ${options.sortDirection?.toUpperCase() || "DESC"}`;
    } else {
      query += " ORDER BY fe.entry_date DESC";
    }
    if (options.limit) {
      const limit = Math.min(options.limit, 1e3);
      const offset = (options.page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }
    const { results, error: error4 } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "finance_entries",
      context: {
        findByUserAccess: true,
        userId,
        filters,
        options,
        security_level: "enhanced"
      }
    });
    if (error4) {
      throw new Error(
        `Database error in FinanceRepository.findByUserAccess: ${error4.message}`
      );
    }
    return results;
  }
  /**
   * Count financial entries for pagination
   */
  async countByUserAccess(userId, filters = {}) {
    let query = `
      SELECT COUNT(DISTINCT fe.id) as total
      FROM finance_entries fe
      JOIN farm_members fm ON fe.farm_id = fm.farm_id
      WHERE fm.user_id = ?
    `;
    const params = [userId];
    if (filters.farm_id) {
      query += " AND fe.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.type) {
      query += " AND fe.type = ?";
      params.push(filters.type);
    }
    const { results, error: error4 } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "finance_entries",
      context: { countByUserAccess: true, userId, filters }
    });
    if (error4) {
      throw new Error(
        `Database error in FinanceRepository.countByUserAccess: ${error4.message}`
      );
    }
    return results[0]?.total || 0;
  }
  /**
   * Create financial transaction with comprehensive audit trail
   */
  async createTransaction(entryData, userId) {
    if (!entryData.farm_id || !entryData.type || !entryData.amount) {
      throw new Error("Farm ID, type, and amount are required");
    }
    if (!["income", "expense", "investment"].includes(entryData.type)) {
      throw new Error(
        "Transaction type must be income, expense, or investment"
      );
    }
    if (typeof entryData.amount !== "number" || entryData.amount <= 0) {
      throw new Error("Amount must be a positive number");
    }
    const farmRepo = new FarmRepository2(this.db);
    const hasAccess = await farmRepo.hasUserAccess(entryData.farm_id, userId);
    if (!hasAccess) {
      throw new Error("Farm not found or access denied");
    }
    const transactionData = {
      farm_id: entryData.farm_id,
      entry_date: entryData.entry_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      type: entryData.type,
      amount: parseFloat(entryData.amount.toFixed(2)),
      // Ensure precision
      currency: entryData.currency || "USD",
      account: entryData.account || null,
      description: entryData.description || null,
      reference_type: entryData.reference_type || null,
      reference_id: entryData.reference_id || null,
      project_id: entryData.project_id || null,
      department: entryData.department || null,
      tax_category: entryData.tax_category || null,
      approval_status: entryData.approval_status || "pending",
      receipt_number: entryData.receipt_number || null,
      recurring_pattern: entryData.recurring_pattern || null,
      budget_category: entryData.budget_category || null,
      tax_deductible: entryData.tax_deductible || 0,
      bank_account: entryData.bank_account || null,
      created_by: userId
    };
    const transaction = [
      {
        query: `
          INSERT INTO finance_entries (
            farm_id, entry_date, type, amount, currency, account, description,
            reference_type, reference_id, project_id, department, tax_category,
            approval_status, receipt_number, recurring_pattern, budget_category,
            tax_deductible, bank_account, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: Object.values(transactionData),
        operation: "run",
        table: "finance_entries",
        context: {
          createTransaction: true,
          audit_level: "comprehensive",
          data_integrity: "enforced"
        }
      }
    ];
    try {
      const result = await this.db.executeTransaction(transaction);
      const newTransactionId = result.results[0].lastRowId;
      await this.logFinancialOperation(
        "create",
        newTransactionId,
        transactionData,
        userId
      );
      return await this.findById(newTransactionId);
    } catch (error4) {
      throw new Error(`Transaction creation failed: ${error4.message}`);
    }
  }
  /**
   * Update financial transaction with audit trail
   */
  async updateTransaction(id, updateData, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error("Transaction not found");
    }
    const hasAccess = await this.hasUserAccessToTransaction(id, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this transaction");
    }
    if (updateData.amount !== void 0) {
      if (typeof updateData.amount !== "number" || updateData.amount <= 0) {
        throw new Error("Amount must be a positive number");
      }
      updateData.amount = parseFloat(updateData.amount.toFixed(2));
    }
    if (updateData.type && !["income", "expense", "investment"].includes(updateData.type)) {
      throw new Error(
        "Transaction type must be income, expense, or investment"
      );
    }
    updateData.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    const updated = await this.updateById(id, updateData);
    await this.logFinancialOperation(
      "update",
      id,
      {
        before: existing,
        after: updated,
        changes: updateData
      },
      userId
    );
    return updated;
  }
  /**
   * Delete financial transaction with dependency checking
   */
  async deleteTransaction(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error("Transaction not found");
    }
    const hasAccess = await this.hasUserAccessToTransaction(id, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this transaction");
    }
    const dependencies = await this.checkTransactionDependencies(id);
    if (dependencies.hasReferences) {
      throw new Error(
        "Cannot delete transaction with existing references. Consider archiving instead."
      );
    }
    await this.deleteById(id);
    await this.logFinancialOperation(
      "delete",
      id,
      {
        deleted_record: existing
      },
      userId
    );
    return { success: true, deletedId: id };
  }
  /**
   * Get real-time balance for farm account
   */
  async getBalance(farmId, accountType = "all", userId) {
    const farmRepo = new FarmRepository2(this.db);
    const hasAccess = await farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }
    let query = `
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN type = 'investment' THEN amount ELSE 0 END) as total_investments,
        COUNT(*) as transaction_count
      FROM finance_entries 
      WHERE farm_id = ?
    `;
    const params = [farmId];
    if (accountType !== "all") {
      query += " AND account = ?";
      params.push(accountType);
    }
    const { results, error: error4 } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "finance_entries",
      context: { getBalance: true, farmId, accountType }
    });
    if (error4) {
      throw new Error(`Balance calculation failed: ${error4.message}`);
    }
    const data = results[0];
    return {
      farm_id: farmId,
      account_type: accountType,
      total_revenue: data?.total_revenue || 0,
      total_expenses: data?.total_expenses || 0,
      total_investments: data?.total_investments || 0,
      net_profit: (data?.total_revenue || 0) - (data?.total_expenses || 0),
      transaction_count: data?.transaction_count || 0,
      calculated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Generate financial report with security validation
   */
  async generateReport(type, params, userId) {
    if (!params.farm_id) {
      throw new Error("Farm ID required for report generation");
    }
    const farmRepo = new FarmRepository2(this.db);
    const hasAccess = await farmRepo.hasUserAccess(params.farm_id, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }
    switch (type) {
      case "monthly_summary":
        return await this.generateMonthlySummary(params, userId);
      case "cash_flow":
        return await this.generateCashFlowReport(params, userId);
      case "category_analysis":
        return await this.generateCategoryAnalysis(params, userId);
      case "profit_loss":
        return await this.generateProfitLossReport(params, userId);
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }
  /**
   * Bulk create financial transactions with atomic operations
   */
  async bulkCreateTransactions(entries, userId) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error("Entries array is required");
    }
    const transactions = [];
    const auditLogs = [];
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      try {
        if (!entry.farm_id || !entry.type || !entry.amount) {
          throw new Error(`Entry ${i + 1}: Missing required fields`);
        }
        const farmRepo = new FarmRepository2(this.db);
        const hasAccess = await farmRepo.hasUserAccess(entry.farm_id, userId);
        if (!hasAccess) {
          throw new Error(`Entry ${i + 1}: Farm access denied`);
        }
        const transactionData = {
          farm_id: entry.farm_id,
          entry_date: entry.entry_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          type: entry.type,
          amount: parseFloat(entry.amount.toFixed(2)),
          currency: entry.currency || "USD",
          account: entry.account || null,
          description: entry.description || null,
          reference_type: entry.reference_type || null,
          reference_id: entry.reference_id || null,
          project_id: entry.project_id || null,
          department: entry.department || null,
          tax_category: entry.tax_category || null,
          approval_status: entry.approval_status || "pending",
          receipt_number: entry.receipt_number || null,
          recurring_pattern: entry.recurring_pattern || null,
          budget_category: entry.budget_category || null,
          tax_deductible: entry.tax_deductible || 0,
          bank_account: entry.bank_account || null,
          created_by: userId
        };
        transactions.push({
          query: `
            INSERT INTO finance_entries (
              farm_id, entry_date, type, amount, currency, account, description,
              reference_type, reference_id, project_id, department, tax_category,
              approval_status, receipt_number, recurring_pattern, budget_category,
              tax_deductible, bank_account, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          params: Object.values(transactionData),
          operation: "run",
          table: "finance_entries",
          context: { bulkCreate: true, entry_index: i }
        });
      } catch (error4) {
        throw new Error(
          `Bulk create failed at entry ${i + 1}: ${error4.message}`
        );
      }
    }
    try {
      const result = await this.db.executeTransaction(transactions);
      await this.logFinancialOperation(
        "bulk_create",
        null,
        {
          total_entries: entries.length,
          created_ids: result.results.map((r2) => r2.lastRowId)
        },
        userId
      );
      return {
        success: true,
        created_count: entries.length,
        created_ids: result.results.map((r2) => r2.lastRowId)
      };
    } catch (error4) {
      throw new Error(`Bulk transaction failed: ${error4.message}`);
    }
  }
  // === PRIVATE HELPER METHODS ===
  async hasUserAccessToTransaction(transactionId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 1 FROM finance_entries fe
      JOIN farm_members fm ON fe.farm_id = fm.farm_id
      WHERE fe.id = ? AND fm.user_id = ?
      LIMIT 1
    `,
      [transactionId, userId],
      {
        operation: "query",
        table: "finance_entries",
        context: { hasUserAccessToTransaction: true }
      }
    );
    return results.length > 0;
  }
  async checkTransactionDependencies(transactionId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 
        (SELECT COUNT(*) FROM invoices WHERE total_amount IN (
          SELECT amount FROM finance_entries WHERE id = ?
        )) as invoice_references,
        (SELECT COUNT(*) FROM purchase_orders WHERE total_amount IN (
          SELECT amount FROM finance_entries WHERE id = ?
        )) as po_references
    `,
      [transactionId, transactionId],
      {
        operation: "query",
        table: "finance_entries",
        context: { checkTransactionDependencies: true }
      }
    );
    const deps = results[0];
    return {
      hasReferences: deps.invoice_references > 0 || deps.po_references > 0,
      invoice_references: deps.invoice_references,
      po_references: deps.po_references
    };
  }
  async logFinancialOperation(operation, transactionId, data, userId) {
    try {
      await this.db.executeQuery(
        `
        INSERT INTO audit_logs (
          user_id, action, table_name, record_id, old_values, new_values, 
          timestamp, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          userId,
          `finance.${operation}`,
          "finance_entries",
          transactionId,
          data.before ? JSON.stringify(data.before) : null,
          data.after || data.created || JSON.stringify(data),
          (/* @__PURE__ */ new Date()).toISOString(),
          "system",
          "FinanceRepository"
        ],
        {
          operation: "run",
          table: "audit_logs",
          context: { logFinancialOperation: true }
        }
      );
    } catch (error4) {
      console.error("Failed to log financial operation:", error4);
    }
  }
  async generateMonthlySummary(params, userId) {
    const { farm_id, year, month } = params;
    const monthStr = `${year}-${month.toString().padStart(2, "0")}`;
    const { results } = await this.db.executeQuery(
      `
      SELECT 
        type,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_amount,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount
      FROM finance_entries 
      WHERE farm_id = ? 
        AND strftime('%Y-%m', entry_date) = ?
      GROUP BY type
    `,
      [farm_id, monthStr],
      {
        operation: "query",
        table: "finance_entries",
        context: { generateMonthlySummary: true }
      }
    );
    const summary = {
      farm_id,
      report_type: "monthly_summary",
      period: monthStr,
      breakdown: results,
      generated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.logFinancialOperation(
      "report_generate",
      null,
      {
        report_type: "monthly_summary",
        period: monthStr,
        summary_data: summary
      },
      userId
    );
    return summary;
  }
  async generateCashFlowReport(params, userId) {
    const { farm_id, date_from, date_to } = params;
    const { results } = await this.db.executeQuery(
      `
      SELECT 
        strftime('%Y-%m', entry_date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as inflow,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as outflow,
        SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END) as net_flow
      FROM finance_entries 
      WHERE farm_id = ?
        AND date(entry_date) >= ?
        AND date(entry_date) <= ?
      GROUP BY strftime('%Y-%m', entry_date)
      ORDER BY month
    `,
      [farm_id, date_from, date_to],
      {
        operation: "query",
        table: "finance_entries",
        context: { generateCashFlowReport: true }
      }
    );
    const report2 = {
      farm_id,
      report_type: "cash_flow",
      period: { from: date_from, to: date_to },
      monthly_flows: results,
      generated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.logFinancialOperation(
      "report_generate",
      null,
      {
        report_type: "cash_flow",
        period: report2.period,
        summary: report2
      },
      userId
    );
    return report2;
  }
  async generateCategoryAnalysis(params, userId) {
    const { farm_id, date_from, date_to } = params;
    const { results } = await this.db.executeQuery(
      `
      SELECT 
        COALESCE(budget_category, 'Uncategorized') as category,
        type,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_amount
      FROM finance_entries 
      WHERE farm_id = ?
        AND date(entry_date) >= ?
        AND date(entry_date) <= ?
      GROUP BY budget_category, type
      ORDER BY total_amount DESC
    `,
      [farm_id, date_from, date_to],
      {
        operation: "query",
        table: "finance_entries",
        context: { generateCategoryAnalysis: true }
      }
    );
    const report2 = {
      farm_id,
      report_type: "category_analysis",
      period: { from: date_from, to: date_to },
      category_breakdown: results,
      generated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.logFinancialOperation(
      "report_generate",
      null,
      {
        report_type: "category_analysis",
        period: report2.period,
        summary: report2
      },
      userId
    );
    return report2;
  }
  async generateProfitLossReport(params, userId) {
    const { farm_id, date_from, date_to } = params;
    const { results } = await this.db.executeQuery(
      `
      SELECT 
        type,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_amount
      FROM finance_entries 
      WHERE farm_id = ?
        AND date(entry_date) >= ?
        AND date(entry_date) <= ?
        AND type IN ('income', 'expense')
      GROUP BY type
    `,
      [farm_id, date_from, date_to],
      {
        operation: "query",
        table: "finance_entries",
        context: { generateProfitLossReport: true }
      }
    );
    const income = results.find((r2) => r2.type === "income")?.total_amount || 0;
    const expenses = results.find((r2) => r2.type === "expense")?.total_amount || 0;
    const profit = income - expenses;
    const margin = income > 0 ? profit / income * 100 : 0;
    const report2 = {
      farm_id,
      report_type: "profit_loss",
      period: { from: date_from, to: date_to },
      revenue: income,
      expenses,
      profit,
      profit_margin: Math.round(margin * 100) / 100,
      transaction_summary: results,
      generated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.logFinancialOperation(
      "report_generate",
      null,
      {
        report_type: "profit_loss",
        period: report2.period,
        summary: report2
      },
      userId
    );
    return report2;
  }
};

// api/repositories/task-repository.js
var TaskRepository = class extends BaseRepository {
  static {
    __name(this, "TaskRepository");
  }
  constructor(dbOperations) {
    super(dbOperations, "tasks");
  }
  /**
   * Get tasks for user's farms with enhanced filtering and data
   */
  async findByUserAccess(userId, filters = {}, options = {}) {
    let query = `
      SELECT DISTINCT
        t.*,
        fa.name as farm_name,
        creator.name as created_by_name,
        assignee.name as assigned_to_name,
        COUNT(DISTINCT tl.id) as time_log_count,
        COALESCE(SUM(tl.total_hours), 0) as total_logged_hours,
        COUNT(DISTINCT tc.id) as comment_count,
        CASE 
          WHEN t.status = 'completed' AND t.due_date IS NOT NULL 
               AND date(t.updated_at) <= date(t.due_date) 
          THEN 1 
          ELSE 0 
        END as on_time_completion,
        CASE 
          WHEN t.status = 'completed' THEN 
            julianday(t.updated_at) - julianday(t.created_at)
          ELSE NULL 
        END as actual_completion_days
      FROM tasks t
      JOIN farm_members fm ON t.farm_id = fm.farm_id
      JOIN farms fa ON t.farm_id = fa.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN task_time_logs tl ON t.id = tl.task_id
      LEFT JOIN task_comments tc ON t.id = tc.task_id
      WHERE fm.user_id = ?
    `;
    const params = [userId];
    if (filters.status) {
      query += " AND t.status = ?";
      params.push(filters.status);
    }
    if (filters.priority) {
      query += " AND t.priority = ?";
      params.push(filters.priority);
    }
    if (filters.task_category) {
      query += " AND t.task_category = ?";
      params.push(filters.task_category);
    }
    if (filters.assigned_to) {
      query += " AND t.assigned_to = ?";
      params.push(filters.assigned_to);
    }
    if (filters.farm_id) {
      query += " AND t.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.due_date_from) {
      query += " AND date(t.due_date) >= ?";
      params.push(filters.due_date_from);
    }
    if (filters.due_date_to) {
      query += " AND date(t.due_date) <= ?";
      params.push(filters.due_date_to);
    }
    if (filters.search) {
      query += " AND (t.title LIKE ? OR t.description LIKE ? OR t.tags LIKE ?)";
      params.push(
        `%${filters.search}%`,
        `%${filters.search}%`,
        `%${filters.search}%`
      );
    }
    query += " GROUP BY t.id";
    if (options.sortBy) {
      query += ` ORDER BY t.${options.sortBy} ${options.sortDirection?.toUpperCase() || "DESC"}`;
    } else {
      query += " ORDER BY t.due_date ASC, t.created_at DESC";
    }
    if (options.limit) {
      const limit = Math.min(options.limit, 1e3);
      const offset = (options.page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }
    const { results, error: error4 } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "tasks",
      context: {
        findByUserAccess: true,
        userId,
        filters,
        options,
        security_level: "enhanced"
      }
    });
    if (error4) {
      throw new Error(
        `Database error in TaskRepository.findByUserAccess: ${error4.message}`
      );
    }
    return results;
  }
  /**
   * Count tasks for pagination
   */
  async countByUserAccess(userId, filters = {}) {
    let query = `
      SELECT COUNT(DISTINCT t.id) as total
      FROM tasks t
      JOIN farm_members fm ON t.farm_id = fm.farm_id
      WHERE fm.user_id = ?
    `;
    const params = [userId];
    if (filters.status) {
      query += " AND t.status = ?";
      params.push(filters.status);
    }
    if (filters.priority) {
      query += " AND t.priority = ?";
      params.push(filters.priority);
    }
    if (filters.assigned_to) {
      query += " AND t.assigned_to = ?";
      params.push(filters.assigned_to);
    }
    if (filters.farm_id) {
      query += " AND t.farm_id = ?";
      params.push(filters.farm_id);
    }
    const { results, error: error4 } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "tasks",
      context: { countByUserAccess: true, userId, filters }
    });
    if (error4) {
      throw new Error(
        `Database error in TaskRepository.countByUserAccess: ${error4.message}`
      );
    }
    return results[0]?.total || 0;
  }
  /**
   * Create task with comprehensive validation and setup
   */
  async createTask(taskData, userId) {
    if (!taskData.farm_id || !taskData.title) {
      throw new Error("Farm ID and title are required");
    }
    if (taskData.priority && !["low", "medium", "high", "urgent"].includes(taskData.priority)) {
      throw new Error("Priority must be low, medium, high, or urgent");
    }
    if (taskData.status && !["pending", "in_progress", "completed", "cancelled", "on_hold"].includes(
      taskData.status
    )) {
      throw new Error("Invalid status value");
    }
    const farmRepo = new FarmRepository2(this.db);
    const hasAccess = await farmRepo.hasUserAccess(taskData.farm_id, userId);
    if (!hasAccess) {
      throw new Error("Farm not found or access denied");
    }
    if (taskData.assigned_to) {
      const assigneeHasAccess = await farmRepo.hasUserAccess(
        taskData.farm_id,
        taskData.assigned_to
      );
      if (!assigneeHasAccess) {
        throw new Error("Assigned user does not have access to this farm");
      }
    }
    const taskRecord = {
      farm_id: taskData.farm_id,
      title: taskData.title.trim(),
      description: taskData.description || null,
      status: taskData.status || "pending",
      priority: taskData.priority || "medium",
      due_date: taskData.due_date || null,
      assigned_to: taskData.assigned_to || null,
      created_by: userId,
      priority_score: taskData.priority_score || null,
      estimated_duration: taskData.estimated_duration || null,
      actual_duration: taskData.actual_duration || null,
      dependencies: taskData.dependencies || null,
      resource_requirements: taskData.resource_requirements || null,
      task_category: taskData.task_category || null,
      recurring_pattern: taskData.recurring_pattern || null,
      completion_criteria: taskData.completion_criteria || null,
      progress_percentage: taskData.progress_percentage || 0,
      tags: taskData.tags || null,
      location: taskData.location || null
    };
    const transaction = [
      {
        query: `
          INSERT INTO tasks (
            farm_id, title, description, status, priority, due_date, assigned_to,
            created_by, priority_score, estimated_duration, actual_duration,
            dependencies, resource_requirements, task_category, recurring_pattern,
            completion_criteria, progress_percentage, tags, location
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: Object.values(taskRecord),
        operation: "run",
        table: "tasks",
        context: {
          createTask: true,
          audit_level: "comprehensive",
          data_integrity: "enforced"
        }
      }
    ];
    try {
      const result = await this.db.executeTransaction(transaction);
      const newTaskId = result.results[0].lastRowId;
      await this.logTaskOperation("create", newTaskId, taskRecord, userId);
      return await this.findByIdWithDetails(newTaskId, userId);
    } catch (error4) {
      throw new Error(`Task creation failed: ${error4.message}`);
    }
  }
  /**
   * Update task with validation and audit trail
   */
  async updateTask(id, updateData, userId) {
    const existing = await this.findByIdWithDetails(id);
    if (!existing) {
      throw new Error("Task not found");
    }
    const hasAccess = await this.hasUserAccessToTask(id, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this task");
    }
    if (updateData.priority && !["low", "medium", "high", "urgent"].includes(updateData.priority)) {
      throw new Error("Priority must be low, medium, high, or urgent");
    }
    if (updateData.status && !["pending", "in_progress", "completed", "cancelled", "on_hold"].includes(
      updateData.status
    )) {
      throw new Error("Invalid status value");
    }
    if (updateData.progress_percentage !== void 0) {
      const progress = parseFloat(updateData.progress_percentage);
      if (isNaN(progress) || progress < 0 || progress > 100) {
        throw new Error("Progress percentage must be between 0 and 100");
      }
      updateData.progress_percentage = progress;
    }
    if (updateData.progress_percentage === 100 && !updateData.status) {
      updateData.status = "completed";
    }
    updateData.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    const updated = await this.updateById(id, updateData);
    await this.logTaskOperation(
      "update",
      id,
      {
        before: existing,
        after: updated,
        changes: updateData
      },
      userId
    );
    return await this.findByIdWithDetails(id, userId);
  }
  /**
   * Delete task with dependency checking
   */
  async deleteTask(id, userId) {
    const existing = await this.findByIdWithDetails(id);
    if (!existing) {
      throw new Error("Task not found");
    }
    const hasAccess = await this.hasUserAccessToTask(id, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this task");
    }
    const dependencies = await this.checkTaskDependencies(id);
    if (dependencies.hasReferences) {
      throw new Error(
        "Cannot delete task with dependent tasks. Please update dependencies first."
      );
    }
    await this.deleteById(id);
    await this.logTaskOperation(
      "delete",
      id,
      {
        deleted_record: existing
      },
      userId
    );
    return { success: true, deletedId: id };
  }
  /**
   * Get task with comprehensive details
   */
  async findByIdWithDetails(taskId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT DISTINCT
        t.*,
        fa.name as farm_name,
        creator.name as created_by_name,
        assignee.name as assigned_to_name,
        COUNT(DISTINCT tl.id) as time_log_count,
        COALESCE(SUM(tl.total_hours), 0) as total_logged_hours,
        COUNT(DISTINCT tc.id) as comment_count,
        COUNT(DISTINCT tcol.id) as collaborator_count
      FROM tasks t
      JOIN farm_members fm ON t.farm_id = fm.farm_id
      JOIN farms fa ON t.farm_id = fa.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN task_time_logs tl ON t.id = tl.task_id
      LEFT JOIN task_comments tc ON t.id = tc.task_id
      LEFT JOIN task_collaborators tcol ON t.id = tcol.task_id
      WHERE t.id = ? AND fm.user_id = ?
      GROUP BY t.id
    `,
      [taskId, userId],
      {
        operation: "query",
        table: "tasks",
        context: { findByIdWithDetails: true, taskId, userId }
      }
    );
    if (results.length === 0) {
      return null;
    }
    const task = results[0];
    if (task.dependencies) {
      const dependencyIds = task.dependencies.split(",").map((id) => parseInt(id.trim())).filter((id) => !isNaN(id));
      if (dependencyIds.length > 0) {
        const { results: dependencyResults } = await this.db.executeQuery(
          `
          SELECT t.id, t.title, t.status, t.due_date
          FROM tasks t
          WHERE t.id IN (${dependencyIds.map(() => "?").join(",")})
          AND t.farm_id = ?
        `,
          [...dependencyIds, task.farm_id],
          {
            operation: "query",
            table: "tasks",
            context: { getDependencies: true, taskId }
          }
        );
        task.dependencies_list = dependencyResults;
      }
    }
    return task;
  }
  /**
   * Get overdue tasks for notification
   */
  async getOverdueTasks(farmId, userId) {
    const farmRepo = new FarmRepository2(this.db);
    const hasAccess = await farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }
    const { results } = await this.db.executeQuery(
      `
      SELECT 
        t.*,
        fa.name as farm_name,
        assignee.name as assigned_to_name
      FROM tasks t
      JOIN farms fa ON t.farm_id = fa.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.farm_id = ?
        AND t.due_date < date('now')
        AND t.status != 'completed'
      ORDER BY t.due_date ASC
    `,
      [farmId],
      {
        operation: "query",
        table: "tasks",
        context: { getOverdueTasks: true, farmId }
      }
    );
    return results;
  }
  /**
   * Get task analytics and performance metrics
   */
  async getTaskAnalytics(farmId, userId, dateFrom, dateTo) {
    const farmRepo = new FarmRepository2(this.db);
    const hasAccess = await farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }
    const dateFilter = dateFrom && dateTo ? `AND date(t.created_at) >= date('${dateFrom}') AND date(t.created_at) <= date('${dateTo}')` : "";
    const { results } = await this.db.executeQuery(
      `
      SELECT
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as active_tasks,
        COUNT(CASE WHEN t.due_date < date('now') AND t.status != 'completed' THEN 1 END) as overdue_tasks,
        AVG(CASE WHEN t.estimated_duration IS NOT NULL AND t.actual_duration IS NOT NULL
             THEN (t.actual_duration / t.estimated_duration) * 100 ELSE NULL END) as avg_completion_ratio,
        COUNT(CASE WHEN t.progress_percentage = 100 THEN 1 END) as fully_completed_tasks,
        SUM(CASE WHEN t.priority = 'high' AND t.status != 'completed' THEN 1 ELSE 0 END) as high_priority_pending,
        AVG(t.progress_percentage) as avg_progress
      FROM tasks t
      WHERE t.farm_id = ? ${dateFilter}
    `,
      [farmId],
      {
        operation: "query",
        table: "tasks",
        context: { getTaskAnalytics: true, farmId, dateFrom, dateTo }
      }
    );
    return results[0] || {};
  }
  /**
   * Bulk create tasks with template support
   */
  async bulkCreateTasks(tasksData, userId, templateId = null) {
    if (!Array.isArray(tasksData) || tasksData.length === 0) {
      throw new Error("Tasks array is required");
    }
    const tasks = [];
    const auditLogs = [];
    for (let i = 0; i < tasksData.length; i++) {
      const taskData = tasksData[i];
      try {
        const task = await this.createTask(taskData, userId);
        tasks.push(task);
      } catch (error4) {
        throw new Error(
          `Bulk create failed at task ${i + 1}: ${error4.message}`
        );
      }
    }
    await this.logTaskOperation(
      "bulk_create",
      null,
      {
        total_tasks: tasksData.length,
        created_ids: tasks.map((t2) => t2.id),
        template_id: templateId
      },
      userId
    );
    return {
      success: true,
      created_count: tasks.length,
      tasks
    };
  }
  /**
   * Create task from template
   */
  async createFromTemplate(templateId, customData, userId) {
    const { results: templates } = await this.db.executeQuery(
      `
      SELECT tt.*, fa.name as farm_name
      FROM task_templates tt
      JOIN farms fa ON tt.farm_id = fa.id
      WHERE tt.id = ? AND fa.owner_id = ?
    `,
      [templateId, userId],
      {
        operation: "query",
        table: "task_templates",
        context: { getTemplate: true, templateId, userId }
      }
    );
    if (templates.length === 0) {
      throw new Error("Template not found or access denied");
    }
    const template = templates[0];
    const taskData = {
      farm_id: template.farm_id,
      title: customData.title || template.template_name,
      description: customData.description || template.description,
      priority: customData.priority || template.priority_level || "medium",
      estimated_duration: customData.estimated_duration || template.estimated_duration,
      dependencies: customData.dependencies || template.dependencies,
      task_category: template.category,
      ...customData
    };
    return await this.createTask(taskData, userId);
  }
  // === PRIVATE HELPER METHODS ===
  async hasUserAccessToTask(taskId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 1 FROM tasks t
      JOIN farm_members fm ON t.farm_id = fm.farm_id
      WHERE t.id = ? AND fm.user_id = ?
      LIMIT 1
    `,
      [taskId, userId],
      {
        operation: "query",
        table: "tasks",
        context: { hasUserAccessToTask: true }
      }
    );
    return results.length > 0;
  }
  async checkTaskDependencies(taskId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 
        COUNT(*) as dependent_count
      FROM tasks 
      WHERE dependencies LIKE '%' || ? || '%'
    `,
      [taskId.toString()],
      {
        operation: "query",
        table: "tasks",
        context: { checkTaskDependencies: true }
      }
    );
    const deps = results[0];
    return {
      hasReferences: deps.dependent_count > 0,
      dependent_count: deps.dependent_count
    };
  }
  async logTaskOperation(operation, taskId, data, userId) {
    try {
      await this.db.executeQuery(
        `
        INSERT INTO audit_logs (
          user_id, action, table_name, record_id, old_values, new_values, 
          timestamp, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          userId,
          `task.${operation}`,
          "tasks",
          taskId,
          data.before ? JSON.stringify(data.before) : null,
          data.after || data.created || JSON.stringify(data),
          (/* @__PURE__ */ new Date()).toISOString(),
          "system",
          "TaskRepository"
        ],
        {
          operation: "run",
          table: "audit_logs",
          context: { logTaskOperation: true }
        }
      );
    } catch (error4) {
      console.error("Failed to log task operation:", error4);
    }
  }
};

// api/repositories/crop-plan-repository.js
var CropPlanRepository = class extends BaseRepository {
  static {
    __name(this, "CropPlanRepository");
  }
  constructor(dbOperations) {
    super(dbOperations, "crop_plans");
  }
  /**
   * Find plans by farm
   */
  async findByFarm(farmId, options = {}) {
    return await this.findMany({ farm_id: farmId }, options);
  }
  /**
   * Create crop plan
   */
  async createPlan(planData, options = {}) {
    return await this.create(planData, options);
  }
};

// api/repositories/crop-activity-repository.js
var CropActivityRepository = class extends BaseRepository {
  static {
    __name(this, "CropActivityRepository");
  }
  constructor(dbOperations) {
    super(dbOperations, "crop_activities");
  }
  /**
   * Find activities by crop
   */
  async findByCrop(cropId, options = {}) {
    return await this.findMany({ crop_id: cropId }, options);
  }
  /**
   * Create activity
   */
  async createActivity(activityData, options = {}) {
    return await this.create(activityData, options);
  }
};

// api/repositories/crop-observation-repository.js
var CropObservationRepository = class extends BaseRepository {
  static {
    __name(this, "CropObservationRepository");
  }
  constructor(dbOperations) {
    super(dbOperations, "crop_observations");
  }
  /**
   * Find observations by crop
   */
  async findByCrop(cropId, options = {}) {
    return await this.findMany({ crop_id: cropId }, options);
  }
  /**
   * Create observation
   */
  async createObservation(observationData, options = {}) {
    return await this.create(observationData, options);
  }
};

// api/crops.js
function handleDbError(error4, context2) {
  console.error(`Error in ${context2}:`, error4);
  if (error4 instanceof DatabaseError) {
    switch (error4.code) {
      case DB_ERROR_CODES.NOT_FOUND:
        return createErrorResponse("Resource not found", 404);
      case DB_ERROR_CODES.DEPENDENCY_VIOLATION:
        return createErrorResponse(
          "Cannot delete resource due to existing dependencies",
          409
        );
      case DB_ERROR_CODES.INVALID_PARAMETER:
        return createErrorResponse(`Invalid data: ${error4.message}`, 400);
      case DB_ERROR_CODES.SUSPICIOUS_ACTIVITY:
        return createErrorResponse("Invalid request", 400);
    }
  }
  return createErrorResponse("Internal server error", 500);
}
__name(handleDbError, "handleDbError");
function getCropPathSegments(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const cropsIndex = segments.indexOf("crops");
  if (cropsIndex === -1) {
    return [];
  }
  return segments.slice(cropsIndex + 1);
}
__name(getCropPathSegments, "getCropPathSegments");
async function onRequest2(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;
  const dbOps = new DatabaseOperations(env2);
  const cropRepository = new CropRepository(dbOps);
  const routeSegments = getCropPathSegments(pathname);
  if (routeSegments[0] === "planning") {
    return await onRequestPlanning(context2);
  }
  if (routeSegments[0] === "rotation") {
    return await onRequestRotation(context2);
  }
  if (routeSegments[0] === "irrigation") {
    return await onRequestIrrigation(context2);
  }
  if (routeSegments[0] === "pests-diseases") {
    return await onRequestPestsDiseases(context2);
  }
  if (routeSegments[0] === "soil-health") {
    return await onRequestSoilHealth(context2);
  }
  try {
    const auth = new AuthUtils(env2);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      const cropId = url.searchParams.get("id");
      const activities = url.searchParams.get("activities");
      const observations = url.searchParams.get("observations");
      const yields = url.searchParams.get("yields");
      const fieldId = url.searchParams.get("field_id");
      const status = url.searchParams.get("status");
      if (cropId) {
        const crop = await cropRepository.findByIdWithDetails(cropId, user.id);
        if (!crop) {
          return createErrorResponse("Crop not found or access denied", 404);
        }
        if (activities === "true") {
          const activityRepo = new CropActivityRepository(dbOps);
          crop.activities = await activityRepo.findByCropId(
            cropId,
            user.id,
            20
          );
        }
        if (observations === "true") {
          const observationRepo = new CropObservationRepository(dbOps);
          crop.observations = await observationRepo.findByCropId(
            cropId,
            user.id,
            10
          );
        }
        if (yields === "true") {
          crop.yield_records = [];
        }
        return createSuccessResponse(crop);
      } else {
        const filters = {
          field_id: fieldId,
          status
          // Note: Analytics mode is implicitly handled by the repository's find logic
        };
        Object.keys(filters).forEach((key) => {
          if (filters[key] === null || filters[key] === void 0) {
            delete filters[key];
          }
        });
        const options = {
          sortBy: "planting_date",
          sortDirection: "DESC",
          page: parseInt(url.searchParams.get("page") || "1"),
          limit: parseInt(url.searchParams.get("limit") || "100")
        };
        const crops = await cropRepository.findByUserAccess(
          user.id,
          filters,
          options
        );
        return createSuccessResponse(crops || []);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const {
        farm_id,
        field_id,
        crop_type,
        planting_date
        // ... other fields
      } = body;
      if (!farm_id || !crop_type || !field_id || !planting_date) {
        return createErrorResponse(
          "Farm ID, crop type, field ID, and planting date are required",
          400
        );
      }
      try {
        await cropRepository.validateFieldAndRotation(
          field_id,
          farm_id,
          crop_type,
          user.id
        );
      } catch (error4) {
        if (error4.message.includes("Rotation violation")) {
          return createErrorResponse(
            `Crop rotation warning/violation: ${error4.message}`,
            400
          );
        }
        if (error4.message.includes("Field not found")) {
          return createErrorResponse(
            `Field ID ${field_id} is invalid or inaccessible.`,
            400
          );
        }
        throw error4;
      }
      const newCrop = await cropRepository.createCrop(body, user.id);
      return createSuccessResponse(newCrop, 201);
    } else if (method === "PUT") {
      const body = await request.json();
      const { id, ...updateData } = body;
      if (!id) {
        return createErrorResponse("Crop ID required", 400);
      }
      delete updateData.farm_id;
      delete updateData.field_id;
      delete updateData.crop_type;
      const updatedCrop = await cropRepository.updateCrop(
        id,
        updateData,
        user.id
      );
      return createSuccessResponse(updatedCrop);
    } else if (method === "DELETE") {
      const cropId = url.searchParams.get("id");
      if (!cropId) {
        return createErrorResponse("Crop ID required", 400);
      }
      const result = await cropRepository.deleteCrop(cropId, user.id);
      return createSuccessResponse(result);
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error4) {
    return handleDbError(error4, "onRequest");
  }
}
__name(onRequest2, "onRequest");
async function onRequestPlanning(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  const dbOps = new DatabaseOperations(env2);
  const planRepo = new CropPlanRepository(dbOps);
  try {
    const auth = new AuthUtils(env2);
    const user = await auth.getUserFromToken(request);
    if (!user) return createUnauthorizedResponse();
    if (method === "POST") {
      const body = await request.json();
      const {
        plan_name,
        field_id,
        crop_type,
        planting_date,
        expected_yield_unit,
        expected_price_unit,
        activities
      } = body;
      if (!plan_name || !field_id || !crop_type || !expected_yield_unit || !expected_price_unit || !activities || activities.length === 0) {
        return createErrorResponse(
          "Missing required planning fields (plan name, field, yield/price units, activities).",
          400
        );
      }
      const field = await dbOps.findById(
        "fields",
        field_id,
        "area_sqm, farm_id"
      );
      if (!field || field.farm_id !== user.farm_id) {
        return createErrorResponse("Invalid or inaccessible field ID.", 400);
      }
      const fieldArea = field.area_sqm;
      let projectedCost = 0;
      const calculatedActivities = [];
      for (const activity of activities) {
        const cost = parseFloat(activity.cost_per_unit) || 0;
        const rate = parseFloat(activity.units_used_per_sqm) || 0;
        const totalCost = fieldArea * rate * cost;
        projectedCost += totalCost;
        calculatedActivities.push({
          ...activity,
          total_projected_cost: totalCost
        });
      }
      const projectedRevenue = fieldArea * parseFloat(expected_yield_unit) * parseFloat(expected_price_unit);
      const projectedProfit = projectedRevenue - projectedCost;
      const planData = {
        plan_name,
        field_id,
        crop_type,
        planting_date,
        expected_yield_unit: parseFloat(expected_yield_unit),
        expected_price_unit: parseFloat(expected_price_unit),
        projected_revenue,
        projected_cost,
        projected_profit
        // ... other plan metadata
      };
      const newPlan = await planRepo.createPlanWithActivities(
        planData,
        calculatedActivities,
        user.id
      );
      return createSuccessResponse(newPlan, 201);
    } else if (method === "GET") {
      const plans = await planRepo.findByUserAccess(user.id);
      return createSuccessResponse(plans);
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error4) {
    return handleDbError(error4, "onRequestPlanning");
  }
}
__name(onRequestPlanning, "onRequestPlanning");
async function onRequestRotation(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  const dbOps = new DatabaseOperations(env2);
  const cropRepo = new CropRepository(dbOps);
  try {
    const auth = new AuthUtils(env2);
    const user = await auth.getUserFromToken(request);
    if (!user) return createUnauthorizedResponse();
    if (method === "POST") {
      const body = await request.json();
      const { action, farm_id, field_id, crop_sequence, notes, id } = body;
      if (action === "create") {
        const rotationData = {
          farm_id,
          field_id,
          crop_sequence,
          notes,
          user_id: user.id
        };
        return createSuccessResponse(
          { success: true, message: "Rotation plan created" },
          201
        );
      } else if (action === "list") {
        return createSuccessResponse([]);
      }
    }
    return createErrorResponse("Method not allowed", 405);
  } catch (error4) {
    return handleDbError(error4, "onRequestRotation");
  }
}
__name(onRequestRotation, "onRequestRotation");
async function onRequestIrrigation(context2) {
  const { request, env: env2 } = context2;
  const method = request.method;
  const dbOps = new DatabaseOperations(env2);
  try {
    const auth = new AuthUtils(env2);
    const user = await auth.getUserFromToken(request);
    if (!user) return createUnauthorizedResponse();
    if (method === "POST") {
      const body = await request.json();
      const { action, farm_id } = body;
      if (action === "list") {
        return createSuccessResponse([]);
      } else if (action === "analytics") {
        return createSuccessResponse({
          total_water_usage: 0,
          efficiency_score: 0,
          cost_savings: 0,
          next_schedules: []
        });
      }
    }
    return createErrorResponse("Method not allowed", 405);
  } catch (error4) {
    return handleDbError(error4, "onRequestIrrigation");
  }
}
__name(onRequestIrrigation, "onRequestIrrigation");
async function onRequestPestsDiseases(context2) {
  const { request, env: env2 } = context2;
  const method = request.method;
  const dbOps = new DatabaseOperations(env2);
  try {
    const auth = new AuthUtils(env2);
    const user = await auth.getUserFromToken(request);
    if (!user) return createUnauthorizedResponse();
    if (method === "POST") {
      const body = await request.json();
      const { action, farm_id } = body;
      if (action === "prevention_calendar") {
        return createSuccessResponse({ upcoming: [] });
      } else if (action === "disease_risk_assessment") {
        return createSuccessResponse({
          risk_assessment: { overall_risk: "low" }
        });
      }
    }
    return createErrorResponse("Method not allowed", 405);
  } catch (error4) {
    return handleDbError(error4, "onRequestPestsDiseases");
  }
}
__name(onRequestPestsDiseases, "onRequestPestsDiseases");
async function onRequestSoilHealth(context2) {
  const { request, env: env2 } = context2;
  const method = request.method;
  const dbOps = new DatabaseOperations(env2);
  try {
    const auth = new AuthUtils(env2);
    const user = await auth.getUserFromToken(request);
    if (!user) return createUnauthorizedResponse();
    if (method === "POST") {
      const body = await request.json();
      const { action, farm_id } = body;
      if (action === "metrics") {
        return createSuccessResponse({
          ph_balance: "neutral",
          nutrient_status: "adequate",
          organic_matter_status: "moderate",
          next_test_recommended: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else if (action === "recommendations") {
        return createSuccessResponse({ recommendations: [] });
      }
    }
    return createErrorResponse("Method not allowed", 405);
  } catch (error4) {
    return handleDbError(error4, "onRequestSoilHealth");
  }
}
__name(onRequestSoilHealth, "onRequestSoilHealth");

// api/livestock/index.js
var NESTED_ENTITIES = /* @__PURE__ */ new Set([
  "health-records",
  "production",
  "breeding",
  "feeding",
  "movements"
  // Fully implemented
]);
var INTAKE_TYPES = /* @__PURE__ */ new Set(["Birth", "Purchase", "Transfer"]);
function getLivestockPathSegments(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const livestockIndex = segments.indexOf("livestock");
  if (livestockIndex === -1) {
    return [];
  }
  return segments.slice(livestockIndex + 1);
}
__name(getLivestockPathSegments, "getLivestockPathSegments");
async function checkAnimalAccess(db, userId, animalId, requiredRoles = null) {
  try {
    const query = `
      SELECT a.farm_id, fm.role
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE a.id = ? AND fm.user_id = ?
      LIMIT 1
    `;
    const { data } = await db.executeQuery(query, [animalId, userId], {
      operation: "first"
    });
    if (!data) {
      return null;
    }
    if (requiredRoles && !requiredRoles.includes(data.role)) {
      return null;
    }
    return data.farm_id;
  } catch (error4) {
    console.error("Error checking animal access:", error4);
    return null;
  }
}
__name(checkAnimalAccess, "checkAnimalAccess");
function handleDbError2(error4, context2) {
  console.error(`Error in ${context2}:`, error4);
  if (error4 instanceof DatabaseError) {
    switch (error4.code) {
      case DB_ERROR_CODES.NOT_FOUND:
        return createErrorResponse("Resource not found", 404);
      case DB_ERROR_CODES.DEPENDENCY_VIOLATION:
        return createErrorResponse(
          "Cannot delete resource due to existing dependencies",
          409
        );
      case DB_ERROR_CODES.INVALID_PARAMETER:
        return createErrorResponse(`Invalid data: ${error4.message}`, 400);
      case DB_ERROR_CODES.SUSPICIOUS_ACTIVITY:
        return createErrorResponse("Invalid request", 400);
    }
  }
  return createErrorResponse("Internal server error", 500);
}
__name(handleDbError2, "handleDbError");
async function onRequest3(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;
  const db = new DatabaseOperations(env2);
  const animalRepo = new AnimalRepository(db);
  try {
    const auth = new AuthUtils(env2);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    const routeSegments = getLivestockPathSegments(pathname);
    if (routeSegments.length === 0) {
      if (method === "GET") {
        return await handleGetLivestock(context2, user, animalRepo);
      }
      if (method === "POST") {
        return await handleCreateAnimal(context2, user, db, animalRepo);
      }
      return createErrorResponse("Method not allowed", 405);
    }
    const firstSegment = routeSegments[0];
    if (firstSegment === "stats" && routeSegments.length === 1) {
      if (method === "GET") {
        return await handleLivestockStats(context2, user, db);
      }
      return createErrorResponse("Method not allowed", 405);
    }
    const animalId = firstSegment;
    if (routeSegments.length === 1) {
      if (method === "GET") {
        return await getAnimalById(context2, user, animalId, animalRepo);
      }
      if (method === "PUT") {
        return await updateAnimal(context2, user, animalId, db, animalRepo);
      }
      if (method === "DELETE") {
        return await deleteAnimal(context2, user, animalId, db);
      }
      return createErrorResponse("Method not allowed", 405);
    }
    const nestedResource = routeSegments[1];
    const recordId = routeSegments[2] || null;
    if (routeSegments.length === 2 && nestedResource === "pedigree") {
      if (method === "GET") {
        const farmId = await checkAnimalAccess(db, user.id, animalId);
        if (!farmId) {
          return createErrorResponse("Animal not found or access denied", 404);
        }
        return await handleGetPedigree(context2, user, animalId, db);
      }
      return createErrorResponse("Method not allowed", 405);
    }
    if (NESTED_ENTITIES.has(nestedResource)) {
      const farmId = await checkAnimalAccess(db, user.id, animalId);
      if (!farmId) {
        return createErrorResponse("Animal not found or access denied", 404);
      }
      const nestedContext = { ...context2, recordId, farmId };
      switch (nestedResource) {
        case "health-records":
          return handleHealthRecords(nestedContext, user, animalId, db);
        case "production":
          return handleProductionRecords(nestedContext, user, animalId, db);
        case "breeding":
          return handleBreedingRecords(nestedContext, user, animalId, db);
        case "feeding":
          return handleFeedingRecords(nestedContext, user, animalId, db);
        case "movements":
          return handleMovementRecords(nestedContext, user, animalId, db);
      }
    }
    return createErrorResponse("Invalid endpoint", 404);
  } catch (error4) {
    return handleDbError2(error4, "onRequest");
  }
}
__name(onRequest3, "onRequest");
async function handleGetLivestock(context2, user, animalRepo) {
  const url = new URL(context2.request.url);
  const {
    species,
    breed,
    health_status,
    sex,
    farm_id,
    search,
    current_location_id,
    // Added filter
    page = 1,
    limit = 20,
    sort_by = "created_at",
    sort_order = "desc"
  } = Object.fromEntries(url.searchParams);
  try {
    const filters = {
      species,
      breed,
      health_status,
      sex,
      farm_id,
      search,
      current_location_id
    };
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: sort_by,
      sortDirection: sort_order
    };
    const animals = await animalRepo.findByUserAccess(
      user.id,
      filters,
      options
    );
    const total = await animalRepo.countByUserAccess(user.id, filters);
    return createSuccessResponse({
      animals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error4) {
    return handleDbError2(error4, "handleGetLivestock");
  }
}
__name(handleGetLivestock, "handleGetLivestock");
async function getAnimalById(context2, user, animalId, animalRepo) {
  try {
    const animal = await animalRepo.findWithDetails(animalId, user.id);
    if (!animal) {
      return createErrorResponse("Animal not found or access denied", 404);
    }
    return createSuccessResponse(animal);
  } catch (error4) {
    return handleDbError2(error4, "getAnimalById");
  }
}
__name(getAnimalById, "getAnimalById");
async function handleCreateAnimal(context2, user, db, animalRepo) {
  try {
    const body = await context2.request.json();
    const {
      farm_id,
      name,
      species,
      breed,
      sex,
      identification_tag,
      intake_type,
      intake_date,
      purchase_price,
      seller_details,
      // Intake Fields
      father_id,
      mother_id,
      current_location_id
      // Location Field
      // ... other optional fields like birth_date, health_status
    } = body;
    if (!farm_id || !name || !species || !intake_type || !intake_date) {
      return createErrorResponse(
        "Farm ID, name, species, intake type, and intake date are required",
        400
      );
    }
    if (!INTAKE_TYPES.has(intake_type)) {
      return createErrorResponse(
        "Invalid intake_type. Must be Birth, Purchase, or Transfer.",
        400
      );
    }
    if (intake_type === "Purchase" && (!purchase_price || isNaN(parseFloat(purchase_price)) || parseFloat(purchase_price) <= 0)) {
      return createErrorResponse(
        "Purchase intake requires a valid positive purchase_price.",
        400
      );
    }
    if (intake_type === "Birth" && !mother_id) {
      return createErrorResponse("Birth intake requires a mother_id.", 400);
    }
    if (current_location_id) {
      const locationCheck = await db.findById(
        "locations",
        current_location_id,
        "farm_id",
        { userId: user.id }
      );
      if (!locationCheck || locationCheck.farm_id !== farm_id) {
        return createErrorResponse(
          "Invalid or inaccessible current_location_id.",
          400
        );
      }
    }
    if (father_id || mother_id) {
      const parentIds = [father_id, mother_id].filter((id) => id);
      const parentRecords = await db.findMany(
        "animals",
        { id: parentIds },
        { userId: user.id, columns: "id, farm_id, species, sex" }
      );
      if (parentRecords.data.length !== parentIds.length) {
        return createErrorResponse(
          "One or more parent IDs were not found.",
          404
        );
      }
      for (const parent of parentRecords.data) {
        if (parent.farm_id !== farm_id || parent.species !== species) {
          return createErrorResponse(
            `Parent animal (ID: ${parent.id}) failed farm/species validation.`,
            400
          );
        }
        if (father_id && parent.id === father_id && parent.sex !== "male") {
          return createErrorResponse(
            "Father ID must refer to a male animal.",
            400
          );
        }
        if (mother_id && parent.id === mother_id && parent.sex !== "female") {
          return createErrorResponse(
            "Mother ID must refer to a female animal.",
            400
          );
        }
      }
    }
    const animalData = {
      farm_id,
      name,
      species,
      breed: breed || null,
      sex,
      identification_tag,
      intake_type,
      intake_date,
      purchase_price: purchase_price || null,
      seller_details: seller_details || null,
      father_id: father_id || null,
      mother_id: mother_id || null,
      current_location_id: current_location_id || null,
      health_status: body.health_status || "healthy",
      // If intake_type is Birth, use intake_date as birth_date
      birth_date: body.birth_date || (intake_type === "Birth" ? intake_date : null)
    };
    const newAnimal = await animalRepo.createWithValidation(
      animalData,
      user.id
    );
    const detailedAnimal = await animalRepo.findWithDetails(
      newAnimal.id,
      user.id
    );
    return createSuccessResponse(detailedAnimal, 201);
  } catch (error4) {
    if (error4.message.includes("Farm not found") || error4.message.includes("Breed not found")) {
      return createErrorResponse(error4.message, 400);
    }
    return handleDbError2(error4, "handleCreateAnimal");
  }
}
__name(handleCreateAnimal, "handleCreateAnimal");
async function updateAnimal(context2, user, animalId, db, animalRepo) {
  try {
    const body = await context2.request.json();
    delete body.farm_id;
    delete body.intake_type;
    const { current_location_id, ...updateData } = body;
    const farmId = await checkAnimalAccess(db, user.id, animalId);
    if (!farmId) {
      return createErrorResponse("Animal not found or access denied", 404);
    }
    if (current_location_id) {
      const locationCheck = await db.findById(
        "locations",
        current_location_id,
        "farm_id",
        { userId: user.id }
      );
      if (!locationCheck || locationCheck.farm_id !== farmId) {
        return createErrorResponse(
          "Invalid or inaccessible current_location_id for update.",
          400
        );
      }
      updateData.current_location_id = current_location_id;
    }
    if (Object.keys(updateData).length === 0) {
      return createErrorResponse("No valid fields to update", 400);
    }
    await db.updateById("animals", animalId, updateData, { userId: user.id });
    const updatedAnimal = await animalRepo.findWithDetails(animalId, user.id);
    return createSuccessResponse(updatedAnimal);
  } catch (error4) {
    return handleDbError2(error4, "updateAnimal");
  }
}
__name(updateAnimal, "updateAnimal");
async function deleteAnimal(context2, user, animalId, db) {
  try {
    const farmId = await checkAnimalAccess(db, user.id, animalId, [
      "owner",
      "manager",
      "admin"
    ]);
    if (!farmId) {
      return createErrorResponse(
        "Animal not found or insufficient permissions",
        404
      );
    }
    await db.deleteById("animals", animalId, { userId: user.id });
    return createSuccessResponse({ success: true });
  } catch (error4) {
    return handleDbError2(error4, "deleteAnimal");
  }
}
__name(deleteAnimal, "deleteAnimal");
async function handleHealthRecords(context2, user, animalId, db) {
  const { request, recordId } = context2;
  const method = request.method;
  const numericAnimalId = Number(animalId);
  try {
    if (method === "GET") {
      if (recordId) {
        const record = await fetchHealthRecordById(
          db,
          user.id,
          Number(recordId)
        );
        if (!record || record.animal_id !== numericAnimalId) {
          return createErrorResponse("Health record not found", 404);
        }
        return createSuccessResponse(record);
      }
      const url = new URL(request.url);
      const recordType = url.searchParams.get("record_type");
      const status = url.searchParams.get("status");
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");
      let query = `
        SELECT hr.*, a.name as animal_name, u.name as recorded_by_name
        FROM animal_health_records hr
        JOIN animals a ON hr.animal_id = a.id
        LEFT JOIN users u ON hr.created_by = u.id
        WHERE hr.animal_id = ?
      `;
      const params = [numericAnimalId];
      if (recordType) {
        query += " AND hr.record_type = ?";
        params.push(recordType);
      }
      if (status === "overdue") {
        query += " AND hr.next_due_date < date('now') AND hr.next_due_date IS NOT NULL";
      } else if (status === "upcoming") {
        query += " AND hr.next_due_date BETWEEN date('now') AND date('now', '+7 days') AND hr.next_due_date IS NOT NULL";
      }
      if (dateFrom) {
        query += " AND hr.record_date >= ?";
        params.push(dateFrom);
      }
      if (dateTo) {
        query += " AND hr.record_date <= ?";
        params.push(dateTo);
      }
      query += " ORDER BY hr.record_date DESC, hr.created_at DESC";
      const { data } = await db.executeQuery(query, params, {
        operation: "all",
        table: "animal_health_records",
        userId: user.id
      });
      return createSuccessResponse(data || []);
    }
    if (method === "POST") {
      const body = await request.json();
      const {
        record_date,
        record_type,
        vet_name,
        diagnosis,
        treatment,
        medication,
        dosage,
        cost,
        next_due_date,
        vet_contact,
        notes
      } = body;
      if (!record_date || !record_type) {
        return createErrorResponse(
          "Record date and record type are required",
          400
        );
      }
      const recordData = {
        animal_id: numericAnimalId,
        record_date,
        record_type,
        vet_name: toNullableString(vet_name),
        diagnosis: toNullableString(diagnosis),
        treatment: toNullableString(treatment),
        medication: toNullableString(medication),
        dosage: toNullableString(dosage),
        cost: toNullableNumber(cost),
        next_due_date: toNullableString(next_due_date),
        vet_contact: toNullableString(vet_contact),
        notes: toNullableString(notes),
        created_by: user.id
      };
      const created = await db.create("animal_health_records", recordData, {
        userId: user.id
      });
      const enriched = await fetchHealthRecordById(db, user.id, created?.id) || created;
      return createSuccessResponse(enriched, 201);
    }
    if (method === "PUT") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }
      const existing = await db.findById(
        "animal_health_records",
        recordId,
        "*",
        { userId: user.id }
      );
      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Health record not found", 404);
      }
      const body = await request.json();
      const updateData = {};
      const fieldMap = {
        record_date: body.record_date,
        record_type: body.record_type,
        vet_name: body.vet_name,
        diagnosis: body.diagnosis,
        treatment: body.treatment,
        medication: body.medication,
        dosage: body.dosage,
        cost: body.cost,
        next_due_date: body.next_due_date,
        vet_contact: body.vet_contact,
        notes: body.notes
      };
      for (const [key, value] of Object.entries(fieldMap)) {
        if (value !== void 0) {
          updateData[key] = key === "cost" ? toNullableNumber(value) : sanitizeNullableValue(value);
        }
      }
      if (Object.keys(updateData).length === 0) {
        return createErrorResponse("No fields provided for update", 400);
      }
      updateData.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      const updated = await db.updateById(
        "animal_health_records",
        recordId,
        updateData,
        { userId: user.id }
      );
      const enriched = await fetchHealthRecordById(db, user.id, updated?.id) || updated;
      return createSuccessResponse(enriched);
    }
    if (method === "DELETE") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }
      const existing = await db.findById(
        "animal_health_records",
        recordId,
        "animal_id",
        { userId: user.id }
      );
      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Health record not found", 404);
      }
      await db.deleteById("animal_health_records", recordId, {
        userId: user.id
      });
      return createSuccessResponse({ success: true });
    }
    return createErrorResponse("Method not allowed", 405);
  } catch (error4) {
    return handleDbError2(error4, "handleHealthRecords");
  }
}
__name(handleHealthRecords, "handleHealthRecords");
async function handleProductionRecords(context2, user, animalId, db) {
  const { request, recordId } = context2;
  const method = request.method;
  const numericAnimalId = Number(animalId);
  try {
    if (method === "GET") {
      if (recordId) {
        const record = await fetchProductionRecordById(
          db,
          user.id,
          Number(recordId)
        );
        if (!record || record.animal_id !== numericAnimalId) {
          return createErrorResponse("Production record not found", 404);
        }
        return createSuccessResponse(record);
      }
      const url = new URL(request.url);
      const date = url.searchParams.get("date");
      let query = `
        SELECT pr.*, a.name as animal_name, u.name as recorded_by_name
        FROM animal_production pr
        JOIN animals a ON pr.animal_id = a.id
        LEFT JOIN users u ON pr.recorded_by = u.id
        WHERE pr.animal_id = ?
      `;
      const params = [numericAnimalId];
      if (date) {
        query += " AND pr.production_date = ?";
        params.push(date);
      }
      query += " ORDER BY pr.production_date DESC, pr.created_at DESC, pr.id DESC";
      const { data } = await db.executeQuery(query, params, {
        operation: "all",
        table: "animal_production",
        userId: user.id
      });
      return createSuccessResponse(data || []);
    }
    if (method === "POST") {
      const body = await request.json();
      const {
        production_date,
        production_type,
        quantity,
        unit,
        quality_grade,
        price_per_unit,
        total_value,
        market_destination,
        storage_location,
        notes
      } = body;
      if (!production_date || !production_type) {
        return createErrorResponse(
          "Production date and type are required",
          400
        );
      }
      const normalizedQuantity = Number(quantity);
      if (Number.isNaN(normalizedQuantity)) {
        return createErrorResponse("Quantity must be a number", 400);
      }
      const pricePerUnit = toNullableNumber(price_per_unit);
      const computedTotal = total_value !== void 0 && total_value !== null ? toNullableNumber(total_value) : pricePerUnit !== null ? Number((normalizedQuantity * pricePerUnit).toFixed(2)) : null;
      const recordData = {
        animal_id: numericAnimalId,
        production_date,
        production_type,
        quantity: normalizedQuantity,
        unit: toNullableString(unit),
        quality_grade: toNullableString(quality_grade),
        price_per_unit: pricePerUnit,
        total_value: computedTotal,
        market_destination: toNullableString(market_destination),
        storage_location: toNullableString(storage_location),
        notes: toNullableString(notes),
        recorded_by: user.id
      };
      const created = await db.create("animal_production", recordData, {
        userId: user.id
      });
      const enriched = await fetchProductionRecordById(db, user.id, created?.id) || created;
      return createSuccessResponse(enriched, 201);
    }
    if (method === "PUT") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }
      const existing = await db.findById("animal_production", recordId, "*", {
        userId: user.id
      });
      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Production record not found", 404);
      }
      const body = await request.json();
      const updateData = {};
      if (body.production_date !== void 0) {
        updateData.production_date = sanitizeNullableValue(
          body.production_date
        );
      }
      if (body.production_type !== void 0) {
        updateData.production_type = sanitizeNullableValue(
          body.production_type
        );
      }
      if (body.quantity !== void 0) {
        const normalizedQuantity = Number(body.quantity);
        if (Number.isNaN(normalizedQuantity)) {
          return createErrorResponse("Quantity must be a number", 400);
        }
        updateData.quantity = normalizedQuantity;
      }
      if (body.unit !== void 0) {
        updateData.unit = toNullableString(body.unit);
      }
      if (body.quality_grade !== void 0) {
        updateData.quality_grade = toNullableString(body.quality_grade);
      }
      if (body.price_per_unit !== void 0) {
        updateData.price_per_unit = toNullableNumber(body.price_per_unit);
      }
      if (body.total_value !== void 0) {
        updateData.total_value = toNullableNumber(body.total_value);
      }
      if (body.market_destination !== void 0) {
        updateData.market_destination = toNullableString(
          body.market_destination
        );
      }
      if (body.storage_location !== void 0) {
        updateData.storage_location = toNullableString(body.storage_location);
      }
      if (body.notes !== void 0) {
        updateData.notes = toNullableString(body.notes);
      }
      if (Object.keys(updateData).length === 0) {
        return createErrorResponse("No fields provided for update", 400);
      }
      updateData.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      const updated = await db.updateById(
        "animal_production",
        recordId,
        updateData,
        { userId: user.id }
      );
      const enriched = await fetchProductionRecordById(db, user.id, updated?.id) || updated;
      return createSuccessResponse(enriched);
    }
    if (method === "DELETE") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }
      const existing = await db.findById(
        "animal_production",
        recordId,
        "animal_id",
        { userId: user.id }
      );
      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Production record not found", 404);
      }
      await db.deleteById("animal_production", recordId, {
        userId: user.id
      });
      return createSuccessResponse({ success: true });
    }
    return createErrorResponse("Method not allowed", 405);
  } catch (error4) {
    return handleDbError2(error4, "handleProductionRecords");
  }
}
__name(handleProductionRecords, "handleProductionRecords");
async function handleBreedingRecords(context2, user, animalId, db) {
  const { request, recordId, farmId } = context2;
  const method = request.method;
  const numericAnimalId = Number(animalId);
  try {
    if (method === "GET") {
      if (recordId) {
        const record = await fetchBreedingRecordById(
          db,
          user.id,
          Number(recordId)
        );
        if (!record || record.animal_id !== numericAnimalId) {
          return createErrorResponse("Breeding record not found", 404);
        }
        return createSuccessResponse(record);
      }
      let query = `
        SELECT br.*, sire.name as sire_name, u.name as created_by_name
        FROM animal_breeding br
        LEFT JOIN animals sire ON br.partner_id = sire.id
        LEFT JOIN users u ON br.created_by = u.id
        WHERE br.animal_id = ?
        ORDER BY br.breeding_date DESC, br.created_at DESC, br.id DESC
      `;
      const { data } = await db.executeQuery(query, [numericAnimalId], {
        operation: "all",
        table: "animal_breeding",
        userId: user.id
      });
      const normalized = (data || []).map(
        (record) => normalizeBreedingRecord(record)
      );
      return createSuccessResponse(normalized);
    }
    if (method === "POST") {
      const body = await request.json();
      const {
        breeding_date,
        breeding_type,
        sire_id,
        breeding_fee,
        expected_calving_date,
        actual_calving_date,
        breeding_result,
        offspring_count,
        breeding_notes,
        vet_supervision
      } = body;
      if (!breeding_date || !breeding_type) {
        return createErrorResponse("Breeding date and type are required", 400);
      }
      if (sire_id) {
        const sireFarmId = await checkAnimalAccess(db, user.id, sire_id);
        if (!sireFarmId || farmId && sireFarmId !== farmId) {
          return createErrorResponse("Invalid sire selection", 400);
        }
      }
      const recordData = {
        animal_id: numericAnimalId,
        breeding_date,
        breeding_type,
        partner_id: sire_id || null,
        breeding_fee: toNullableNumber(breeding_fee),
        expected_birth_date: toNullableString(expected_calving_date),
        actual_birth_date: toNullableString(actual_calving_date),
        breeding_result: toNullableString(breeding_result),
        offspring_count: toNullableInt(offspring_count),
        notes: toNullableString(breeding_notes),
        vet_supervision: vet_supervision ? 1 : 0,
        created_by: user.id
      };
      const created = await db.create("animal_breeding", recordData, {
        userId: user.id
      });
      const enriched = await fetchBreedingRecordById(db, user.id, created?.id) || created;
      return createSuccessResponse(enriched, 201);
    }
    if (method === "PUT") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }
      const existing = await db.findById("animal_breeding", recordId, "*", {
        userId: user.id
      });
      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Breeding record not found", 404);
      }
      const body = await request.json();
      const updateData = {};
      if (body.breeding_date !== void 0) {
        updateData.breeding_date = sanitizeNullableValue(body.breeding_date);
      }
      if (body.breeding_type !== void 0) {
        updateData.breeding_type = sanitizeNullableValue(body.breeding_type);
      }
      if (body.sire_id !== void 0) {
        if (body.sire_id) {
          const sireFarmId = await checkAnimalAccess(db, user.id, body.sire_id);
          if (!sireFarmId || farmId && sireFarmId !== farmId) {
            return createErrorResponse("Invalid sire selection", 400);
          }
        }
        updateData.partner_id = body.sire_id || null;
      }
      if (body.breeding_fee !== void 0) {
        updateData.breeding_fee = toNullableNumber(body.breeding_fee);
      }
      if (body.expected_calving_date !== void 0) {
        updateData.expected_birth_date = toNullableString(
          body.expected_calving_date
        );
      }
      if (body.actual_calving_date !== void 0) {
        updateData.actual_birth_date = toNullableString(
          body.actual_calving_date
        );
      }
      if (body.breeding_result !== void 0) {
        updateData.breeding_result = toNullableString(body.breeding_result);
      }
      if (body.offspring_count !== void 0) {
        updateData.offspring_count = toNullableInt(body.offspring_count);
      }
      if (body.breeding_notes !== void 0) {
        updateData.notes = toNullableString(body.breeding_notes);
      }
      if (body.vet_supervision !== void 0) {
        updateData.vet_supervision = body.vet_supervision ? 1 : 0;
      }
      if (Object.keys(updateData).length === 0) {
        return createErrorResponse("No fields provided for update", 400);
      }
      updateData.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      const updated = await db.updateById(
        "animal_breeding",
        recordId,
        updateData,
        { userId: user.id }
      );
      const enriched = await fetchBreedingRecordById(db, user.id, updated?.id) || updated;
      return createSuccessResponse(enriched);
    }
    if (method === "DELETE") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }
      const existing = await db.findById(
        "animal_breeding",
        recordId,
        "animal_id",
        { userId: user.id }
      );
      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Breeding record not found", 404);
      }
      await db.deleteById("animal_breeding", recordId, { userId: user.id });
      return createSuccessResponse({ success: true });
    }
    return createErrorResponse("Method not allowed", 405);
  } catch (error4) {
    return handleDbError2(error4, "handleBreedingRecords");
  }
}
__name(handleBreedingRecords, "handleBreedingRecords");
async function handleFeedingRecords(context2, user, animalId, db) {
  const { request, recordId } = context2;
  const method = request.method;
  const numericAnimalId = Number(animalId);
  try {
    if (method === "GET") {
      if (recordId) {
        const record = await fetchFeedingRecordById(
          db,
          user.id,
          Number(recordId)
        );
        if (!record || record.animal_id !== numericAnimalId) {
          return createErrorResponse("Feeding record not found", 404);
        }
        return createSuccessResponse(record);
      }
      const url = new URL(request.url);
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");
      let query = `
        SELECT fr.*, a.name as animal_name, u.name as recorded_by_name
        FROM animal_feeding_records fr
        JOIN animals a ON fr.animal_id = a.id
        LEFT JOIN users u ON fr.recorded_by = u.id
        WHERE fr.animal_id = ?
      `;
      const params = [numericAnimalId];
      if (dateFrom) {
        query += " AND fr.feeding_date >= ?";
        params.push(dateFrom);
      }
      if (dateTo) {
        query += " AND fr.feeding_date <= ?";
        params.push(dateTo);
      }
      query += " ORDER BY fr.feeding_date DESC, fr.created_at DESC";
      const { data } = await db.executeQuery(query, params, {
        operation: "all",
        table: "animal_feeding_records",
        userId: user.id
      });
      return createSuccessResponse(data || []);
    }
    if (method === "POST") {
      const body = await request.json();
      const {
        feeding_date,
        feed_type,
        quantity,
        unit,
        feeding_method,
        ration_details,
        nutrition_notes,
        cost,
        notes
      } = body;
      if (!feeding_date || !feed_type) {
        return createErrorResponse(
          "Feeding date and feed type are required",
          400
        );
      }
      const normalizedQuantity = Number(quantity);
      if (Number.isNaN(normalizedQuantity)) {
        return createErrorResponse("Quantity must be a number", 400);
      }
      const recordData = {
        animal_id: numericAnimalId,
        feeding_date,
        feed_type,
        quantity: normalizedQuantity,
        unit: toNullableString(unit),
        feeding_method: toNullableString(feeding_method),
        ration_details: toNullableString(ration_details),
        nutrition_notes: toNullableString(nutrition_notes),
        cost: toNullableNumber(cost),
        notes: toNullableString(notes),
        recorded_by: user.id
      };
      const created = await db.create("animal_feeding_records", recordData, {
        userId: user.id
      });
      const enriched = await fetchFeedingRecordById(db, user.id, created?.id) || created;
      return createSuccessResponse(enriched, 201);
    }
    if (method === "PUT") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }
      const existing = await db.findById(
        "animal_feeding_records",
        recordId,
        "*",
        { userId: user.id }
      );
      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Feeding record not found", 404);
      }
      const body = await request.json();
      const updateData = {};
      if (body.feeding_date !== void 0) {
        updateData.feeding_date = sanitizeNullableValue(body.feeding_date);
      }
      if (body.feed_type !== void 0) {
        updateData.feed_type = sanitizeNullableValue(body.feed_type);
      }
      if (body.quantity !== void 0) {
        const normalizedQuantity = Number(body.quantity);
        if (Number.isNaN(normalizedQuantity)) {
          return createErrorResponse("Quantity must be a number", 400);
        }
        updateData.quantity = normalizedQuantity;
      }
      if (body.unit !== void 0) {
        updateData.unit = toNullableString(body.unit);
      }
      if (body.feeding_method !== void 0) {
        updateData.feeding_method = toNullableString(body.feeding_method);
      }
      if (body.ration_details !== void 0) {
        updateData.ration_details = toNullableString(body.ration_details);
      }
      if (body.nutrition_notes !== void 0) {
        updateData.nutrition_notes = toNullableString(body.nutrition_notes);
      }
      if (body.cost !== void 0) {
        updateData.cost = toNullableNumber(body.cost);
      }
      if (body.notes !== void 0) {
        updateData.notes = toNullableString(body.notes);
      }
      if (Object.keys(updateData).length === 0) {
        return createErrorResponse("No fields provided for update", 400);
      }
      updateData.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      const updated = await db.updateById(
        "animal_feeding_records",
        recordId,
        updateData,
        { userId: user.id }
      );
      const enriched = await fetchFeedingRecordById(db, user.id, updated?.id) || updated;
      return createSuccessResponse(enriched);
    }
    if (method === "DELETE") {
      if (!recordId) {
        return createErrorResponse("Record ID is required", 400);
      }
      const existing = await db.findById(
        "animal_feeding_records",
        recordId,
        "animal_id",
        { userId: user.id }
      );
      if (!existing || existing.animal_id !== numericAnimalId) {
        return createErrorResponse("Feeding record not found", 404);
      }
      await db.deleteById("animal_feeding_records", recordId, {
        userId: user.id
      });
      return createSuccessResponse({ success: true });
    }
    return createErrorResponse("Method not allowed", 405);
  } catch (error4) {
    return handleDbError2(error4, "handleFeedingRecords");
  }
}
__name(handleFeedingRecords, "handleFeedingRecords");
async function handleMovementRecords(context2, user, animalId, db) {
  const { request, recordId } = context2;
  const method = request.method;
  try {
    if (method === "GET") {
      const { data } = await db.findMany(
        "animal_movements",
        { animal_id: animalId },
        { orderBy: "movement_date DESC", userId: user.id, operation: "all" }
      );
      return createSuccessResponse(data || []);
    }
    if (method === "POST") {
      const body = await request.json();
      const { destination_location_id, movement_date, notes } = body;
      if (!destination_location_id || !movement_date) {
        return createErrorResponse(
          "Destination location ID and movement date are required.",
          400
        );
      }
      const animal = await db.findById(
        "animals",
        animalId,
        "current_location_id, farm_id",
        { userId: user.id }
      );
      const destination = await db.findById(
        "locations",
        destination_location_id,
        "farm_id",
        { userId: user.id }
      );
      if (!destination || destination.farm_id !== animal.farm_id) {
        return createErrorResponse(
          "Destination location not found or inaccessible.",
          400
        );
      }
      const movementData = {
        animal_id: animalId,
        source_location_id: animal.current_location_id,
        destination_location_id,
        movement_date,
        recorded_by: user.id,
        notes: notes || null
      };
      const result = await db.create("animal_movements", movementData, {
        userId: user.id
      });
      await db.updateById(
        "animals",
        animalId,
        { current_location_id: destination_location_id },
        { userId: user.id }
      );
      const createdRecord = await db.findById("animal_movements", result.id);
      return createSuccessResponse(createdRecord, 201);
    }
    return createErrorResponse("Method not allowed", 405);
  } catch (error4) {
    return handleDbError2(error4, "handleMovementRecords");
  }
}
__name(handleMovementRecords, "handleMovementRecords");
async function buildPedigreeTree(db, animalId, userId, depth = 0, maxDepth = 3) {
  if (!animalId || depth >= maxDepth) {
    return null;
  }
  const animal = await db.findById(
    "animals",
    animalId,
    "id, name, sex, species, father_id, mother_id",
    { userId }
  );
  if (!animal) {
    return null;
  }
  const father = await buildPedigreeTree(
    db,
    animal.father_id,
    userId,
    depth + 1,
    maxDepth
  );
  const mother = await buildPedigreeTree(
    db,
    animal.mother_id,
    userId,
    depth + 1,
    maxDepth
  );
  return {
    id: animal.id,
    name: animal.name,
    sex: animal.sex,
    generation: depth,
    // Only include parents if one or both exist
    parents: father || mother ? { father, mother } : null
  };
}
__name(buildPedigreeTree, "buildPedigreeTree");
async function handleGetPedigree(context2, user, animalId, db) {
  try {
    const pedigree = await buildPedigreeTree(db, animalId, user.id, 0, 3);
    if (!pedigree) {
      return createErrorResponse(
        "Animal not found or no pedigree data available.",
        404
      );
    }
    return createSuccessResponse(pedigree);
  } catch (error4) {
    return handleDbError2(error4, "handleGetPedigree");
  }
}
__name(handleGetPedigree, "handleGetPedigree");
async function handleLivestockStats(context2, user, db) {
  try {
    const speciesQuery = `
          SELECT a.species, COUNT(a.id) as count
          FROM animals a
          JOIN farm_members fm ON a.farm_id = fm.farm_id
          WHERE fm.user_id = ?
          GROUP BY a.species
        `;
    const { data: speciesStats } = await db.executeQuery(
      speciesQuery,
      [user.id],
      { operation: "all" }
    );
    const healthQuery = `
          SELECT a.health_status, COUNT(a.id) as count
          FROM animals a
          JOIN farm_members fm ON a.farm_id = fm.farm_id
          WHERE fm.user_id = ?
          GROUP BY a.health_status
        `;
    const { data: healthStats } = await db.executeQuery(
      healthQuery,
      [user.id],
      { operation: "all" }
    );
    const locationQuery = `
            SELECT l.name as location_name, COUNT(a.id) as count
            FROM animals a
            JOIN locations l ON a.current_location_id = l.id
            JOIN farm_members fm ON a.farm_id = fm.farm_id
            WHERE fm.user_id = ?
            GROUP BY l.name
        `;
    const { data: locationStats } = await db.executeQuery(
      locationQuery,
      [user.id],
      { operation: "all" }
    );
    const total = speciesStats.reduce((acc, cur) => acc + cur.count, 0);
    return createSuccessResponse({
      total_animals: total,
      by_species: speciesStats,
      by_health_status: healthStats,
      by_location: locationStats
    });
  } catch (error4) {
    return handleDbError2(error4, "handleLivestockStats");
  }
}
__name(handleLivestockStats, "handleLivestockStats");
async function fetchHealthRecordById(db, userId, recordId) {
  if (!recordId) return null;
  const { data } = await db.executeQuery(
    `
      SELECT hr.*, a.name as animal_name, u.name as recorded_by_name
      FROM animal_health_records hr
      JOIN animals a ON hr.animal_id = a.id
      LEFT JOIN users u ON hr.created_by = u.id
      WHERE hr.id = ?
      LIMIT 1
    `,
    [recordId],
    { operation: "first", table: "animal_health_records", userId }
  );
  return data || null;
}
__name(fetchHealthRecordById, "fetchHealthRecordById");
async function fetchProductionRecordById(db, userId, recordId) {
  if (!recordId) return null;
  const { data } = await db.executeQuery(
    `
      SELECT pr.*, a.name as animal_name, u.name as recorded_by_name
      FROM animal_production pr
      JOIN animals a ON pr.animal_id = a.id
      LEFT JOIN users u ON pr.recorded_by = u.id
      WHERE pr.id = ?
      LIMIT 1
    `,
    [recordId],
    { operation: "first", table: "animal_production", userId }
  );
  return data || null;
}
__name(fetchProductionRecordById, "fetchProductionRecordById");
async function fetchBreedingRecordById(db, userId, recordId) {
  if (!recordId) return null;
  const { data } = await db.executeQuery(
    `
      SELECT br.*, sire.name as sire_name, u.name as created_by_name
      FROM animal_breeding br
      LEFT JOIN animals sire ON br.partner_id = sire.id
      LEFT JOIN users u ON br.created_by = u.id
      WHERE br.id = ?
      LIMIT 1
    `,
    [recordId],
    { operation: "first", table: "animal_breeding", userId }
  );
  return data ? normalizeBreedingRecord(data) : null;
}
__name(fetchBreedingRecordById, "fetchBreedingRecordById");
async function fetchFeedingRecordById(db, userId, recordId) {
  if (!recordId) return null;
  const { data } = await db.executeQuery(
    `
      SELECT fr.*, a.name as animal_name, u.name as recorded_by_name
      FROM animal_feeding_records fr
      JOIN animals a ON fr.animal_id = a.id
      LEFT JOIN users u ON fr.recorded_by = u.id
      WHERE fr.id = ?
      LIMIT 1
    `,
    [recordId],
    { operation: "first", table: "animal_feeding_records", userId }
  );
  return data || null;
}
__name(fetchFeedingRecordById, "fetchFeedingRecordById");
function normalizeBreedingRecord(record) {
  if (!record) return null;
  const {
    partner_id,
    expected_birth_date,
    actual_birth_date,
    notes,
    vet_supervision,
    ...rest
  } = record;
  return {
    ...rest,
    notes,
    sire_id: partner_id,
    expected_calving_date: expected_birth_date,
    actual_calving_date: actual_birth_date,
    breeding_notes: notes,
    vet_supervision: Boolean(vet_supervision)
  };
}
__name(normalizeBreedingRecord, "normalizeBreedingRecord");
function toNullableNumber(value) {
  if (value === void 0 || value === null || value === "") {
    return null;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}
__name(toNullableNumber, "toNullableNumber");
function toNullableInt(value) {
  const numeric = toNullableNumber(value);
  return numeric === null ? null : Math.trunc(numeric);
}
__name(toNullableInt, "toNullableInt");
function sanitizeNullableValue(value) {
  if (value === void 0) {
    return void 0;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  return value;
}
__name(sanitizeNullableValue, "sanitizeNullableValue");
function toNullableString(value) {
  const sanitized = sanitizeNullableValue(value);
  if (sanitized === void 0) {
    return void 0;
  }
  if (sanitized === null) {
    return null;
  }
  return String(sanitized);
}
__name(toNullableString, "toNullableString");

// api/tasks-enhanced.js
async function onRequest4(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth = new AuthUtils(env2);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    const dbOps = new DatabaseOperations(env2);
    const taskRepository = new TaskRepository(dbOps);
    if (method === "GET") {
      const taskId = url.searchParams.get("id");
      const analytics = url.searchParams.get("analytics");
      const timeLogs = url.searchParams.get("time_logs");
      const comments = url.searchParams.get("comments");
      const status = url.searchParams.get("status");
      const priority = url.searchParams.get("priority");
      const assignedTo = url.searchParams.get("assigned_to");
      const dueDateFrom = url.searchParams.get("due_date_from");
      const dueDateTo = url.searchParams.get("due_date_to");
      const category = url.searchParams.get("category");
      const farmId = url.searchParams.get("farm_id");
      const search = url.searchParams.get("search");
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = Math.min(
        parseInt(url.searchParams.get("limit") || "100"),
        1e3
      );
      if (taskId) {
        const task = await taskRepository.findByIdWithDetails(taskId, user.id);
        if (!task) {
          return createErrorResponse("Task not found or access denied", 404);
        }
        if (timeLogs === "true") {
          task.time_logs = [];
        }
        if (comments === "true") {
          task.comments = [];
        }
        return createSuccessResponse(task);
      } else {
        const filters = {
          status,
          priority,
          task_category: category,
          assigned_to: assignedTo,
          farm_id: farmId,
          due_date_from: dueDateFrom,
          due_date_to: dueDateTo,
          search
        };
        Object.keys(filters).forEach((key) => {
          if (filters[key] === null) {
            delete filters[key];
          }
        });
        const options = {
          sortBy: "due_date",
          sortDirection: "ASC",
          page,
          limit
        };
        const tasks = await taskRepository.findByUserAccess(
          user.id,
          filters,
          options
        );
        if (analytics === "true" && farmId) {
          const dateFrom = url.searchParams.get("date_from");
          const dateTo = url.searchParams.get("date_to");
          const analyticsData = await taskRepository.getTaskAnalytics(
            farmId,
            user.id,
            dateFrom,
            dateTo
          );
          return createSuccessResponse({
            tasks,
            analytics: analyticsData,
            enhanced: true
          });
        }
        return createSuccessResponse(tasks || []);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const {
        farm_id,
        title: title2,
        description,
        status,
        priority,
        due_date,
        assigned_to,
        priority_score,
        estimated_duration,
        actual_duration,
        dependencies,
        resource_requirements,
        task_category,
        recurring_pattern,
        completion_criteria,
        progress_percentage,
        tags,
        location
      } = body;
      if (!farm_id || !title2) {
        return createErrorResponse("Farm ID and title are required", 400);
      }
      const taskData = {
        farm_id,
        title: title2,
        description,
        status: status || "pending",
        priority: priority || "medium",
        due_date,
        assigned_to,
        priority_score,
        estimated_duration,
        actual_duration,
        dependencies,
        resource_requirements,
        task_category,
        recurring_pattern,
        completion_criteria,
        progress_percentage,
        tags,
        location
      };
      const newTask = await taskRepository.createTask(taskData, user.id);
      return createSuccessResponse(newTask);
    } else if (method === "PUT") {
      const body = await request.json();
      const { id, ...updateData } = body;
      if (!id) {
        return createErrorResponse("Task ID required", 400);
      }
      const updatedTask = await taskRepository.updateTask(
        id,
        updateData,
        user.id
      );
      return createSuccessResponse(updatedTask);
    } else if (method === "DELETE") {
      const taskId = url.searchParams.get("id");
      if (!taskId) {
        return createErrorResponse("Task ID required", 400);
      }
      const result = await taskRepository.deleteTask(taskId, user.id);
      return createSuccessResponse(result);
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error4) {
    console.error("Enhanced Tasks API error:", error4);
    if (error4.message.includes("Farm not found or access denied")) {
      return createErrorResponse("Farm not found or access denied", 404);
    }
    if (error4.message.includes("Assigned user does not have access")) {
      return createErrorResponse(
        "Assigned user does not have access to this farm",
        400
      );
    }
    if (error4.message.includes("Task not found")) {
      return createErrorResponse("Task not found or access denied", 404);
    }
    if (error4.message.includes("Cannot delete task with dependent tasks")) {
      return createErrorResponse(
        "Cannot delete task with dependent tasks. Please update dependencies first.",
        400
      );
    }
    return createErrorResponse("Internal server error", 500);
  }
}
__name(onRequest4, "onRequest");

// api/finance-enhanced.js
async function onRequest5(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth = new AuthUtils(env2);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    const db = new DatabaseOperations(env2);
    const financeRepo = new FinanceRepository(db);
    if (method === "GET") {
      const entryId = url.searchParams.get("id");
      const analytics = url.searchParams.get("analytics");
      const type = url.searchParams.get("type");
      const category = url.searchParams.get("category");
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");
      const farmId = url.searchParams.get("farm_id");
      if (entryId) {
        try {
          const entry = await financeRepo.findById(entryId);
          if (!entry) {
            return createErrorResponse("Entry not found or access denied", 404);
          }
          return createSuccessResponse(entry);
        } catch (error4) {
          console.error("Database error:", error4);
          return createErrorResponse("Database error", 500);
        }
      } else if (analytics === "true") {
        const filters = {};
        if (type) filters.type = type;
        if (category) filters.budget_category = category;
        if (farmId) filters.farm_id = farmId;
        if (dateFrom) filters.entry_date_from = dateFrom;
        if (dateTo) filters.entry_date_to = dateTo;
        try {
          const entries = await financeRepo.findByUserAccess(user.id, filters, {
            sortBy: "entry_date",
            sortDirection: "DESC"
          });
          return createSuccessResponse(entries || []);
        } catch (error4) {
          console.error("Database error:", error4);
          return createErrorResponse("Database error", 500);
        }
      } else {
        const filters = {};
        if (type) filters.type = type;
        if (category) filters.budget_category = category;
        if (farmId) filters.farm_id = farmId;
        try {
          const entries = await financeRepo.findByUserAccess(user.id, filters, {
            sortBy: "entry_date",
            sortDirection: "DESC",
            limit: 100
          });
          return createSuccessResponse(entries || []);
        } catch (error4) {
          console.error("Database error:", error4);
          return createErrorResponse("Database error", 500);
        }
      }
    } else if (method === "POST") {
      const body = await request.json();
      try {
        const newEntry = await financeRepo.createTransaction(body, user.id);
        return createSuccessResponse(newEntry);
      } catch (error4) {
        console.error("Create transaction error:", error4);
        return createErrorResponse(error4.message, 500);
      }
    } else if (method === "PUT") {
      const body = await request.json();
      const { id, ...updateData } = body;
      if (!id) {
        return createErrorResponse("Entry ID required", 400);
      }
      try {
        const updatedEntry = await financeRepo.updateTransaction(
          id,
          updateData,
          user.id
        );
        return createSuccessResponse(updatedEntry);
      } catch (error4) {
        console.error("Update transaction error:", error4);
        return createErrorResponse(error4.message, 500);
      }
    } else if (method === "DELETE") {
      let entryId = url.searchParams.get("id");
      if (!entryId) {
        const parts = url.pathname.split("/").filter(Boolean);
        entryId = parts.length ? parts[parts.length - 1] : null;
      }
      if (!entryId) {
        return createErrorResponse("Entry ID required", 400);
      }
      try {
        const result = await financeRepo.deleteTransaction(entryId, user.id);
        return createSuccessResponse(result);
      } catch (error4) {
        console.error("Delete transaction error:", error4);
        return createErrorResponse(error4.message, 500);
      }
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error4) {
    console.error("Finance API error:", error4);
    return createErrorResponse("Internal server error", 500);
  }
}
__name(onRequest5, "onRequest");

// index.js
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // Allow all for development simplicity
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};
function handleCors(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
}
__name(handleCors, "handleCors");
function wrapCors(response) {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    headers: newHeaders
  });
}
__name(wrapCors, "wrapCors");
var router = t();
router.post("/api/auth/signup", (req, env2) => AuthCore.signup(req, env2));
router.post("/api/auth/login", (req, env2) => AuthCore.login(req, env2));
router.get("/api/auth/me", (req, env2) => AuthCore.me(req, env2));
router.get(
  "/api/health",
  () => new Response(JSON.stringify({ status: "ok" }), {
    headers: { "Content-Type": "application/json" }
  })
);
router.all("/api/farms", (req, env2) => onRequest({ request: req, env: env2 }));
router.all(
  "/api/farms/:id?",
  (req, env2) => onRequest({ request: req, env: env2 })
);
router.all("/api/crops", (req, env2) => onRequest2({ request: req, env: env2 }));
router.all(
  "/api/crops/:id?",
  (req, env2) => onRequest2({ request: req, env: env2 })
);
router.all(
  "/api/livestock",
  (req, env2) => onRequest3({ request: req, env: env2 })
);
router.all(
  "/api/livestock/:id?",
  (req, env2) => onRequest3({ request: req, env: env2 })
);
router.all("/api/tasks", (req, env2) => onRequest4({ request: req, env: env2 }));
router.all(
  "/api/tasks/:id?",
  (req, env2) => onRequest4({ request: req, env: env2 })
);
router.all(
  "/api/finance-enhanced",
  (req, env2) => onRequest5({ request: req, env: env2 })
);
router.all(
  "*",
  () => new Response(JSON.stringify({ error: "Endpoint not found" }), {
    status: 404
  })
);
var index_default2 = {
  async fetch(request, env2, ctx) {
    const preflight = handleCors(request);
    if (preflight) return preflight;
    try {
      const response = await router.handle(request, env2, ctx);
      return wrapCors(response);
    } catch (e) {
      console.error("Global Error:", e);
      return wrapCors(
        new Response(JSON.stringify({ error: e.message }), { status: 500 })
      );
    }
  }
};

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error4 = reduceError(e);
    return Response.json(error4, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-1hkc2l/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = index_default2;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-1hkc2l/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map

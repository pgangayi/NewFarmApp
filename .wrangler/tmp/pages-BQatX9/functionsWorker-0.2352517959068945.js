var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
var init_utils = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
    __name(notImplementedClass, "notImplementedClass");
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance;
var init_performance = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
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
    PerformanceEntry = class {
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
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
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
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
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
    PerformanceObserverEntryList = class {
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
    Performance = class {
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
    PerformanceObserver = class {
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
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default;
var init_noop = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";
var _console, _ignoreErrors, _stderr, _stdout, log, info, trace, debug, table, error, warn, createTask, clear, count, countReset, dir, dirxml, group, groupEnd, groupCollapsed, profile, profileEnd, time, timeEnd, timeLog, timeStamp, Console, _times, _stdoutErrorHandler, _stderrErrorHandler;
var init_console = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole, assert, clear2, context, count2, countReset2, createTask2, debug2, dir2, dirxml2, error2, group2, groupCollapsed2, groupEnd2, info2, log2, profile2, profileEnd2, table2, time2, timeEnd2, timeLog2, timeStamp2, trace2, warn2, console_default;
var init_console2 = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
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
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default;
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime;
var init_hrtime = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
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
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream;
var init_read_stream = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream = class {
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
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream;
var init_write_stream = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream = class {
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
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/tty.mjs
var init_tty = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION;
var init_node_version = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    NODE_VERSION = "22.14.0";
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";
var Process;
var init_process = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    init_node_version();
    Process = class _Process extends EventEmitter {
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
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess, getBuiltinModule, workerdProcess, isWorkerdProcessV2, unenvProcess, exit, features, platform, env, hrtime3, nextTick, _channel, _disconnect, _events, _eventsCount, _handleQueue, _maxListeners, _pendingMessage, _send, assert2, disconnect, mainModule, _debugEnd, _debugProcess, _exiting, _fatalException, _getActiveHandles, _getActiveRequests, _kill, _linkedBinding, _preload_modules, _rawDebug, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, abort, addListener, allowedNodeEnvironmentFlags, arch, argv, argv0, availableMemory, binding, channel, chdir, config, connected, constrainedMemory, cpuUsage, cwd, debugPort, dlopen, domain, emit, emitWarning, eventNames, execArgv, execPath, exitCode, finalization, getActiveResourcesInfo, getegid, geteuid, getgid, getgroups, getMaxListeners, getuid, hasUncaughtExceptionCaptureCallback, initgroups, kill, listenerCount, listeners, loadEnvFile, memoryUsage, moduleLoadList, off, on, once, openStdin, permission, pid, ppid, prependListener, prependOnceListener, rawListeners, reallyExit, ref, release, removeAllListeners, removeListener, report, resourceUsage, send, setegid, seteuid, setgid, setgroups, setMaxListeners, setSourceMapsEnabled, setuid, setUncaughtExceptionCaptureCallback, sourceMapsEnabled, stderr, stdin, stdout, throwDeprecation, title, traceDeprecation, umask, unref, uptime, version, versions, _process, process_default;
var init_process2 = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    workerdProcess = getBuiltinModule("node:process");
    isWorkerdProcessV2 = globalThis.Cloudflare.compatibilityFlags.enable_nodejs_process_v2;
    unenvProcess = new Process({
      env: globalProcess.env,
      // `hrtime` is only available from workerd process v2
      hrtime: isWorkerdProcessV2 ? workerdProcess.hrtime : hrtime,
      // `nextTick` is available from workerd process v1
      nextTick: workerdProcess.nextTick
    });
    ({ exit, features, platform } = workerdProcess);
    ({
      env: (
        // Always implemented by workerd
        env
      ),
      hrtime: (
        // Only implemented in workerd v2
        hrtime3
      ),
      nextTick: (
        // Always implemented by workerd
        nextTick
      )
    } = unenvProcess);
    ({
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
    } = unenvProcess);
    ({
      _debugEnd: (
        // @ts-expect-error `_debugEnd` is missing typings
        _debugEnd
      ),
      _debugProcess: (
        // @ts-expect-error `_debugProcess` is missing typings
        _debugProcess
      ),
      _exiting: (
        // @ts-expect-error `_exiting` is missing typings
        _exiting
      ),
      _fatalException: (
        // @ts-expect-error `_fatalException` is missing typings
        _fatalException
      ),
      _getActiveHandles: (
        // @ts-expect-error `_getActiveHandles` is missing typings
        _getActiveHandles
      ),
      _getActiveRequests: (
        // @ts-expect-error `_getActiveRequests` is missing typings
        _getActiveRequests
      ),
      _kill: (
        // @ts-expect-error `_kill` is missing typings
        _kill
      ),
      _linkedBinding: (
        // @ts-expect-error `_linkedBinding` is missing typings
        _linkedBinding
      ),
      _preload_modules: (
        // @ts-expect-error `_preload_modules` is missing typings
        _preload_modules
      ),
      _rawDebug: (
        // @ts-expect-error `_rawDebug` is missing typings
        _rawDebug
      ),
      _startProfilerIdleNotifier: (
        // @ts-expect-error `_startProfilerIdleNotifier` is missing typings
        _startProfilerIdleNotifier
      ),
      _stopProfilerIdleNotifier: (
        // @ts-expect-error `_stopProfilerIdleNotifier` is missing typings
        _stopProfilerIdleNotifier
      ),
      _tickCallback: (
        // @ts-expect-error `_tickCallback` is missing typings
        _tickCallback
      ),
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      arch,
      argv,
      argv0,
      availableMemory,
      binding: (
        // @ts-expect-error `binding` is missing typings
        binding
      ),
      channel,
      chdir,
      config,
      connected,
      constrainedMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      domain: (
        // @ts-expect-error `domain` is missing typings
        domain
      ),
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
      initgroups: (
        // @ts-expect-error `initgroups` is missing typings
        initgroups
      ),
      kill,
      listenerCount,
      listeners,
      loadEnvFile,
      memoryUsage,
      moduleLoadList: (
        // @ts-expect-error `moduleLoadList` is missing typings
        moduleLoadList
      ),
      off,
      on,
      once,
      openStdin: (
        // @ts-expect-error `openStdin` is missing typings
        openStdin
      ),
      permission,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      reallyExit: (
        // @ts-expect-error `reallyExit` is missing typings
        reallyExit
      ),
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
    } = isWorkerdProcessV2 ? workerdProcess : unenvProcess);
    _process = {
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
    process_default = _process;
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});

// api/_auth.js
var auth_exports = {};
__export(auth_exports, {
  AuthUtils: () => AuthUtils,
  createErrorResponse: () => createErrorResponse,
  createSuccessResponse: () => createSuccessResponse,
  createUnauthorizedResponse: () => createUnauthorizedResponse
});
function createUnauthorizedResponse(message = "Unauthorized") {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { "Content-Type": "application/json" }
  });
}
function createErrorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
function createSuccessResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}
var AuthUtils;
var init_auth = __esm({
  "api/_auth.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    AuthUtils = class {
      static {
        __name(this, "AuthUtils");
      }
      constructor(env2) {
        this.env = env2;
        this.JWT_SECRET = env2.JWT_SECRET || "fallback-secret-key-change-in-production";
      }
      // Extract JWT token from Authorization header
      extractToken(request) {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return null;
        }
        return authHeader.substring(7);
      }
      // Verify JWT token and return user data
      async verifyToken(token) {
        try {
          const parts = token.split(".");
          if (parts.length !== 3) return null;
          const [headerB64, payloadB64, signatureB64] = parts;
          const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
          if (payload.exp && Date.now() >= payload.exp * 1e3) {
            return null;
          }
          const expectedSignature = await this.sign(`${headerB64}.${payloadB64}`, this.JWT_SECRET);
          if (signatureB64 !== expectedSignature.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")) {
            return null;
          }
          return payload;
        } catch (error3) {
          console.error("Token verification failed:", error3);
          return null;
        }
      }
      // Get user from token or return null
      async getUserFromToken(request) {
        const token = this.extractToken(request);
        if (!token) return null;
        const payload = await this.verifyToken(token);
        if (!payload) return null;
        try {
          const { results } = await this.env.DB.prepare(
            "SELECT id, email, name, created_at FROM users WHERE id = ?"
          ).bind(payload.userId).all();
          return results.length > 0 ? results[0] : null;
        } catch (error3) {
          console.error("User lookup failed:", error3);
          return null;
        }
      }
      // Create JWT token for user
      async createToken(user) {
        const header = {
          alg: "HS256",
          typ: "JWT"
        };
        const payload = {
          userId: user.id,
          email: user.email,
          iat: Math.floor(Date.now() / 1e3),
          exp: Math.floor(Date.now() / 1e3) + 24 * 60 * 60
          // 24 hours
        };
        const headerB64 = this.base64UrlEncode(JSON.stringify(header));
        const payloadB64 = this.base64UrlEncode(JSON.stringify(payload));
        const signature = await this.sign(`${headerB64}.${payloadB64}`, this.JWT_SECRET);
        return `${headerB64}.${payloadB64}.${signature}`;
      }
      // Hash password using Web Crypto API
      async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      }
      // Verify password against hash
      async verifyPassword(password, hash) {
        const hashedPassword = await this.hashPassword(password);
        return hashedPassword === hash;
      }
      // Create user account
      async createUser(email, name, password) {
        try {
          const passwordHash = await this.hashPassword(password);
          const userId = this.generateUserId();
          const { results } = await this.env.DB.prepare(
            "SELECT id FROM users WHERE email = ?"
          ).bind(email).all();
          if (results.length > 0) {
            throw new Error("User already exists");
          }
          await this.env.DB.prepare(`
        INSERT INTO users (id, email, name, password_hash)
        VALUES (?, ?, ?, ?)
      `).bind(userId, email, name, passwordHash).run();
          const { results: userResults } = await this.env.DB.prepare(
            "SELECT id, email, name, created_at FROM users WHERE id = ?"
          ).bind(userId).all();
          return userResults[0];
        } catch (error3) {
          console.error("User creation failed:", error3);
          throw error3;
        }
      }
      // Authenticate user with email and password
      async authenticateUser(email, password) {
        try {
          const { results } = await this.env.DB.prepare(
            "SELECT id, email, name, password_hash FROM users WHERE email = ?"
          ).bind(email).all();
          if (results.length === 0) {
            throw new Error("Invalid credentials");
          }
          const user = results[0];
          const isValidPassword = await this.verifyPassword(password, user.password_hash);
          if (!isValidPassword) {
            throw new Error("Invalid credentials");
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name
          };
        } catch (error3) {
          console.error("Authentication failed:", error3);
          throw error3;
        }
      }
      // Helper: Base64 URL encode
      base64UrlEncode(str) {
        return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      }
      // Helper: Sign data with secret
      async sign(data, secret) {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(data);
        const cryptoKey = await crypto.subtle.importKey(
          "raw",
          keyData,
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
        return this.base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
      }
      // Generate user ID (simple UUID-like string)
      generateUserId() {
        return "user_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      }
      // Check if user has access to farm
      async hasFarmAccess(userId, farmId) {
        try {
          const { results } = await this.env.DB.prepare(`
        SELECT role FROM farm_members 
        WHERE farm_id = ? AND user_id = ?
      `).bind(farmId, userId).all();
          return results.length > 0;
        } catch (error3) {
          console.error("Farm access check failed:", error3);
          return false;
        }
      }
      // Get user's role for a specific farm
      async getUserFarmRole(userId, farmId) {
        try {
          const { results } = await this.env.DB.prepare(`
        SELECT role FROM farm_members 
        WHERE farm_id = ? AND user_id = ?
      `).bind(farmId, userId).all();
          return results.length > 0 ? results[0].role : null;
        } catch (error3) {
          console.error("Farm role lookup failed:", error3);
          return null;
        }
      }
      // Grant farm access to user
      async grantFarmAccess(farmId, userId, role = "worker") {
        try {
          await this.env.DB.prepare(`
        INSERT INTO farm_members (farm_id, user_id, role)
        VALUES (?, ?, ?)
      `).bind(farmId, userId, role).run();
          return true;
        } catch (error3) {
          console.error("Grant farm access failed:", error3);
          return false;
        }
      }
    };
    __name(createUnauthorizedResponse, "createUnauthorizedResponse");
    __name(createErrorResponse, "createErrorResponse");
    __name(createSuccessResponse, "createSuccessResponse");
  }
});

// api/auth/login.js
async function onRequestPost(context2) {
  const { request, env: env2 } = context2;
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return createErrorResponse("Email and password required", 400);
    }
    const auth2 = new AuthUtils(env2);
    const user = await auth2.authenticateUser(email, password);
    const token = await auth2.createToken(user);
    return createSuccessResponse({
      user,
      token
    });
  } catch (error3) {
    console.error("Login error:", error3);
    if (error3.message === "Invalid credentials") {
      return createErrorResponse("Invalid email or password", 401);
    }
    return createErrorResponse("Internal server error", 500);
  }
}
var init_login = __esm({
  "api/auth/login.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequestPost, "onRequestPost");
  }
});

// api/auth/signup.js
async function onRequestPost2(context2) {
  const { request, env: env2 } = context2;
  try {
    const body = await request.json();
    const { email, password, name } = body;
    if (!email || !password || !name) {
      return createErrorResponse("Email, password, and name required", 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse("Invalid email format", 400);
    }
    if (password.length < 6) {
      return createErrorResponse("Password must be at least 6 characters long", 400);
    }
    const auth2 = new AuthUtils(env2);
    try {
      const user = await auth2.createUser(email, name, password);
      const token = await auth2.createToken(user);
      return createSuccessResponse({
        user,
        token,
        message: "User created successfully"
      });
    } catch (createError) {
      if (createError.message === "User already exists") {
        return createErrorResponse("User with this email already exists", 409);
      }
      throw createError;
    }
  } catch (error3) {
    console.error("Signup error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
var init_signup = __esm({
  "api/auth/signup.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequestPost2, "onRequestPost");
  }
});

// api/auth/validate.js
async function onRequestGet(context2) {
  const { request, env: env2 } = context2;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createErrorResponse("Invalid token", 401);
    }
    return createSuccessResponse({
      user,
      valid: true
    });
  } catch (error3) {
    console.error("Token validation error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
async function onRequestPost3(context2) {
  return onRequestGet(context2);
}
var init_validate = __esm({
  "api/auth/validate.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequestGet, "onRequestGet");
    __name(onRequestPost3, "onRequestPost");
  }
});

// api/crops/irrigation.js
async function onRequest(context2) {
  const { request, env: env2 } = context2;
  const method = request.method;
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { AuthUtils: AuthUtils2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    const auth2 = new AuthUtils2(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const userId = user.id;
    if (method === "POST") {
      const body = await request.json();
      const { action } = body;
      switch (action) {
        case "list":
          return await listIrrigationSchedules(env2, userId, body.farm_id);
        case "create":
          return await createIrrigationSchedule(env2, userId, body);
        case "update":
          return await updateIrrigationSchedule(env2, userId, body);
        case "delete":
          return await deleteIrrigationSchedule(env2, userId, body.id);
        case "optimize":
          return await optimizeIrrigationSchedule(env2, userId, body);
        case "analytics":
          return await getIrrigationAnalytics(env2, userId, body.farm_id);
        case "recommendations":
          return await getIrrigationRecommendations(env2, userId, body.farm_id);
        default:
          return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
      }
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error3) {
    console.error("Irrigation API error:", error3);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
async function listIrrigationSchedules(env2, userId, farmId) {
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env2.DB.prepare(accessQuery).bind(farmId, userId).all();
  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const query = `
    SELECT irs.*, f.name as field_name, c.crop_type
    FROM irrigation_schedules irs
    JOIN fields f ON irs.field_id = f.id
    LEFT JOIN crops c ON irs.field_id = c.field_id AND c.status = 'active'
    WHERE irs.farm_id = ? AND irs.is_active = 1
    ORDER BY irs.next_watering_date ASC
  `;
  const { results: schedules } = await env2.DB.prepare(query).bind(farmId).all();
  return new Response(JSON.stringify(schedules), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function createIrrigationSchedule(env2, userId, data) {
  const {
    farm_id,
    field_id,
    crop_type,
    irrigation_type,
    frequency_days,
    duration_minutes,
    water_amount_liters,
    priority = "medium",
    start_date
  } = data;
  const accessQuery = `
    SELECT fm.id FROM farm_members fm
    JOIN fields f ON fm.farm_id = f.farm_id
    WHERE fm.user_id = ? AND f.id = ? AND fm.farm_id = ?
  `;
  const { results: access } = await env2.DB.prepare(accessQuery).bind(userId, field_id, farm_id).all();
  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const nextWateringDate = new Date(start_date || Date.now());
  nextWateringDate.setDate(nextWateringDate.getDate() + frequency_days);
  const insertQuery = `
    INSERT INTO irrigation_schedules (
      farm_id, field_id, crop_type, irrigation_type, frequency_days,
      duration_minutes, water_amount_liters, priority, next_watering_date,
      status, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, datetime('now'))
  `;
  const result = await env2.DB.prepare(insertQuery).bind(
    farm_id,
    field_id,
    crop_type,
    irrigation_type,
    frequency_days,
    duration_minutes,
    water_amount_liters,
    priority,
    nextWateringDate.toISOString(),
    userId
  ).run();
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Failed to create irrigation schedule" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  await logIrrigationActivity(env2, result.meta.last_row_id, "schedule_created", {
    crop_type,
    irrigation_type,
    frequency_days
  });
  return new Response(JSON.stringify({
    success: true,
    id: result.meta.last_row_id
  }), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
}
async function updateIrrigationSchedule(env2, userId, data) {
  const { id, farm_id, ...updates } = data;
  const accessQuery = `
    SELECT irs.id FROM irrigation_schedules irs
    JOIN farm_members fm ON irs.farm_id = fm.farm_id
    WHERE irs.id = ? AND fm.user_id = ? AND irs.farm_id = ?
  `;
  const { results: access } = await env2.DB.prepare(accessQuery).bind(id, userId, farm_id).all();
  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const updateFields = [];
  const updateValues = [];
  Object.keys(updates).forEach((key) => {
    if (updates[key] !== void 0) {
      updateFields.push(`${key} = ?`);
      updateValues.push(updates[key]);
    }
  });
  if (updateFields.length === 0) {
    return new Response(JSON.stringify({ error: "No fields to update" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  updateValues.push(id);
  const updateQuery = `
    UPDATE irrigation_schedules 
    SET ${updateFields.join(", ")}, updated_at = datetime('now')
    WHERE id = ?
  `;
  const result = await env2.DB.prepare(updateQuery).bind(...updateValues).run();
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Failed to update irrigation schedule" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  await logIrrigationActivity(env2, id, "schedule_updated", updates);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function deleteIrrigationSchedule(env2, userId, scheduleId) {
  const accessQuery = `
    SELECT irs.id FROM irrigation_schedules irs
    JOIN farm_members fm ON irs.farm_id = fm.farm_id
    WHERE irs.id = ? AND fm.user_id = ?
  `;
  const { results: access } = await env2.DB.prepare(accessQuery).bind(scheduleId, userId).all();
  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const updateQuery = `
    UPDATE irrigation_schedules 
    SET is_active = 0, updated_at = datetime('now')
    WHERE id = ?
  `;
  const result = await env2.DB.prepare(updateQuery).bind(scheduleId).run();
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Failed to delete irrigation schedule" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function optimizeIrrigationSchedule(env2, userId, data) {
  const { schedule_id, farm_id, weather_data } = data;
  const scheduleQuery = `
    SELECT irs.*, f.area_hectares, f.name as field_name
    FROM irrigation_schedules irs
    JOIN fields f ON irs.field_id = f.id
    WHERE irs.id = ? AND irs.farm_id = ?
  `;
  const { results: schedules } = await env2.DB.prepare(scheduleQuery).bind(schedule_id, farm_id).all();
  if (!schedules || schedules.length === 0) {
    return new Response(JSON.stringify({ error: "Schedule not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  const schedule = schedules[0];
  const optimizations = calculateOptimizations(schedule, weather_data);
  const updateQuery = `
    UPDATE irrigation_schedules 
    SET frequency_days = ?, duration_minutes = ?, water_amount_liters = ?,
        priority = ?, optimized_at = datetime('now')
    WHERE id = ?
  `;
  const result = await env2.DB.prepare(updateQuery).bind(
    optimizations.frequency_days,
    optimizations.duration_minutes,
    optimizations.water_amount_liters,
    optimizations.priority,
    schedule_id
  ).run();
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Failed to optimize schedule" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  await logIrrigationActivity(env2, schedule_id, "schedule_optimized", {
    optimizations,
    weather_impact: weather_data ? "considered" : "not_available"
  });
  return new Response(JSON.stringify({
    success: true,
    optimizations,
    savings: optimizations.savings
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function getIrrigationAnalytics(env2, userId, farmId) {
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env2.DB.prepare(accessQuery).bind(farmId, userId).all();
  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const waterUsageQuery = `
    SELECT 
      SUM(water_amount_liters) as total_water,
      AVG(water_amount_liters) as avg_water,
      COUNT(*) as total_schedules
    FROM irrigation_logs il
    JOIN irrigation_schedules irs ON il.schedule_id = irs.id
    WHERE irs.farm_id = ? AND il.log_date >= date('now', 'start of month')
  `;
  const { results: waterUsage } = await env2.DB.prepare(waterUsageQuery).bind(farmId).all();
  const efficiencyQuery = `
    SELECT 
      AVG(CASE 
        WHEN irs.irrigation_type = 'drip' THEN 95
        WHEN irs.irrigation_type = 'sprinkler' THEN 80
        WHEN irs.irrigation_type = 'manual' THEN 70
        WHEN irs.irrigation_type = 'flood' THEN 60
        ELSE 75
      END) as avg_efficiency
    FROM irrigation_schedules irs
    WHERE irs.farm_id = ? AND irs.is_active = 1
  `;
  const { results: efficiency } = await env2.DB.prepare(efficiencyQuery).bind(farmId).all();
  const upcomingQuery = `
    SELECT irs.*, f.name as field_name, c.crop_type
    FROM irrigation_schedules irs
    JOIN fields f ON irs.field_id = f.id
    LEFT JOIN crops c ON irs.field_id = c.field_id AND c.status = 'active'
    WHERE irs.farm_id = ? AND irs.next_watering_date <= date('now', '+7 days')
      AND irs.is_active = 1 AND irs.status = 'active'
    ORDER BY irs.next_watering_date ASC
    LIMIT 10
  `;
  const { results: upcomingSchedules } = await env2.DB.prepare(upcomingQuery).bind(farmId).all();
  const totalWater = waterUsage[0]?.total_water || 0;
  const avgEfficiency = efficiency[0]?.avg_efficiency || 75;
  const costSavings = Math.round(totalWater * (95 - avgEfficiency) / 100 * 2e-3);
  const recommendations = generateIrrigationRecommendations(waterUsage[0], efficiency[0]);
  const analytics = {
    total_water_usage: Math.round(totalWater || 0),
    efficiency_score: Math.round(avgEfficiency || 0),
    cost_savings: costSavings,
    next_schedules: upcomingSchedules || [],
    recommendations
  };
  return new Response(JSON.stringify(analytics), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function getIrrigationRecommendations(env2, userId, farmId) {
  const currentSetupQuery = `
    SELECT irs.irrigation_type, COUNT(*) as count, AVG(irs.frequency_days) as avg_frequency
    FROM irrigation_schedules irs
    WHERE irs.farm_id = ? AND irs.is_active = 1
    GROUP BY irs.irrigation_type
  `;
  const { results: setup } = await env2.DB.prepare(currentSetupQuery).bind(farmId).all();
  const weatherQuery = `
    SELECT wd.precipitation_sum, wd.temperature_avg
    FROM weather_data wd
    JOIN farms f ON wd.farm_id = f.id
    WHERE f.id = ?
    ORDER BY wd.data_date DESC
    LIMIT 7
  `;
  const { results: weather } = await env2.DB.prepare(weatherQuery).bind(farmId).all();
  const recommendations = [];
  const dripCount = setup.find((s) => s.irrigation_type === "drip")?.count || 0;
  const totalSchedules = setup.reduce((sum, s) => sum + s.count, 0);
  if (dripCount / totalSchedules < 0.3) {
    recommendations.push({
      type: "efficiency",
      priority: "high",
      message: "Consider installing more drip irrigation systems (current: " + Math.round(dripCount / totalSchedules * 100) + "%)",
      benefit: "Save 20-30% water usage",
      action: "Upgrade to drip irrigation for high-value crops"
    });
  }
  const avgFrequency = setup.reduce((sum, s) => sum + s.avg_frequency * s.count, 0) / totalSchedules;
  if (avgFrequency < 2) {
    recommendations.push({
      type: "frequency",
      priority: "medium",
      message: "Consider reducing irrigation frequency for water conservation",
      benefit: "Reduce water usage while maintaining crop health",
      action: "Implement soil moisture monitoring"
    });
  }
  if (weather && weather.length > 0) {
    const recentRain = weather.reduce((sum, w) => sum + (w.precipitation_sum || 0), 0);
    if (recentRain > 20) {
      recommendations.push({
        type: "weather",
        priority: "high",
        message: "Recent rainfall detected - consider delaying irrigation",
        benefit: "Save water and prevent over-watering",
        action: "Reduce watering schedule for next 3-5 days"
      });
    }
  }
  const currentMonth = (/* @__PURE__ */ new Date()).getMonth();
  if (currentMonth >= 5 && currentMonth <= 8) {
    recommendations.push({
      type: "seasonal",
      priority: "medium",
      message: "Peak growing season - monitor water needs closely",
      benefit: "Optimize crop yield during critical growth period",
      action: "Increase monitoring frequency, adjust schedules as needed"
    });
  }
  return new Response(JSON.stringify({ recommendations }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
function calculateOptimizations(schedule, weatherData) {
  const optimizations = {
    frequency_days: schedule.frequency_days,
    duration_minutes: schedule.duration_minutes,
    water_amount_liters: schedule.water_amount_liters,
    priority: schedule.priority,
    savings: { water: 0, cost: 0 }
  };
  if (weatherData && weatherData.precipitation) {
    if (weatherData.precipitation > 15) {
      optimizations.frequency_days = Math.ceil(schedule.frequency_days * 1.5);
      optimizations.savings.water = schedule.water_amount_liters * 0.3;
      optimizations.priority = "low";
    } else if (weatherData.precipitation > 5) {
      optimizations.frequency_days = Math.ceil(schedule.frequency_days * 1.2);
      optimizations.savings.water = schedule.water_amount_liters * 0.15;
    } else {
    }
  }
  const cropMultiplier = getCropWaterMultiplier(schedule.crop_type);
  optimizations.water_amount_liters = Math.round(schedule.water_amount_liters * cropMultiplier);
  optimizations.savings.cost = Math.round(optimizations.savings.water * 2e-3);
  return optimizations;
}
function getCropWaterMultiplier(cropType) {
  const multipliers = {
    "corn": 1.2,
    "wheat": 0.9,
    "soybeans": 1.1,
    "tomato": 1.3,
    "potato": 1,
    "lettuce": 0.8,
    "cabbage": 1
  };
  return multipliers[cropType] || 1;
}
async function logIrrigationActivity(env2, scheduleId, action, details) {
  try {
    const insertQuery = `
      INSERT INTO irrigation_logs (
        schedule_id, action, details, logged_at
      ) VALUES (?, ?, ?, datetime('now'))
    `;
    await env2.DB.prepare(insertQuery).bind(scheduleId, action, JSON.stringify(details)).run();
  } catch (error3) {
    console.warn("Failed to log irrigation activity:", error3);
  }
}
function generateIrrigationRecommendations(waterUsage, efficiency) {
  const recommendations = [];
  if (!waterUsage || waterUsage.total_schedules === 0) {
    recommendations.push("No irrigation data available. Consider setting up irrigation schedules.");
    return recommendations;
  }
  if (efficiency && efficiency.avg_efficiency < 70) {
    recommendations.push("System efficiency is below optimal. Consider upgrading to drip irrigation.");
  }
  if (waterUsage.avg_water > 500) {
    recommendations.push("High water usage detected. Review irrigation schedules for optimization opportunities.");
  }
  if (waterUsage.total_schedules > 20) {
    recommendations.push("Multiple irrigation schedules detected. Consider consolidating for better efficiency.");
  }
  recommendations.push("Monitor soil moisture before each irrigation cycle.");
  recommendations.push("Consider installing weather-based automatic adjustments.");
  recommendations.push("Use mulch to reduce evaporation and water requirements.");
  return recommendations;
}
var init_irrigation = __esm({
  "api/crops/irrigation.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(onRequest, "onRequest");
    __name(listIrrigationSchedules, "listIrrigationSchedules");
    __name(createIrrigationSchedule, "createIrrigationSchedule");
    __name(updateIrrigationSchedule, "updateIrrigationSchedule");
    __name(deleteIrrigationSchedule, "deleteIrrigationSchedule");
    __name(optimizeIrrigationSchedule, "optimizeIrrigationSchedule");
    __name(getIrrigationAnalytics, "getIrrigationAnalytics");
    __name(getIrrigationRecommendations, "getIrrigationRecommendations");
    __name(calculateOptimizations, "calculateOptimizations");
    __name(getCropWaterMultiplier, "getCropWaterMultiplier");
    __name(logIrrigationActivity, "logIrrigationActivity");
    __name(generateIrrigationRecommendations, "generateIrrigationRecommendations");
  }
});

// api/crops/pests-diseases.js
async function onRequest2(context2) {
  const { request, env: env2 } = context2;
  const method = request.method;
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { AuthUtils: AuthUtils2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    const auth2 = new AuthUtils2(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const userId = user.id;
    if (method === "POST") {
      const body = await request.json();
      const { action } = body;
      switch (action) {
        case "list_pests":
          return await listPestIssues(env2, userId, body);
        case "list_diseases":
          return await listDiseaseOutbreaks(env2, userId, body);
        case "create_issue":
          return await createIssue(env2, userId, body);
        case "update_issue":
          return await updateIssue(env2, userId, body);
        case "delete_issue":
          return await deleteIssue(env2, userId, body.id);
        case "prevention_calendar":
          return await getPreventionCalendar(env2, userId, body.farm_id);
        case "pest_predictions":
          return await getPestPredictions(env2, userId, body.farm_id);
        case "disease_risk_assessment":
          return await getDiseaseRiskAssessment(env2, userId, body.farm_id);
        default:
          return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
      }
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error3) {
    console.error("Pest & Disease API error:", error3);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
async function listPestIssues(env2, userId, { farm_id, severity, status }) {
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env2.DB.prepare(accessQuery).bind(farm_id, userId).all();
  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  let query = `
    SELECT pi.*, f.name as field_name, c.crop_type
    FROM pest_issues pi
    JOIN fields f ON pi.field_id = f.id
    LEFT JOIN crops c ON pi.field_id = c.field_id AND c.status = 'active'
    WHERE pi.farm_id = ?
  `;
  const queryParams = [farm_id];
  if (severity) {
    query += " AND pi.severity = ?";
    queryParams.push(severity);
  }
  if (status) {
    query += " AND pi.status = ?";
    queryParams.push(status);
  }
  query += " ORDER BY pi.discovery_date DESC";
  const { results: pestIssues } = await env2.DB.prepare(query).bind(...queryParams).all();
  return new Response(JSON.stringify(pestIssues), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function listDiseaseOutbreaks(env2, userId, { farm_id }) {
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env2.DB.prepare(accessQuery).bind(farm_id, userId).all();
  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const query = `
    SELECT do.*, f.name as field_name, c.crop_type
    FROM disease_outbreaks do
    JOIN fields f ON do.field_id = f.id
    LEFT JOIN crops c ON do.field_id = c.field_id AND c.status = 'active'
    WHERE do.farm_id = ?
    ORDER BY do.outbreak_date DESC
  `;
  const { results: diseaseOutbreaks } = await env2.DB.prepare(query).bind(farm_id).all();
  return new Response(JSON.stringify(diseaseOutbreaks), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function createIssue(env2, userId, data) {
  const { farm_id, field_id, issue_type, ...issueData } = data;
  const accessQuery = `
    SELECT fm.id FROM farm_members fm
    JOIN fields f ON fm.farm_id = f.farm_id
    WHERE fm.user_id = ? AND f.id = ? AND fm.farm_id = ?
  `;
  const { results: access } = await env2.DB.prepare(accessQuery).bind(userId, field_id, farm_id).all();
  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  let insertQuery, insertParams;
  if (issue_type === "pest") {
    insertQuery = `
      INSERT INTO pest_issues (
        farm_id, field_id, crop_type, pest_name, severity, affected_area_percent,
        discovery_date, status, description, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    insertParams = [
      farm_id,
      field_id,
      issueData.crop_type,
      issueData.pest_name,
      issueData.severity,
      issueData.affected_area_percent,
      issueData.discovery_date || (/* @__PURE__ */ new Date()).toISOString(),
      issueData.status || "active",
      issueData.description,
      userId
    ];
  } else {
    insertQuery = `
      INSERT INTO disease_outbreaks (
        farm_id, field_id, crop_type, disease_name, severity, affected_area_percent,
        outbreak_date, status, growth_stage, description, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    insertParams = [
      farm_id,
      field_id,
      issueData.crop_type,
      issueData.disease_name,
      issueData.severity,
      issueData.affected_area_percent,
      issueData.outbreak_date || (/* @__PURE__ */ new Date()).toISOString(),
      issueData.status || "monitoring",
      issueData.growth_stage,
      issueData.description,
      userId
    ];
  }
  const result = await env2.DB.prepare(insertQuery).bind(...insertParams).run();
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Failed to create issue" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  await logPestDiseaseActivity(env2, result.meta.last_row_id, "issue_created", {
    issue_type,
    ...issueData
  });
  return new Response(JSON.stringify({
    success: true,
    id: result.meta.last_row_id
  }), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
}
async function updateIssue(env2, userId, data) {
  const { id, farm_id, issue_type, ...updates } = data;
  const tableName = issue_type === "pest" ? "pest_issues" : "disease_outbreaks";
  const accessQuery = `
    SELECT pi.id FROM ${tableName} pi
    JOIN farm_members fm ON pi.farm_id = fm.farm_id
    WHERE pi.id = ? AND fm.user_id = ? AND pi.farm_id = ?
  `;
  const { results: access } = await env2.DB.prepare(accessQuery).bind(id, userId, farm_id).all();
  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const updateFields = [];
  const updateValues = [];
  Object.keys(updates).forEach((key) => {
    if (updates[key] !== void 0 && key !== "id" && key !== "farm_id" && key !== "issue_type") {
      updateFields.push(`${key} = ?`);
      updateValues.push(updates[key]);
    }
  });
  if (updateFields.length === 0) {
    return new Response(JSON.stringify({ error: "No fields to update" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  updateValues.push(id);
  const updateQuery = `
    UPDATE ${tableName} 
    SET ${updateFields.join(", ")}, updated_at = datetime('now')
    WHERE id = ?
  `;
  const result = await env2.DB.prepare(updateQuery).bind(...updateValues).run();
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Failed to update issue" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  await logPestDiseaseActivity(env2, id, "issue_updated", updates);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function deleteIssue(env2, userId, issueId) {
  const pestAccessQuery = `
    SELECT pi.id FROM pest_issues pi
    JOIN farm_members fm ON pi.farm_id = fm.farm_id
    WHERE pi.id = ? AND fm.user_id = ?
  `;
  const { results: pestAccess } = await env2.DB.prepare(pestAccessQuery).bind(issueId, userId).all();
  const diseaseAccessQuery = `
    SELECT do.id FROM disease_outbreaks do
    JOIN farm_members fm ON do.farm_id = fm.farm_id
    WHERE do.id = ? AND fm.user_id = ?
  `;
  const { results: diseaseAccess } = await env2.DB.prepare(diseaseAccessQuery).bind(issueId, userId).all();
  if ((!pestAccess || pestAccess.length === 0) && (!diseaseAccess || diseaseAccess.length === 0)) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const tableName = pestAccess && pestAccess.length > 0 ? "pest_issues" : "disease_outbreaks";
  const statusField = tableName === "pest_issues" ? "status" : "status";
  const newStatus = tableName === "pest_issues" ? "resolved" : "contained";
  const updateQuery = `
    UPDATE ${tableName} 
    SET ${statusField} = ?, is_resolved = 1, updated_at = datetime('now')
    WHERE id = ?
  `;
  const result = await env2.DB.prepare(updateQuery).bind(newStatus, issueId).run();
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Failed to delete issue" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function getPreventionCalendar(env2, userId, farmId) {
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env2.DB.prepare(accessQuery).bind(farmId, userId).all();
  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const tasksQuery = `
    SELECT ppt.*, f.name as field_name
    FROM prevention_tasks ppt
    JOIN fields f ON ppt.field_id = f.id
    WHERE ppt.farm_id = ? AND ppt.scheduled_date >= date('now')
    ORDER BY ppt.scheduled_date ASC
    LIMIT 20
  `;
  const { results: upcoming } = await env2.DB.prepare(tasksQuery).bind(farmId).all();
  const currentMonth = (/* @__PURE__ */ new Date()).getMonth();
  const seasonalRecommendations = generateSeasonalRecommendations(currentMonth);
  return new Response(JSON.stringify({
    upcoming: upcoming || [],
    seasonal_recommendations: seasonalRecommendations
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function getPestPredictions(env2, userId, farmId) {
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env2.DB.prepare(accessQuery).bind(farmId, userId).all();
  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const cropsQuery = `
    SELECT c.crop_type, f.name as field_name, c.growth_stage
    FROM crops c
    JOIN fields f ON c.field_id = f.id
    WHERE c.farm_id = ? AND c.status = 'active'
  `;
  const { results: crops } = await env2.DB.prepare(cropsQuery).bind(farmId).all();
  const predictions = generatePestPredictions(crops);
  return new Response(JSON.stringify({
    predictions,
    risk_factors: analyzeRiskFactors(crops)
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function getDiseaseRiskAssessment(env2, userId, farmId) {
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env2.DB.prepare(accessQuery).bind(farmId, userId).all();
  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const weatherQuery = `
    SELECT temperature_avg, humidity, precipitation_sum
    FROM weather_data wd
    JOIN farms f ON wd.farm_id = f.id
    WHERE f.id = ?
    ORDER BY wd.data_date DESC
    LIMIT 7
  `;
  const { results: weather } = await env2.DB.prepare(weatherQuery).bind(farmId).all();
  const cropsQuery = `
    SELECT c.crop_type, f.name as field_name, c.planting_date
    FROM crops c
    JOIN fields f ON c.field_id = f.id
    WHERE c.farm_id = ? AND c.status = 'active'
  `;
  const { results: crops } = await env2.DB.prepare(cropsQuery).bind(farmId).all();
  const riskAssessment = assessDiseaseRisk(weather, crops);
  return new Response(JSON.stringify({
    risk_assessment: riskAssessment,
    recommendations: generateDiseaseRecommendations(riskAssessment)
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function logPestDiseaseActivity(env2, issueId, action, details) {
  try {
    const insertQuery = `
      INSERT INTO pest_disease_logs (
        issue_id, action, details, logged_at
      ) VALUES (?, ?, ?, datetime('now'))
    `;
    await env2.DB.prepare(insertQuery).bind(issueId, action, JSON.stringify(details)).run();
  } catch (error3) {
    console.warn("Failed to log pest disease activity:", error3);
  }
}
function generateSeasonalRecommendations(month) {
  const recommendations = [];
  if (month >= 2 && month <= 4) {
    recommendations.push({
      task: "Monitor for early season pests",
      timing: "Weekly inspections",
      crops: ["All crops"],
      priority: "medium"
    });
    recommendations.push({
      task: "Apply preventive treatments",
      timing: "Before flowering",
      crops: ["Fruit trees", "Brassicas"],
      priority: "high"
    });
  } else if (month >= 5 && month <= 7) {
    recommendations.push({
      task: "Intensive pest monitoring",
      timing: "Daily inspections",
      crops: ["All crops"],
      priority: "high"
    });
    recommendations.push({
      task: "Heat stress management",
      timing: "Morning inspections",
      crops: ["Leafy greens", "Lettuce"],
      priority: "medium"
    });
  } else if (month >= 8 && month <= 10) {
    recommendations.push({
      task: "Fall cleanup and prevention",
      timing: "Before first frost",
      crops: ["All crops"],
      priority: "high"
    });
  }
  return recommendations;
}
function generatePestPredictions(crops) {
  const predictions = [];
  crops.forEach((crop) => {
    const pestRisks = getPestRisksForCrop(crop.crop_type);
    pestRisks.forEach((risk) => {
      predictions.push({
        crop_type: crop.crop_type,
        field_name: crop.field_name,
        pest_name: risk.pest,
        risk_level: risk.risk_level,
        peak_period: risk.peak_period,
        prevention_actions: risk.prevention_actions
      });
    });
  });
  return predictions;
}
function getPestRisksForCrop(cropType) {
  const pestDatabase = {
    "tomato": [
      { pest: "Aphids", risk_level: "medium", peak_period: "Spring-Summer", prevention_actions: ["Monitor new growth", "Use beneficial insects"] },
      { pest: "Hornworms", risk_level: "high", peak_period: "Summer", prevention_actions: ["Hand picking", "BT spray"] },
      { pest: "Whiteflies", risk_level: "medium", peak_period: "Summer-Fall", prevention_actions: ["Yellow sticky traps", "Neem oil"] }
    ],
    "corn": [
      { pest: "Corn borers", risk_level: "high", peak_period: "Summer", prevention_actions: ["Plant early varieties", "Crop rotation"] },
      { pest: "Aphids", risk_level: "medium", peak_period: "Spring-Summer", prevention_actions: ["Natural predators", "Insecticidal soap"] }
    ],
    "beans": [
      { pest: "Bean beetles", risk_level: "high", peak_period: "Summer", prevention_actions: ["Row covers", "Early planting"] },
      { pest: "Aphids", risk_level: "low", peak_period: "All season", prevention_actions: ["Monitor colonies", "Beneficial insects"] }
    ],
    "cabbage": [
      { pest: "Cabbage worms", risk_level: "high", peak_period: "Spring-Fall", prevention_actions: ["Floating row covers", "BT spray"] },
      { pest: "Aphids", risk_level: "medium", peak_period: "Summer", prevention_actions: ["Ladybugs", "Water spray"] }
    ]
  };
  return pestDatabase[cropType.toLowerCase()] || [];
}
function analyzeRiskFactors(crops) {
  const riskFactors = [];
  const cropTypes = [...new Set(crops.map((c) => c.crop_type.toLowerCase()))];
  if (cropTypes.includes("tomato") && cropTypes.includes("cabbage")) {
    riskFactors.push({
      factor: "Crop rotation gap",
      description: "Both tomatoes and brassicas detected - consider rotation break",
      severity: "medium"
    });
  }
  crops.forEach((crop) => {
    if (crop.growth_stage === "flowering") {
      riskFactors.push({
        factor: "Flowering stage vulnerability",
        description: `${crop.crop_type} in flowering stage - high pest attraction`,
        severity: "high",
        crop: crop.crop_type
      });
    }
  });
  return riskFactors;
}
function assessDiseaseRisk(weather, crops) {
  const riskFactors = [];
  let overallRisk = "low";
  if (weather && weather.length > 0) {
    const avgTemp = weather.reduce((sum, w) => sum + (w.temperature_avg || 0), 0) / weather.length;
    const avgHumidity = weather.reduce((sum, w) => sum + (w.humidity || 0), 0) / weather.length;
    const totalPrecip = weather.reduce((sum, w) => sum + (w.precipitation_sum || 0), 0);
    if (avgTemp >= 18 && avgTemp <= 25 && avgHumidity > 80) {
      riskFactors.push("Optimal conditions for fungal diseases");
      overallRisk = "high";
    } else if (avgTemp >= 20 && avgTemp <= 30 && avgHumidity > 70) {
      riskFactors.push("Moderate conditions for bacterial diseases");
      overallRisk = overallRisk === "high" ? "high" : "medium";
    }
    if (totalPrecip > 50) {
      riskFactors.push("High rainfall - increased disease risk");
      overallRisk = "medium";
    }
  }
  crops.forEach((crop) => {
    const daysSincePlanting = crop.planting_date ? Math.floor((Date.now() - new Date(crop.planting_date).getTime()) / (1e3 * 60 * 60 * 24)) : 0;
    if (daysSincePlanting > 30 && crop.crop_type.toLowerCase() === "tomato") {
      riskFactors.push("Late season tomato disease risk (30+ days)");
      overallRisk = overallRisk === "high" ? "high" : "medium";
    }
  });
  return {
    overall_risk: overallRisk,
    risk_factors: riskFactors,
    weather_conditions: weather ? {
      avg_temperature: Math.round(weather.reduce((sum, w) => sum + (w.temperature_avg || 0), 0) / weather.length * 10) / 10,
      avg_humidity: Math.round(weather.reduce((sum, w) => sum + (w.humidity || 0), 0) / weather.length * 10) / 10,
      total_precipitation: Math.round(weather.reduce((sum, w) => sum + (w.precipitation_sum || 0), 0) * 10) / 10
    } : null
  };
}
function generateDiseaseRecommendations(riskAssessment) {
  const recommendations = [];
  if (riskAssessment.overall_risk === "high") {
    recommendations.push("Implement daily crop monitoring");
    recommendations.push("Apply preventive fungicide treatments");
    recommendations.push("Improve air circulation in crop areas");
    recommendations.push("Remove any diseased plant material immediately");
  } else if (riskAssessment.overall_risk === "medium") {
    recommendations.push("Increase monitoring frequency to 2-3 times per week");
    recommendations.push("Ensure proper spacing between plants");
    recommendations.push("Avoid overhead watering");
  }
  if (riskAssessment.risk_factors.some((factor) => factor.includes("rainfall"))) {
    recommendations.push("Consider switching to drip irrigation");
    recommendations.push("Improve field drainage");
  }
  recommendations.push("Use disease-resistant varieties for future plantings");
  recommendations.push("Practice crop rotation to break disease cycles");
  return recommendations;
}
var init_pests_diseases = __esm({
  "api/crops/pests-diseases.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(onRequest2, "onRequest");
    __name(listPestIssues, "listPestIssues");
    __name(listDiseaseOutbreaks, "listDiseaseOutbreaks");
    __name(createIssue, "createIssue");
    __name(updateIssue, "updateIssue");
    __name(deleteIssue, "deleteIssue");
    __name(getPreventionCalendar, "getPreventionCalendar");
    __name(getPestPredictions, "getPestPredictions");
    __name(getDiseaseRiskAssessment, "getDiseaseRiskAssessment");
    __name(logPestDiseaseActivity, "logPestDiseaseActivity");
    __name(generateSeasonalRecommendations, "generateSeasonalRecommendations");
    __name(generatePestPredictions, "generatePestPredictions");
    __name(getPestRisksForCrop, "getPestRisksForCrop");
    __name(analyzeRiskFactors, "analyzeRiskFactors");
    __name(assessDiseaseRisk, "assessDiseaseRisk");
    __name(generateDiseaseRecommendations, "generateDiseaseRecommendations");
  }
});

// api/crops/rotation.js
async function onRequest3(context2) {
  const { request, env: env2 } = context2;
  const method = request.method;
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { AuthUtils: AuthUtils2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    const auth2 = new AuthUtils2(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const userId = user.id;
    if (method === "POST") {
      const body = await request.json();
      const { action } = body;
      switch (action) {
        case "list":
          return await listRotationPlans(env2, userId, body.farm_id);
        case "create":
          return await createRotationPlan(env2, userId, body);
        case "update":
          return await updateRotationPlan(env2, userId, body);
        case "delete":
          return await deleteRotationPlan(env2, userId, body.id);
        case "recommendations":
          return await getRotationRecommendations(env2, userId, body.farm_id);
        case "health_check":
          return await performRotationHealthCheck(env2, userId, body.rotation_id);
        default:
          return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
      }
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error3) {
    console.error("Crop rotation API error:", error3);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
async function listRotationPlans(env2, userId, farmId) {
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env2.DB.prepare(accessQuery).bind(farmId, userId).all();
  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const query = `
    SELECT crp.*, f.name as field_name
    FROM crop_rotation_plans crp
    JOIN fields f ON crp.field_id = f.id
    WHERE crp.farm_id = ?
    ORDER BY crp.created_at DESC
  `;
  const { results: plans } = await env2.DB.prepare(query).bind(farmId).all();
  const plansWithSequences = plans.map((plan) => ({
    ...plan,
    crop_sequence: JSON.parse(plan.crop_sequence)
  }));
  return new Response(JSON.stringify(plansWithSequences), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function createRotationPlan(env2, userId, data) {
  const { farm_id, field_id, crop_sequence } = data;
  const accessQuery = `
    SELECT fm.id FROM farm_members fm
    JOIN fields f ON fm.farm_id = f.farm_id
    WHERE fm.user_id = ? AND f.id = ? AND fm.farm_id = ?
  `;
  const { results: access } = await env2.DB.prepare(accessQuery).bind(userId, field_id, farm_id).all();
  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const existingQuery = `
    SELECT id FROM crop_rotation_plans 
    WHERE field_id = ? AND is_active = 1
  `;
  const { results: existing } = await env2.DB.prepare(existingQuery).bind(field_id).all();
  if (existing && existing.length > 0) {
    return new Response(JSON.stringify({ error: "Rotation plan already exists for this field" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const validationResult = validateCropSequence(crop_sequence);
  if (!validationResult.isValid) {
    return new Response(JSON.stringify({
      error: "Invalid crop sequence",
      issues: validationResult.issues
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const insertQuery = `
    INSERT INTO crop_rotation_plans (
      farm_id, field_id, crop_sequence, notes, is_active, created_by, created_at
    ) VALUES (?, ?, ?, ?, 1, ?, datetime('now'))
  `;
  const result = await env2.DB.prepare(insertQuery).bind(
    farm_id,
    field_id,
    JSON.stringify(crop_sequence),
    data.notes || null,
    userId
  ).run();
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Failed to create rotation plan" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const healthCheck = performRotationHealthCheckSync(crop_sequence);
  return new Response(JSON.stringify({
    success: true,
    id: result.meta.last_row_id,
    health_check: healthCheck
  }), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
}
async function updateRotationPlan(env2, userId, data) {
  const { id, farm_id, crop_sequence, notes, status } = data;
  const accessQuery = `
    SELECT crp.id FROM crop_rotation_plans crp
    JOIN farm_members fm ON crp.farm_id = fm.farm_id
    WHERE crp.id = ? AND fm.user_id = ? AND crp.farm_id = ?
  `;
  const { results: access } = await env2.DB.prepare(accessQuery).bind(id, userId, farm_id).all();
  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const updateQuery = `
    UPDATE crop_rotation_plans 
    SET crop_sequence = ?, notes = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `;
  const result = await env2.DB.prepare(updateQuery).bind(JSON.stringify(crop_sequence), notes, status, id).run();
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Failed to update rotation plan" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function deleteRotationPlan(env2, userId, planId) {
  const accessQuery = `
    SELECT crp.id FROM crop_rotation_plans crp
    JOIN farm_members fm ON crp.farm_id = fm.farm_id
    WHERE crp.id = ? AND fm.user_id = ?
  `;
  const { results: access } = await env2.DB.prepare(accessQuery).bind(planId, userId).all();
  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const updateQuery = `
    UPDATE crop_rotation_plans 
    SET is_active = 0, updated_at = datetime('now')
    WHERE id = ?
  `;
  const result = await env2.DB.prepare(updateQuery).bind(planId).run();
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Failed to delete rotation plan" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function getRotationRecommendations(env2, userId, farmId) {
  const cropQuery = `
    SELECT DISTINCT crop_type, field_id, f.name as field_name
    FROM crops c
    JOIN fields f ON c.field_id = f.id
    WHERE c.farm_id = ?
    ORDER BY c.planting_date DESC
  `;
  const { results: farmCrops } = await env2.DB.prepare(cropQuery).bind(farmId).all();
  const recommendations = generateRotationRecommendations(farmCrops);
  return new Response(JSON.stringify({
    current_crops: farmCrops,
    recommendations
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function performRotationHealthCheck(env2, userId, rotationId) {
  const planQuery = `
    SELECT crp.*, f.name as field_name
    FROM crop_rotation_plans crp
    JOIN fields f ON crp.field_id = f.id
    WHERE crp.id = ?
  `;
  const { results: plans } = await env2.DB.prepare(planQuery).bind(rotationId).all();
  if (!plans || plans.length === 0) {
    return new Response(JSON.stringify({ error: "Rotation plan not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  const plan = plans[0];
  const cropSequence = JSON.parse(plan.crop_sequence);
  const healthCheck = performRotationHealthCheckSync(cropSequence);
  return new Response(JSON.stringify(healthCheck), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
function validateCropSequence(cropSequence) {
  const issues = [];
  if (!Array.isArray(cropSequence) || cropSequence.length === 0) {
    issues.push("Crop sequence must be a non-empty array");
    return { isValid: false, issues };
  }
  for (let i = 0; i < cropSequence.length; i++) {
    const crop = cropSequence[i];
    if (!crop.year || !crop.crop_type) {
      issues.push(`Crop ${i + 1}: Missing required fields (year, crop_type)`);
    }
    if (crop.planting_date && crop.harvest_date) {
      if (new Date(crop.harvest_date) <= new Date(crop.planting_date)) {
        issues.push(`Crop ${i + 1}: Harvest date must be after planting date`);
      }
    }
  }
  return { isValid: issues.length === 0, issues };
}
function performRotationHealthCheckSync(cropSequence) {
  const issues = [];
  const recommendations = [];
  const score = { soilHealth: 0, diseasePrevention: 0, nutrientBalance: 0, overall: 0 };
  const cropFamilies = cropSequence.map((crop) => getCropFamily(crop.crop_type));
  const familyCounts = cropFamilies.reduce((acc, family) => {
    acc[family] = (acc[family] || 0) + 1;
    return acc;
  }, {});
  let diseaseScore = 100;
  for (const [family, count3] of Object.entries(familyCounts)) {
    if (count3 > 1 && family !== "Other") {
      const years = cropSequence.length;
      if (years <= 3 && count3 > 1) {
        issues.push(`${family} crops repeated within ${years}-year rotation (recommended: 3+ years)`);
        diseaseScore -= 30;
      } else if (count3 > 2) {
        issues.push(`Excessive ${family} crops in rotation`);
        diseaseScore -= 15;
      }
    }
  }
  const legumeYears = cropSequence.filter((crop) => getCropFamily(crop.crop_type) === "Legumes").length;
  const totalYears = cropSequence.length;
  const legumeRatio = legumeYears / totalYears;
  if (legumeRatio < 0.2) {
    issues.push("Low nitrogen-fixing crops in rotation (recommended: 20-30%)");
    recommendations.push("Include more legumes (beans, peas, lentils) to improve soil nitrogen");
    score.soilHealth -= 20;
  } else if (legumeRatio > 0.5) {
    recommendations.push("Consider reducing legume percentage to balance with other crop types");
    score.soilHealth -= 10;
  } else {
    score.soilHealth += 30;
  }
  const uniqueFamilies = new Set(cropFamilies).size;
  const diversityRatio = uniqueFamilies / totalYears;
  if (diversityRatio < 0.5) {
    issues.push("Low crop diversity in rotation");
    recommendations.push("Include more diverse crop families for better soil health");
    score.soilHealth -= 15;
  } else {
    score.soilHealth += 20;
  }
  const grainYears = cropSequence.filter((crop) => getCropFamily(crop.crop_type) === "Grains").length;
  const grainRatio = grainYears / totalYears;
  if (grainRatio === 0) {
    recommendations.push("Consider including grains to break disease cycles and build soil structure");
    score.diseasePrevention -= 10;
  } else {
    score.diseasePrevention += 15;
  }
  const rootYears = cropSequence.filter((crop) => getCropFamily(crop.crop_type) === "Root Crops").length;
  if (rootYears > 1 && rootYears / totalYears > 0.4) {
    recommendations.push("Consider alternating root crops with other types for better soil structure");
    score.soilHealth -= 10;
  }
  score.diseasePrevention = Math.max(0, diseaseScore);
  score.overall = Math.round((score.soilHealth + score.diseasePrevention + score.nutrientBalance) / 3);
  if (score.overall >= 80) {
    recommendations.push("Excellent rotation plan! This will maintain excellent soil health.");
  } else if (score.overall >= 60) {
    recommendations.push("Good rotation plan with minor improvements needed.");
  } else {
    recommendations.push("Rotation plan needs improvement for optimal soil health.");
  }
  return {
    score,
    issues,
    recommendations,
    cropFamilies: familyCounts,
    summary: {
      totalYears,
      legumeRatio: Math.round(legumeRatio * 100),
      diversityRatio: Math.round(diversityRatio * 100),
      grainRatio: Math.round(grainRatio * 100)
    }
  };
}
function generateRotationRecommendations(farmCrops) {
  const recommendations = [];
  if (farmCrops.length === 0) {
    recommendations.push({
      type: "first_rotation",
      message: "No crops found on farm. Consider starting with a basic 3-year rotation: Corn \u2192 Beans \u2192 Wheat",
      crops: ["corn", "beans", "wheat"]
    });
    return recommendations;
  }
  const currentCrops = farmCrops.map((crop) => crop.crop_type);
  const cropFamilies = [...new Set(currentCrops.map((crop) => getCropFamily(crop)))];
  if (cropFamilies.length === 1) {
    recommendations.push({
      type: "monoculture_risk",
      message: `Warning: Only ${cropFamilies[0]} crops detected. Consider diversifying to prevent disease buildup.`,
      suggestion: "Add legumes and grains to your rotation"
    });
  }
  if (!cropFamilies.includes("Legumes")) {
    recommendations.push({
      type: "nitrogen_boost",
      message: "Consider adding nitrogen-fixing crops to improve soil fertility",
      crops: ["beans", "peas", "lentils"],
      benefit: "Natural nitrogen enrichment for following crops"
    });
  }
  if (!cropFamilies.includes("Grains")) {
    recommendations.push({
      type: "disease_break",
      message: "Include grains to break disease cycles and improve soil structure",
      crops: ["wheat", "corn", "barley"],
      benefit: "Reduced disease pressure and improved soil aggregation"
    });
  }
  return recommendations;
}
function getCropFamily(cropType) {
  const families = {
    "Brassicas": ["cabbage", "broccoli", "cauliflower", "kale", "brussels_sprouts"],
    "Solanaceae": ["tomato", "pepper", "eggplant", "potato"],
    "Legumes": ["beans", "peas", "lentils", "chickpeas", "soybeans"],
    "Grains": ["corn", "wheat", "rice", "barley", "oats"],
    "Root Crops": ["carrot", "beet", "radish", "turnip", "rutabaga"],
    "Leafy Greens": ["lettuce", "spinach", "arugula", "kale"],
    "Cucurbits": ["cucumber", "squash", "pumpkin", "melon", "zucchini"]
  };
  const cropLower = cropType.toLowerCase();
  for (const [family, crops] of Object.entries(families)) {
    if (crops.includes(cropLower)) {
      return family;
    }
  }
  return "Other";
}
var init_rotation = __esm({
  "api/crops/rotation.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(onRequest3, "onRequest");
    __name(listRotationPlans, "listRotationPlans");
    __name(createRotationPlan, "createRotationPlan");
    __name(updateRotationPlan, "updateRotationPlan");
    __name(deleteRotationPlan, "deleteRotationPlan");
    __name(getRotationRecommendations, "getRotationRecommendations");
    __name(performRotationHealthCheck, "performRotationHealthCheck");
    __name(validateCropSequence, "validateCropSequence");
    __name(performRotationHealthCheckSync, "performRotationHealthCheckSync");
    __name(generateRotationRecommendations, "generateRotationRecommendations");
    __name(getCropFamily, "getCropFamily");
  }
});

// api/crops/soil-health.js
async function onRequest4(context2) {
  const { request, env: env2 } = context2;
  const method = request.method;
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { AuthUtils: AuthUtils2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    const auth2 = new AuthUtils2(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const userId = user.id;
    if (method === "POST") {
      const body = await request.json();
      const { action } = body;
      switch (action) {
        case "list_tests":
          return await listSoilTests(env2, userId, body);
        case "create_test":
          return await createSoilTest(env2, userId, body);
        case "update_test":
          return await updateSoilTest(env2, userId, body);
        case "delete_test":
          return await deleteSoilTest(env2, userId, body.id);
        case "metrics":
          return await getSoilHealthMetrics(env2, userId, body.farm_id);
        case "export_report":
          return await exportSoilReport(env2, userId, body.farm_id);
        case "recommendations":
          return await getSoilRecommendations(env2, userId, body.farm_id);
        case "trends_analysis":
          return await getSoilTrendsAnalysis(env2, userId, body.farm_id);
        default:
          return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
      }
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error3) {
    console.error("Soil Health API error:", error3);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
async function listSoilTests(env2, userId, { farm_id, field_id }) {
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env2.DB.prepare(accessQuery).bind(farm_id, userId).all();
  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  let query = `
    SELECT str.*, f.name as field_name
    FROM soil_test_results str
    JOIN fields f ON str.field_id = f.id
    WHERE str.farm_id = ?
  `;
  const queryParams = [farm_id];
  if (field_id) {
    query += " AND str.field_id = ?";
    queryParams.push(field_id);
  }
  query += " ORDER BY str.test_date DESC";
  const { results: tests } = await env2.DB.prepare(query).bind(...queryParams).all();
  const testsWithRecommendations = tests.map((test) => ({
    ...test,
    recommendations: test.recommendations ? JSON.parse(test.recommendations) : []
  }));
  return new Response(JSON.stringify(testsWithRecommendations), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function createSoilTest(env2, userId, data) {
  const { farm_id, field_id, test_type, ...testData } = data;
  const accessQuery = `
    SELECT fm.id FROM farm_members fm
    JOIN fields f ON fm.farm_id = f.farm_id
    WHERE fm.user_id = ? AND f.id = ? AND fm.farm_id = ?
  `;
  const { results: access } = await env2.DB.prepare(accessQuery).bind(userId, field_id, farm_id).all();
  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const recommendations = generateSoilRecommendations({
    ph_level: testData.ph_level,
    organic_matter_percent: testData.organic_matter_percent,
    nitrogen_ppm: testData.nitrogen_ppm,
    phosphorus_ppm: testData.phosphorus_ppm,
    potassium_ppm: testData.potassium_ppm,
    soil_type: testData.soil_type
  });
  const insertQuery = `
    INSERT INTO soil_test_results (
      farm_id, field_id, test_date, test_type, ph_level, organic_matter_percent,
      nitrogen_ppm, phosphorus_ppm, potassium_ppm, soil_type, texture, notes,
      recommendations, lab_name, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `;
  const result = await env2.DB.prepare(insertQuery).bind(
    farm_id,
    field_id,
    testData.test_date || (/* @__PURE__ */ new Date()).toISOString(),
    test_type || "lab",
    testData.ph_level,
    testData.organic_matter_percent,
    testData.nitrogen_ppm,
    testData.phosphorus_ppm,
    testData.potassium_ppm,
    testData.soil_type,
    testData.texture || null,
    testData.notes || null,
    JSON.stringify(recommendations),
    testData.lab_name || null,
    userId
  ).run();
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Failed to create soil test" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  await logSoilActivity(env2, result.meta.last_row_id, "test_created", {
    test_type,
    ph_level: testData.ph_level,
    field_id
  });
  return new Response(JSON.stringify({
    success: true,
    id: result.meta.last_row_id,
    recommendations
  }), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
}
async function updateSoilTest(env2, userId, data) {
  const { id, farm_id, ...updates } = data;
  const accessQuery = `
    SELECT str.id FROM soil_test_results str
    JOIN farm_members fm ON str.farm_id = fm.farm_id
    WHERE str.id = ? AND fm.user_id = ? AND str.farm_id = ?
  `;
  const { results: access } = await env2.DB.prepare(accessQuery).bind(id, userId, farm_id).all();
  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const updateFields = [];
  const updateValues = [];
  Object.keys(updates).forEach((key) => {
    if (updates[key] !== void 0 && key !== "id" && key !== "farm_id") {
      updateFields.push(`${key} = ?`);
      updateValues.push(updates[key]);
    }
  });
  if (updateFields.length === 0) {
    return new Response(JSON.stringify({ error: "No fields to update" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const phChanged = "ph_level" in updates;
  const nutrientsChanged = ["nitrogen_ppm", "phosphorus_ppm", "potassium_ppm", "organic_matter_percent"].some((key) => key in updates);
  if (phChanged || nutrientsChanged) {
    const newTestData = { ...updates };
    if (phChanged) newTestData.ph_level = updates.ph_level;
    if (nutrientsChanged) {
      newTestData.nitrogen_ppm = updates.nitrogen_ppm;
      newTestData.phosphorus_ppm = updates.phosphorus_ppm;
      newTestData.potassium_ppm = updates.potassium_ppm;
      newTestData.organic_matter_percent = updates.organic_matter_percent;
    }
    const newRecommendations = generateSoilRecommendations(newTestData);
    updateFields.push("recommendations = ?");
    updateValues.push(JSON.stringify(newRecommendations));
  }
  updateValues.push(id);
  const updateQuery = `
    UPDATE soil_test_results 
    SET ${updateFields.join(", ")}, updated_at = datetime('now')
    WHERE id = ?
  `;
  const result = await env2.DB.prepare(updateQuery).bind(...updateValues).run();
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Failed to update soil test" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function deleteSoilTest(env2, userId, testId) {
  const accessQuery = `
    SELECT str.id FROM soil_test_results str
    JOIN farm_members fm ON str.farm_id = fm.farm_id
    WHERE str.id = ? AND fm.user_id = ?
  `;
  const { results: access } = await env2.DB.prepare(accessQuery).bind(testId, userId).all();
  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const updateQuery = `
    UPDATE soil_test_results 
    SET is_active = 0, updated_at = datetime('now')
    WHERE id = ?
  `;
  const result = await env2.DB.prepare(updateQuery).bind(testId).run();
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Failed to delete soil test" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function getSoilHealthMetrics(env2, userId, farmId) {
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env2.DB.prepare(accessQuery).bind(farmId, userId).all();
  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const latestTestsQuery = `
    SELECT str.*, f.name as field_name
    FROM soil_test_results str
    JOIN fields f ON str.field_id = f.id
    WHERE str.farm_id = ? AND str.is_active = 1
      AND str.test_date = (
        SELECT MAX(test_date) 
        FROM soil_test_results str2 
        WHERE str2.farm_id = str.farm_id AND str2.field_id = str.field_id AND str2.is_active = 1
      )
    ORDER BY str.test_date DESC
  `;
  const { results: latestTests } = await env2.DB.prepare(latestTestsQuery).bind(farmId).all();
  if (!latestTests || latestTests.length === 0) {
    return new Response(JSON.stringify({
      overall_health_score: 0,
      ph_balance: "neutral",
      nutrient_status: "adequate",
      organic_matter_status: "moderate",
      last_test_date: null,
      next_test_recommended: new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString(),
      trends: { ph_trend: "stable", organic_matter_trend: "stable", nutrient_trend: "stable" }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  const healthScore = calculateOverallHealthScore(latestTests);
  const avgPH = latestTests.reduce((sum, test) => sum + test.ph_level, 0) / latestTests.length;
  const phBalance = avgPH < 6 ? "acidic" : avgPH > 7.5 ? "alkaline" : "neutral";
  const avgNitrogen = latestTests.reduce((sum, test) => sum + test.nitrogen_ppm, 0) / latestTests.length;
  const avgPhosphorus = latestTests.reduce((sum, test) => sum + test.phosphorus_ppm, 0) / latestTests.length;
  const avgPotassium = latestTests.reduce((sum, test) => sum + test.potassium_ppm, 0) / latestTests.length;
  let nutrientStatus = "adequate";
  const deficiencies = [];
  if (avgNitrogen < 20) deficiencies.push("nitrogen");
  if (avgPhosphorus < 25) deficiencies.push("phosphorus");
  if (avgPotassium < 100) deficiencies.push("potassium");
  if (deficiencies.length > 1) nutrientStatus = "deficient";
  else if (deficiencies.length === 0 && (avgNitrogen > 50 || avgPhosphorus > 50 || avgPotassium > 200)) {
    nutrientStatus = "excessive";
  }
  const avgOrganicMatter = latestTests.reduce((sum, test) => sum + test.organic_matter_percent, 0) / latestTests.length;
  const organicMatterStatus = avgOrganicMatter < 2 ? "low" : avgOrganicMatter > 5 ? "high" : "moderate";
  const lastTestDate = new Date(Math.max(...latestTests.map((test) => new Date(test.test_date).getTime())));
  const daysUntilNextTest = healthScore >= 80 ? 730 : healthScore >= 60 ? 540 : 365;
  const nextTestRecommended = new Date(lastTestDate.getTime() + daysUntilNextTest * 24 * 60 * 60 * 1e3);
  const trends = calculateSoilTrends(latestTests);
  return new Response(JSON.stringify({
    overall_health_score: healthScore,
    ph_balance: phBalance,
    nutrient_status: nutrientStatus,
    organic_matter_status: organicMatterStatus,
    last_test_date: lastTestDate.toISOString(),
    next_test_recommended: nextTestRecommended.toISOString(),
    trends
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function exportSoilReport(env2, userId, farmId) {
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env2.DB.prepare(accessQuery).bind(farmId, userId).all();
  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const testsQuery = `
    SELECT str.*, f.name as field_name, fm.name as farm_name
    FROM soil_test_results str
    JOIN fields f ON str.field_id = f.id
    JOIN farms fm ON str.farm_id = fm.id
    WHERE str.farm_id = ? AND str.is_active = 1
    ORDER BY str.test_date DESC, str.field_id
  `;
  const { results: tests } = await env2.DB.prepare(testsQuery).bind(farmId).all();
  const csvHeaders = [
    "Field Name",
    "Test Date",
    "pH Level",
    "Organic Matter (%)",
    "Nitrogen (ppm)",
    "Phosphorus (ppm)",
    "Potassium (ppm)",
    "Soil Type",
    "Texture",
    "Test Type",
    "Lab Name",
    "Notes"
  ];
  let csvContent = csvHeaders.join(",") + "\n";
  tests.forEach((test) => {
    const row = [
      test.field_name,
      test.test_date,
      test.ph_level,
      test.organic_matter_percent,
      test.nitrogen_ppm,
      test.phosphorus_ppm,
      test.potassium_ppm,
      test.soil_type,
      test.texture || "",
      test.test_type,
      test.lab_name || "",
      (test.notes || "").replace(/,/g, ";")
      // Replace commas to avoid CSV issues
    ];
    csvContent += row.join(",") + "\n";
  });
  return new Response(JSON.stringify({
    report: csvContent,
    filename: `soil-health-report-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function getSoilRecommendations(env2, userId, farmId) {
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env2.DB.prepare(accessQuery).bind(farmId, userId).all();
  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const latestTestsQuery = `
    SELECT str.*, f.name as field_name
    FROM soil_test_results str
    JOIN fields f ON str.field_id = f.id
    WHERE str.farm_id = ? AND str.is_active = 1
      AND str.test_date = (
        SELECT MAX(test_date) 
        FROM soil_test_results str2 
        WHERE str2.farm_id = str.farm_id AND str2.field_id = str.field_id AND str2.is_active = 1
      )
  `;
  const { results: tests } = await env2.DB.prepare(latestTestsQuery).bind(farmId).all();
  const recommendations = [];
  tests.forEach((test) => {
    const fieldRecommendations = generateFieldSpecificRecommendations(test);
    if (fieldRecommendations.length > 0) {
      recommendations.push({
        field_id: test.field_id,
        field_name: test.field_name,
        test_date: test.test_date,
        recommendations: fieldRecommendations
      });
    }
  });
  const generalRecommendations = generateGeneralRecommendations(tests);
  recommendations.push({
    field_name: "General",
    recommendations: generalRecommendations
  });
  return new Response(JSON.stringify({ recommendations }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function getSoilTrendsAnalysis(env2, userId, farmId) {
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env2.DB.prepare(accessQuery).bind(farmId, userId).all();
  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const historyQuery = `
    SELECT str.*, f.name as field_name
    FROM soil_test_results str
    JOIN fields f ON str.field_id = f.id
    WHERE str.farm_id = ? AND str.is_active = 1
    ORDER BY str.test_date ASC, str.field_id
  `;
  const { results: history } = await env2.DB.prepare(historyQuery).bind(farmId).all();
  const fieldTrends = {};
  history.forEach((test) => {
    if (!fieldTrends[test.field_id]) {
      fieldTrends[test.field_id] = {
        field_name: test.field_name,
        tests: []
      };
    }
    fieldTrends[test.field_id].tests.push(test);
  });
  const trendAnalysis = [];
  for (const [fieldId, data] of Object.entries(fieldTrends)) {
    const tests = data.tests;
    if (tests.length < 2) continue;
    const phTrend = calculateTrend(tests.map((t) => ({ date: t.test_date, value: t.ph_level })));
    const organicMatterTrend = calculateTrend(tests.map((t) => ({ date: t.test_date, value: t.organic_matter_percent })));
    const nitrogenTrend = calculateTrend(tests.map((t) => ({ date: t.test_date, value: t.nitrogen_ppm })));
    trendAnalysis.push({
      field_id: fieldId,
      field_name: data.field_name,
      test_count: tests.length,
      date_range: {
        first: tests[0].test_date,
        last: tests[tests.length - 1].test_date
      },
      trends: {
        ph: phTrend,
        organic_matter: organicMatterTrend,
        nitrogen: nitrogenTrend
      }
    });
  }
  return new Response(JSON.stringify({ trend_analysis: trendAnalysis }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function logSoilActivity(env2, testId, action, details) {
  try {
    const insertQuery = `
      INSERT INTO soil_health_logs (
        test_id, action, details, logged_at
      ) VALUES (?, ?, ?, datetime('now'))
    `;
    await env2.DB.prepare(insertQuery).bind(testId, action, JSON.stringify(details)).run();
  } catch (error3) {
    console.warn("Failed to log soil activity:", error3);
  }
}
function generateSoilRecommendations(testData) {
  const recommendations = [];
  if (testData.ph_level < 6) {
    recommendations.push("Apply lime to increase soil pH to optimal range (6.0-7.0)");
    recommendations.push("Consider using dolomitic lime if soil is also low in magnesium");
  } else if (testData.ph_level > 7.5) {
    recommendations.push("Apply elemental sulfur to decrease soil pH");
    recommendations.push("Use acidic fertilizers and organic matter to lower pH naturally");
  }
  if (testData.organic_matter_percent < 2) {
    recommendations.push("Add 2-4 inches of compost or aged manure");
    recommendations.push("Plant cover crops to increase organic matter");
    recommendations.push("Avoid over-tilling to preserve soil structure");
  } else if (testData.organic_matter_percent > 6) {
    recommendations.push("Organic matter levels are optimal");
    recommendations.push("Continue current organic matter management practices");
  }
  if (testData.nitrogen_ppm < 20) {
    recommendations.push("Apply nitrogen-rich fertilizers (10-0-0) or compost");
    recommendations.push("Plant nitrogen-fixing legumes to naturally enrich soil");
  }
  if (testData.phosphorus_ppm < 25) {
    recommendations.push("Apply bone meal or rock phosphate for phosphorus");
    recommendations.push("Maintain soil pH in optimal range for phosphorus availability");
  }
  if (testData.potassium_ppm < 100) {
    recommendations.push("Apply potassium sulfate or wood ash for potassium");
    recommendations.push("Avoid over-liming which can reduce potassium availability");
  }
  if (testData.soil_type === "clay") {
    recommendations.push("Improve drainage by adding organic matter and sand");
    recommendations.push("Avoid working soil when wet to prevent compaction");
  } else if (testData.soil_type === "sandy") {
    recommendations.push("Add organic matter to improve water and nutrient retention");
    recommendations.push("Consider more frequent, smaller fertilizer applications");
  }
  return recommendations;
}
function calculateOverallHealthScore(tests) {
  let totalScore = 0;
  let factorCount = 0;
  tests.forEach((test) => {
    const phScore = Math.max(0, 100 - Math.abs(test.ph_level - 6.5) * 20);
    totalScore += phScore * 0.25;
    factorCount += 0.25;
    const omScore = Math.min(100, test.organic_matter_percent * 20);
    totalScore += omScore * 0.25;
    factorCount += 0.25;
    const nitrogenScore = Math.min(100, Math.max(0, test.nitrogen_ppm / 30 * 100));
    const phosphorusScore = Math.min(100, Math.max(0, test.phosphorus_ppm / 35 * 100));
    const potassiumScore = Math.min(100, Math.max(0, test.potassium_ppm / 150 * 100));
    const nutrientScore = (nitrogenScore + phosphorusScore + potassiumScore) / 3;
    totalScore += nutrientScore * 0.25;
    factorCount += 0.25;
    const soilTypeScore = getSoilTypeHealthScore(test.soil_type);
    totalScore += soilTypeScore * 0.25;
    factorCount += 0.25;
  });
  return Math.round(totalScore / factorCount);
}
function getSoilTypeHealthScore(soilType) {
  const scores = {
    "loam": 90,
    "silt": 80,
    "sandy": 70,
    "clay": 75,
    "peat": 60
  };
  return scores[soilType] || 70;
}
function calculateSoilTrends(tests) {
  if (tests.length < 2) {
    return {
      ph_trend: "stable",
      organic_matter_trend: "stable",
      nutrient_trend: "stable"
    };
  }
  const sortedTests = tests.sort((a, b) => new Date(a.test_date) - new Date(b.test_date));
  const firstTest = sortedTests[0];
  const lastTest = sortedTests[sortedTests.length - 1];
  const phChange = lastTest.ph_level - firstTest.ph_level;
  const omChange = lastTest.organic_matter_percent - firstTest.organic_matter_percent;
  const nutrientChange = lastTest.nitrogen_ppm + lastTest.phosphorus_ppm + lastTest.potassium_ppm - (firstTest.nitrogen_ppm + firstTest.phosphorus_ppm + firstTest.potassium_ppm);
  return {
    ph_trend: phChange > 0.5 ? "improving" : phChange < -0.5 ? "declining" : "stable",
    organic_matter_trend: omChange > 0.5 ? "improving" : omChange < -0.5 ? "declining" : "stable",
    nutrient_trend: nutrientChange > 10 ? "improving" : nutrientChange < -10 ? "declining" : "stable"
  };
}
function generateFieldSpecificRecommendations(test) {
  const recommendations = [];
  if (test.ph_level < 6) {
    recommendations.push({
      type: "pH_correction",
      priority: "high",
      description: `Soil pH (${test.ph_level.toFixed(1)}) is too acidic for optimal crop growth`,
      action: "Apply lime to raise pH to 6.0-7.0 range",
      timeline: "Apply 6 months before planting"
    });
  } else if (test.ph_level > 7.5) {
    recommendations.push({
      type: "pH_correction",
      priority: "medium",
      description: `Soil pH (${test.ph_level.toFixed(1)}) is too alkaline`,
      action: "Apply elemental sulfur to lower pH",
      timeline: "Apply 6 months before planting"
    });
  }
  if (test.organic_matter_percent < 2) {
    recommendations.push({
      type: "organic_matter",
      priority: "high",
      description: `Low organic matter (${test.organic_matter_percent.toFixed(1)}%)`,
      action: "Add 2-4 inches of compost or aged manure annually",
      timeline: "Apply before planting season"
    });
  }
  if (test.nitrogen_ppm < 20) {
    recommendations.push({
      type: "nitrogen",
      priority: "medium",
      description: `Low nitrogen (${test.nitrogen_ppm} ppm)`,
      action: "Apply nitrogen-rich fertilizer or compost",
      timeline: "Apply at planting and mid-season"
    });
  }
  return recommendations;
}
function generateGeneralRecommendations(tests) {
  const recommendations = [];
  const oldestTest = Math.min(...tests.map((t) => new Date(t.test_date).getTime()));
  const daysSinceLastTest = (Date.now() - oldestTest) / (1e3 * 60 * 60 * 24);
  if (daysSinceLastTest > 730) {
    recommendations.push({
      type: "testing_frequency",
      priority: "high",
      description: "Soil tests are over 2 years old",
      action: "Conduct new soil tests for accurate recommendations",
      timeline: "Schedule testing before next growing season"
    });
  }
  const avgHealthScore = tests.length > 0 ? tests.reduce((sum, test) => sum + calculateOverallHealthScore([test]), 0) / tests.length : 0;
  if (avgHealthScore < 60) {
    recommendations.push({
      type: "overall_improvement",
      priority: "high",
      description: `Overall soil health score is ${avgHealthScore}/100`,
      action: "Implement comprehensive soil improvement program",
      timeline: "Start immediately, ongoing improvement"
    });
  }
  return recommendations;
}
function calculateTrend(dataPoints) {
  if (dataPoints.length < 2) return { direction: "stable", magnitude: 0 };
  const sortedPoints = dataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstValue = sortedPoints[0].value;
  const lastValue = sortedPoints[sortedPoints.length - 1].value;
  const change = lastValue - firstValue;
  const changePercent = firstValue !== 0 ? change / firstValue * 100 : 0;
  if (Math.abs(changePercent) < 5) {
    return { direction: "stable", magnitude: 0 };
  } else if (changePercent > 0) {
    return { direction: "improving", magnitude: Math.round(changePercent) };
  } else {
    return { direction: "declining", magnitude: Math.round(Math.abs(changePercent)) };
  }
}
var init_soil_health = __esm({
  "api/crops/soil-health.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(onRequest4, "onRequest");
    __name(listSoilTests, "listSoilTests");
    __name(createSoilTest, "createSoilTest");
    __name(updateSoilTest, "updateSoilTest");
    __name(deleteSoilTest, "deleteSoilTest");
    __name(getSoilHealthMetrics, "getSoilHealthMetrics");
    __name(exportSoilReport, "exportSoilReport");
    __name(getSoilRecommendations, "getSoilRecommendations");
    __name(getSoilTrendsAnalysis, "getSoilTrendsAnalysis");
    __name(logSoilActivity, "logSoilActivity");
    __name(generateSoilRecommendations, "generateSoilRecommendations");
    __name(calculateOverallHealthScore, "calculateOverallHealthScore");
    __name(getSoilTypeHealthScore, "getSoilTypeHealthScore");
    __name(calculateSoilTrends, "calculateSoilTrends");
    __name(generateFieldSpecificRecommendations, "generateFieldSpecificRecommendations");
    __name(generateGeneralRecommendations, "generateGeneralRecommendations");
    __name(calculateTrend, "calculateTrend");
  }
});

// api/finance/entries.js
async function onRequest5(context2) {
  const { request, env: env2 } = context2;
  const method = request.method;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      const { results: financeEntries, error: error3 } = await env2.DB.prepare(`
        SELECT 
          fe.id,
          fe.entry_date,
          fe.type,
          fe.amount,
          fe.currency,
          fe.account,
          fe.description,
          fe.reference_type,
          fe.reference_id,
          fe.created_at,
          fa.name as farm_name
        FROM finance_entries fe
        JOIN farm_members fm ON fe.farm_id = fm.farm_id
        JOIN farms fa ON fe.farm_id = fa.id
        WHERE fm.user_id = ?
        ORDER BY fe.entry_date DESC, fe.created_at DESC
      `).bind(user.id).all();
      if (error3) {
        console.error("Database error:", error3);
        return createErrorResponse("Database error", 500);
      }
      return createSuccessResponse(financeEntries || []);
    } else if (method === "POST") {
      const body = await request.json();
      const { farm_id, entry_date, type, amount, currency, account, description, reference_type, reference_id } = body;
      if (!farm_id || !type || !amount) {
        return createErrorResponse("Farm ID, type, and amount required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse("Farm not found or access denied", 404);
      }
      const { results, error: insertError } = await env2.DB.prepare(`
        INSERT INTO finance_entries (farm_id, entry_date, type, amount, currency, account, description, reference_type, reference_id, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id,
        entry_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        // Default to today's date
        type,
        amount,
        currency || "USD",
        account || null,
        description || null,
        reference_type || null,
        reference_id || null,
        user.id
      ).run();
      if (insertError) {
        console.error("Insert error:", insertError);
        return createErrorResponse("Failed to create finance entry", 500);
      }
      const { results: entryResults } = await env2.DB.prepare(`
        SELECT 
          fe.id,
          fe.entry_date,
          fe.type,
          fe.amount,
          fe.currency,
          fe.account,
          fe.description,
          fe.reference_type,
          fe.reference_id,
          fe.created_at,
          fa.name as farm_name
        FROM finance_entries fe
        JOIN farms fa ON fe.farm_id = fa.id
        WHERE fe.rowid = last_insert_rowid()
      `).all();
      const newEntry = entryResults[0];
      return createSuccessResponse(newEntry);
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error3) {
    console.error("Finance entries API error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
var init_entries = __esm({
  "api/finance/entries.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest5, "onRequest");
  }
});

// api/operations/apply-treatment-cloudflare.js
async function onRequest6(context2) {
  const { request, env: env2 } = context2;
  const SUPABASE_URL = env2.SUPABASE_URL;
  const SERVICE_ROLE = env2.SUPABASE_SERVICE_ROLE_KEY;
  const SENTRY_DSN = env2.SENTRY_DSN;
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      throw new Error("Server misconfigured: missing Supabase credentials");
    }
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "GET",
      headers: { "Authorization": authHeader }
    });
    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "invalid token" }), { status: 401 });
    }
    const userJson = await userRes.json();
    const userId = userJson?.id;
    if (!userId) return new Response(JSON.stringify({ error: "could not determine user id" }), { status: 401 });
    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
    }
    const idempotencyKey = request.headers.get("Idempotency-Key") || null;
    const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/apply_treatment`;
    const rpcBody = { payload, user_id: userId, idempotency_key: idempotencyKey };
    const rpcRes = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_ROLE,
        "Authorization": `Bearer ${SERVICE_ROLE}`
      },
      body: JSON.stringify(rpcBody)
    });
    const rpcJson = await rpcRes.text();
    let responseBody;
    try {
      responseBody = JSON.parse(rpcJson);
    } catch (e) {
      responseBody = { error: "invalid rpc response" };
    }
    let status = rpcRes.status;
    if (responseBody.error === "insufficient_inventory") {
      status = 409;
    } else if (responseBody.error) {
      status = 400;
    }
    if (status === 200 && responseBody.treatmentId) {
      triggerTreatmentAppliedWebhook(env2, {
        treatmentId: responseBody.treatmentId,
        farmId: payload.farmId,
        items: payload.items,
        appliedAt: payload.appliedAt,
        recordedBy: userId
      }).catch((err) => console.error("Webhook trigger failed:", err));
    }
    console.log(`apply-treatment: user=${userId}, status=${status}, idempotency=${idempotencyKey}`);
    return new Response(JSON.stringify(responseBody), { status, headers: { "Content-Type": "application/json" } });
  } catch (error3) {
    console.error("apply-treatment error:", error3);
    return new Response(JSON.stringify({ error: "internal server error" }), { status: 500 });
  }
}
async function triggerTreatmentAppliedWebhook(env2, data) {
  try {
    const webhookUrl = `${env2.CF_PAGES_URL || "http://localhost:8788"}/api/webhooks/events`;
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env2.WEBHOOK_SECRET}`
      },
      body: JSON.stringify({
        event: "treatment.applied",
        data
      })
    });
  } catch (error3) {
    console.error("Failed to trigger webhook:", error3);
  }
}
var init_apply_treatment_cloudflare = __esm({
  "api/operations/apply-treatment-cloudflare.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(onRequest6, "onRequest");
    __name(triggerTreatmentAppliedWebhook, "triggerTreatmentAppliedWebhook");
  }
});

// api/crops-main.js
var crops_main_exports = {};
__export(crops_main_exports, {
  onRequest: () => onRequest7,
  onRequestActivities: () => onRequestActivities,
  onRequestObservations: () => onRequestObservations
});
async function onRequest7(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      const cropId = url.searchParams.get("id");
      const analytics = url.searchParams.get("analytics");
      const varieties = url.searchParams.get("varieties");
      const activities = url.searchParams.get("activities");
      const observations = url.searchParams.get("observations");
      const yields = url.searchParams.get("yields");
      const fieldId = url.searchParams.get("field_id");
      const status = url.searchParams.get("status");
      if (cropId) {
        const { results: cropResults, error: error3 } = await env2.DB.prepare(`
          SELECT 
            c.*,
            f.name as field_name,
            fa.name as farm_name,
            COALESCE((SELECT COUNT(*) FROM crop_activities ca WHERE ca.crop_id = c.id), 0) as activity_count,
            COALESCE((SELECT COUNT(*) FROM crop_observations co WHERE co.crop_id = c.id), 0) as observation_count,
            COALESCE((SELECT COUNT(*) FROM irrigation_schedules isc WHERE isc.crop_id = c.id AND isc.is_active = 1), 0) as irrigation_schedules
          FROM crops c
          JOIN farm_members fm ON c.farm_id = fm.farm_id
          JOIN farms fa ON c.farm_id = fa.id
          LEFT JOIN fields f ON c.field_id = f.id
          WHERE c.id = ? AND fm.user_id = ?
        `).bind(cropId, user.id).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        const crop = cropResults[0];
        if (!crop) {
          return createErrorResponse("Crop not found or access denied", 404);
        }
        if (activities === "true") {
          const { results: activitiesResults } = await env2.DB.prepare(`
            SELECT * FROM crop_activities 
            WHERE crop_id = ? 
            ORDER BY activity_date DESC 
            LIMIT 20
          `).bind(cropId).all();
          crop.activities = activitiesResults;
        }
        if (observations === "true") {
          const { results: observationsResults } = await env2.DB.prepare(`
            SELECT * FROM crop_observations 
            WHERE crop_id = ? 
            ORDER BY observation_date DESC 
            LIMIT 10
          `).bind(cropId).all();
          crop.observations = observationsResults;
        }
        if (yields === "true") {
          const { results: yieldsResults } = await env2.DB.prepare(`
            SELECT * FROM crop_yield_records 
            WHERE crop_id = ? 
            ORDER BY harvest_date DESC 
          `).bind(cropId).all();
          crop.yield_records = yieldsResults;
        }
        return createSuccessResponse(crop);
      } else if (varieties === "true") {
        const { results: varietiesResults, error: error3 } = await env2.DB.prepare(`
          SELECT * FROM crop_varieties 
          ORDER BY crop_type, name
        `).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        return createSuccessResponse(varietiesResults);
      } else if (analytics === "true") {
        let query = `
          SELECT 
            c.*,
            f.name as field_name,
            fa.name as farm_name,
            COALESCE((SELECT COUNT(*) FROM crop_activities ca WHERE ca.crop_id = c.id), 0) as activity_count,
            COALESCE((SELECT COUNT(*) FROM crop_observations co WHERE co.crop_id = c.id), 0) as observation_count,
            COALESCE((SELECT MAX(cyr.total_yield) FROM crop_yield_records cyr WHERE cyr.crop_id = c.id), 0) as best_yield,
            COALESCE((SELECT AVG(cyr.yield_per_hectare) FROM crop_yield_records cyr WHERE cyr.crop_id = c.id), 0) as avg_yield_per_hectare,
            COALESCE((SELECT AVG(cyr.revenue) FROM crop_yield_records cyr WHERE cyr.crop_id = c.id), 0) as avg_revenue
          FROM crops c
          JOIN farm_members fm ON c.farm_id = fm.farm_id
          JOIN farms fa ON c.farm_id = fa.id
          LEFT JOIN fields f ON c.field_id = f.id
          WHERE fm.user_id = ?
        `;
        const params = [user.id];
        if (fieldId) {
          query += " AND c.field_id = ?";
          params.push(fieldId);
        }
        if (status) {
          query += " AND c.status = ?";
          params.push(status);
        }
        query += " ORDER BY c.planting_date DESC";
        const { results: crops, error: error3 } = await env2.DB.prepare(query).bind(...params).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        return createSuccessResponse(crops || []);
      } else {
        let query = `
          SELECT 
            c.*,
            f.name as field_name,
            fa.name as farm_name
          FROM crops c
          JOIN farm_members fm ON c.farm_id = fm.farm_id
          JOIN farms fa ON c.farm_id = fa.id
          LEFT JOIN fields f ON c.field_id = f.id
          WHERE fm.user_id = ?
        `;
        const params = [user.id];
        if (fieldId) {
          query += " AND c.field_id = ?";
          params.push(fieldId);
        }
        query += " ORDER BY c.created_at DESC";
        const { results: crops, error: error3 } = await env2.DB.prepare(query).bind(...params).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        return createSuccessResponse(crops || []);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const {
        farm_id,
        field_id,
        crop_type,
        crop_variety,
        planting_date,
        expected_yield,
        seeds_used,
        fertilizer_type,
        irrigation_schedule,
        pest_control_schedule,
        soil_preparation,
        weather_requirements,
        target_weight,
        notes
      } = body;
      if (!farm_id || !crop_type) {
        return createErrorResponse("Farm ID and crop type are required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse("Farm not found or access denied", 404);
      }
      const { results, error: insertError } = await env2.DB.prepare(`
        INSERT INTO crops (
          farm_id, field_id, crop_type, crop_variety, planting_date,
          expected_yield, seeds_used, fertilizer_type, irrigation_schedule,
          pest_control_schedule, soil_preparation, weather_requirements,
          target_weight, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id,
        field_id || null,
        crop_type,
        crop_variety || null,
        planting_date || null,
        expected_yield || null,
        seeds_used || null,
        fertilizer_type || null,
        irrigation_schedule || null,
        pest_control_schedule || null,
        soil_preparation || null,
        weather_requirements || null,
        target_weight || null,
        notes || null
      ).run();
      if (insertError) {
        console.error("Insert error:", insertError);
        return createErrorResponse("Failed to create crop", 500);
      }
      const { results: cropResults } = await env2.DB.prepare(`
        SELECT 
          c.*,
          f.name as field_name,
          fa.name as farm_name
        FROM crops c
        JOIN farms fa ON c.farm_id = fa.id
        LEFT JOIN fields f ON c.field_id = f.id
        WHERE c.rowid = last_insert_rowid()
      `).all();
      const newCrop = cropResults[0];
      await env2.DB.prepare(`
        INSERT INTO crop_activities (crop_id, activity_type, activity_date, description)
        VALUES (?, 'planted', ?, ?)
      `).bind(newCrop.id, (/* @__PURE__ */ new Date()).toISOString().split("T")[0], `Planted ${crop_type}${crop_variety ? " (" + crop_variety + ")" : ""}`).run();
      return createSuccessResponse(newCrop);
    } else if (method === "PUT") {
      const body = await request.json();
      const { id, ...updateData } = body;
      if (!id) {
        return createErrorResponse("Crop ID required", 400);
      }
      const { results: existingCrops } = await env2.DB.prepare(`
        SELECT c.farm_id 
        FROM crops c
        JOIN farm_members fm ON c.farm_id = fm.farm_id
        WHERE c.id = ? AND fm.user_id = ?
      `).bind(id, user.id).all();
      if (existingCrops.length === 0) {
        return createErrorResponse("Crop not found or access denied", 404);
      }
      const updateFields = [];
      const updateValues = [];
      const allowedFields = [
        "field_id",
        "crop_type",
        "crop_variety",
        "planting_date",
        "harvest_date",
        "expected_yield",
        "actual_yield",
        "seeds_used",
        "fertilizer_type",
        "irrigation_schedule",
        "pest_control_schedule",
        "soil_preparation",
        "weather_requirements",
        "growth_stage",
        "status",
        "current_weight",
        "target_weight",
        "health_status",
        "last_inspection_date",
        "notes"
      ];
      allowedFields.forEach((field) => {
        if (updateData[field] !== void 0) {
          updateFields.push(`${field} = ?`);
          updateValues.push(updateData[field]);
        }
      });
      if (updateFields.length === 0) {
        return createErrorResponse("No fields to update", 400);
      }
      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id);
      const { error: updateError } = await env2.DB.prepare(`
        UPDATE crops 
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `).bind(...updateValues).run();
      if (updateError) {
        console.error("Update error:", updateError);
        return createErrorResponse("Failed to update crop", 500);
      }
      if (updateData.status && updateData.status !== existingCrops[0].status) {
        await env2.DB.prepare(`
          INSERT INTO crop_activities (crop_id, activity_type, activity_date, description)
          VALUES (?, ?, ?, ?)
        `).bind(id, "status_changed", (/* @__PURE__ */ new Date()).toISOString().split("T")[0], `Status changed to ${updateData.status}`).run();
      }
      const { results: cropResults } = await env2.DB.prepare(`
        SELECT 
          c.*,
          f.name as field_name,
          fa.name as farm_name
        FROM crops c
        JOIN farms fa ON c.farm_id = fa.id
        LEFT JOIN fields f ON c.field_id = f.id
        WHERE c.id = ?
      `).bind(id).all();
      return createSuccessResponse(cropResults[0]);
    } else if (method === "DELETE") {
      const cropId = url.searchParams.get("id");
      if (!cropId) {
        return createErrorResponse("Crop ID required", 400);
      }
      const { results: existingCrops } = await env2.DB.prepare(`
        SELECT c.farm_id 
        FROM crops c
        JOIN farm_members fm ON c.farm_id = fm.farm_id
        WHERE c.id = ? AND fm.user_id = ?
      `).bind(cropId, user.id).all();
      if (existingCrops.length === 0) {
        return createErrorResponse("Crop not found or access denied", 404);
      }
      const { results: dependencies } = await env2.DB.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM irrigation_schedules WHERE crop_id = ?) as irrigation_schedules,
          (SELECT COUNT(*) FROM crop_yield_records WHERE crop_id = ?) as yield_records
      `).bind(cropId, cropId).all();
      const dep = dependencies[0];
      if (dep.irrigation_schedules > 0 || dep.yield_records > 0) {
        return createErrorResponse(
          "Cannot delete crop with existing schedules or yield records. Please archive instead.",
          400
        );
      }
      const { error: deleteError } = await env2.DB.prepare(`
        DELETE FROM crops WHERE id = ?
      `).bind(cropId).run();
      if (deleteError) {
        console.error("Delete error:", deleteError);
        return createErrorResponse("Failed to delete crop", 500);
      }
      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error3) {
    console.error("Crops API error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
async function onRequestActivities(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      const cropId = url.searchParams.get("crop_id");
      const limit = url.searchParams.get("limit") || "20";
      if (!cropId) {
        return createErrorResponse("Crop ID required", 400);
      }
      const { results: accessCheck } = await env2.DB.prepare(`
        SELECT c.farm_id 
        FROM crops c
        JOIN farm_members fm ON c.farm_id = fm.farm_id
        WHERE c.id = ? AND fm.user_id = ?
      `).bind(cropId, user.id).all();
      if (accessCheck.length === 0) {
        return createErrorResponse("Access denied", 403);
      }
      const { results, error: error3 } = await env2.DB.prepare(`
        SELECT * FROM crop_activities 
        WHERE crop_id = ? 
        ORDER BY activity_date DESC 
        LIMIT ?
      `).bind(cropId, parseInt(limit)).all();
      if (error3) {
        console.error("Activities error:", error3);
        return createErrorResponse("Database error", 500);
      }
      return createSuccessResponse(results);
    } else if (method === "POST") {
      const body = await request.json();
      const { crop_id, activity_type, activity_date, description, cost, weather_conditions } = body;
      if (!crop_id || !activity_type || !activity_date) {
        return createErrorResponse("Crop ID, activity type, and date required", 400);
      }
      const { results: accessCheck } = await env2.DB.prepare(`
        SELECT c.farm_id 
        FROM crops c
        JOIN farm_members fm ON c.farm_id = fm.farm_id
        WHERE c.id = ? AND fm.user_id = ?
      `).bind(crop_id, user.id).all();
      if (accessCheck.length === 0) {
        return createErrorResponse("Access denied", 403);
      }
      const { error: error3 } = await env2.DB.prepare(`
        INSERT INTO crop_activities (
          crop_id, activity_type, activity_date, description,
          cost, worker_id, weather_conditions
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crop_id,
        activity_type,
        activity_date,
        description || "",
        cost || 0,
        user.id,
        weather_conditions || ""
      ).run();
      if (error3) {
        console.error("Activity insert error:", error3);
        return createErrorResponse("Failed to create activity", 500);
      }
      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error3) {
    console.error("Activities API error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
async function onRequestObservations(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      const cropId = url.searchParams.get("crop_id");
      const limit = url.searchParams.get("limit") || "10";
      if (!cropId) {
        return createErrorResponse("Crop ID required", 400);
      }
      const { results: accessCheck } = await env2.DB.prepare(`
        SELECT c.farm_id 
        FROM crops c
        JOIN farm_members fm ON c.farm_id = fm.farm_id
        WHERE c.id = ? AND fm.user_id = ?
      `).bind(cropId, user.id).all();
      if (accessCheck.length === 0) {
        return createErrorResponse("Access denied", 403);
      }
      const { results, error: error3 } = await env2.DB.prepare(`
        SELECT * FROM crop_observations 
        WHERE crop_id = ? 
        ORDER BY observation_date DESC 
        LIMIT ?
      `).bind(cropId, parseInt(limit)).all();
      if (error3) {
        console.error("Observations error:", error3);
        return createErrorResponse("Database error", 500);
      }
      return createSuccessResponse(results);
    } else if (method === "POST") {
      const body = await request.json();
      const {
        crop_id,
        observation_date,
        growth_stage,
        health_status,
        height_cm,
        leaf_count,
        pest_presence,
        disease_signs,
        soil_moisture,
        photos,
        notes
      } = body;
      if (!crop_id || !observation_date) {
        return createErrorResponse("Crop ID and observation date required", 400);
      }
      const { results: accessCheck } = await env2.DB.prepare(`
        SELECT c.farm_id 
        FROM crops c
        JOIN farm_members fm ON c.farm_id = fm.farm_id
        WHERE c.id = ? AND fm.user_id = ?
      `).bind(crop_id, user.id).all();
      if (accessCheck.length === 0) {
        return createErrorResponse("Access denied", 403);
      }
      const { error: error3 } = await env2.DB.prepare(`
        INSERT INTO crop_observations (
          crop_id, observation_date, growth_stage, health_status,
          height_cm, leaf_count, pest_presence, disease_signs,
          soil_moisture, photos, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crop_id,
        observation_date,
        growth_stage || null,
        health_status || null,
        height_cm || null,
        leaf_count || null,
        pest_presence ? 1 : 0,
        disease_signs || null,
        soil_moisture || null,
        photos || null,
        notes || null
      ).run();
      if (error3) {
        console.error("Observation insert error:", error3);
        return createErrorResponse("Failed to create observation", 500);
      }
      if (health_status) {
        await env2.DB.prepare(`
          UPDATE crops 
          SET health_status = ?, last_inspection_date = ?
          WHERE id = ?
        `).bind(health_status, observation_date, crop_id).run();
      }
      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error3) {
    console.error("Observations API error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
var init_crops_main = __esm({
  "api/crops-main.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest7, "onRequest");
    __name(onRequestActivities, "onRequestActivities");
    __name(onRequestObservations, "onRequestObservations");
  }
});

// api/crops.js
async function onRequest8(context2) {
  const { request, env: env2 } = context2;
  const { onRequest: mainCropsHandler } = await Promise.resolve().then(() => (init_crops_main(), crops_main_exports));
  return mainCropsHandler(context2);
}
async function onRequestPost4(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const pathname = url.pathname;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    const body = await request.json();
    const { action } = body;
    switch (action) {
      case "overview":
        return handleCropOverview(request, env2, user);
      case "health":
        return handleCropHealth(request, env2, user);
      case "yield_prediction":
        return handleYieldPrediction(request, env2, user);
      default:
        return createErrorResponse("Invalid action", 400);
    }
  } catch (error3) {
    console.error("Crops action handler error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
async function handleCropOverview(request, env2, user) {
  const body = await request.json();
  const { farm_id } = body;
  if (!farm_id) {
    return createErrorResponse("Farm ID required", 400);
  }
  try {
    if (!await new AuthUtils(env2).hasFarmAccess(user.id, farm_id)) {
      return createErrorResponse("Farm access denied", 403);
    }
    const { results, error: error3 } = await env2.DB.prepare(`
      SELECT 
        COUNT(*) as active_crops,
        COALESCE((SELECT COUNT(*) FROM crops WHERE farm_id = ? AND health_status = 'excellent'), 0) as healthy_crops,
        COALESCE((SELECT COUNT(*) FROM irrigation_schedules WHERE farm_id = ? AND is_active = 1), 0) as irrigation_systems,
        COALESCE((SELECT COUNT(*) FROM crop_pest_issues WHERE farm_id = ? AND status = 'active'), 0) as active_pest_issues,
        COALESCE((SELECT AVG(soil_health_score) FROM soil_analysis WHERE field_id IN 
          (SELECT id FROM fields WHERE farm_id = ?)), 0) as soil_health_score
      FROM crops
      WHERE farm_id = ? AND status = 'active'
    `).bind(farm_id, farm_id, farm_id, farm_id, farm_id).all();
    if (error3) {
      console.error("Database error:", error3);
      return createErrorResponse("Database error", 500);
    }
    const overview = results[0] || {};
    const { results: recentActivity } = await env2.DB.prepare(`
      SELECT 
        ca.*,
        c.crop_type,
        f.name as field_name
      FROM crop_activities ca
      JOIN crops c ON ca.crop_id = c.id
      JOIN fields f ON c.field_id = f.id
      WHERE c.farm_id = ?
      ORDER BY ca.activity_date DESC
      LIMIT 5
    `).bind(farm_id).all();
    const { results: upcomingTasks } = await env2.DB.prepare(`
      SELECT 
        t.*,
        c.crop_type,
        f.name as field_name
      FROM tasks t
      LEFT JOIN crops c ON t.target_id = CAST(c.id AS TEXT) AND t.target_type = 'crop'
      LEFT JOIN fields f ON c.field_id = f.id
      WHERE t.farm_id = ? AND t.status = 'pending' AND t.due_date <= date('now', '+30 days')
      ORDER BY t.due_date ASC
      LIMIT 5
    `).bind(farm_id).all();
    return createSuccessResponse({
      ...overview,
      recent_activity: recentActivity || [],
      upcoming_tasks: upcomingTasks || []
    });
  } catch (error3) {
    console.error("Crop overview error:", error3);
    return createErrorResponse("Failed to get crop overview", 500);
  }
}
async function handleCropHealth(request, env2, user) {
  const body = await request.json();
  const { farm_id } = body;
  if (!farm_id) {
    return createErrorResponse("Farm ID required", 400);
  }
  try {
    if (!await new AuthUtils(env2).hasFarmAccess(user.id, farm_id)) {
      return createErrorResponse("Farm access denied", 403);
    }
    const { results: healthData } = await env2.DB.prepare(`
      SELECT 
        c.id,
        c.crop_type,
        c.crop_variety,
        c.health_status,
        c.last_inspection_date,
        f.name as field_name,
        COALESCE((SELECT COUNT(*) FROM crop_observations 
          WHERE crop_id = c.id AND DATE(observation_date) >= DATE('now', '-7 days')), 0) as recent_observations
      FROM crops c
      JOIN fields f ON c.field_id = f.id
      WHERE c.farm_id = ?
      ORDER BY c.health_status DESC, c.last_inspection_date DESC
    `).bind(farm_id).all();
    const alerts = [];
    healthData.forEach((crop) => {
      if (crop.health_status === "poor") {
        alerts.push({
          type: "health_issue",
          crop: crop.crop_type,
          message: `${crop.crop_type} in ${crop.field_name} requires immediate attention`,
          priority: "high"
        });
      }
      if (!crop.last_inspection_date || (/* @__PURE__ */ new Date() - new Date(crop.last_inspection_date)) / (1e3 * 60 * 60 * 24) > 14) {
        alerts.push({
          type: "inspection_due",
          crop: crop.crop_type,
          message: `${crop.crop_type} inspection overdue`,
          priority: "medium"
        });
      }
    });
    return createSuccessResponse({
      crops: healthData,
      alerts
    });
  } catch (error3) {
    console.error("Crop health error:", error3);
    return createErrorResponse("Failed to get crop health data", 500);
  }
}
async function handleYieldPrediction(request, env2, user) {
  const body = await request.json();
  const { farm_id } = body;
  if (!farm_id) {
    return createErrorResponse("Farm ID required", 400);
  }
  try {
    if (!await new AuthUtils(env2).hasFarmAccess(user.id, farm_id)) {
      return createErrorResponse("Farm access denied", 403);
    }
    const { results: crops } = await env2.DB.prepare(`
      SELECT 
        c.id,
        c.crop_type,
        c.planting_date,
        c.expected_yield,
        c.actual_yield,
        f.name as field_name,
        f.area_hectares,
        COALESCE((SELECT AVG(yield_per_hectare) FROM crop_yield_records 
          WHERE crop_id = c.id), 0) as historical_avg_yield
      FROM crops c
      JOIN fields f ON c.field_id = f.id
      WHERE c.farm_id = ? AND c.status = 'active'
    `).bind(farm_id).all();
    const predictions = crops.map((crop) => {
      const plantingDate = new Date(crop.planting_date);
      const daysSincePlanting = (/* @__PURE__ */ new Date() - plantingDate) / (1e3 * 60 * 60 * 24);
      const growthStage = getGrowthStage(crop.crop_type, daysSincePlanting);
      let predictionConfidence = 0.7;
      let predictedYield = crop.expected_yield;
      if (crop.historical_avg_yield > 0) {
        const performanceRatio = crop.actual_yield / crop.historical_avg_yield;
        predictedYield = crop.expected_yield * performanceRatio;
        predictionConfidence = Math.min(0.9, 0.5 + performanceRatio * 0.4);
      }
      return {
        ...crop,
        growth_stage: growthStage,
        predicted_yield: Math.round(predictedYield),
        prediction_confidence: Math.round(predictionConfidence * 100),
        harvest_ready_days: Math.max(0, 90 - daysSincePlanting)
        // Rough estimate
      };
    });
    return createSuccessResponse({ predictions });
  } catch (error3) {
    console.error("Yield prediction error:", error3);
    return createErrorResponse("Failed to generate yield predictions", 500);
  }
}
function getGrowthStage(cropType, daysSincePlanting) {
  const cropTypeLower = cropType.toLowerCase();
  if (cropTypeLower.includes("corn") || cropTypeLower.includes("maize")) {
    if (daysSincePlanting < 21) return "germination";
    if (daysSincePlanting < 45) return "seedling";
    if (daysSincePlanting < 70) return "vegetative";
    if (daysSincePlanting < 90) return "flowering";
    return "mature";
  } else if (cropTypeLower.includes("tomato")) {
    if (daysSincePlanting < 14) return "germination";
    if (daysSincePlanting < 35) return "seedling";
    if (daysSincePlanting < 60) return "flowering";
    return "fruiting";
  } else {
    if (daysSincePlanting < 30) return "germination";
    if (daysSincePlanting < 60) return "growing";
    if (daysSincePlanting < 90) return "flowering";
    return "mature";
  }
}
var init_crops = __esm({
  "api/crops.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest8, "onRequest");
    __name(onRequestPost4, "onRequestPost");
    __name(handleCropOverview, "handleCropOverview");
    __name(handleCropHealth, "handleCropHealth");
    __name(handleYieldPrediction, "handleYieldPrediction");
    __name(getGrowthStage, "getGrowthStage");
  }
});

// api/analytics-engine.js
async function onRequest9(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      const farmId = url.searchParams.get("farm_id");
      const type = url.searchParams.get("type") || "comprehensive";
      const timeframe = url.searchParams.get("timeframe") || "12months";
      if (!farmId) {
        return createErrorResponse("Farm ID required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, farmId)) {
        return createErrorResponse("Access denied", 403);
      }
      switch (type) {
        case "comprehensive":
          return createSuccessResponse(await getComprehensiveAnalytics(env2, farmId, timeframe));
        case "performance":
          return createSuccessResponse(await getPerformanceAnalytics(env2, farmId, timeframe));
        case "predictive":
          return createSuccessResponse(await getPredictiveAnalytics(env2, farmId));
        case "optimization":
          return createSuccessResponse(await getOptimizationRecommendations(env2, farmId));
        case "trends":
          return createSuccessResponse(await getTrendAnalysis(env2, farmId, timeframe));
        case "roi":
          return createSuccessResponse(await getROIAnalysis(env2, farmId, timeframe));
        case "efficiency":
          return createSuccessResponse(await getEfficiencyAnalysis(env2, farmId, timeframe));
        default:
          return createErrorResponse("Unknown analytics type", 400);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const { farm_id, analysis_type, parameters } = body;
      if (!farm_id || !analysis_type) {
        return createErrorResponse("Farm ID and analysis type required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse("Access denied", 403);
      }
      const result = await generateCustomAnalysis(env2, farm_id, analysis_type, parameters);
      return createSuccessResponse(result);
    }
    return createErrorResponse("Method not allowed", 405);
  } catch (error3) {
    console.error("Analytics engine error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
async function getComprehensiveAnalytics(env2, farmId, timeframe) {
  const [animals, crops, fields, inventory, tasks, finance, weather] = await Promise.all([
    getAnimalAnalytics(env2, farmId, timeframe),
    getCropAnalytics(env2, farmId, timeframe),
    getFieldAnalytics(env2, farmId, timeframe),
    getInventoryAnalytics(env2, farmId, timeframe),
    getTaskAnalytics(env2, farmId, timeframe),
    getFinanceAnalytics(env2, farmId, timeframe),
    getWeatherAnalytics(env2, farmId, timeframe)
  ]);
  const crossModuleInsights = await generateCrossModuleInsights(env2, farmId, timeframe);
  const benchmarks = await generateBenchmarks(env2, farmId, timeframe);
  return {
    summary: {
      overall_score: calculateOverallScore({ animals, crops, fields, inventory, tasks, finance }),
      performance_trend: await calculatePerformanceTrend(env2, farmId, timeframe),
      efficiency_rating: await calculateEfficiencyRating({ animals, crops, fields, inventory, tasks, finance }),
      sustainability_score: await calculateSustainabilityScore({ animals, crops, fields, weather })
    },
    modules: {
      animals,
      crops,
      fields,
      inventory,
      tasks,
      finance,
      weather
    },
    insights: crossModuleInsights,
    benchmarks,
    recommendations: await generateRecommendations({ animals, crops, fields, inventory, tasks, finance, weather }),
    trends: await getTrendForecasting(env2, farmId)
  };
}
async function getPerformanceAnalytics(env2, farmId, timeframe) {
  return {
    kpi_trends: await getKPITrends(env2, farmId, timeframe),
    productivity_metrics: await getProductivityMetrics(env2, farmId, timeframe),
    efficiency_analysis: await getEfficiencyAnalysis(env2, farmId, timeframe),
    quality_indicators: await getQualityIndicators(env2, farmId, timeframe),
    sustainability_metrics: await getSustainabilityMetrics(env2, farmId, timeframe)
  };
}
async function getPredictiveAnalytics(env2, farmId) {
  return {
    yield_predictions: await getYieldPredictions(env2, farmId),
    demand_forecasting: await getDemandForecasting(env2, farmId),
    risk_assessment: await getRiskAssessment(env2, farmId),
    maintenance_predictions: await getMaintenancePredictions(env2, farmId),
    financial_projections: await getFinancialProjections(env2, farmId),
    weather_impact_analysis: await getWeatherImpactAnalysis(env2, farmId)
  };
}
async function getOptimizationRecommendations(env2, farmId) {
  return {
    resource_optimization: await getResourceOptimization(env2, farmId),
    workflow_optimization: await getWorkflowOptimization(env2, farmId),
    cost_reduction: await getCostReductionRecommendations(env2, farmId),
    yield_improvement: await getYieldImprovementRecommendations(env2, farmId),
    efficiency_boosters: await getEfficiencyBoosters(env2, farmId),
    sustainability_improvements: await getSustainabilityImprovements(env2, farmId)
  };
}
async function getAnimalAnalytics(env2, farmId, timeframe) {
  const animalData = await env2.DB.prepare(`
    SELECT 
      species,
      COUNT(*) as total_count,
      COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_count,
      COUNT(CASE WHEN health_status = 'sick' THEN 1 END) as sick_count,
      AVG(CASE WHEN current_weight IS NOT NULL THEN current_weight END) as avg_weight,
      COUNT(CASE WHEN vaccination_status = 'current' THEN 1 END) as vaccinated_count,
      COUNT(CASE WHEN production_type IS NOT NULL THEN 1 END) as productive_animals,
      AVG(CASE WHEN production_value IS NOT NULL THEN production_value END) as avg_production_value
    FROM animals
    WHERE farm_id = ?
    GROUP BY species
  `).bind(farmId).all();
  const healthTrends = await env2.DB.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as health_checks,
      COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_count
    FROM animals
    WHERE farm_id = ?
      AND date(created_at) >= date(?, ?)
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).bind(farmId, (/* @__PURE__ */ new Date()).toISOString(), `-${timeframe}`).all();
  const productionEfficiency = await env2.DB.prepare(`
    SELECT 
      ap.animal_id,
      ap.production_type,
      AVG(ap.quantity) as avg_daily_production,
      MAX(ap.quantity) as max_daily_production,
      COUNT(*) as production_days
    FROM animal_production ap
    JOIN animals a ON ap.animal_id = a.id
    WHERE a.farm_id = ?
      AND date(ap.production_date) >= date(?, ?)
    GROUP BY ap.animal_id, ap.production_type
  `).bind(farmId, (/* @__PURE__ */ new Date()).toISOString(), `-${timeframe}`).all();
  return {
    overview: animalData,
    health_trends: healthTrends,
    production_efficiency: productionEfficiency,
    performance_score: calculateAnimalPerformanceScore(animalData),
    optimization_opportunities: await getAnimalOptimizationOpportunities(env2, farmId)
  };
}
async function getCropAnalytics(env2, farmId, timeframe) {
  const cropData = await env2.DB.prepare(`
    SELECT 
      crop_type,
      COUNT(*) as total_crops,
      COUNT(CASE WHEN growth_stage = 'mature' THEN 1 END) as mature_crops,
      COUNT(CASE WHEN growth_stage = 'flowering' THEN 1 END) as flowering_crops,
      AVG(CASE WHEN expected_yield IS NOT NULL THEN expected_yield END) as avg_expected_yield,
      AVG(CASE WHEN actual_yield IS NOT NULL THEN actual_yield END) as avg_actual_yield,
      COUNT(CASE WHEN health_status = 'excellent' THEN 1 END) as excellent_health,
      AVG(CASE WHEN soil_moisture IS NOT NULL THEN soil_moisture END) as avg_soil_moisture
    FROM crops
    WHERE farm_id = ?
    GROUP BY crop_type
  `).bind(farmId).all();
  const yieldPerformance = await env2.DB.prepare(`
    SELECT 
      c.crop_type,
      AVG(CASE WHEN c.expected_yield > 0 THEN (c.actual_yield / c.expected_yield) * 100 ELSE NULL END) as yield_efficiency,
      COUNT(CASE WHEN c.actual_yield IS NOT NULL THEN 1 END) as harvested_crops
    FROM crops c
    WHERE c.farm_id = ?
      AND date(c.created_at) >= date(?, ?)
    GROUP BY c.crop_type
  `).bind(farmId, (/* @__PURE__ */ new Date()).toISOString(), `-${timeframe}`).all();
  const plantingSchedule = await env2.DB.prepare(`
    SELECT 
      planting_date,
      crop_type,
      COUNT(*) as plantings,
      AVG(expected_yield) as avg_expected_yield
    FROM crops
    WHERE farm_id = ?
      AND planting_date IS NOT NULL
      AND date(planting_date) >= date(?, ?)
    GROUP BY planting_date, crop_type
    ORDER BY planting_date DESC
  `).bind(farmId, (/* @__PURE__ */ new Date()).toISOString(), `-${timeframe}`).all();
  return {
    overview: cropData,
    yield_performance: yieldPerformance,
    planting_schedule: plantingSchedule,
    performance_score: calculateCropPerformanceScore(cropData),
    optimization_opportunities: await getCropOptimizationOpportunities(env2, farmId)
  };
}
async function getFieldAnalytics(env2, farmId, timeframe) {
  const fieldData = await env2.DB.prepare(`
    SELECT 
      COUNT(*) as total_fields,
      AVG(area_hectares) as avg_field_size,
      COUNT(CASE WHEN soil_type IS NOT NULL THEN 1 END) as analyzed_fields,
      COUNT(CASE WHEN current_cover_crop IS NOT NULL THEN 1 END) as cultivated_fields,
      AVG(CASE WHEN soil_ph IS NOT NULL THEN soil_ph END) as avg_soil_ph,
      AVG(CASE WHEN drainage_quality = 'excellent' THEN 1 WHEN drainage_quality = 'good' THEN 0.8 WHEN drainage_quality = 'fair' THEN 0.6 ELSE 0.4 END) as avg_drainage_score
    FROM fields
    WHERE farm_id = ?
  `).bind(farmId).all();
  const utilizationRates = await env2.DB.prepare(`
    SELECT 
      f.area_hectares,
      COUNT(c.id) as active_crops,
      COALESCE(SUM(c.area_hectares), 0) as cultivated_area,
      (COALESCE(SUM(c.area_hectares), 0) / f.area_hectares) * 100 as utilization_rate
    FROM fields f
    LEFT JOIN crops c ON f.id = c.field_id AND c.growth_stage IN ('planted', 'growing', 'flowering', 'mature')
    WHERE f.farm_id = ?
    GROUP BY f.id, f.area_hectares
  `).bind(farmId).all();
  const soilHealthTrends = await env2.DB.prepare(`
    SELECT 
      DATE(sa.analysis_date) as date,
      AVG(sa.ph_level) as avg_ph,
      AVG(sa.organic_matter) as avg_organic_matter,
      COUNT(sa.id) as analyses
    FROM soil_analysis sa
    JOIN fields f ON sa.field_id = f.id
    WHERE f.farm_id = ?
      AND date(sa.analysis_date) >= date(?, ?)
    GROUP BY DATE(sa.analysis_date)
    ORDER BY date DESC
  `).bind(farmId, (/* @__PURE__ */ new Date()).toISOString(), `-${timeframe}`).all();
  return {
    overview: fieldData[0] || {},
    utilization_rates: utilizationRates,
    soil_health_trends: soilHealthTrends,
    performance_score: calculateFieldPerformanceScore(fieldData[0]),
    optimization_opportunities: await getFieldOptimizationOpportunities(env2, farmId)
  };
}
async function getInventoryAnalytics(env2, farmId, timeframe) {
  const inventoryData = await env2.DB.prepare(`
    SELECT 
      COUNT(*) as total_items,
      COUNT(CASE WHEN qty <= reorder_threshold THEN 1 END) as low_stock_items,
      COUNT(CASE WHEN qty = 0 THEN 1 END) as out_of_stock_items,
      COALESCE(SUM(qty * unit_cost), 0) as total_inventory_value,
      COUNT(CASE WHEN expiration_date IS NOT NULL AND expiration_date <= date('now', '+30 days') THEN 1 END) as expiring_items,
      AVG(CASE WHEN reorder_threshold > 0 THEN (qty / reorder_threshold) * 100 ELSE NULL END) as avg_stock_level
    FROM inventory_items
    WHERE farm_id = ?
  `).bind(farmId).all();
  const usagePatterns = await env2.DB.prepare(`
    SELECT 
      it.reason_type,
      SUM(ABS(it.qty_delta)) as total_usage,
      COUNT(*) as usage_count,
      AVG(ABS(it.qty_delta)) as avg_usage_per_transaction
    FROM inventory_transactions it
    WHERE it.farm_id = ?
      AND it.qty_delta < 0
      AND date(it.created_at) >= date(?, ?)
    GROUP BY it.reason_type
    ORDER BY total_usage DESC
  `).bind(farmId, (/* @__PURE__ */ new Date()).toISOString(), `-${timeframe}`).all();
  const turnoverRates = await env2.DB.prepare(`
    SELECT 
      ii.name,
      ii.category,
      SUM(CASE WHEN it.qty_delta < 0 THEN ABS(it.qty_delta) ELSE 0 END) as total_consumed,
      ii.qty as current_stock,
      CASE WHEN ii.initial_stock > 0 
           THEN (SUM(CASE WHEN it.qty_delta < 0 THEN ABS(it.qty_delta) ELSE 0 END) / ii.initial_stock) * 100 
           ELSE 0 END as turnover_rate
    FROM inventory_items ii
    LEFT JOIN inventory_transactions it ON ii.id = it.inventory_item_id
    WHERE ii.farm_id = ?
      AND date(it.created_at) >= date(?, ?)
    GROUP BY ii.id, ii.name, ii.category, ii.qty, ii.initial_stock
    HAVING total_consumed > 0
    ORDER BY turnover_rate DESC
  `).bind(farmId, (/* @__PURE__ */ new Date()).toISOString(), `-${timeframe}`).all();
  return {
    overview: inventoryData[0] || {},
    usage_patterns: usagePatterns,
    turnover_rates: turnoverRates,
    performance_score: calculateInventoryPerformanceScore(inventoryData[0]),
    optimization_opportunities: await getInventoryOptimizationOpportunities(env2, farmId)
  };
}
async function getTaskAnalytics(env2, farmId, timeframe) {
  const taskData = await env2.DB.prepare(`
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_tasks,
      COUNT(CASE WHEN due_date < date('now') AND status != 'completed' THEN 1 END) as overdue_tasks,
      AVG(CASE WHEN estimated_duration IS NOT NULL AND actual_duration IS NOT NULL 
           THEN (actual_duration / estimated_duration) * 100 ELSE NULL END) as avg_completion_ratio,
      COUNT(CASE WHEN progress_percentage = 100 THEN 1 END) as fully_completed_tasks
    FROM tasks
    WHERE farm_id = ?
  `).bind(farmId).all();
  const productivityMetrics = await env2.DB.prepare(`
    SELECT 
      assigned_to,
      COUNT(*) as total_assigned,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      AVG(progress_percentage) as avg_progress,
      SUM(CASE WHEN estimated_duration IS NOT NULL THEN estimated_duration ELSE 0 END) as total_estimated_hours
    FROM tasks
    WHERE farm_id = ?
      AND date(created_at) >= date(?, ?)
    GROUP BY assigned_to
  `).bind(farmId, (/* @__PURE__ */ new Date()).toISOString(), `-${timeframe}`).all();
  const workflowEfficiency = await env2.DB.prepare(`
    SELECT 
      task_category,
      COUNT(*) as total_tasks,
      AVG(julianday(CASE WHEN status = 'completed' THEN updated_at END) - julianday(created_at)) as avg_completion_days,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      (COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*)) * 100 as completion_rate
    FROM tasks
    WHERE farm_id = ?
      AND date(created_at) >= date(?, ?)
    GROUP BY task_category
  `).bind(farmId, (/* @__PURE__ */ new Date()).toISOString(), `-${timeframe}`).all();
  return {
    overview: taskData[0] || {},
    productivity_metrics: productivityMetrics,
    workflow_efficiency: workflowEfficiency,
    performance_score: calculateTaskPerformanceScore(taskData[0]),
    optimization_opportunities: await getTaskOptimizationOpportunities(env2, farmId)
  };
}
async function getFinanceAnalytics(env2, farmId, timeframe) {
  const financeData = await env2.DB.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
      COALESCE(SUM(CASE WHEN type = 'investment' THEN amount ELSE 0 END), 0) as total_investments,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END), 0) as net_profit,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as gross_profit,
      COUNT(CASE WHEN tax_deductible = 1 THEN 1 END) as tax_deductible_entries,
      COALESCE(SUM(CASE WHEN tax_deductible = 1 THEN amount ELSE 0 END), 0) as tax_deductible_amount
    FROM finance_entries
    WHERE farm_id = ?
      AND date(entry_date) >= date(?, ?)
  `).bind(farmId, (/* @__PURE__ */ new Date()).toISOString(), `-${timeframe}`).all();
  const budgetPerformance = await env2.DB.prepare(`
    SELECT 
      bc.category_name,
      bc.budgeted_amount,
      bc.spent_amount,
      bc.remaining_budget,
      (bc.spent_amount / bc.budgeted_amount) * 100 as budget_utilization,
      bc.fiscal_year
    FROM budget_categories bc
    WHERE bc.farm_id = ?
      AND bc.fiscal_year = ?
  `).bind(farmId, (/* @__PURE__ */ new Date()).getFullYear()).all();
  const cashFlowTrends = await env2.DB.prepare(`
    SELECT 
      strftime('%Y-%m', entry_date) as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as inflow,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as outflow,
      SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END) as net_cash_flow
    FROM finance_entries
    WHERE farm_id = ?
      AND date(entry_date) >= date(?, ?)
    GROUP BY strftime('%Y-%m', entry_date)
    ORDER BY month DESC
  `).bind(farmId, (/* @__PURE__ */ new Date()).toISOString(), `-${timeframe}`).all();
  return {
    overview: financeData[0] || {},
    budget_performance: budgetPerformance,
    cash_flow_trends: cashFlowTrends,
    performance_score: calculateFinancePerformanceScore(financeData[0]),
    optimization_opportunities: await getFinanceOptimizationOpportunities(env2, farmId)
  };
}
async function getWeatherAnalytics(env2, farmId, timeframe) {
  const weatherData = await env2.DB.prepare(`
    SELECT 
      COUNT(*) as total_readings,
      AVG(temperature_avg) as avg_temperature,
      AVG(humidity) as avg_humidity,
      SUM(precipitation) as total_precipitation,
      COUNT(CASE WHEN weather_condition = 'rain' THEN 1 END) as rainy_days,
      COUNT(CASE WHEN temperature_high > 35 THEN 1 END) as hot_days
    FROM weather_data wd
    JOIN weather_locations wl ON wd.location_id = wl.id
    WHERE wl.farm_id = ?
      AND date(measurement_date) >= date(?, ?)
  `).bind(farmId, (/* @__PURE__ */ new Date()).toISOString(), `-${timeframe}`).all();
  const cropWeatherCorrelation = await env2.DB.prepare(`
    SELECT 
      c.crop_type,
      AVG(CASE WHEN wd.temperature_avg BETWEEN 18 AND 25 THEN 1 ELSE 0 END) as optimal_temp_days,
      AVG(CASE WHEN wd.precipitation BETWEEN 2 AND 10 THEN 1 ELSE 0 END) as optimal_rain_days,
      COUNT(wd.id) as weather_records
    FROM crops c
    JOIN fields f ON c.field_id = f.id
    JOIN weather_locations wl ON f.farm_id = wl.farm_id
    JOIN weather_data wd ON wl.id = wd.location_id
    WHERE f.farm_id = ?
      AND date(wd.measurement_date) >= date(?, ?)
      AND date(wd.measurement_date) BETWEEN date(c.planting_date) AND date(c.harvest_date)
    GROUP BY c.crop_type
  `).bind(farmId, (/* @__PURE__ */ new Date()).toISOString(), `-${timeframe}`).all();
  return {
    overview: weatherData[0] || {},
    crop_correlation: cropWeatherCorrelation,
    performance_score: calculateWeatherPerformanceScore(weatherData[0]),
    optimization_opportunities: await getWeatherOptimizationOpportunities(env2, farmId)
  };
}
function calculateOverallScore(data) {
  const scores = [];
  if (data.animals) scores.push(data.animals.performance_score || 0);
  if (data.crops) scores.push(data.crops.performance_score || 0);
  if (data.fields) scores.push(data.fields.performance_score || 0);
  if (data.inventory) scores.push(data.inventory.performance_score || 0);
  if (data.tasks) scores.push(data.tasks.performance_score || 0);
  if (data.finance) scores.push(data.finance.performance_score || 0);
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}
function calculateAnimalPerformanceScore(data) {
  if (!data || data.length === 0) return 0;
  let totalScore = 0;
  let count3 = 0;
  data.forEach((animal) => {
    const healthScore = animal.total_count > 0 ? animal.healthy_count / animal.total_count * 100 : 0;
    const vaccinationScore = animal.total_count > 0 ? animal.vaccinated_count / animal.total_count * 100 : 0;
    const productivityScore = animal.total_count > 0 ? animal.productive_animals / animal.total_count * 100 : 0;
    const animalScore = healthScore * 0.4 + vaccinationScore * 0.3 + productivityScore * 0.3;
    totalScore += animalScore;
    count3++;
  });
  return count3 > 0 ? Math.round(totalScore / count3) : 0;
}
function calculateCropPerformanceScore(data) {
  if (!data || data.length === 0) return 0;
  let totalScore = 0;
  let count3 = 0;
  data.forEach((crop) => {
    const maturityScore = crop.total_crops > 0 ? crop.mature_crops / crop.total_crops * 100 : 0;
    const healthScore = crop.total_crops > 0 ? crop.excellent_health / crop.total_crops * 100 : 0;
    const yieldScore = crop.avg_actual_yield && crop.avg_expected_yield ? Math.min(crop.avg_actual_yield / crop.avg_expected_yield * 100, 150) : 50;
    const cropScore = maturityScore * 0.3 + healthScore * 0.4 + yieldScore * 0.3;
    totalScore += cropScore;
    count3++;
  });
  return count3 > 0 ? Math.round(totalScore / count3) : 0;
}
function calculateFieldPerformanceScore(data) {
  if (!data) return 0;
  const utilizationScore = data.total_fields > 0 ? data.analyzed_fields / data.total_fields * 100 : 0;
  const healthScore = (data.avg_soil_ph >= 6 && data.avg_soil_ph <= 7.5 ? 100 : 50) * 0.5 + data.avg_drainage_score * 100 * 0.3;
  const cultivationScore = data.total_fields > 0 ? data.cultivated_fields / data.total_fields * 100 : 0;
  return Math.round(utilizationScore * 0.3 + healthScore * 0.4 + cultivationScore * 0.3);
}
function calculateInventoryPerformanceScore(data) {
  if (!data) return 0;
  const stockHealthScore = data.total_items > 0 ? (data.total_items - data.low_stock_items - data.out_of_stock_items) / data.total_items * 100 : 0;
  const expirationScore = data.total_items > 0 ? (data.total_items - data.expiring_items) / data.total_items * 100 : 100;
  const valueScore = data.avg_stock_level > 80 && data.avg_stock_level < 120 ? 100 : data.avg_stock_level > 50 ? 80 : 50;
  return Math.round(stockHealthScore * 0.5 + expirationScore * 0.3 + valueScore * 0.2);
}
function calculateTaskPerformanceScore(data) {
  if (!data) return 0;
  const completionScore = data.total_tasks > 0 ? data.completed_tasks / data.total_tasks * 100 : 0;
  const overduePenalty = Math.max(0, 100 - data.overdue_tasks * 5);
  const efficiencyScore = data.avg_completion_ratio || 100;
  return Math.round(completionScore * 0.6 + overduePenalty * 0.2 + efficiencyScore * 0.2);
}
function calculateFinancePerformanceScore(data) {
  if (!data) return 0;
  const profitabilityScore = data.total_revenue > 0 ? Math.min((data.net_profit / data.total_revenue + 0.5) * 100, 100) : 50;
  const efficiencyScore = data.total_expenses > 0 ? Math.min(100 - data.total_expenses / data.total_revenue * 100, 100) : 50;
  const taxScore = data.tax_deductible_entries > 0 ? 100 : 50;
  return Math.round(profitabilityScore * 0.5 + efficiencyScore * 0.3 + taxScore * 0.2);
}
function calculateWeatherPerformanceScore(data) {
  if (!data) return 0;
  const temperatureScore = data.avg_temperature >= 18 && data.avg_temperature <= 25 ? 100 : data.avg_temperature >= 15 && data.avg_temperature <= 28 ? 80 : 50;
  const moistureScore = data.avg_humidity >= 50 && data.avg_humidity <= 70 ? 100 : data.avg_humidity >= 40 && data.avg_humidity <= 80 ? 80 : 50;
  const precipitationScore = Math.min(data.total_precipitation / 100 * 100, 100);
  return Math.round(temperatureScore * 0.4 + moistureScore * 0.3 + precipitationScore * 0.3);
}
var init_analytics_engine = __esm({
  "api/analytics-engine.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest9, "onRequest");
    __name(getComprehensiveAnalytics, "getComprehensiveAnalytics");
    __name(getPerformanceAnalytics, "getPerformanceAnalytics");
    __name(getPredictiveAnalytics, "getPredictiveAnalytics");
    __name(getOptimizationRecommendations, "getOptimizationRecommendations");
    __name(getAnimalAnalytics, "getAnimalAnalytics");
    __name(getCropAnalytics, "getCropAnalytics");
    __name(getFieldAnalytics, "getFieldAnalytics");
    __name(getInventoryAnalytics, "getInventoryAnalytics");
    __name(getTaskAnalytics, "getTaskAnalytics");
    __name(getFinanceAnalytics, "getFinanceAnalytics");
    __name(getWeatherAnalytics, "getWeatherAnalytics");
    __name(calculateOverallScore, "calculateOverallScore");
    __name(calculateAnimalPerformanceScore, "calculateAnimalPerformanceScore");
    __name(calculateCropPerformanceScore, "calculateCropPerformanceScore");
    __name(calculateFieldPerformanceScore, "calculateFieldPerformanceScore");
    __name(calculateInventoryPerformanceScore, "calculateInventoryPerformanceScore");
    __name(calculateTaskPerformanceScore, "calculateTaskPerformanceScore");
    __name(calculateFinancePerformanceScore, "calculateFinancePerformanceScore");
    __name(calculateWeatherPerformanceScore, "calculateWeatherPerformanceScore");
  }
});

// api/animals.js
async function onRequest10(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length > 1) {
      const animalId = pathSegments[1];
      if (method === "PUT") {
        return await updateAnimal(context2, animalId);
      } else if (method === "DELETE") {
        return await deleteAnimal(context2, animalId);
      } else if (method === "GET") {
        return await getAnimalById(url, user, env2, animalId);
      } else {
        return createErrorResponse("Method not allowed", 405);
      }
    }
    if (pathSegments.length > 2) {
      const entity = pathSegments[1];
      const id = pathSegments[2];
      switch (entity) {
        case "health-records":
          return handleHealthRecords(context2, user, id);
        case "production":
          return handleProductionRecords(context2, user, id);
        case "breeding":
          return handleBreedingRecords2(context2, user, id);
        case "feeding":
          return handleFeedingRecords2(context2, user, id);
        case "movements":
          return handleMovementRecords2(context2, user, id);
        default:
          return createErrorResponse("Invalid endpoint", 404);
      }
    }
    if (method === "GET") {
      return await handleGetAnimals(url, user, env2);
    } else if (method === "POST") {
      return await handleCreateAnimal(request, user, env2);
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error3) {
    console.error("Enhanced Animals API error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
async function handleGetAnimals(url, user, env2) {
  const {
    species,
    breed,
    health_status,
    sex,
    production_type,
    location,
    status,
    farm_id,
    search,
    page = 1,
    limit = 20,
    sort_by = "created_at",
    sort_order = "desc"
  } = Object.fromEntries(url.searchParams);
  let query = `
    SELECT DISTINCT
      a.id,
      a.name,
      a.species,
      a.breed,
      a.birth_date,
      a.sex,
      a.identification_tag,
      a.health_status,
      a.current_location,
      a.pasture_id,
      a.production_type,
      a.status,
      a.current_weight,
      a.target_weight,
      a.vaccination_status,
      a.last_vet_check,
      a.acquisition_date,
      a.acquisition_cost,
      a.created_at,
      a.updated_at,
      fa.name as farm_name,
      ap.name as pasture_name,
      b.origin_country as breed_origin,
      b.purpose as breed_purpose,
      b.average_weight as breed_avg_weight,
      b.temperament as breed_temperament,
      COUNT(hr.id) as health_records_count,
      COUNT(pr.id) as production_records_count,
      COUNT(abr.breeding_date) as breeding_records_count
    FROM animals a
    JOIN farm_members fm ON a.farm_id = fm.farm_id
    JOIN farms fa ON a.farm_id = fa.id
    LEFT JOIN breeds b ON a.breed = b.name AND a.species = b.species
    LEFT JOIN animal_pastures ap ON a.pasture_id = ap.id
    LEFT JOIN animal_health_records hr ON a.id = hr.animal_id
    LEFT JOIN animal_production pr ON a.id = pr.animal_id
    LEFT JOIN animal_breeding abr ON a.id = abr.animal_id
    WHERE fm.user_id = ?
  `;
  const params = [user.id];
  if (species) {
    query += " AND a.species = ?";
    params.push(species);
  }
  if (breed) {
    query += " AND a.breed = ?";
    params.push(breed);
  }
  if (health_status) {
    query += " AND a.health_status = ?";
    params.push(health_status);
  }
  if (sex) {
    query += " AND a.sex = ?";
    params.push(sex);
  }
  if (production_type) {
    query += " AND a.production_type = ?";
    params.push(production_type);
  }
  if (location) {
    query += " AND a.current_location LIKE ?";
    params.push(`%${location}%`);
  }
  if (status) {
    query += " AND a.status = ?";
    params.push(status);
  }
  if (farm_id) {
    query += " AND a.farm_id = ?";
    params.push(farm_id);
  }
  if (search) {
    query += " AND (a.name LIKE ? OR a.identification_tag LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  query += " GROUP BY a.id";
  const validSortFields = ["name", "species", "breed", "health_status", "created_at", "updated_at", "age_months"];
  const validSortOrders = ["asc", "desc"];
  if (validSortFields.includes(sort_by) && validSortOrders.includes(sort_order.toLowerCase())) {
    query += ` ORDER BY a.${sort_by} ${sort_order.toUpperCase()}`;
  } else {
    query += " ORDER BY a.created_at DESC";
  }
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += " LIMIT ? OFFSET ?";
  params.push(parseInt(limit), offset);
  const { results: animals, error: error3 } = await env2.DB.prepare(query).bind(...params).all();
  if (error3) {
    console.error("Database error:", error3);
    return createErrorResponse("Database error", 500);
  }
  let countQuery = `
    SELECT COUNT(DISTINCT a.id) as total
    FROM animals a
    JOIN farm_members fm ON a.farm_id = fm.farm_id
    WHERE fm.user_id = ?
  `;
  const countParams = [user.id];
  if (species) {
    countQuery += " AND a.species = ?";
    countParams.push(species);
  }
  if (breed) {
    countQuery += " AND a.breed = ?";
    countParams.push(breed);
  }
  if (health_status) {
    countQuery += " AND a.health_status = ?";
    countParams.push(health_status);
  }
  if (sex) {
    countQuery += " AND a.sex = ?";
    countParams.push(sex);
  }
  if (production_type) {
    countQuery += " AND a.production_type = ?";
    countParams.push(production_type);
  }
  if (location) {
    countQuery += " AND a.current_location LIKE ?";
    countParams.push(`%${location}%`);
  }
  if (status) {
    countQuery += " AND a.status = ?";
    countParams.push(status);
  }
  if (farm_id) {
    countQuery += " AND a.farm_id = ?";
    countParams.push(farm_id);
  }
  if (search) {
    countQuery += " AND (a.name LIKE ? OR a.identification_tag LIKE ?)";
    countParams.push(`%${search}%`, `%${search}%`);
  }
  const { results: countResult } = await env2.DB.prepare(countQuery).bind(...countParams).all();
  const total = countResult[0]?.total || 0;
  return createSuccessResponse({
    animals: animals || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}
async function getAnimalById(url, user, env2, animalId) {
  const { results: animals, error: error3 } = await env2.DB.prepare(`
    SELECT DISTINCT
      a.id,
      a.name,
      a.species,
      a.breed,
      a.birth_date,
      a.sex,
      a.identification_tag,
      a.health_status,
      a.current_location,
      a.pasture_id,
      a.production_type,
      a.status,
      a.current_weight,
      a.target_weight,
      a.vaccination_status,
      a.last_vet_check,
      a.acquisition_date,
      a.acquisition_cost,
      a.father_id,
      a.mother_id,
      a.genetic_profile,
      a.created_at,
      a.updated_at,
      fa.name as farm_name,
      ap.name as pasture_name,
      b.origin_country as breed_origin,
      b.purpose as breed_purpose,
      b.average_weight as breed_avg_weight,
      b.temperament as breed_temperament,
      COUNT(hr.id) as health_records_count,
      COUNT(pr.id) as production_records_count,
      COUNT(abr.breeding_date) as breeding_records_count,
      father.name as father_name,
      mother.name as mother_name
    FROM animals a
    JOIN farm_members fm ON a.farm_id = fm.farm_id
    JOIN farms fa ON a.farm_id = fa.id
    LEFT JOIN breeds b ON a.breed = b.name AND a.species = b.species
    LEFT JOIN animal_pastures ap ON a.pasture_id = ap.id
    LEFT JOIN animal_health_records hr ON a.id = hr.animal_id
    LEFT JOIN animal_production pr ON a.id = pr.animal_id
    LEFT JOIN animal_breeding abr ON a.id = abr.animal_id
    LEFT JOIN animals father ON a.father_id = father.id
    LEFT JOIN animals mother ON a.mother_id = mother.id
    WHERE a.id = ? AND fm.user_id = ?
    GROUP BY a.id
  `).bind(animalId, user.id).all();
  if (error3) {
    console.error("Database error:", error3);
    return createErrorResponse("Database error", 500);
  }
  if (animals.length === 0) {
    return createErrorResponse("Animal not found or access denied", 404);
  }
  return createSuccessResponse(animals[0]);
}
async function handleCreateAnimal(request, user, env2) {
  const body = await request.json();
  const {
    farm_id,
    name,
    species,
    breed,
    birth_date,
    sex,
    identification_tag,
    health_status,
    current_location,
    pasture_id,
    production_type,
    current_weight,
    target_weight,
    vaccination_status,
    acquisition_date,
    acquisition_cost,
    father_id,
    mother_id,
    genetic_profile
  } = body;
  if (!farm_id || !name || !species) {
    return createErrorResponse("Farm ID, name, and species are required", 400);
  }
  if (!await auth.hasFarmAccess(user.id, farm_id)) {
    return createErrorResponse("Farm not found or access denied", 404);
  }
  if (breed) {
    const { results: breedCheck } = await env2.DB.prepare(
      "SELECT id FROM breeds WHERE name = ? AND species = ?"
    ).bind(breed, species).all();
    if (breedCheck.length === 0) {
      return createErrorResponse(`Breed "${breed}" not found for species "${species}"`, 400);
    }
  }
  if (father_id) {
    const { results: fatherCheck } = await env2.DB.prepare(
      "SELECT id, sex, species FROM animals WHERE id = ?"
    ).bind(father_id).all();
    if (fatherCheck.length === 0 || fatherCheck[0].sex !== "male" || fatherCheck[0].species !== species) {
      return createErrorResponse("Invalid father ID", 400);
    }
  }
  if (mother_id) {
    const { results: motherCheck } = await env2.DB.prepare(
      "SELECT id, sex, species FROM animals WHERE id = ?"
    ).bind(mother_id).all();
    if (motherCheck.length === 0 || motherCheck[0].sex !== "female" || motherCheck[0].species !== species) {
      return createErrorResponse("Invalid mother ID", 400);
    }
  }
  const { results, error: insertError } = await env2.DB.prepare(`
    INSERT INTO animals (
      farm_id, name, species, breed, birth_date, sex, identification_tag,
      health_status, current_location, pasture_id, production_type,
      current_weight, target_weight, vaccination_status, acquisition_date,
      acquisition_cost, father_id, mother_id, genetic_profile
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    farm_id,
    name,
    species,
    breed || null,
    birth_date || null,
    sex || null,
    identification_tag || null,
    health_status || "healthy",
    current_location || null,
    pasture_id || null,
    production_type || null,
    current_weight || null,
    target_weight || null,
    vaccination_status || "up-to-date",
    acquisition_date || null,
    acquisition_cost || null,
    father_id || null,
    mother_id || null,
    genetic_profile || null
  ).run();
  if (insertError) {
    console.error("Insert error:", insertError);
    return createErrorResponse("Failed to create animal", 500);
  }
  const { results: animalResults } = await env2.DB.prepare(`
    SELECT
      a.*,
      fa.name as farm_name,
      ap.name as pasture_name,
      b.origin_country as breed_origin,
      b.purpose as breed_purpose,
      b.average_weight as breed_avg_weight,
      b.temperament as breed_temperament,
      fa.name as farm_name
    FROM animals a
    JOIN farms fa ON a.farm_id = fa.id
    LEFT JOIN breeds b ON a.breed = b.name AND a.species = b.species
    LEFT JOIN animal_pastures ap ON a.pasture_id = ap.id
    WHERE a.rowid = last_insert_rowid()
  `).all();
  const newAnimal = animalResults[0];
  return createSuccessResponse(newAnimal, 201);
}
async function updateAnimal(context2, animalId) {
  const { request, env: env2 } = context2;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    const body = await request.json();
    const {
      name,
      breed,
      birth_date,
      sex,
      identification_tag,
      health_status,
      current_location,
      pasture_id,
      production_type,
      current_weight,
      target_weight,
      vaccination_status,
      acquisition_date,
      acquisition_cost,
      father_id,
      mother_id,
      genetic_profile,
      status
    } = body;
    const { results: accessCheck } = await env2.DB.prepare(`
      SELECT a.farm_id
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE a.id = ? AND fm.user_id = ?
    `).bind(animalId, user.id).all();
    if (accessCheck.length === 0) {
      return createErrorResponse("Animal not found or access denied", 404);
    }
    const updateFields = [];
    const updateValues = [];
    const updatableFields = {
      name,
      breed,
      birth_date,
      sex,
      identification_tag,
      health_status,
      current_location,
      pasture_id,
      production_type,
      current_weight,
      target_weight,
      vaccination_status,
      acquisition_date,
      acquisition_cost,
      father_id,
      mother_id,
      genetic_profile,
      status
    };
    Object.entries(updatableFields).forEach(([field, value]) => {
      if (value !== void 0) {
        updateFields.push(`${field} = ?`);
        updateValues.push(value);
      }
    });
    if (updateFields.length === 0) {
      return createErrorResponse("No fields to update", 400);
    }
    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    updateValues.push(animalId);
    const { error: updateError } = await env2.DB.prepare(`
      UPDATE animals
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `).bind(...updateValues).run();
    if (updateError) {
      return createErrorResponse("Failed to update animal", 500);
    }
    const { results: updatedAnimal } = await env2.DB.prepare(`
      SELECT
        a.*,
        fa.name as farm_name,
        ap.name as pasture_name,
        b.origin_country as breed_origin,
        b.purpose as breed_purpose,
        b.average_weight as breed_avg_weight,
        b.temperament as breed_temperament
      FROM animals a
      JOIN farms fa ON a.farm_id = fa.id
      LEFT JOIN breeds b ON a.breed = b.name AND a.species = b.species
      LEFT JOIN animal_pastures ap ON a.pasture_id = ap.id
      WHERE a.id = ?
    `).bind(animalId).all();
    return createSuccessResponse(updatedAnimal[0]);
  } catch (error3) {
    console.error("Update animal error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
async function deleteAnimal(context2, animalId) {
  const { request, env: env2 } = context2;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    const { results: accessCheck } = await env2.DB.prepare(`
      SELECT fm.role
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE a.id = ? AND fm.user_id = ? AND fm.role IN ('owner', 'manager', 'admin')
    `).bind(animalId, user.id).all();
    if (accessCheck.length === 0) {
      return createErrorResponse("Animal not found or insufficient permissions", 404);
    }
    const { error: deleteError } = await env2.DB.prepare(`
      DELETE FROM animals WHERE id = ?
    `).bind(animalId).run();
    if (deleteError) {
      return createErrorResponse("Failed to delete animal", 500);
    }
    return createSuccessResponse({ success: true });
  } catch (error3) {
    console.error("Delete animal error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
async function handleHealthRecords(context2, user, animalId) {
  const { request, env: env2 } = context2;
  const method = request.method;
  const { results: accessCheck } = await env2.DB.prepare(`
    SELECT a.farm_id
    FROM animals a
    JOIN farm_members fm ON a.farm_id = fm.farm_id
    WHERE a.id = ? AND fm.user_id = ?
  `).bind(animalId, user.id).all();
  if (accessCheck.length === 0) {
    return createErrorResponse("Animal not found or access denied", 404);
  }
  if (method === "GET") {
    const { results: healthRecords, error: error3 } = await env2.DB.prepare(`
      SELECT hr.*, a.name as animal_name, u.name as recorded_by_name
      FROM animal_health_records hr
      JOIN animals a ON hr.animal_id = a.id
      LEFT JOIN users u ON hr.created_by = u.id
      WHERE hr.animal_id = ?
      ORDER BY hr.record_date DESC
    `).bind(animalId).all();
    if (error3) {
      return createErrorResponse("Database error", 500);
    }
    return createSuccessResponse(healthRecords || []);
  } else if (method === "POST") {
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
      return createErrorResponse("Record date and type are required", 400);
    }
    const { results, error: error3 } = await env2.DB.prepare(`
      INSERT INTO animal_health_records (
        animal_id, record_date, record_type, vet_name, diagnosis, treatment,
        medication, dosage, cost, next_due_date, vet_contact, notes, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      animalId,
      record_date,
      record_type,
      vet_name || null,
      diagnosis || null,
      treatment || null,
      medication || null,
      dosage || null,
      cost || null,
      next_due_date || null,
      vet_contact || null,
      notes || null,
      user.id
    ).run();
    if (error3) {
      return createErrorResponse("Failed to create health record", 500);
    }
    return createSuccessResponse({ success: true, id: results.lastInsertRowId }, 201);
  }
  return createErrorResponse("Method not allowed", 405);
}
async function handleProductionRecords(context2, user, animalId) {
  const { request, env: env2 } = context2;
  const method = request.method;
  const { results: accessCheck } = await env2.DB.prepare(`
    SELECT a.farm_id
    FROM animals a
    JOIN farm_members fm ON a.farm_id = fm.farm_id
    WHERE a.id = ? AND fm.user_id = ?
  `).bind(animalId, user.id).all();
  if (accessCheck.length === 0) {
    return createErrorResponse("Animal not found or access denied", 404);
  }
  if (method === "GET") {
    const { results: productionRecords, error: error3 } = await env2.DB.prepare(`
      SELECT pr.*, a.name as animal_name, u.name as recorded_by_name
      FROM animal_production pr
      JOIN animals a ON pr.animal_id = a.id
      LEFT JOIN users u ON pr.recorded_by = u.id
      WHERE pr.animal_id = ?
      ORDER BY pr.production_date DESC
    `).bind(animalId).all();
    if (error3) {
      return createErrorResponse("Database error", 500);
    }
    return createSuccessResponse(productionRecords || []);
  } else if (method === "POST") {
    const body = await request.json();
    const {
      production_date,
      production_type,
      quantity,
      unit,
      quality_grade,
      price_per_unit,
      market_destination,
      notes
    } = body;
    if (!production_date || !production_type || quantity === void 0) {
      return createErrorResponse("Production date, type, and quantity are required", 400);
    }
    const total_value = price_per_unit ? parseFloat(quantity) * parseFloat(price_per_unit) : null;
    const { results, error: error3 } = await env2.DB.prepare(`
      INSERT INTO animal_production (
        animal_id, production_date, production_type, quantity, unit,
        quality_grade, price_per_unit, total_value, market_destination, notes, recorded_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      animalId,
      production_date,
      production_type,
      parseFloat(quantity),
      unit,
      quality_grade || null,
      price_per_unit || null,
      total_value,
      market_destination || null,
      notes || null,
      user.id
    ).run();
    if (error3) {
      return createErrorResponse("Failed to create production record", 500);
    }
    return createSuccessResponse({ success: true, id: results.lastInsertRowId }, 201);
  }
  return createErrorResponse("Method not allowed", 405);
}
async function handleBreedingRecords2(context2, user, animalId) {
  return createErrorResponse("Breeding records endpoint not implemented yet", 501);
}
async function handleFeedingRecords2(context2, user, animalId) {
  return createErrorResponse("Feeding records endpoint not implemented yet", 501);
}
async function handleMovementRecords2(context2, user, animalId) {
  return createErrorResponse("Movement records endpoint not implemented yet", 501);
}
var init_animals = __esm({
  "api/animals.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest10, "onRequest");
    __name(handleGetAnimals, "handleGetAnimals");
    __name(getAnimalById, "getAnimalById");
    __name(handleCreateAnimal, "handleCreateAnimal");
    __name(updateAnimal, "updateAnimal");
    __name(deleteAnimal, "deleteAnimal");
    __name(handleHealthRecords, "handleHealthRecords");
    __name(handleProductionRecords, "handleProductionRecords");
    __name(handleBreedingRecords2, "handleBreedingRecords");
    __name(handleFeedingRecords2, "handleFeedingRecords");
    __name(handleMovementRecords2, "handleMovementRecords");
  }
});

// api/animals-enhanced.js
async function onRequest11(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length > 2) {
      const entity = pathSegments[1];
      const id = pathSegments[2];
      switch (entity) {
        case "health-records":
          return handleHealthRecords2(context2, user, id);
        case "production":
          return handleProductionRecords2(context2, user, id);
        case "breeding":
          return handleBreedingRecords(context2, user, id);
        case "feeding":
          return handleFeedingRecords(context2, user, id);
        case "movements":
          return handleMovementRecords(context2, user, id);
        default:
          return createErrorResponse("Invalid endpoint", 404);
      }
    }
    if (method === "GET") {
      return await handleGetAnimals2(url, user, env2);
    } else if (method === "POST") {
      return await handleCreateAnimal2(request, user, env2);
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error3) {
    console.error("Enhanced Animals API error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
async function handleGetAnimals2(url, user, env2) {
  const {
    species,
    breed,
    health_status,
    sex,
    production_type,
    location,
    status,
    farm_id,
    search,
    page = 1,
    limit = 20,
    sort_by = "created_at",
    sort_order = "desc"
  } = Object.fromEntries(url.searchParams);
  let query = `
    SELECT DISTINCT
      a.id,
      a.name,
      a.species,
      a.breed,
      a.birth_date,
      a.sex,
      a.identification_tag,
      a.health_status,
      a.current_location,
      a.pasture_id,
      a.production_type,
      a.status,
      a.current_weight,
      a.target_weight,
      a.vaccination_status,
      a.last_vet_check,
      a.acquisition_date,
      a.acquisition_cost,
      a.created_at,
      a.updated_at,
      fa.name as farm_name,
      ap.name as pasture_name,
      b.origin_country as breed_origin,
      b.purpose as breed_purpose,
      b.average_weight as breed_avg_weight,
      b.temperament as breed_temperament,
      COUNT(hr.id) as health_records_count,
      COUNT(pr.id) as production_records_count,
      COUNT(abr.breeding_date) as breeding_records_count
    FROM animals a
    JOIN farm_members fm ON a.farm_id = fm.farm_id
    JOIN farms fa ON a.farm_id = fa.id
    LEFT JOIN breeds b ON a.breed = b.name AND a.species = b.species
    LEFT JOIN animal_pastures ap ON a.pasture_id = ap.id
    LEFT JOIN animal_health_records hr ON a.id = hr.animal_id
    LEFT JOIN animal_production pr ON a.id = pr.animal_id
    LEFT JOIN animal_breeding abr ON a.id = abr.animal_id
    WHERE fm.user_id = ?
  `;
  const params = [user.id];
  if (species) {
    query += " AND a.species = ?";
    params.push(species);
  }
  if (breed) {
    query += " AND a.breed = ?";
    params.push(breed);
  }
  if (health_status) {
    query += " AND a.health_status = ?";
    params.push(health_status);
  }
  if (sex) {
    query += " AND a.sex = ?";
    params.push(sex);
  }
  if (production_type) {
    query += " AND a.production_type = ?";
    params.push(production_type);
  }
  if (location) {
    query += " AND a.current_location LIKE ?";
    params.push(`%${location}%`);
  }
  if (status) {
    query += " AND a.status = ?";
    params.push(status);
  }
  if (farm_id) {
    query += " AND a.farm_id = ?";
    params.push(farm_id);
  }
  if (search) {
    query += " AND (a.name LIKE ? OR a.identification_tag LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  query += " GROUP BY a.id";
  const validSortFields = ["name", "species", "breed", "health_status", "created_at", "updated_at", "age_months"];
  const validSortOrders = ["asc", "desc"];
  if (validSortFields.includes(sort_by) && validSortOrders.includes(sort_order.toLowerCase())) {
    query += ` ORDER BY a.${sort_by} ${sort_order.toUpperCase()}`;
  } else {
    query += " ORDER BY a.created_at DESC";
  }
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += " LIMIT ? OFFSET ?";
  params.push(parseInt(limit), offset);
  const { results: animals, error: error3 } = await env2.DB.prepare(query).bind(...params).all();
  if (error3) {
    console.error("Database error:", error3);
    return createErrorResponse("Database error", 500);
  }
  let countQuery = `
    SELECT COUNT(DISTINCT a.id) as total
    FROM animals a
    JOIN farm_members fm ON a.farm_id = fm.farm_id
    WHERE fm.user_id = ?
  `;
  const countParams = [user.id];
  if (species) {
    countQuery += " AND a.species = ?";
    countParams.push(species);
  }
  if (breed) {
    countQuery += " AND a.breed = ?";
    countParams.push(breed);
  }
  if (health_status) {
    countQuery += " AND a.health_status = ?";
    countParams.push(health_status);
  }
  if (sex) {
    countQuery += " AND a.sex = ?";
    countParams.push(sex);
  }
  if (production_type) {
    countQuery += " AND a.production_type = ?";
    countParams.push(production_type);
  }
  if (location) {
    countQuery += " AND a.current_location LIKE ?";
    countParams.push(`%${location}%`);
  }
  if (status) {
    countQuery += " AND a.status = ?";
    countParams.push(status);
  }
  if (farm_id) {
    countQuery += " AND a.farm_id = ?";
    countParams.push(farm_id);
  }
  if (search) {
    countQuery += " AND (a.name LIKE ? OR a.identification_tag LIKE ?)";
    countParams.push(`%${search}%`, `%${search}%`);
  }
  const { results: countResult } = await env2.DB.prepare(countQuery).bind(...countParams).all();
  const total = countResult[0]?.total || 0;
  return createSuccessResponse({
    animals: animals || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}
async function handleCreateAnimal2(request, user, env2) {
  const body = await request.json();
  const {
    farm_id,
    name,
    species,
    breed,
    birth_date,
    sex,
    identification_tag,
    health_status,
    current_location,
    pasture_id,
    production_type,
    current_weight,
    target_weight,
    vaccination_status,
    acquisition_date,
    acquisition_cost,
    father_id,
    mother_id,
    genetic_profile
  } = body;
  if (!farm_id || !name || !species) {
    return createErrorResponse("Farm ID, name, and species are required", 400);
  }
  if (!await auth.hasFarmAccess(user.id, farm_id)) {
    return createErrorResponse("Farm not found or access denied", 404);
  }
  if (breed) {
    const { results: breedCheck } = await env2.DB.prepare(
      "SELECT id FROM breeds WHERE name = ? AND species = ?"
    ).bind(breed, species).all();
    if (breedCheck.length === 0) {
      return createErrorResponse(`Breed "${breed}" not found for species "${species}"`, 400);
    }
  }
  if (father_id) {
    const { results: fatherCheck } = await env2.DB.prepare(
      "SELECT id, sex, species FROM animals WHERE id = ?"
    ).bind(father_id).all();
    if (fatherCheck.length === 0 || fatherCheck[0].sex !== "male" || fatherCheck[0].species !== species) {
      return createErrorResponse("Invalid father ID", 400);
    }
  }
  if (mother_id) {
    const { results: motherCheck } = await env2.DB.prepare(
      "SELECT id, sex, species FROM animals WHERE id = ?"
    ).bind(mother_id).all();
    if (motherCheck.length === 0 || motherCheck[0].sex !== "female" || motherCheck[0].species !== species) {
      return createErrorResponse("Invalid mother ID", 400);
    }
  }
  const { results, error: insertError } = await env2.DB.prepare(`
    INSERT INTO animals (
      farm_id, name, species, breed, birth_date, sex, identification_tag,
      health_status, current_location, pasture_id, production_type,
      current_weight, target_weight, vaccination_status, acquisition_date,
      acquisition_cost, father_id, mother_id, genetic_profile
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    farm_id,
    name,
    species,
    breed || null,
    birth_date || null,
    sex || null,
    identification_tag || null,
    health_status || "healthy",
    current_location || null,
    pasture_id || null,
    production_type || null,
    current_weight || null,
    target_weight || null,
    vaccination_status || "up-to-date",
    acquisition_date || null,
    acquisition_cost || null,
    father_id || null,
    mother_id || null,
    genetic_profile || null
  ).run();
  if (insertError) {
    console.error("Insert error:", insertError);
    return createErrorResponse("Failed to create animal", 500);
  }
  const { results: animalResults } = await env2.DB.prepare(`
    SELECT 
      a.*,
      fa.name as farm_name,
      ap.name as pasture_name,
      b.origin_country as breed_origin,
      b.purpose as breed_purpose,
      b.average_weight as breed_avg_weight,
      b.temperament as breed_temperament,
      fa.name as farm_name
    FROM animals a
    JOIN farms fa ON a.farm_id = fa.id
    LEFT JOIN breeds b ON a.breed = b.name AND a.species = b.species
    LEFT JOIN animal_pastures ap ON a.pasture_id = ap.id
    WHERE a.rowid = last_insert_rowid()
  `).all();
  const newAnimal = animalResults[0];
  return createSuccessResponse(newAnimal, 201);
}
async function handleHealthRecords2(context2, user, animalId) {
  const { request, env: env2 } = context2;
  const method = request.method;
  const url = new URL(request.url);
  const { results: accessCheck } = await env2.DB.prepare(`
    SELECT a.farm_id 
    FROM animals a
    JOIN farm_members fm ON a.farm_id = fm.farm_id
    WHERE a.id = ? AND fm.user_id = ?
  `).bind(animalId, user.id).all();
  if (accessCheck.length === 0) {
    return createErrorResponse("Animal not found or access denied", 404);
  }
  if (method === "GET") {
    const { results: healthRecords, error: error3 } = await env2.DB.prepare(`
      SELECT hr.*, a.name as animal_name, u.name as recorded_by_name
      FROM animal_health_records hr
      JOIN animals a ON hr.animal_id = a.id
      LEFT JOIN users u ON hr.created_by = u.id
      WHERE hr.animal_id = ?
      ORDER BY hr.record_date DESC
    `).bind(animalId).all();
    if (error3) {
      return createErrorResponse("Database error", 500);
    }
    return createSuccessResponse(healthRecords || []);
  } else if (method === "POST") {
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
      return createErrorResponse("Record date and type are required", 400);
    }
    const { results, error: error3 } = await env2.DB.prepare(`
      INSERT INTO animal_health_records (
        animal_id, record_date, record_type, vet_name, diagnosis, treatment,
        medication, dosage, cost, next_due_date, vet_contact, notes, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      animalId,
      record_date,
      record_type,
      vet_name || null,
      diagnosis || null,
      treatment || null,
      medication || null,
      dosage || null,
      cost || null,
      next_due_date || null,
      vet_contact || null,
      notes || null,
      user.id
    ).run();
    if (error3) {
      return createErrorResponse("Failed to create health record", 500);
    }
    return createSuccessResponse({ success: true, id: results.lastInsertRowId }, 201);
  }
  return createErrorResponse("Method not allowed", 405);
}
async function handleProductionRecords2(context2, user, animalId) {
  const { request, env: env2 } = context2;
  const method = request.method;
  const url = new URL(request.url);
  const { results: accessCheck } = await env2.DB.prepare(`
    SELECT a.farm_id 
    FROM animals a
    JOIN farm_members fm ON a.farm_id = fm.farm_id
    WHERE a.id = ? AND fm.user_id = ?
  `).bind(animalId, user.id).all();
  if (accessCheck.length === 0) {
    return createErrorResponse("Animal not found or access denied", 404);
  }
  if (method === "GET") {
    const { results: productionRecords, error: error3 } = await env2.DB.prepare(`
      SELECT pr.*, a.name as animal_name, u.name as recorded_by_name
      FROM animal_production pr
      JOIN animals a ON pr.animal_id = a.id
      LEFT JOIN users u ON pr.recorded_by = u.id
      WHERE pr.animal_id = ?
      ORDER BY pr.production_date DESC
    `).bind(animalId).all();
    if (error3) {
      return createErrorResponse("Database error", 500);
    }
    return createSuccessResponse(productionRecords || []);
  } else if (method === "POST") {
    const body = await request.json();
    const {
      production_date,
      production_type,
      quantity,
      unit,
      quality_grade,
      price_per_unit,
      market_destination,
      notes
    } = body;
    if (!production_date || !production_type || quantity === void 0) {
      return createErrorResponse("Production date, type, and quantity are required", 400);
    }
    const total_value = price_per_unit ? parseFloat(quantity) * parseFloat(price_per_unit) : null;
    const { results, error: error3 } = await env2.DB.prepare(`
      INSERT INTO animal_production (
        animal_id, production_date, production_type, quantity, unit,
        quality_grade, price_per_unit, total_value, market_destination, notes, recorded_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      animalId,
      production_date,
      production_type,
      parseFloat(quantity),
      unit,
      quality_grade || null,
      price_per_unit || null,
      total_value,
      market_destination || null,
      notes || null,
      user.id
    ).run();
    if (error3) {
      return createErrorResponse("Failed to create production record", 500);
    }
    return createSuccessResponse({ success: true, id: results.lastInsertRowId }, 201);
  }
  return createErrorResponse("Method not allowed", 405);
}
var init_animals_enhanced = __esm({
  "api/animals-enhanced.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest11, "onRequest");
    __name(handleGetAnimals2, "handleGetAnimals");
    __name(handleCreateAnimal2, "handleCreateAnimal");
    __name(handleHealthRecords2, "handleHealthRecords");
    __name(handleProductionRecords2, "handleProductionRecords");
  }
});

// api/farms.js
async function onRequest12(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      const { results: farms, error: error3 } = await env2.DB.prepare(`
        SELECT 
          id, 
          name, 
          location, 
          area_hectares, 
          created_at,
          updated_at
        FROM farms 
        WHERE owner_id = ?
        ORDER BY created_at DESC
      `).bind(user.id).all();
      if (error3) {
        console.error("Database error:", error3);
        return createErrorResponse("Database error", 500);
      }
      return createSuccessResponse(farms || []);
    } else if (method === "POST") {
      const body = await request.json();
      const { name, location, area_hectares } = body;
      if (!name || !location) {
        return createErrorResponse("Name and location required", 400);
      }
      const { results, error: insertError } = await env2.DB.prepare(`
        INSERT INTO farms (name, location, area_hectares, owner_id)
        VALUES (?, ?, ?, ?)
      `).bind(name, location, area_hectares || null, user.id).run();
      if (insertError) {
        console.error("Insert error:", insertError);
        return createErrorResponse("Failed to create farm", 500);
      }
      const { results: farmResults } = await env2.DB.prepare(`
        SELECT id, name, location, area_hectares, created_at, updated_at
        FROM farms 
        WHERE rowid = last_insert_rowid()
      `).all();
      const newFarm = farmResults[0];
      await auth2.grantFarmAccess(newFarm.id, user.id, "owner");
      return createSuccessResponse(newFarm);
    } else if (method === "PUT") {
      const body = await request.json();
      const { id, name, location, area_hectares } = body;
      if (!id) {
        return createErrorResponse("Farm ID required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, id)) {
        return createErrorResponse("Farm not found or access denied", 404);
      }
      const updateFields = [];
      const updateValues = [];
      if (name !== void 0) {
        updateFields.push("name = ?");
        updateValues.push(name);
      }
      if (location !== void 0) {
        updateFields.push("location = ?");
        updateValues.push(location);
      }
      if (area_hectares !== void 0) {
        updateFields.push("area_hectares = ?");
        updateValues.push(area_hectares);
      }
      if (updateFields.length === 0) {
        return createErrorResponse("No fields to update", 400);
      }
      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id);
      const { error: updateError } = await env2.DB.prepare(`
        UPDATE farms 
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `).bind(...updateValues).run();
      if (updateError) {
        console.error("Update error:", updateError);
        return createErrorResponse("Failed to update farm", 500);
      }
      const { results: farmResults } = await env2.DB.prepare(`
        SELECT id, name, location, area_hectares, created_at, updated_at
        FROM farms 
        WHERE id = ?
      `).bind(id).all();
      return createSuccessResponse(farmResults[0]);
    } else if (method === "DELETE") {
      const url2 = new URL(request.url);
      const farmId = url2.searchParams.get("id");
      if (!farmId) {
        return createErrorResponse("Farm ID required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, farmId)) {
        return createErrorResponse("Farm not found or access denied", 404);
      }
      const { error: deleteError } = await env2.DB.prepare(`
        DELETE FROM farms WHERE id = ?
      `).bind(farmId).run();
      if (deleteError) {
        console.error("Delete error:", deleteError);
        return createErrorResponse("Failed to delete farm", 500);
      }
      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error3) {
    console.error("Farm API error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
var init_farms = __esm({
  "api/farms.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest12, "onRequest");
  }
});

// api/farms-enhanced.js
async function onRequest13(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      const farmId = url.searchParams.get("id");
      const stats = url.searchParams.get("stats");
      const operations = url.searchParams.get("operations");
      const analytics = url.searchParams.get("analytics");
      if (farmId) {
        const { results: farmResults, error: error3 } = await env2.DB.prepare(`
          SELECT 
            f.*,
            COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
            COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count,
            COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = f.id AND t.status != 'completed'), 0) as pending_tasks
          FROM farms f
          WHERE f.id = ? AND f.owner_id = ?
        `).bind(farmId, user.id).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        const farm = farmResults[0];
        if (!farm) {
          return createErrorResponse("Farm not found or access denied", 404);
        }
        if (!await auth2.hasFarmAccess(user.id, farmId)) {
          return createErrorResponse("Access denied", 403);
        }
        if (stats === "true") {
          const { results: statsResults } = await env2.DB.prepare(`
            SELECT * FROM farm_statistics 
            WHERE farm_id = ? 
            ORDER BY report_date DESC 
            LIMIT 12
          `).bind(farmId).all();
          farm.statistics = statsResults;
        }
        if (operations === "true") {
          const { results: opsResults } = await env2.DB.prepare(`
            SELECT * FROM farm_operations 
            WHERE farm_id = ? 
            ORDER BY operation_date DESC 
            LIMIT 50
          `).bind(farmId).all();
          farm.operations = opsResults;
        }
        return createSuccessResponse(farm);
      } else if (analytics === "true") {
        const { results: farms, error: error3 } = await env2.DB.prepare(`
          SELECT 
            f.*,
            COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
            COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count,
            COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = f.id AND t.status != 'completed'), 0) as pending_tasks,
            COALESCE((SELECT SUM(amount) FROM finance_entries fe WHERE fe.farm_id = f.id AND fe.type = 'income'), 0) as total_revenue,
            COALESCE((SELECT SUM(amount) FROM finance_entries fe WHERE fe.farm_id = f.id AND fe.type = 'expense'), 0) as total_expenses,
            COALESCE((SELECT MAX(fs.productivity_score) FROM farm_statistics fs WHERE fs.farm_id = f.id), 0) as latest_productivity_score
          FROM farms f
          WHERE f.owner_id = ?
          ORDER BY f.created_at DESC
        `).bind(user.id).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        return createSuccessResponse(farms || []);
      } else {
        const { results: farms, error: error3 } = await env2.DB.prepare(`
          SELECT 
            f.*,
            COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
            COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count,
            COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = f.id AND t.status != 'completed'), 0) as pending_tasks
          FROM farms f
          WHERE f.owner_id = ?
          ORDER BY f.created_at DESC
        `).bind(user.id).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        return createSuccessResponse(farms || []);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const {
        name,
        location,
        area_hectares,
        farm_type,
        certification_status,
        environmental_compliance,
        total_acres,
        operational_start_date,
        management_structure,
        seasonal_staff,
        annual_budget
      } = body;
      if (!name || !location) {
        return createErrorResponse("Name and location required", 400);
      }
      const { results, error: insertError } = await env2.DB.prepare(`
        INSERT INTO farms (
          name, location, area_hectares, farm_type, certification_status,
          environmental_compliance, total_acres, operational_start_date,
          management_structure, seasonal_staff, annual_budget, owner_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        name,
        location,
        area_hectares || null,
        farm_type || null,
        certification_status || null,
        environmental_compliance || null,
        total_acres || null,
        operational_start_date || null,
        management_structure || null,
        seasonal_staff || null,
        annual_budget || null,
        user.id
      ).run();
      if (insertError) {
        console.error("Insert error:", insertError);
        return createErrorResponse("Failed to create farm", 500);
      }
      const { results: farmResults } = await env2.DB.prepare(`
        SELECT * FROM farms 
        WHERE rowid = last_insert_rowid()
      `).all();
      const newFarm = farmResults[0];
      await auth2.grantFarmAccess(newFarm.id, user.id, "owner");
      await env2.DB.prepare(`
        INSERT INTO farm_statistics (farm_id, report_date)
        VALUES (?, date('now'))
      `).bind(newFarm.id).run();
      return createSuccessResponse(newFarm);
    } else if (method === "PUT") {
      const body = await request.json();
      const { id, ...updateData } = body;
      if (!id) {
        return createErrorResponse("Farm ID required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, id)) {
        return createErrorResponse("Farm not found or access denied", 404);
      }
      const updateFields = [];
      const updateValues = [];
      const allowedFields = [
        "name",
        "location",
        "area_hectares",
        "farm_type",
        "certification_status",
        "environmental_compliance",
        "total_acres",
        "operational_start_date",
        "management_structure",
        "seasonal_staff",
        "annual_budget"
      ];
      allowedFields.forEach((field) => {
        if (updateData[field] !== void 0) {
          updateFields.push(`${field} = ?`);
          updateValues.push(updateData[field]);
        }
      });
      if (updateFields.length === 0) {
        return createErrorResponse("No fields to update", 400);
      }
      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id);
      const { error: updateError } = await env2.DB.prepare(`
        UPDATE farms 
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `).bind(...updateValues).run();
      if (updateError) {
        console.error("Update error:", updateError);
        return createErrorResponse("Failed to update farm", 500);
      }
      const { results: farmResults } = await env2.DB.prepare(`
        SELECT 
          f.*,
          COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
          COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count
        FROM farms f
        WHERE f.id = ?
      `).bind(id).all();
      return createSuccessResponse(farmResults[0]);
    } else if (method === "DELETE") {
      const farmId = url.searchParams.get("id");
      if (!farmId) {
        return createErrorResponse("Farm ID required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, farmId)) {
        return createErrorResponse("Farm not found or access denied", 404);
      }
      const { results: dependencies } = await env2.DB.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM animals WHERE farm_id = ?) as animal_count,
          (SELECT COUNT(*) FROM fields WHERE farm_id = ?) as field_count,
          (SELECT COUNT(*) FROM tasks WHERE farm_id = ?) as task_count
      `).bind(farmId, farmId, farmId).all();
      const dep = dependencies[0];
      if (dep.animal_count > 0 || dep.field_count > 0 || dep.task_count > 0) {
        return createErrorResponse(
          "Cannot delete farm with existing data. Please archive instead.",
          400
        );
      }
      const { error: deleteError } = await env2.DB.prepare(`
        DELETE FROM farms WHERE id = ?
      `).bind(farmId).run();
      if (deleteError) {
        console.error("Delete error:", deleteError);
        return createErrorResponse("Failed to delete farm", 500);
      }
      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error3) {
    console.error("Farm API error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
var init_farms_enhanced = __esm({
  "api/farms-enhanced.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest13, "onRequest");
  }
});

// api/fields.js
async function onRequest14(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      const { results: fields, error: error3 } = await env2.DB.prepare(`
        SELECT 
          f.id,
          f.name,
          f.area_hectares,
          f.crop_type,
          f.notes,
          f.created_at,
          f.updated_at,
          fa.name as farm_name
        FROM fields f
        JOIN farm_members fm ON f.farm_id = fm.farm_id
        JOIN farms fa ON f.farm_id = fa.id
        WHERE fm.user_id = ?
        ORDER BY f.created_at DESC
      `).bind(user.id).all();
      if (error3) {
        console.error("Database error:", error3);
        return createErrorResponse("Database error", 500);
      }
      return createSuccessResponse(fields || []);
    } else if (method === "POST") {
      const body = await request.json();
      const { farm_id, name, area_hectares, crop_type, notes } = body;
      if (!farm_id || !name) {
        return createErrorResponse("Farm ID and name required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse("Farm not found or access denied", 404);
      }
      const { results, error: insertError } = await env2.DB.prepare(`
        INSERT INTO fields (farm_id, name, area_hectares, crop_type, notes)
        VALUES (?, ?, ?, ?, ?)
      `).bind(farm_id, name, area_hectares || null, crop_type || null, notes || null).run();
      if (insertError) {
        console.error("Insert error:", insertError);
        return createErrorResponse("Failed to create field", 500);
      }
      const { results: fieldResults } = await env2.DB.prepare(`
        SELECT 
          f.id,
          f.name,
          f.area_hectares,
          f.crop_type,
          f.notes,
          f.created_at,
          f.updated_at,
          fa.name as farm_name
        FROM fields f
        JOIN farms fa ON f.farm_id = fa.id
        WHERE f.rowid = last_insert_rowid()
      `).all();
      const newField = fieldResults[0];
      return createSuccessResponse(newField);
    } else if (method === "PUT") {
      const body = await request.json();
      const { id, name, area_hectares, crop_type, notes } = body;
      if (!id) {
        return createErrorResponse("Field ID required", 400);
      }
      const { results: existingFields } = await env2.DB.prepare(`
        SELECT f.farm_id 
        FROM fields f
        JOIN farm_members fm ON f.farm_id = fm.farm_id
        WHERE f.id = ? AND fm.user_id = ?
      `).bind(id, user.id).all();
      if (existingFields.length === 0) {
        return createErrorResponse("Field not found or access denied", 404);
      }
      const farm_id = existingFields[0].farm_id;
      const updateFields = [];
      const updateValues = [];
      if (name !== void 0) {
        updateFields.push("name = ?");
        updateValues.push(name);
      }
      if (area_hectares !== void 0) {
        updateFields.push("area_hectares = ?");
        updateValues.push(area_hectares);
      }
      if (crop_type !== void 0) {
        updateFields.push("crop_type = ?");
        updateValues.push(crop_type);
      }
      if (notes !== void 0) {
        updateFields.push("notes = ?");
        updateValues.push(notes);
      }
      if (updateFields.length === 0) {
        return createErrorResponse("No fields to update", 400);
      }
      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id);
      const { error: updateError } = await env2.DB.prepare(`
        UPDATE fields 
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `).bind(...updateValues).run();
      if (updateError) {
        console.error("Update error:", updateError);
        return createErrorResponse("Failed to update field", 500);
      }
      const { results: fieldResults } = await env2.DB.prepare(`
        SELECT 
          f.id,
          f.name,
          f.area_hectares,
          f.crop_type,
          f.notes,
          f.created_at,
          f.updated_at,
          fa.name as farm_name
        FROM fields f
        JOIN farms fa ON f.farm_id = fa.id
        WHERE f.id = ?
      `).bind(id).all();
      return createSuccessResponse(fieldResults[0]);
    } else if (method === "DELETE") {
      const fieldId = url.searchParams.get("id");
      if (!fieldId) {
        return createErrorResponse("Field ID required", 400);
      }
      const { results: existingFields } = await env2.DB.prepare(`
        SELECT f.farm_id 
        FROM fields f
        JOIN farm_members fm ON f.farm_id = fm.farm_id
        WHERE f.id = ? AND fm.user_id = ?
      `).bind(fieldId, user.id).all();
      if (existingFields.length === 0) {
        return createErrorResponse("Field not found or access denied", 404);
      }
      const { error: deleteError } = await env2.DB.prepare(`
        DELETE FROM fields WHERE id = ?
      `).bind(fieldId).run();
      if (deleteError) {
        console.error("Delete error:", deleteError);
        return createErrorResponse("Failed to delete field", 500);
      }
      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error3) {
    console.error("Fields API error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
var init_fields = __esm({
  "api/fields.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest14, "onRequest");
  }
});

// api/fields-enhanced.js
async function onRequest15(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      const fieldId = url.searchParams.get("id");
      const analytics = url.searchParams.get("analytics");
      const soil = url.searchParams.get("soil");
      const equipment = url.searchParams.get("equipment");
      const usage = url.searchParams.get("usage");
      if (fieldId) {
        const { results: fieldResults, error: error3 } = await env2.DB.prepare(`
          SELECT 
            f.*,
            fa.name as farm_name,
            fa.id as farm_id,
            COALESCE((SELECT COUNT(*) FROM crops c WHERE c.field_id = f.id), 0) as crop_count,
            COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = fa.id AND t.status != 'completed'), 0) as pending_tasks
          FROM fields f
          JOIN farm_members fm ON f.farm_id = fm.farm_id
          JOIN farms fa ON f.farm_id = fa.id
          WHERE f.id = ? AND fm.user_id = ?
        `).bind(fieldId, user.id).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        const field = fieldResults[0];
        if (!field) {
          return createErrorResponse("Field not found or access denied", 404);
        }
        if (soil === "true") {
          const { results: soilResults } = await env2.DB.prepare(`
            SELECT * FROM soil_analysis 
            WHERE field_id = ? 
            ORDER BY analysis_date DESC 
            LIMIT 10
          `).bind(fieldId).all();
          field.soil_analysis = soilResults;
        }
        if (equipment === "true") {
          const { results: equipmentResults } = await env2.DB.prepare(`
            SELECT * FROM field_equipment 
            WHERE field_id = ? 
            ORDER BY equipment_type, equipment_name
          `).bind(fieldId).all();
          field.equipment = equipmentResults;
        }
        if (usage === "true") {
          const { results: usageResults } = await env2.DB.prepare(`
            SELECT * FROM field_usage_history 
            WHERE field_id = ? 
            ORDER BY usage_period_start DESC 
            LIMIT 12
          `).bind(fieldId).all();
          field.usage_history = usageResults;
        }
        return createSuccessResponse(field);
      } else if (analytics === "true") {
        const { results: fields, error: error3 } = await env2.DB.prepare(`
          SELECT 
            f.*,
            fa.name as farm_name,
            fa.id as farm_id,
            COALESCE((SELECT COUNT(*) FROM crops c WHERE c.field_id = f.id), 0) as crop_count,
            COALESCE((SELECT AVG(fuh.profitability_score) FROM field_usage_history fuh WHERE fuh.field_id = f.id), 0) as avg_profitability,
            COALESCE((SELECT MAX(fuh.yield_per_hectare) FROM field_usage_history fuh WHERE fuh.field_id = f.id), 0) as best_yield_per_hectare,
            COALESCE((SELECT AVG(sa.ph_level) FROM soil_analysis sa WHERE sa.field_id = f.id), 0) as avg_ph_level
          FROM fields f
          JOIN farm_members fm ON f.farm_id = fm.farm_id
          JOIN farms fa ON f.farm_id = fa.id
          WHERE fm.user_id = ?
          ORDER BY f.created_at DESC
        `).bind(user.id).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        return createSuccessResponse(fields || []);
      } else {
        const { results: fields, error: error3 } = await env2.DB.prepare(`
          SELECT 
            f.*,
            fa.name as farm_name,
            COALESCE((SELECT COUNT(*) FROM crops c WHERE c.field_id = f.id), 0) as crop_count
          FROM fields f
          JOIN farm_members fm ON f.farm_id = fm.farm_id
          JOIN farms fa ON f.farm_id = fa.id
          WHERE fm.user_id = ?
          ORDER BY f.created_at DESC
        `).bind(user.id).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        return createSuccessResponse(fields || []);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const {
        farm_id,
        name,
        area_hectares,
        crop_type,
        notes,
        soil_type,
        field_capacity,
        current_cover_crop,
        irrigation_system,
        drainage_quality,
        accessibility_score,
        environmental_factors,
        maintenance_schedule
      } = body;
      if (!farm_id || !name) {
        return createErrorResponse("Farm ID and name required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse("Farm not found or access denied", 404);
      }
      const { results, error: insertError } = await env2.DB.prepare(`
        INSERT INTO fields (
          farm_id, name, area_hectares, crop_type, notes,
          soil_type, field_capacity, current_cover_crop, irrigation_system,
          drainage_quality, accessibility_score, environmental_factors,
          maintenance_schedule
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id,
        name,
        area_hectares || null,
        crop_type || null,
        notes || null,
        soil_type || null,
        field_capacity || null,
        current_cover_crop || null,
        irrigation_system || null,
        drainage_quality || null,
        accessibility_score || null,
        environmental_factors || null,
        maintenance_schedule || null
      ).run();
      if (insertError) {
        console.error("Insert error:", insertError);
        return createErrorResponse("Failed to create field", 500);
      }
      const { results: fieldResults } = await env2.DB.prepare(`
        SELECT 
          f.*,
          fa.name as farm_name
        FROM fields f
        JOIN farms fa ON f.farm_id = fa.id
        WHERE f.rowid = last_insert_rowid()
      `).all();
      const newField = fieldResults[0];
      await env2.DB.prepare(`
        INSERT INTO soil_analysis (field_id, analysis_date)
        VALUES (?, date('now'))
      `).bind(newField.id).run();
      return createSuccessResponse(newField);
    } else if (method === "PUT") {
      const body = await request.json();
      const { id, ...updateData } = body;
      if (!id) {
        return createErrorResponse("Field ID required", 400);
      }
      const { results: existingFields } = await env2.DB.prepare(`
        SELECT f.farm_id 
        FROM fields f
        JOIN farm_members fm ON f.farm_id = fm.farm_id
        WHERE f.id = ? AND fm.user_id = ?
      `).bind(id, user.id).all();
      if (existingFields.length === 0) {
        return createErrorResponse("Field not found or access denied", 404);
      }
      const updateFields = [];
      const updateValues = [];
      const allowedFields = [
        "name",
        "area_hectares",
        "crop_type",
        "notes",
        "soil_type",
        "field_capacity",
        "current_cover_crop",
        "irrigation_system",
        "drainage_quality",
        "accessibility_score",
        "environmental_factors",
        "maintenance_schedule"
      ];
      allowedFields.forEach((field) => {
        if (updateData[field] !== void 0) {
          updateFields.push(`${field} = ?`);
          updateValues.push(updateData[field]);
        }
      });
      if (updateFields.length === 0) {
        return createErrorResponse("No fields to update", 400);
      }
      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id);
      const { error: updateError } = await env2.DB.prepare(`
        UPDATE fields 
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `).bind(...updateValues).run();
      if (updateError) {
        console.error("Update error:", updateError);
        return createErrorResponse("Failed to update field", 500);
      }
      const { results: fieldResults } = await env2.DB.prepare(`
        SELECT 
          f.*,
          fa.name as farm_name,
          COALESCE((SELECT COUNT(*) FROM crops c WHERE c.field_id = f.id), 0) as crop_count
        FROM fields f
        JOIN farms fa ON f.farm_id = fa.id
        WHERE f.id = ?
      `).bind(id).all();
      return createSuccessResponse(fieldResults[0]);
    } else if (method === "DELETE") {
      const fieldId = url.searchParams.get("id");
      if (!fieldId) {
        return createErrorResponse("Field ID required", 400);
      }
      const { results: existingFields } = await env2.DB.prepare(`
        SELECT f.farm_id 
        FROM fields f
        JOIN farm_members fm ON f.farm_id = fm.farm_id
        WHERE f.id = ? AND fm.user_id = ?
      `).bind(fieldId, user.id).all();
      if (existingFields.length === 0) {
        return createErrorResponse("Field not found or access denied", 404);
      }
      const { results: dependencies } = await env2.DB.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM crops WHERE field_id = ?) as crop_count,
          (SELECT COUNT(*) FROM soil_analysis WHERE field_id = ?) as soil_analysis_count,
          (SELECT COUNT(*) FROM field_equipment WHERE field_id = ?) as equipment_count,
          (SELECT COUNT(*) FROM field_usage_history WHERE field_id = ?) as usage_count
      `).bind(fieldId, fieldId, fieldId, fieldId).all();
      const dep = dependencies[0];
      if (dep.crop_count > 0) {
        return createErrorResponse(
          "Cannot delete field with active crops. Please remove crops first.",
          400
        );
      }
      const { error: deleteError } = await env2.DB.prepare(`
        DELETE FROM fields WHERE id = ?
      `).bind(fieldId).run();
      if (deleteError) {
        console.error("Delete error:", deleteError);
        return createErrorResponse("Failed to delete field", 500);
      }
      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error3) {
    console.error("Field API error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
var init_fields_enhanced = __esm({
  "api/fields-enhanced.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest15, "onRequest");
  }
});

// api/finance-enhanced.js
async function onRequest16(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      const entryId = url.searchParams.get("id");
      const analytics = url.searchParams.get("analytics");
      const type = url.searchParams.get("type");
      const category = url.searchParams.get("category");
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");
      const farmId = url.searchParams.get("farm_id");
      if (entryId) {
        const { results: entryResults, error: error3 } = await env2.DB.prepare(`
          SELECT 
            fe.*,
            fa.name as farm_name,
            creator.name as created_by_name
          FROM finance_entries fe
          JOIN farm_members fm ON fe.farm_id = fm.farm_id
          JOIN farms fa ON fe.farm_id = fa.id
          LEFT JOIN users creator ON fe.created_by = creator.id
          WHERE fe.id = ? AND fm.user_id = ?
        `).bind(entryId, user.id).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        const entry = entryResults[0];
        if (!entry) {
          return createErrorResponse("Entry not found or access denied", 404);
        }
        return createSuccessResponse(entry);
      } else if (analytics === "true") {
        let query = `
          SELECT 
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
        const params = [user.id];
        if (type) {
          query += " AND fe.type = ?";
          params.push(type);
        }
        if (category) {
          query += " AND fe.budget_category = ?";
          params.push(category);
        }
        if (farmId) {
          query += " AND fe.farm_id = ?";
          params.push(farmId);
        }
        if (dateFrom) {
          query += " AND date(fe.entry_date) >= ?";
          params.push(dateFrom);
        }
        if (dateTo) {
          query += " AND date(fe.entry_date) <= ?";
          params.push(dateTo);
        }
        query += " ORDER BY fe.entry_date DESC";
        const { results: entries, error: error3 } = await env2.DB.prepare(query).bind(...params).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        return createSuccessResponse(entries || []);
      } else {
        let query = `
          SELECT 
            fe.*,
            fa.name as farm_name,
            creator.name as created_by_name
          FROM finance_entries fe
          JOIN farm_members fm ON fe.farm_id = fm.farm_id
          JOIN farms fa ON fe.farm_id = fa.id
          LEFT JOIN users creator ON fe.created_by = creator.id
          WHERE fm.user_id = ?
        `;
        const params = [user.id];
        if (type) {
          query += " AND fe.type = ?";
          params.push(type);
        }
        if (category) {
          query += " AND fe.budget_category = ?";
          params.push(category);
        }
        if (farmId) {
          query += " AND fe.farm_id = ?";
          params.push(farmId);
        }
        query += " ORDER BY fe.entry_date DESC LIMIT 100";
        const { results: entries, error: error3 } = await env2.DB.prepare(query).bind(...params).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        return createSuccessResponse(entries || []);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const {
        farm_id,
        entry_date,
        type,
        amount,
        currency,
        account,
        description,
        reference_type,
        reference_id,
        project_id,
        department,
        tax_category,
        approval_status,
        receipt_number,
        recurring_pattern,
        budget_category,
        tax_deductible,
        bank_account
      } = body;
      if (!farm_id || !type || !amount || !entry_date) {
        return createErrorResponse("Farm ID, entry date, type, and amount are required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse("Farm not found or access denied", 404);
      }
      const { results, error: insertError } = await env2.DB.prepare(`
        INSERT INTO finance_entries (
          farm_id, entry_date, type, amount, currency, account, description,
          reference_type, reference_id, project_id, department, tax_category,
          approval_status, receipt_number, recurring_pattern, budget_category,
          tax_deductible, bank_account, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id,
        entry_date,
        type,
        amount,
        currency || "USD",
        account || null,
        description || null,
        reference_type || null,
        reference_id || null,
        project_id || null,
        department || null,
        tax_category || null,
        approval_status || "pending",
        receipt_number || null,
        recurring_pattern || null,
        budget_category || null,
        tax_deductible || 0,
        bank_account || null,
        user.id
      ).run();
      if (insertError) {
        console.error("Insert error:", insertError);
        return createErrorResponse("Failed to create finance entry", 500);
      }
      const { results: entryResults } = await env2.DB.prepare(`
        SELECT 
          fe.*,
          fa.name as farm_name,
          creator.name as created_by_name
        FROM finance_entries fe
        JOIN farms fa ON fe.farm_id = fa.id
        LEFT JOIN users creator ON fe.created_by = creator.id
        WHERE fe.rowid = last_insert_rowid()
      `).all();
      const newEntry = entryResults[0];
      return createSuccessResponse(newEntry);
    } else if (method === "PUT") {
      const body = await request.json();
      const { id, ...updateData } = body;
      if (!id) {
        return createErrorResponse("Entry ID required", 400);
      }
      const { results: existingEntries } = await env2.DB.prepare(`
        SELECT fe.farm_id, fe.title
        FROM finance_entries fe
        JOIN farm_members fm ON fe.farm_id = fm.farm_id
        WHERE fe.id = ? AND fm.user_id = ?
      `).bind(id, user.id).all();
      if (existingEntries.length === 0) {
        return createErrorResponse("Entry not found or access denied", 404);
      }
      const updateFields = [];
      const updateValues = [];
      const allowedFields = [
        "entry_date",
        "type",
        "amount",
        "currency",
        "account",
        "description",
        "reference_type",
        "reference_id",
        "project_id",
        "department",
        "tax_category",
        "approval_status",
        "receipt_number",
        "recurring_pattern",
        "budget_category",
        "tax_deductible",
        "bank_account"
      ];
      allowedFields.forEach((field) => {
        if (updateData[field] !== void 0) {
          updateFields.push(`${field} = ?`);
          updateValues.push(updateData[field]);
        }
      });
      if (updateFields.length === 0) {
        return createErrorResponse("No fields to update", 400);
      }
      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id);
      const { error: updateError } = await env2.DB.prepare(`
        UPDATE finance_entries 
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `).bind(...updateValues).run();
      if (updateError) {
        console.error("Update error:", updateError);
        return createErrorResponse("Failed to update finance entry", 500);
      }
      const { results: entryResults } = await env2.DB.prepare(`
        SELECT 
          fe.*,
          fa.name as farm_name,
          creator.name as created_by_name
        FROM finance_entries fe
        JOIN farms fa ON fe.farm_id = fa.id
        LEFT JOIN users creator ON fe.created_by = creator.id
        WHERE fe.id = ?
      `).bind(id).all();
      return createSuccessResponse(entryResults[0]);
    } else if (method === "DELETE") {
      const entryId = url.searchParams.get("id");
      if (!entryId) {
        return createErrorResponse("Entry ID required", 400);
      }
      const { results: existingEntries } = await env2.DB.prepare(`
        SELECT fe.farm_id, fe.type, fe.amount
        FROM finance_entries fe
        JOIN farm_members fm ON fe.farm_id = fm.farm_id
        WHERE fe.id = ? AND fm.user_id = ?
      `).bind(entryId, user.id).all();
      if (existingEntries.length === 0) {
        return createErrorResponse("Entry not found or access denied", 404);
      }
      const { results: references } = await env2.DB.prepare(`
        SELECT COUNT(*) as ref_count FROM invoices WHERE total_amount = ?
      `).bind(existingEntries[0].amount).all();
      if (references[0].ref_count > 0) {
        return createErrorResponse(
          "Cannot delete entry with existing references. Please archive instead.",
          400
        );
      }
      const { error: deleteError } = await env2.DB.prepare(`
        DELETE FROM finance_entries WHERE id = ?
      `).bind(entryId).run();
      if (deleteError) {
        console.error("Delete error:", deleteError);
        return createErrorResponse("Failed to delete finance entry", 500);
      }
      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error3) {
    console.error("Finance API error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
var init_finance_enhanced = __esm({
  "api/finance-enhanced.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest16, "onRequest");
  }
});

// api/inventory/index.js
async function onRequest17(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      const { results: inventoryItems, error: error3 } = await env2.DB.prepare(`
        SELECT 
          ii.id,
          ii.name,
          ii.sku,
          ii.qty,
          ii.unit,
          ii.reorder_threshold,
          ii.created_at,
          ii.updated_at,
          fa.name as farm_name
        FROM inventory_items ii
        JOIN farm_members fm ON ii.farm_id = fm.farm_id
        JOIN farms fa ON ii.farm_id = fa.id
        WHERE fm.user_id = ?
        ORDER BY ii.created_at DESC
      `).bind(user.id).all();
      if (error3) {
        console.error("Database error:", error3);
        return createErrorResponse("Database error", 500);
      }
      return createSuccessResponse(inventoryItems || []);
    } else if (method === "POST") {
      const body = await request.json();
      const { farm_id, name, sku, qty, unit, reorder_threshold } = body;
      if (!farm_id || !name) {
        return createErrorResponse("Farm ID and name required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse("Farm not found or access denied", 404);
      }
      const { results, error: insertError } = await env2.DB.prepare(`
        INSERT INTO inventory_items (farm_id, name, sku, qty, unit, reorder_threshold)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id,
        name,
        sku || null,
        qty || 0,
        unit || "units",
        reorder_threshold || 0
      ).run();
      if (insertError) {
        console.error("Insert error:", insertError);
        return createErrorResponse("Failed to create inventory item", 500);
      }
      const { results: itemResults } = await env2.DB.prepare(`
        SELECT 
          ii.id,
          ii.name,
          ii.sku,
          ii.qty,
          ii.unit,
          ii.reorder_threshold,
          ii.created_at,
          ii.updated_at,
          fa.name as farm_name
        FROM inventory_items ii
        JOIN farms fa ON ii.farm_id = fa.id
        WHERE ii.rowid = last_insert_rowid()
      `).all();
      const newItem = itemResults[0];
      return createSuccessResponse(newItem);
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error3) {
    console.error("Inventory API error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
var init_inventory = __esm({
  "api/inventory/index.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest17, "onRequest");
  }
});

// api/inventory-enhanced.js
async function onRequest18(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      const itemId = url.searchParams.get("id");
      const analytics = url.searchParams.get("analytics");
      const alerts = url.searchParams.get("alerts");
      const suppliers = url.searchParams.get("suppliers");
      const lowStock = url.searchParams.get("low_stock");
      const category = url.searchParams.get("category");
      if (itemId) {
        const { results: itemResults, error: error3 } = await env2.DB.prepare(`
          SELECT 
            ii.*,
            fa.name as farm_name,
            COALESCE((SELECT COUNT(*) FROM inventory_transactions it WHERE it.inventory_item_id = ii.id), 0) as transaction_count,
            COALESCE((SELECT SUM(ABS(it.qty_delta)) FROM inventory_transactions it WHERE it.inventory_item_id = ii.id), 0) as total_movement,
            COALESCE((SELECT AVG(it.unit_cost) FROM inventory_transactions it WHERE it.inventory_item_id = ii.id AND it.unit_cost IS NOT NULL), 0) as avg_cost_per_unit
          FROM inventory_items ii
          JOIN farm_members fm ON ii.farm_id = fm.farm_id
          JOIN farms fa ON ii.farm_id = fa.id
          WHERE ii.id = ? AND fm.user_id = ?
        `).bind(itemId, user.id).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        const item = itemResults[0];
        if (!item) {
          return createErrorResponse("Inventory item not found or access denied", 404);
        }
        if (alerts === "true") {
          const { results: alertsResults } = await env2.DB.prepare(`
            SELECT * FROM inventory_alerts 
            WHERE inventory_item_id = ? 
            ORDER BY alert_date DESC 
            LIMIT 10
          `).bind(itemId).all();
          item.alerts = alertsResults;
        }
        const { results: costResults } = await env2.DB.prepare(`
          SELECT * FROM inventory_cost_history 
          WHERE inventory_item_id = ? 
          ORDER BY cost_date DESC 
          LIMIT 12
        `).bind(itemId).all();
        item.cost_history = costResults;
        return createSuccessResponse(item);
      } else if (lowStock === "true") {
        const { results: items, error: error3 } = await env2.DB.prepare(`
          SELECT 
            ii.*,
            fa.name as farm_name,
            CASE 
              WHEN ii.qty <= ii.reorder_threshold THEN 'critical'
              WHEN ii.qty <= ii.reorder_threshold * 1.5 THEN 'low'
              ELSE 'normal'
            END as stock_status
          FROM inventory_items ii
          JOIN farm_members fm ON ii.farm_id = fm.farm_id
          JOIN farms fa ON ii.farm_id = fa.id
          WHERE fm.user_id = ? 
            AND ii.reorder_threshold > 0 
            AND ii.qty <= ii.reorder_threshold * 1.5
          ORDER BY (ii.qty / ii.reorder_threshold) ASC
        `).bind(user.id).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        return createSuccessResponse(items || []);
      } else if (analytics === "true") {
        let query = `
          SELECT 
            ii.*,
            fa.name as farm_name,
            COALESCE((SELECT COUNT(*) FROM inventory_transactions it WHERE it.inventory_item_id = ii.id), 0) as transaction_count,
            COALESCE((SELECT SUM(CASE WHEN it.qty_delta < 0 THEN ABS(it.qty_delta) ELSE 0 END) FROM inventory_transactions it WHERE it.inventory_item_id = ii.id), 0) as total_usage,
            COALESCE((SELECT SUM(CASE WHEN it.qty_delta > 0 THEN it.qty_delta ELSE 0 END) FROM inventory_transactions it WHERE it.inventory_item_id = ii.id), 0) as total_additions,
            COALESCE((SELECT MAX(ch.unit_cost) FROM inventory_cost_history ch WHERE ch.inventory_item_id = ii.id), 0) as latest_cost_per_unit,
            COALESCE((SELECT AVG(ch.unit_cost) FROM inventory_cost_history ch WHERE ch.inventory_item_id = ii.id), 0) as avg_cost_per_unit,
            CASE 
              WHEN ii.qty <= ii.reorder_threshold THEN 'critical'
              WHEN ii.qty <= ii.reorder_threshold * 1.5 THEN 'low'
              ELSE 'normal'
            END as stock_status
          FROM inventory_items ii
          JOIN farm_members fm ON ii.farm_id = fm.farm_id
          JOIN farms fa ON ii.farm_id = fa.id
          WHERE fm.user_id = ?
        `;
        const params = [user.id];
        if (category) {
          query += " AND ii.category = ?";
          params.push(category);
        }
        query += " ORDER BY ii.name ASC";
        const { results: items, error: error3 } = await env2.DB.prepare(query).bind(...params).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        return createSuccessResponse(items || []);
      } else {
        let query = `
          SELECT 
            ii.*,
            fa.name as farm_name,
            CASE 
              WHEN ii.qty <= ii.reorder_threshold THEN 'critical'
              WHEN ii.qty <= ii.reorder_threshold * 1.5 THEN 'low'
              ELSE 'normal'
            END as stock_status
          FROM inventory_items ii
          JOIN farm_members fm ON ii.farm_id = fm.farm_id
          JOIN farms fa ON ii.farm_id = fa.id
          WHERE fm.user_id = ?
        `;
        const params = [user.id];
        query += " ORDER BY ii.name ASC";
        const { results: items, error: error3 } = await env2.DB.prepare(query).bind(...params).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        return createSuccessResponse(items || []);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const {
        farm_id,
        name,
        sku,
        qty,
        unit,
        reorder_threshold,
        category,
        supplier_info,
        storage_requirements,
        expiration_date,
        quality_grade,
        minimum_order_quantity,
        maximum_order_quantity,
        current_cost_per_unit,
        preferred_supplier_id
      } = body;
      if (!farm_id || !name) {
        return createErrorResponse("Farm ID and name are required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse("Farm not found or access denied", 404);
      }
      const { results, error: insertError } = await env2.DB.prepare(`
        INSERT INTO inventory_items (
          farm_id, name, sku, qty, unit, reorder_threshold,
          category, supplier_info, storage_requirements, expiration_date,
          quality_grade, minimum_order_quantity, maximum_order_quantity,
          current_cost_per_unit, preferred_supplier_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id,
        name,
        sku || null,
        qty || 0,
        unit || "units",
        reorder_threshold || 0,
        category || null,
        supplier_info || null,
        storage_requirements || null,
        expiration_date || null,
        quality_grade || null,
        minimum_order_quantity || null,
        maximum_order_quantity || null,
        current_cost_per_unit || null,
        preferred_supplier_id || null
      ).run();
      if (insertError) {
        console.error("Insert error:", insertError);
        return createErrorResponse("Failed to create inventory item", 500);
      }
      const { results: itemResults } = await env2.DB.prepare(`
        SELECT 
          ii.*,
          fa.name as farm_name
        FROM inventory_items ii
        JOIN farms fa ON ii.farm_id = fa.id
        WHERE ii.rowid = last_insert_rowid()
      `).all();
      const newItem = itemResults[0];
      if (current_cost_per_unit) {
        await env2.DB.prepare(`
          INSERT INTO inventory_cost_history (
            inventory_item_id, cost_date, unit_cost, quantity_purchased, 
            total_cost, cost_reason, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newItem.id,
          (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          current_cost_per_unit,
          qty || 0,
          current_cost_per_unit * (qty || 0),
          "initial_cost",
          "Initial cost entry"
        ).run();
      }
      if (qty <= reorder_threshold) {
        await env2.DB.prepare(`
          INSERT INTO inventory_alerts (
            inventory_item_id, alert_type, alert_date, current_quantity, 
            threshold_quantity, severity, notes
          ) VALUES (?, 'low_stock', ?, ?, ?, ?, ?)
        `).bind(
          newItem.id,
          (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          qty || 0,
          reorder_threshold || 0,
          qty <= reorder_threshold * 0.5 ? "critical" : "high",
          "Initial stock level is at or below reorder threshold"
        ).run();
      }
      return createSuccessResponse(newItem);
    } else if (method === "PUT") {
      const body = await request.json();
      const { id, ...updateData } = body;
      if (!id) {
        return createErrorResponse("Item ID required", 400);
      }
      const { results: existingItems } = await env2.DB.prepare(`
        SELECT ii.farm_id, ii.qty, ii.name
        FROM inventory_items ii
        JOIN farm_members fm ON ii.farm_id = fm.farm_id
        WHERE ii.id = ? AND fm.user_id = ?
      `).bind(id, user.id).all();
      if (existingItems.length === 0) {
        return createErrorResponse("Inventory item not found or access denied", 404);
      }
      const existingItem = existingItems[0];
      const updateFields = [];
      const updateValues = [];
      const allowedFields = [
        "name",
        "sku",
        "qty",
        "unit",
        "reorder_threshold",
        "category",
        "supplier_info",
        "storage_requirements",
        "expiration_date",
        "quality_grade",
        "minimum_order_quantity",
        "maximum_order_quantity",
        "current_cost_per_unit",
        "preferred_supplier_id"
      ];
      allowedFields.forEach((field) => {
        if (updateData[field] !== void 0) {
          updateFields.push(`${field} = ?`);
          updateValues.push(updateData[field]);
        }
      });
      if (updateFields.length === 0) {
        return createErrorResponse("No fields to update", 400);
      }
      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id);
      const { error: updateError } = await env2.DB.prepare(`
        UPDATE inventory_items 
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `).bind(...updateValues).run();
      if (updateError) {
        console.error("Update error:", updateError);
        return createErrorResponse("Failed to update inventory item", 500);
      }
      if (updateData.qty !== void 0 && updateData.qty !== existingItem.qty) {
        if (updateData.qty <= (updateData.reorder_threshold || 0)) {
          await env2.DB.prepare(`
            INSERT INTO inventory_alerts (
              inventory_item_id, alert_type, alert_date, current_quantity, 
              threshold_quantity, severity, notes
            ) VALUES (?, 'low_stock', ?, ?, ?, ?, ?)
          `).bind(
            id,
            (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            updateData.qty,
            updateData.reorder_threshold || 0,
            updateData.qty <= (updateData.reorder_threshold || 0) * 0.5 ? "critical" : "high",
            `Stock level reduced to ${updateData.qty} - below reorder threshold`
          ).run();
        }
        if (updateData.current_cost_per_unit !== void 0) {
          await env2.DB.prepare(`
            INSERT INTO inventory_cost_history (
              inventory_item_id, cost_date, unit_cost, quantity_purchased, 
              total_cost, cost_reason, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id,
            (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            updateData.current_cost_per_unit,
            Math.abs(updateData.qty - existingItem.qty),
            updateData.current_cost_per_unit * Math.abs(updateData.qty - existingItem.qty),
            "price_update",
            "Cost per unit updated"
          ).run();
        }
      }
      const { results: itemResults } = await env2.DB.prepare(`
        SELECT 
          ii.*,
          fa.name as farm_name
        FROM inventory_items ii
        JOIN farms fa ON ii.farm_id = fa.id
        WHERE ii.id = ?
      `).bind(id).all();
      return createSuccessResponse(itemResults[0]);
    } else if (method === "DELETE") {
      const itemId = url.searchParams.get("id");
      if (!itemId) {
        return createErrorResponse("Item ID required", 400);
      }
      const { results: existingItems } = await env2.DB.prepare(`
        SELECT ii.farm_id, ii.name
        FROM inventory_items ii
        JOIN farm_members fm ON ii.farm_id = fm.farm_id
        WHERE ii.id = ? AND fm.user_id = ?
      `).bind(itemId, user.id).all();
      if (existingItems.length === 0) {
        return createErrorResponse("Inventory item not found or access denied", 404);
      }
      const { results: dependencies } = await env2.DB.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM inventory_transactions WHERE inventory_item_id = ?) as transaction_count,
          (SELECT COUNT(*) FROM purchase_order_items WHERE inventory_item_id = ?) as po_items,
          (SELECT COUNT(*) FROM inventory_cost_history WHERE inventory_item_id = ?) as cost_records
      `).bind(itemId, itemId, itemId).all();
      const dep = dependencies[0];
      if (dep.transaction_count > 0 || dep.po_items > 0 || dep.cost_records > 0) {
        return createErrorResponse(
          "Cannot delete item with existing transactions, purchase orders, or cost records. Please deactivate instead.",
          400
        );
      }
      const { error: deleteError } = await env2.DB.prepare(`
        DELETE FROM inventory_items WHERE id = ?
      `).bind(itemId).run();
      if (deleteError) {
        console.error("Delete error:", deleteError);
        return createErrorResponse("Failed to delete inventory item", 500);
      }
      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error3) {
    console.error("Inventory API error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
var init_inventory_enhanced = __esm({
  "api/inventory-enhanced.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest18, "onRequest");
  }
});

// api/system-integration.js
async function onRequest19(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      const farmId = url.searchParams.get("farm_id");
      const type = url.searchParams.get("type") || "dashboard";
      if (!farmId) {
        return createErrorResponse("Farm ID required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, farmId)) {
        return createErrorResponse("Access denied", 403);
      }
      if (type === "dashboard") {
        const dashboardData = await getDashboardData(env2, farmId);
        return createSuccessResponse(dashboardData);
      } else if (type === "integration") {
        const integrationData = await getIntegrationData(env2, farmId);
        return createSuccessResponse(integrationData);
      } else if (type === "workflow") {
        const workflowData = await getWorkflowData(env2, farmId);
        return createSuccessResponse(workflowData);
      } else if (type === "analytics") {
        const analyticsData = await getAdvancedAnalytics(env2, farmId);
        return createSuccessResponse(analyticsData);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const { action, farm_id, data } = body;
      if (!action || !farm_id) {
        return createErrorResponse("Action and farm ID required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse("Access denied", 403);
      }
      switch (action) {
        case "sync_inventory":
          return await handleInventorySync(env2, farm_id, data);
        case "auto_task_creation":
          return await handleAutoTaskCreation(env2, farm_id, data);
        case "financial_insights":
          return await handleFinancialInsights(env2, farm_id, data);
        case "crop_rotation_recommendation":
          return await handleCropRotation(env2, farm_id, data);
        case "resource_optimization":
          return await handleResourceOptimization(env2, farm_id, data);
        default:
          return createErrorResponse("Unknown action", 400);
      }
    }
    return createErrorResponse("Method not allowed", 405);
  } catch (error3) {
    console.error("System integration error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
async function getDashboardData(env2, farmId) {
  const [farms, animals, crops, fields, inventory, tasks, finance] = await Promise.all([
    // Farm data
    env2.DB.prepare(`
      SELECT 
        f.*,
        COUNT(DISTINCT a.id) as animal_count,
        COUNT(DISTINCT c.id) as crop_count,
        COUNT(DISTINCT fi.id) as field_count,
        COUNT(DISTINCT t.id) as task_count,
        COALESCE(SUM(CASE WHEN fe.type = 'income' THEN fe.amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN fe.type = 'expense' THEN fe.amount ELSE 0 END), 0) as total_expenses
      FROM farms f
      LEFT JOIN animals a ON f.id = a.farm_id
      LEFT JOIN crops c ON f.id = c.farm_id
      LEFT JOIN fields fi ON f.id = fi.farm_id
      LEFT JOIN tasks t ON f.id = t.farm_id
      LEFT JOIN finance_entries fe ON f.id = fe.farm_id
      WHERE f.id = ?
      GROUP BY f.id
    `).bind(farmId).all(),
    // Animal statistics
    env2.DB.prepare(`
      SELECT 
        species,
        COUNT(*) as count,
        COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_count,
        AVG(CASE WHEN current_weight IS NOT NULL THEN current_weight END) as avg_weight
      FROM animals
      WHERE farm_id = ?
      GROUP BY species
    `).bind(farmId).all(),
    // Crop statistics
    env2.DB.prepare(`
      SELECT 
        crop_type,
        COUNT(*) as count,
        AVG(expected_yield) as avg_yield,
        COUNT(CASE WHEN growth_stage = 'mature' THEN 1 END) as mature_count
      FROM crops
      WHERE farm_id = ?
      GROUP BY crop_type
    `).bind(farmId).all(),
    // Field utilization
    env2.DB.prepare(`
      SELECT 
        COUNT(*) as total_fields,
        AVG(area_hectares) as avg_area,
        COUNT(CASE WHEN current_cover_crop IS NOT NULL THEN 1 END) as cultivated_fields
      FROM fields
      WHERE farm_id = ?
    `).bind(farmId).all(),
    // Inventory status
    env2.DB.prepare(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN qty <= reorder_threshold THEN 1 END) as low_stock_items,
        COALESCE(SUM(qty * unit_cost), 0) as total_value
      FROM inventory_items
      WHERE farm_id = ?
    `).bind(farmId).all(),
    // Task overview
    env2.DB.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_tasks,
        COUNT(CASE WHEN due_date < date('now') AND status != 'completed' THEN 1 END) as overdue_tasks
      FROM tasks
      WHERE farm_id = ?
    `).bind(farmId).all(),
    // Financial summary
    env2.DB.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as revenue,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END), 0) as net_profit
      FROM finance_entries
      WHERE farm_id = ?
        AND date(entry_date) >= date('now', '-30 days')
    `).bind(farmId).all()
  ]);
  return {
    farm: farms[0] || {},
    animals,
    crops,
    fields: fields[0] || {},
    inventory: inventory[0] || {},
    tasks: tasks[0] || {},
    finance: finance[0] || {},
    alerts: await getSystemAlerts(env2, farmId),
    insights: await generateSystemInsights(env2, farmId)
  };
}
async function getIntegrationData(env2, farmId) {
  const relationships = await env2.DB.prepare(`
    SELECT 
      'tasks' as module,
      'animals' as related_module,
      COUNT(*) as relationship_count
    FROM tasks t
    JOIN animals a ON t.target_id = CAST(a.id AS TEXT)
    WHERE t.target_type = 'animal' AND t.farm_id = ?
    
    UNION ALL
    
    SELECT 
      'tasks' as module,
      'crops' as related_module,
      COUNT(*) as relationship_count
    FROM tasks t
    JOIN crops c ON t.target_id = CAST(c.id AS TEXT)
    WHERE t.target_type = 'crop' AND t.farm_id = ?
    
    UNION ALL
    
    SELECT 
      'finance' as module,
      'inventory' as related_module,
      COUNT(*) as relationship_count
    FROM finance_entries fe
    JOIN inventory_transactions it ON fe.reference_id = CAST(it.id AS TEXT)
    WHERE fe.reference_type = 'inventory' AND fe.farm_id = ?
  `).bind(farmId, farmId, farmId).all();
  return {
    relationships,
    data_flows: await getDataFlows(env2, farmId),
    integration_points: getIntegrationPoints()
  };
}
async function getWorkflowData(env2, farmId) {
  const workflows = await env2.DB.prepare(`
    SELECT 
      w.workflow_name,
      w.trigger_type,
      w.status,
      COUNT(wi.id) as execution_count,
      MAX(wi.executed_at) as last_execution
    FROM workflows w
    LEFT JOIN workflow_instances wi ON w.id = wi.workflow_id
    WHERE w.farm_id = ?
    GROUP BY w.id, w.workflow_name, w.trigger_type, w.status
  `).bind(farmId).all();
  return {
    workflows,
    process_automation: await getProcessAutomation(env2, farmId),
    efficiency_metrics: await getEfficiencyMetrics(env2, farmId)
  };
}
async function getAdvancedAnalytics(env2, farmId) {
  const analytics = {
    performance_trends: await getPerformanceTrends(env2, farmId),
    productivity_metrics: await getProductivityMetrics2(env2, farmId),
    financial_analysis: await getFinancialAnalysis(env2, farmId),
    operational_efficiency: await getOperationalEfficiency(env2, farmId),
    predictive_insights: await getPredictiveInsights(env2, farmId)
  };
  return analytics;
}
async function getSystemAlerts(env2, farmId) {
  const alerts = [];
  const overdueTasks = await env2.DB.prepare(`
    SELECT COUNT(*) as count FROM tasks 
    WHERE farm_id = ? AND due_date < date('now') AND status != 'completed'
  `).bind(farmId).all();
  if (overdueTasks[0].count > 0) {
    alerts.push({
      type: "warning",
      category: "tasks",
      message: `${overdueTasks[0].count} overdue tasks require attention`,
      count: overdueTasks[0].count
    });
  }
  const lowStock = await env2.DB.prepare(`
    SELECT COUNT(*) as count FROM inventory_items 
    WHERE farm_id = ? AND qty <= reorder_threshold
  `).bind(farmId).all();
  if (lowStock[0].count > 0) {
    alerts.push({
      type: "warning",
      category: "inventory",
      message: `${lowStock[0].count} items are running low on stock`,
      count: lowStock[0].count
    });
  }
  const unhealthyAnimals = await env2.DB.prepare(`
    SELECT COUNT(*) as count FROM animals 
    WHERE farm_id = ? AND health_status != 'healthy'
  `).bind(farmId).all();
  if (unhealthyAnimals[0].count > 0) {
    alerts.push({
      type: "error",
      category: "animals",
      message: `${unhealthyAnimals[0].count} animals need health attention`,
      count: unhealthyAnimals[0].count
    });
  }
  return alerts;
}
async function generateSystemInsights(env2, farmId) {
  const insights = [];
  const financialData = await env2.DB.prepare(`
    SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as revenue,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
    FROM finance_entries
    WHERE farm_id = ? AND date(entry_date) >= date('now', '-30 days')
  `).bind(farmId).all();
  const revenue = financialData[0]?.revenue || 0;
  const expenses = financialData[0]?.expenses || 0;
  const profitMargin = revenue > 0 ? (revenue - expenses) / revenue * 100 : 0;
  if (profitMargin < 10) {
    insights.push({
      type: "improvement",
      category: "finance",
      title: "Profit Margin Optimization",
      description: "Consider reviewing expenses or increasing revenue streams to improve profitability.",
      impact: "high",
      suggestion: "Analyze top expense categories and identify cost reduction opportunities"
    });
  }
  const taskEfficiency = await env2.DB.prepare(`
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN due_date < date('now') AND status != 'completed' THEN 1 END) as overdue_tasks
    FROM tasks
    WHERE farm_id = ? AND date(created_at) >= date('now', '-30 days')
  `).bind(farmId).all();
  const completionRate = taskEfficiency[0].total_tasks > 0 ? taskEfficiency[0].completed_tasks / taskEfficiency[0].total_tasks * 100 : 0;
  if (completionRate < 70) {
    insights.push({
      type: "efficiency",
      category: "tasks",
      title: "Task Completion Rate",
      description: "Improve task management processes to increase completion rates.",
      impact: "medium",
      suggestion: "Review task priorities and resource allocation"
    });
  }
  return insights;
}
async function handleInventorySync(env2, farmId, data) {
  const syncResults = await env2.DB.prepare(`
    INSERT INTO inventory_transactions (farm_id, inventory_item_id, qty_delta, unit, reason_type, reference_type, created_at)
    SELECT 
      ? as farm_id,
      ii.id as inventory_item_id,
      -1 as qty_delta,
      ii.unit,
      'usage' as reason_type,
      'automated_sync' as reference_type,
      CURRENT_TIMESTAMP as created_at
    FROM inventory_items ii
    WHERE ii.farm_id = ? AND ii.qty > 0
  `).bind(farmId, farmId).run();
  return createSuccessResponse({
    success: true,
    message: "Inventory sync completed",
    affected_rows: syncResults.changes
  });
}
async function handleAutoTaskCreation(env2, farmId, data) {
  const autoTasks = [
    {
      title: "Daily Animal Health Check",
      description: "Automated daily health monitoring for all animals",
      task_category: "Livestock",
      priority: "medium",
      recurring_pattern: "daily"
    },
    {
      title: "Inventory Stock Review",
      description: "Weekly inventory review and restocking check",
      task_category: "Inventory",
      priority: "low",
      recurring_pattern: "weekly"
    }
  ];
  const createdTasks = [];
  for (const task of autoTasks) {
    const { results } = await env2.DB.prepare(`
      INSERT INTO tasks (farm_id, title, description, task_category, priority, recurring_pattern, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(farmId, task.title, task.description, task.task_category, task.priority, task.recurring_pattern, "system").run();
    createdTasks.push(results);
  }
  return createSuccessResponse({
    success: true,
    message: "Auto tasks created",
    tasks_created: createdTasks.length
  });
}
async function handleFinancialInsights(env2, farmId, data) {
  const insights = {
    expense_categories: await getExpenseAnalysis(env2, farmId),
    revenue_sources: await getRevenueAnalysis(env2, farmId),
    budget_variance: await getBudgetVariance(env2, farmId),
    recommendations: await generateFinancialRecommendations(env2, farmId)
  };
  return createSuccessResponse(insights);
}
async function handleCropRotation(env2, farmId, data) {
  const recommendations = {
    current_rotation: await getCurrentRotation(env2, farmId),
    soil_health_considerations: await getSoilHealthData(env2, farmId),
    suggested_rotations: [
      {
        sequence: ["Corn", "Soybeans", "Wheat", "Cover Crop"],
        benefits: "Improved soil nitrogen and pest management",
        yield_impact: "+15% over 4-year cycle"
      },
      {
        sequence: ["Vegetables", "Legumes", "Grains", "Fallow"],
        benefits: "Enhanced biodiversity and soil restoration",
        yield_impact: "+20% soil health improvement"
      }
    ]
  };
  return createSuccessResponse(recommendations);
}
async function handleResourceOptimization(env2, farmId, data) {
  const optimization = {
    labor_allocation: await optimizeLaborAllocation(env2, farmId),
    equipment_utilization: await optimizeEquipmentUse(env2, farmId),
    feed_efficiency: await optimizeFeedDistribution(env2, farmId),
    water_management: await optimizeWaterUsage(env2, farmId)
  };
  return createSuccessResponse(optimization);
}
async function getPerformanceTrends(env2, farmId) {
  return {
    last_30_days: await get30DayTrends(env2, farmId),
    seasonal_patterns: await getSeasonalPatterns(env2, farmId),
    year_over_year: await getYoYGrowth(env2, farmId)
  };
}
async function getProductivityMetrics2(env2, farmId) {
  const metrics = await env2.DB.prepare(`
    SELECT 
      COUNT(DISTINCT t.id) as total_tasks,
      AVG(t.estimated_duration) as avg_task_duration,
      COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
      AVG(t.progress_percentage) as avg_progress
    FROM tasks t
    WHERE t.farm_id = ?
      AND date(t.created_at) >= date('now', '-30 days')
  `).bind(farmId).all();
  return metrics[0] || {};
}
async function getFinancialAnalysis(env2, farmId) {
  return {
    profitability_trend: await getProfitabilityTrend(env2, farmId),
    cost_analysis: await getCostAnalysis(env2, farmId),
    revenue_breakdown: await getRevenueBreakdown(env2, farmId)
  };
}
async function getOperationalEfficiency(env2, farmId) {
  return {
    resource_utilization: await getResourceUtilization(env2, farmId),
    workflow_efficiency: await getWorkflowEfficiency(env2, farmId),
    automation_rate: await getAutomationRate(env2, farmId)
  };
}
async function getPredictiveInsights(env2, farmId) {
  return {
    yield_predictions: await getYieldPredictions(env2, farmId),
    demand_forecasting: await getDemandForecasting(env2, farmId),
    risk_assessment: await getRiskAssessment(env2, farmId),
    optimization_opportunities: await getOptimizationOpportunities(env2, farmId)
  };
}
function getIntegrationPoints() {
  return [
    { from: "animals", to: "tasks", type: "health_monitoring" },
    { from: "crops", to: "finance", type: "revenue_tracking" },
    { from: "inventory", to: "tasks", type: "stock_management" },
    { from: "weather", to: "tasks", type: "scheduling" },
    { from: "finance", to: "budget", type: "expense_tracking" }
  ];
}
var init_system_integration = __esm({
  "api/system-integration.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest19, "onRequest");
    __name(getDashboardData, "getDashboardData");
    __name(getIntegrationData, "getIntegrationData");
    __name(getWorkflowData, "getWorkflowData");
    __name(getAdvancedAnalytics, "getAdvancedAnalytics");
    __name(getSystemAlerts, "getSystemAlerts");
    __name(generateSystemInsights, "generateSystemInsights");
    __name(handleInventorySync, "handleInventorySync");
    __name(handleAutoTaskCreation, "handleAutoTaskCreation");
    __name(handleFinancialInsights, "handleFinancialInsights");
    __name(handleCropRotation, "handleCropRotation");
    __name(handleResourceOptimization, "handleResourceOptimization");
    __name(getPerformanceTrends, "getPerformanceTrends");
    __name(getProductivityMetrics2, "getProductivityMetrics");
    __name(getFinancialAnalysis, "getFinancialAnalysis");
    __name(getOperationalEfficiency, "getOperationalEfficiency");
    __name(getPredictiveInsights, "getPredictiveInsights");
    __name(getIntegrationPoints, "getIntegrationPoints");
  }
});

// api/tasks.js
async function onRequest20(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
    if (method === "GET") {
      const { results: tasks, error: error3 } = await env2.DB.prepare(`
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.due_date,
          t.created_at,
          t.updated_at,
          fa.name as farm_name,
          assignee.name as assigned_to_name
        FROM tasks t
        JOIN farm_members fm ON t.farm_id = fm.farm_id
        JOIN farms fa ON t.farm_id = fa.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE fm.user_id = ?
        ORDER BY t.due_date ASC, t.created_at DESC
      `).bind(user.id).all();
      if (error3) {
        console.error("Database error:", error3);
        return createErrorResponse("Database error", 500);
      }
      return createSuccessResponse(tasks || []);
    } else if (method === "POST") {
      const body = await request.json();
      const { farm_id, title: title2, description, status, priority, due_date, assigned_to } = body;
      if (!farm_id || !title2) {
        return createErrorResponse("Farm ID and title required", 400);
      }
      if (!await auth2.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse("Farm not found or access denied", 404);
      }
      if (assigned_to && !await auth2.hasFarmAccess(assigned_to, farm_id)) {
        return createErrorResponse("Assigned user does not have access to this farm", 400);
      }
      const { results, error: insertError } = await env2.DB.prepare(`
        INSERT INTO tasks (farm_id, title, description, status, priority, due_date, assigned_to, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id,
        title2,
        description || null,
        status || "pending",
        priority || "medium",
        due_date || null,
        assigned_to || null,
        user.id
      ).run();
      if (insertError) {
        console.error("Insert error:", insertError);
        return createErrorResponse("Failed to create task", 500);
      }
      const { results: taskResults } = await env2.DB.prepare(`
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.due_date,
          t.created_at,
          t.updated_at,
          fa.name as farm_name,
          assignee.name as assigned_to_name
        FROM tasks t
        JOIN farms fa ON t.farm_id = fa.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE t.rowid = last_insert_rowid()
      `).all();
      const newTask = taskResults[0];
      return createSuccessResponse(newTask);
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error3) {
    console.error("Tasks API error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
var init_tasks = __esm({
  "api/tasks.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest20, "onRequest");
  }
});

// api/tasks-enhanced.js
async function onRequest21(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const auth2 = new AuthUtils(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }
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
      if (taskId) {
        const { results: taskResults, error: error3 } = await env2.DB.prepare(`
          SELECT 
            t.*,
            fa.name as farm_name,
            creator.name as created_by_name,
            assignee.name as assigned_to_name,
            COUNT(DISTINCT tl.id) as time_log_count,
            SUM(tl.total_hours) as total_logged_hours,
            COUNT(DISTINCT tc.id) as comment_count
          FROM tasks t
          JOIN farm_members fm ON t.farm_id = fm.farm_id
          JOIN farms fa ON t.farm_id = fa.id
          LEFT JOIN users creator ON t.created_by = creator.id
          LEFT JOIN users assignee ON t.assigned_to = assignee.id
          LEFT JOIN task_time_logs tl ON t.id = tl.task_id
          LEFT JOIN task_comments tc ON t.id = tc.task_id
          WHERE t.id = ? AND fm.user_id = ?
          GROUP BY t.id
        `).bind(taskId, user.id).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        const task = taskResults[0];
        if (!task) {
          return createErrorResponse("Task not found or access denied", 404);
        }
        if (timeLogs === "true") {
          const { results: timeResults } = await env2.DB.prepare(`
            SELECT 
              tl.*,
              u.name as user_name
            FROM task_time_logs tl
            JOIN users u ON tl.user_id = u.id
            WHERE tl.task_id = ?
            ORDER BY tl.start_time DESC
          `).bind(taskId).all();
          task.time_logs = timeResults;
        }
        if (comments === "true") {
          const { results: commentResults } = await env2.DB.prepare(`
            SELECT 
              tc.*,
              u.name as user_name
            FROM task_comments tc
            JOIN users u ON tc.user_id = u.id
            WHERE tc.task_id = ?
            ORDER BY tc.created_at DESC
          `).bind(taskId).all();
          task.comments = commentResults;
        }
        return createSuccessResponse(task);
      } else if (analytics === "true") {
        let query = `
          SELECT 
            t.*,
            fa.name as farm_name,
            creator.name as created_by_name,
            assignee.name as assigned_to_name,
            COUNT(DISTINCT tl.id) as time_log_count,
            SUM(tl.total_hours) as total_logged_hours,
            CASE 
              WHEN t.status = 'completed' AND t.due_date IS NOT NULL 
                   AND date(t.updated_at) <= date(t.due_date) 
              THEN 1 
              ELSE 0 
            END as on_time_completion,
            CASE 
              WHEN t.status = 'completed' THEN julianday(t.updated_at) - julianday(t.created_at)
              ELSE NULL 
            END as actual_completion_days
          FROM tasks t
          JOIN farm_members fm ON t.farm_id = fm.farm_id
          JOIN farms fa ON t.farm_id = fa.id
          LEFT JOIN users creator ON t.created_by = creator.id
          LEFT JOIN users assignee ON t.assigned_to = assignee.id
          LEFT JOIN task_time_logs tl ON t.id = tl.task_id
          WHERE fm.user_id = ?
        `;
        const params = [user.id];
        if (status) {
          query += " AND t.status = ?";
          params.push(status);
        }
        if (priority) {
          query += " AND t.priority = ?";
          params.push(priority);
        }
        if (category) {
          query += " AND t.task_category = ?";
          params.push(category);
        }
        if (assignedTo) {
          query += " AND t.assigned_to = ?";
          params.push(assignedTo);
        }
        if (dueDateFrom) {
          query += " AND date(t.due_date) >= ?";
          params.push(dueDateFrom);
        }
        if (dueDateTo) {
          query += " AND date(t.due_date) <= ?";
          params.push(dueDateTo);
        }
        query += " GROUP BY t.id ORDER BY t.due_date ASC, t.created_at DESC";
        const { results: tasks, error: error3 } = await env2.DB.prepare(query).bind(...params).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
        }
        return createSuccessResponse(tasks || []);
      } else {
        let query = `
          SELECT 
            t.*,
            fa.name as farm_name,
            creator.name as created_by_name,
            assignee.name as assigned_to_name
          FROM tasks t
          JOIN farm_members fm ON t.farm_id = fm.farm_id
          JOIN farms fa ON t.farm_id = fa.id
          LEFT JOIN users creator ON t.created_by = creator.id
          LEFT JOIN users assignee ON t.assigned_to = assignee.id
          WHERE fm.user_id = ?
        `;
        const params = [user.id];
        if (status) {
          query += " AND t.status = ?";
          params.push(status);
        }
        if (priority) {
          query += " AND t.priority = ?";
          params.push(priority);
        }
        if (category) {
          query += " AND t.task_category = ?";
          params.push(category);
        }
        query += " ORDER BY t.due_date ASC, t.created_at DESC";
        const { results: tasks, error: error3 } = await env2.DB.prepare(query).bind(...params).all();
        if (error3) {
          console.error("Database error:", error3);
          return createErrorResponse("Database error", 500);
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
      if (!await auth2.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse("Farm not found or access denied", 404);
      }
      if (assigned_to && !await auth2.hasFarmAccess(assigned_to, farm_id)) {
        return createErrorResponse("Assigned user does not have access to this farm", 400);
      }
      const { results, error: insertError } = await env2.DB.prepare(`
        INSERT INTO tasks (
          farm_id, title, description, status, priority, due_date, assigned_to,
          created_by, priority_score, estimated_duration, actual_duration,
          dependencies, resource_requirements, task_category, recurring_pattern,
          completion_criteria, progress_percentage, tags, location
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id,
        title2,
        description || null,
        status || "pending",
        priority || "medium",
        due_date || null,
        assigned_to || null,
        user.id,
        priority_score || null,
        estimated_duration || null,
        actual_duration || null,
        dependencies || null,
        resource_requirements || null,
        task_category || null,
        recurring_pattern || null,
        completion_criteria || null,
        progress_percentage || 0,
        tags || null,
        location || null
      ).run();
      if (insertError) {
        console.error("Insert error:", insertError);
        return createErrorResponse("Failed to create task", 500);
      }
      const { results: taskResults } = await env2.DB.prepare(`
        SELECT 
          t.*,
          fa.name as farm_name,
          creator.name as created_by_name,
          assignee.name as assigned_to_name
        FROM tasks t
        JOIN farms fa ON t.farm_id = fa.id
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE t.rowid = last_insert_rowid()
      `).all();
      const newTask = taskResults[0];
      await env2.DB.prepare(`
        INSERT INTO task_collaborators (task_id, user_id, role, invited_by)
        VALUES (?, ?, 'assignee', ?)
      `).bind(newTask.id, user.id, user.id).run();
      return createSuccessResponse(newTask);
    } else if (method === "PUT") {
      const body = await request.json();
      const { id, ...updateData } = body;
      if (!id) {
        return createErrorResponse("Task ID required", 400);
      }
      const { results: existingTasks } = await env2.DB.prepare(`
        SELECT t.farm_id, t.title
        FROM tasks t
        JOIN farm_members fm ON t.farm_id = fm.farm_id
        WHERE t.id = ? AND fm.user_id = ?
      `).bind(id, user.id).all();
      if (existingTasks.length === 0) {
        return createErrorResponse("Task not found or access denied", 404);
      }
      const updateFields = [];
      const updateValues = [];
      const allowedFields = [
        "title",
        "description",
        "status",
        "priority",
        "due_date",
        "assigned_to",
        "priority_score",
        "estimated_duration",
        "actual_duration",
        "dependencies",
        "resource_requirements",
        "task_category",
        "recurring_pattern",
        "completion_criteria",
        "progress_percentage",
        "tags",
        "location"
      ];
      allowedFields.forEach((field) => {
        if (updateData[field] !== void 0) {
          updateFields.push(`${field} = ?`);
          updateValues.push(updateData[field]);
        }
      });
      if (updateFields.length === 0) {
        return createErrorResponse("No fields to update", 400);
      }
      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id);
      const { error: updateError } = await env2.DB.prepare(`
        UPDATE tasks 
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `).bind(...updateValues).run();
      if (updateError) {
        console.error("Update error:", updateError);
        return createErrorResponse("Failed to update task", 500);
      }
      if (updateData.progress_percentage !== void 0) {
        const progress = updateData.progress_percentage;
        if (progress >= 100 && !updateData.status) {
          await env2.DB.prepare(`
            UPDATE tasks 
            SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).bind(id).run();
        }
      }
      const { results: taskResults } = await env2.DB.prepare(`
        SELECT 
          t.*,
          fa.name as farm_name,
          creator.name as created_by_name,
          assignee.name as assigned_to_name
        FROM tasks t
        JOIN farms fa ON t.farm_id = fa.id
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE t.id = ?
      `).bind(id).all();
      return createSuccessResponse(taskResults[0]);
    } else if (method === "DELETE") {
      const taskId = url.searchParams.get("id");
      if (!taskId) {
        return createErrorResponse("Task ID required", 400);
      }
      const { results: existingTasks } = await env2.DB.prepare(`
        SELECT t.farm_id, t.title
        FROM tasks t
        JOIN farm_members fm ON t.farm_id = fm.farm_id
        WHERE t.id = ? AND fm.user_id = ?
      `).bind(taskId, user.id).all();
      if (existingTasks.length === 0) {
        return createErrorResponse("Task not found or access denied", 404);
      }
      const { results: dependencies } = await env2.DB.prepare(`
        SELECT COUNT(*) as dep_count FROM tasks 
        WHERE dependencies LIKE '%' || ? || '%'
      `).bind(taskId).all();
      if (dependencies[0].dep_count > 0) {
        return createErrorResponse(
          "Cannot delete task with dependent tasks. Please update dependencies first.",
          400
        );
      }
      const { error: deleteError } = await env2.DB.prepare(`
        DELETE FROM tasks WHERE id = ?
      `).bind(taskId).run();
      if (deleteError) {
        console.error("Delete error:", deleteError);
        return createErrorResponse("Failed to delete task", 500);
      }
      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error3) {
    console.error("Tasks API error:", error3);
    return createErrorResponse("Internal server error", 500);
  }
}
var init_tasks_enhanced = __esm({
  "api/tasks-enhanced.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(onRequest21, "onRequest");
  }
});

// api/weather-recommendations.js
async function generateRecommendations2(env2, farmId, weatherData) {
  try {
    const recommendations = [];
    const alerts = [];
    const farmQuery = `
      SELECT f.name, f.area_hectares, f.location
      FROM farms f 
      WHERE f.id = ?
    `;
    const { results: farmData } = await env2.DB.prepare(farmQuery).bind(farmId).all();
    const farm = farmData[0];
    for (let i = 0; i < weatherData.time.length; i++) {
      const date = weatherData.time[i];
      const tempMax = weatherData.temperature_2m_max[i];
      const tempMin = weatherData.temperature_2m_min[i];
      const precipitation = weatherData.precipitation_sum[i];
      const windSpeed = weatherData.wind_speed_10m_max[i] || 0;
      const humidity = weatherData.relative_humidity_2m_mean?.[i] || 50;
      if (tempMax > 35) {
        recommendations.push({
          type: "heat_warning",
          severity: "high",
          date,
          title: "Extreme Heat Expected",
          message: `Temperature reaching ${tempMax}\xB0C. Ensure adequate water supply for animals and consider providing shade.`,
          action_items: [
            "Increase water availability",
            "Monitor animal behavior for heat stress",
            "Consider moving animals to shaded areas",
            "Avoid heavy farm work during peak hours"
          ]
        });
      }
      if (tempMin < 0 && tempMax > 5) {
        recommendations.push({
          type: "frost_risk",
          severity: "medium",
          date,
          title: "Frost Risk Alert",
          message: `Freezing temperatures expected (${tempMin}\xB0C). Protect sensitive crops and animals.`,
          action_items: [
            "Cover sensitive plants",
            "Bring animals indoors if possible",
            "Insulate water pipes and tanks",
            "Delay planting frost-sensitive crops"
          ]
        });
      }
      if (precipitation > 25) {
        recommendations.push({
          type: "heavy_rain",
          severity: "medium",
          date,
          title: "Heavy Rain Expected",
          message: `${precipitation}mm rainfall expected. Take precautions against flooding.`,
          action_items: [
            "Check drainage systems",
            "Move equipment to higher ground",
            "Delay field operations",
            "Monitor soil erosion risk"
          ]
        });
      }
      if (precipitation === 0 && windSpeed > 25) {
        recommendations.push({
          type: "fire_risk",
          severity: "medium",
          date,
          title: "High Fire Risk",
          message: `Dry conditions with strong winds (${windSpeed}km/h). Be extra cautious with fire.`,
          action_items: [
            "Postpone controlled burns",
            "Ensure firefighting equipment is ready",
            "Monitor for dry vegetation fires",
            "Avoid welding or other spark-producing activities"
          ]
        });
      }
      if (windSpeed > 45) {
        recommendations.push({
          type: "high_wind",
          severity: "high",
          date,
          title: "Strong Winds Warning",
          message: `Wind speeds reaching ${windSpeed}km/h. Secure equipment and avoid working at heights.`,
          action_items: [
            "Secure loose equipment and tools",
            "Avoid working on roofs or ladders",
            "Check animal shelter integrity",
            "Delay helicopter or drone operations"
          ]
        });
      }
      if (humidity > 85) {
        recommendations.push({
          type: "high_humidity",
          severity: "low",
          date,
          title: "High Humidity Conditions",
          message: `Humidity at ${humidity}%. Watch for fungal disease development.`,
          action_items: [
            "Monitor crops for fungal diseases",
            "Improve ventilation in animal housing",
            "Consider preventive fungicide application",
            "Avoid overhead irrigation"
          ]
        });
      }
      if (precipitation < 5 && tempMax > 15 && tempMax < 30 && windSpeed < 20) {
        recommendations.push({
          type: "optimal_conditions",
          severity: "low",
          date,
          title: "Optimal Farming Conditions",
          message: `Perfect weather for field operations: ${tempMax}\xB0C, light winds, minimal rain.`,
          action_items: [
            "Excellent day for planting",
            "Ideal for crop maintenance",
            "Good for field inspections",
            "Perfect for harvesting dry crops"
          ]
        });
      }
    }
    const existingAlertsQuery = `
      SELECT alert_date, alert_type FROM weather_alerts 
      WHERE farm_id = ? AND alert_date >= date('now')
    `;
    const { results: existingAlerts } = await env2.DB.prepare(existingAlertsQuery).bind(farmId).all();
    const existingKey = new Set(existingAlerts.map((a) => `${a.alert_date}_${a.alert_type}`));
    for (const rec of recommendations) {
      const alertKey = `${rec.date}_${rec.type}`;
      if (!existingKey.has(alertKey)) {
        await env2.DB.prepare(`
          INSERT INTO weather_alerts (
            farm_id, alert_date, alert_type, severity, title, message, 
            action_items, created_at, acknowledged_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), NULL)
        `).bind(
          farmId,
          rec.date,
          rec.type,
          rec.severity,
          rec.title,
          rec.message,
          JSON.stringify(rec.action_items)
        ).run();
      }
    }
    return recommendations;
  } catch (error3) {
    console.error("Failed to generate weather recommendations:", error3);
    throw error3;
  }
}
var init_weather_recommendations = __esm({
  "api/weather-recommendations.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    __name(generateRecommendations2, "generateRecommendations");
  }
});

// api/weather-location.js
async function onRequest22(context2) {
  const { request, env: env2 } = context2;
  const url = new URL(request.url);
  const method = request.method;
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { AuthUtils: AuthUtils2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    const auth2 = new AuthUtils2(env2);
    const user = await auth2.getUserFromToken(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const userId = user.id;
    if (method === "POST") {
      const body = await request.json();
      const { action, farm_id, latitude, longitude, timezone, alert_id } = body;
      switch (action) {
        case "update_farm_location":
          return await updateFarmLocation(env2, userId, farm_id, latitude, longitude, timezone);
        case "acknowledge_alert":
          return await acknowledgeAlert(env2, userId, alert_id);
        default:
          return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
      }
    }
    if (method === "GET") {
      const farmId = url.searchParams.get("farm_id");
      const days = parseInt(url.searchParams.get("days") || "7");
      if (!farmId) {
        return new Response(JSON.stringify({ error: "Farm ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      const accessQuery = `
        SELECT id FROM farm_members
        WHERE farm_id = ? AND user_id = ?
      `;
      const { results: farmAccess } = await env2.DB.prepare(accessQuery).bind(farmId, userId).all();
      if (!farmAccess || farmAccess.length === 0) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }
      const farmQuery = `
        SELECT latitude, longitude, timezone FROM farms WHERE id = ?
      `;
      const { results: farmData } = await env2.DB.prepare(farmQuery).bind(farmId).all();
      if (!farmData || farmData.length === 0) {
        return new Response(JSON.stringify({ error: "Farm not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
      const farm = farmData[0];
      if (!farm.latitude || !farm.longitude) {
        return new Response(JSON.stringify({ error: "Farm location not set" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      return await getWeatherData(env2, farmId, farm.latitude, farm.longitude, farm.timezone, days);
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error3) {
    console.error("Weather location API error:", error3);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
async function updateFarmLocation(env2, userId, farmId, latitude, longitude, timezone) {
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env2.DB.prepare(accessQuery).bind(farmId, userId).all();
  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const updateQuery = `
    UPDATE farms 
    SET latitude = ?, longitude = ?, timezone = ?, updated_at = datetime('now')
    WHERE id = ?
  `;
  const result = await env2.DB.prepare(updateQuery).bind(latitude, longitude, timezone, farmId).run();
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Failed to update farm location" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    await fetchAndStoreWeatherData(env2, farmId, latitude, longitude, timezone);
  } catch (weatherError) {
    console.warn("Failed to fetch initial weather data:", weatherError);
  }
  return new Response(JSON.stringify({
    success: true,
    message: "Farm location updated successfully"
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function acknowledgeAlert(env2, userId, alertId) {
  const accessQuery = `
    SELECT wa.id FROM weather_alerts wa
    JOIN farm_members fm ON wa.farm_id = fm.farm_id
    WHERE wa.id = ? AND fm.user_id = ?
  `;
  const { results: alertAccess } = await env2.DB.prepare(accessQuery).bind(alertId, userId).all();
  if (!alertAccess || alertAccess.length === 0) {
    return new Response(JSON.stringify({ error: "Alert not found or access denied" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  const updateQuery = `
    UPDATE weather_alerts 
    SET acknowledged_at = datetime('now')
    WHERE id = ?
  `;
  const result = await env2.DB.prepare(updateQuery).bind(alertId).run();
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Failed to acknowledge alert" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({
    success: true,
    message: "Alert acknowledged"
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function getWeatherData(env2, farmId, latitude, longitude, timezone, days) {
  const recentDataQuery = `
    SELECT data_date FROM weather_data 
    WHERE farm_id = ? AND data_date >= datetime('now', '-6 hours')
    ORDER BY data_date DESC 
    LIMIT 1
  `;
  const { results: recentData } = await env2.DB.prepare(recentDataQuery).bind(farmId).all();
  let weatherData;
  if (!recentData || recentData.length === 0) {
    weatherData = await fetchAndStoreWeatherData(env2, farmId, latitude, longitude, timezone, days);
  } else {
    const cachedQuery = `
      SELECT data_date, temperature_max, temperature_min, temperature_avg,
             precipitation_sum, relative_humidity_max, relative_humidity_min,
             wind_speed_max, wind_speed_avg, et0_fao_evapotranspiration,
             hourly_data
      FROM weather_data 
      WHERE farm_id = ?
      ORDER BY data_date DESC
      LIMIT ?
    `;
    const { results: cached } = await env2.DB.prepare(cachedQuery).bind(farmId, days).all();
    weatherData = {
      weather: cached.map((day) => ({
        ...day,
        hourly_data: day.hourly_data ? JSON.parse(day.hourly_data) : null,
        weather_description: getWeatherDescription(day.precipitation_sum, day.wind_speed_max || 0)
      }))
    };
  }
  return new Response(JSON.stringify(weatherData), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function fetchAndStoreWeatherData(env2, farmId, latitude, longitude, timezone, days = 7) {
  try {
    const openMeteoUrl = new URL("https://api.open-meteo.com/v1/forecast");
    openMeteoUrl.searchParams.set("latitude", latitude.toString());
    openMeteoUrl.searchParams.set("longitude", longitude.toString());
    openMeteoUrl.searchParams.set("hourly", "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m");
    openMeteoUrl.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,precipitation_hours,snowfall_sum,wind_speed_10m_max,wind_speed_10m_mean,wind_direction_10m_dominant,shortwave_radiation_sum,et0_fao_evapotranspiration,soil_temperature_0_to_7cm_mean");
    openMeteoUrl.searchParams.set("forecast_days", days.toString());
    openMeteoUrl.searchParams.set("timezone", timezone || "auto");
    const response = await fetch(openMeteoUrl.toString());
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }
    const weatherData = await response.json();
    const dailyData = weatherData.daily;
    const hourlyData = weatherData.hourly;
    for (let i = 0; i < dailyData.time.length; i++) {
      const dataDate = dailyData.time[i];
      const insertQuery = `
        INSERT OR REPLACE INTO weather_data (
          farm_id, data_date, temperature_max, temperature_min, temperature_avg,
          precipitation_sum, precipitation_hours, snowfall_sum,
          wind_speed_max, wind_speed_avg, wind_direction_dominant,
          shortwave_radiation_sum, et0_fao_evapotranspiration,
          soil_temperature_0_to_7cm_mean, hourly_data, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `;
      await env2.DB.prepare(insertQuery).bind(
        farmId,
        dataDate,
        dailyData.temperature_2m_max[i],
        dailyData.temperature_2m_min[i],
        dailyData.temperature_2m_mean[i],
        dailyData.precipitation_sum[i],
        dailyData.precipitation_hours[i],
        dailyData.snowfall_sum[i] || 0,
        dailyData.wind_speed_10m_max[i],
        dailyData.wind_speed_10m_mean[i],
        dailyData.wind_direction_10m_dominant[i],
        dailyData.shortwave_radiation_sum[i],
        dailyData.et0_fao_evapotranspiration[i],
        dailyData.soil_temperature_0_to_7cm_mean[i],
        JSON.stringify({
          time: hourlyData.time,
          temperature_2m: hourlyData.temperature_2m,
          relative_humidity_2m: hourlyData.relative_humidity_2m,
          precipitation: hourlyData.precipitation,
          wind_speed_10m: hourlyData.wind_speed_10m
        })
      ).run();
    }
    try {
      await generateRecommendations2(env2, farmId, dailyData);
    } catch (recommendationError) {
      console.warn("Failed to generate recommendations:", recommendationError);
    }
    return {
      weather: dailyData.time.map((date, index) => ({
        data_date: date,
        temperature_max: dailyData.temperature_2m_max[index],
        temperature_min: dailyData.temperature_2m_min[index],
        temperature_avg: dailyData.temperature_2m_mean[index],
        precipitation_sum: dailyData.precipitation_sum[index],
        precipitation_hours: dailyData.precipitation_hours[index],
        wind_speed_max: dailyData.wind_speed_10m_max[index],
        wind_speed_avg: dailyData.wind_speed_10m_mean[index],
        wind_direction_dominant: dailyData.wind_direction_10m_dominant[index],
        relative_humidity_max: dailyData.relative_humidity_2m_max?.[index] || null,
        relative_humidity_min: dailyData.relative_humidity_2m_min?.[index] || null,
        et0_fao_evapotranspiration: dailyData.et0_fao_evapotranspiration[index],
        soil_temperature_0_to_7cm_mean: dailyData.soil_temperature_0_to_7cm_mean[index],
        weather_description: getWeatherDescription(dailyData.precipitation_sum[index], dailyData.wind_speed_10m_max[index])
      }))
    };
  } catch (error3) {
    console.error("Failed to fetch weather data:", error3);
    throw error3;
  }
}
function getWeatherDescription(precipitation, windSpeed) {
  if (precipitation > 10) return "Heavy rain";
  if (precipitation > 5) return "Rain";
  if (precipitation > 0) return "Light rain";
  if (windSpeed > 30) return "Windy";
  return "Clear";
}
var init_weather_location = __esm({
  "api/weather-location.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_weather_recommendations();
    __name(onRequest22, "onRequest");
    __name(updateFarmLocation, "updateFarmLocation");
    __name(acknowledgeAlert, "acknowledgeAlert");
    __name(getWeatherData, "getWeatherData");
    __name(fetchAndStoreWeatherData, "fetchAndStoreWeatherData");
    __name(getWeatherDescription, "getWeatherDescription");
  }
});

// health.js
async function onRequest23(context2) {
  const { env: env2 } = context2;
  try {
    const checks = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      status: "healthy",
      checks: {}
    };
    try {
      const result = await env2.DB.prepare("SELECT 1 as test").run();
      checks.checks.d1_database = result.success ? "healthy" : "unhealthy";
    } catch (error3) {
      checks.checks.d1_database = "unhealthy";
    }
    if (env2.JWT_SECRET && env2.JWT_SECRET !== "your-jwt-secret-change-in-production") {
      checks.checks.jwt_auth = "configured";
    } else {
      checks.checks.jwt_auth = "not_configured";
    }
    if (env2.RATE_LIMIT_KV) {
      try {
        await env2.RATE_LIMIT_KV.put("health_check", "ok", { expirationTtl: 60 });
        checks.checks.kv = "healthy";
      } catch (error3) {
        checks.checks.kv = "unhealthy";
      }
    }
    checks.checks.workers_environment = "healthy";
    const criticalServices = ["d1_database", "jwt_auth"];
    const criticalHealthy = criticalServices.every(
      (service) => checks.checks[service] === "healthy" || checks.checks[service] === "configured"
    );
    const allServicesHealthy = Object.values(checks.checks).every(
      (status) => status === "healthy" || status === "configured"
    );
    checks.status = criticalHealthy ? allServicesHealthy ? "healthy" : "degraded" : "unhealthy";
    return new Response(JSON.stringify(checks, null, 2), {
      headers: { "Content-Type": "application/json" },
      status: checks.status === "unhealthy" ? 503 : checks.status === "degraded" ? 200 : 200
    });
  } catch (error3) {
    return new Response(JSON.stringify({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      status: "unhealthy",
      error: error3.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 503
    });
  }
}
var init_health = __esm({
  "health.js"() {
    init_functionsRoutes_0_8578226713375054();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(onRequest23, "onRequest");
  }
});

// ../.wrangler/tmp/pages-BQatX9/functionsRoutes-0.8578226713375054.mjs
var routes;
var init_functionsRoutes_0_8578226713375054 = __esm({
  "../.wrangler/tmp/pages-BQatX9/functionsRoutes-0.8578226713375054.mjs"() {
    init_login();
    init_signup();
    init_validate();
    init_validate();
    init_irrigation();
    init_pests_diseases();
    init_rotation();
    init_soil_health();
    init_entries();
    init_apply_treatment_cloudflare();
    init_crops();
    init_analytics_engine();
    init_animals();
    init_animals_enhanced();
    init_crops();
    init_crops_main();
    init_farms();
    init_farms_enhanced();
    init_fields();
    init_fields_enhanced();
    init_finance_enhanced();
    init_inventory();
    init_inventory_enhanced();
    init_system_integration();
    init_tasks();
    init_tasks_enhanced();
    init_weather_location();
    init_health();
    routes = [
      {
        routePath: "/api/auth/login",
        mountPath: "/api/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost]
      },
      {
        routePath: "/api/auth/signup",
        mountPath: "/api/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost2]
      },
      {
        routePath: "/api/auth/validate",
        mountPath: "/api/auth",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet]
      },
      {
        routePath: "/api/auth/validate",
        mountPath: "/api/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost3]
      },
      {
        routePath: "/api/crops/irrigation",
        mountPath: "/api/crops",
        method: "",
        middlewares: [],
        modules: [onRequest]
      },
      {
        routePath: "/api/crops/pests-diseases",
        mountPath: "/api/crops",
        method: "",
        middlewares: [],
        modules: [onRequest2]
      },
      {
        routePath: "/api/crops/rotation",
        mountPath: "/api/crops",
        method: "",
        middlewares: [],
        modules: [onRequest3]
      },
      {
        routePath: "/api/crops/soil-health",
        mountPath: "/api/crops",
        method: "",
        middlewares: [],
        modules: [onRequest4]
      },
      {
        routePath: "/api/finance/entries",
        mountPath: "/api/finance",
        method: "",
        middlewares: [],
        modules: [onRequest5]
      },
      {
        routePath: "/api/operations/apply-treatment-cloudflare",
        mountPath: "/api/operations",
        method: "",
        middlewares: [],
        modules: [onRequest6]
      },
      {
        routePath: "/api/crops",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost4]
      },
      {
        routePath: "/api/analytics-engine",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest9]
      },
      {
        routePath: "/api/animals",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest10]
      },
      {
        routePath: "/api/animals-enhanced",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest11]
      },
      {
        routePath: "/api/crops",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest8]
      },
      {
        routePath: "/api/crops-main",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest7]
      },
      {
        routePath: "/api/farms",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest12]
      },
      {
        routePath: "/api/farms-enhanced",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest13]
      },
      {
        routePath: "/api/fields",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest14]
      },
      {
        routePath: "/api/fields-enhanced",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest15]
      },
      {
        routePath: "/api/finance-enhanced",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest16]
      },
      {
        routePath: "/api/inventory",
        mountPath: "/api/inventory",
        method: "",
        middlewares: [],
        modules: [onRequest17]
      },
      {
        routePath: "/api/inventory-enhanced",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest18]
      },
      {
        routePath: "/api/system-integration",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest19]
      },
      {
        routePath: "/api/tasks",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest20]
      },
      {
        routePath: "/api/tasks-enhanced",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest21]
      },
      {
        routePath: "/api/weather-location",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest22]
      },
      {
        routePath: "/health",
        mountPath: "/",
        method: "",
        middlewares: [],
        modules: [onRequest23]
      }
    ];
  }
});

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
init_functionsRoutes_0_8578226713375054();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
init_functionsRoutes_0_8578226713375054();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count3 = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count3--;
          if (count3 === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count3++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count3)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context2 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context2);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error3) {
      if (isFailOpen) {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error3;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};

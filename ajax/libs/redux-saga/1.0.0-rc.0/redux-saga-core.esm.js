import { channel, object, func, iterator, notUndef, array, buffer, pattern, multicast, undef, string, task, promise, stringableFunc, symbol } from '@redux-saga/is';
import { a as kTrue, b as check, c as remove, d as once, e as internalErr, f as none, g as fixed, h as dropping, i as sliding, j as expanding, k as buffers, l as TAKE, m as PUT, n as ALL, o as RACE, p as CALL, q as CPS, r as FORK, s as JOIN, t as CANCEL$1, u as SELECT, v as ACTION_CHANNEL, w as CANCELLED, x as FLUSH, y as GET_CONTEXT, z as SET_CONTEXT, A as effectTypes, B as assignWithSymbols, C as createAllStyleChildCallbacks, D as createEmptyArray, E as makeIterator, F as noop, G as shouldComplete, H as getMetaInfo, I as getLocation, J as flatMap, K as createSetContextWarning, L as asyncIteratorSymbol, M as shouldCancel, N as shouldTerminate, O as logError, P as wrapSagaDispatch, Q as identity } from './chunk-b503a2ff.js';
export { k as buffers, Y as detach } from './chunk-b503a2ff.js';
import { CHANNEL_END_TYPE, MATCH, MULTICAST, SAGA_ACTION, CANCEL, SELF_CANCELLATION, TERMINATE, TASK, TASK_CANCEL, IO } from '@redux-saga/symbols';
export { CANCEL, SAGA_LOCATION } from '@redux-saga/symbols';
import deferred from '@redux-saga/deferred';
import { compose } from 'redux';
import _extends from '@babel/runtime/helpers/esm/extends';
import _objectWithoutPropertiesLoose from '@babel/runtime/helpers/esm/objectWithoutPropertiesLoose';
import '@redux-saga/delay-p';

var queue = [];
/**
  Variable to hold a counting semaphore
  - Incrementing adds a lock and puts the scheduler in a `suspended` state (if it's not
    already suspended)
  - Decrementing releases a lock. Zero locks puts the scheduler in a `released` state. This
    triggers flushing the queued tasks.
**/

var semaphore = 0;
/**
  Executes a task 'atomically'. Tasks scheduled during this execution will be queued
  and flushed after this task has finished (assuming the scheduler endup in a released
  state).
**/

function exec(task$$1) {
  try {
    suspend();
    task$$1();
  } finally {
    release();
  }
}
/**
  Executes or queues a task depending on the state of the scheduler (`suspended` or `released`)
**/


function asap(task$$1) {
  queue.push(task$$1);

  if (!semaphore) {
    suspend();
    flush();
  }
}
/**
 * Puts the scheduler in a `suspended` state and executes a task immediately.
 */

function immediately(task$$1) {
  try {
    suspend();
    return task$$1();
  } finally {
    flush();
  }
}
/**
  Puts the scheduler in a `suspended` state. Scheduled tasks will be queued until the
  scheduler is released.
**/

function suspend() {
  semaphore++;
}
/**
  Puts the scheduler in a `released` state.
**/


function release() {
  semaphore--;
}
/**
  Releases the current lock. Executes all queued tasks if the scheduler is in the released state.
**/


function flush() {
  release();
  var task$$1;

  while (!semaphore && (task$$1 = queue.shift()) !== undefined) {
    exec(task$$1);
  }
}

var array$1 = function array$$1(patterns) {
  return function (input) {
    return patterns.some(function (p) {
      return matcher(p)(input);
    });
  };
};
var predicate = function predicate(_predicate) {
  return function (input) {
    return _predicate(input);
  };
};
var string$1 = function string$$1(pattern$$1) {
  return function (input) {
    return input.type === String(pattern$$1);
  };
};
var symbol$1 = function symbol$$1(pattern$$1) {
  return function (input) {
    return input.type === pattern$$1;
  };
};
var wildcard = function wildcard() {
  return kTrue;
};
function matcher(pattern$$1) {
  // prettier-ignore
  var matcherCreator = pattern$$1 === '*' ? wildcard : string(pattern$$1) ? string$1 : array(pattern$$1) ? array$1 : stringableFunc(pattern$$1) ? string$1 : func(pattern$$1) ? predicate : symbol(pattern$$1) ? symbol$1 : null;

  if (matcherCreator === null) {
    throw new Error("invalid pattern: " + pattern$$1);
  }

  return matcherCreator(pattern$$1);
}

var END = {
  type: CHANNEL_END_TYPE
};
var isEnd = function isEnd(a) {
  return a && a.type === CHANNEL_END_TYPE;
};
var CLOSED_CHANNEL_WITH_TAKERS = 'Cannot have a closed channel with pending takers';
var INVALID_BUFFER = 'invalid buffer passed to channel factory function';
var UNDEFINED_INPUT_ERROR = "Saga or channel was provided with an undefined action\nHints:\n  - check that your Action Creator returns a non-undefined value\n  - if the Saga was started using runSaga, check that your subscribe source provides the action to its listeners";
function channel$1(buffer$$1) {
  if (buffer$$1 === void 0) {
    buffer$$1 = expanding();
  }

  var closed = false;
  var takers = [];

  if (process.env.NODE_ENV !== 'production') {
    check(buffer$$1, buffer, INVALID_BUFFER);
  }

  function checkForbiddenStates() {
    if (closed && takers.length) {
      throw internalErr(CLOSED_CHANNEL_WITH_TAKERS);
    }

    if (takers.length && !buffer$$1.isEmpty()) {
      throw internalErr('Cannot have pending takers with non empty buffer');
    }
  }

  function put(input) {
    if (process.env.NODE_ENV !== 'production') {
      checkForbiddenStates();
      check(input, notUndef, UNDEFINED_INPUT_ERROR);
    }

    if (closed) {
      return;
    }

    if (takers.length === 0) {
      return buffer$$1.put(input);
    }

    var cb = takers.shift();
    cb(input);
  }

  function take(cb) {
    if (process.env.NODE_ENV !== 'production') {
      checkForbiddenStates();
      check(cb, func, "channel.take's callback must be a function");
    }

    if (closed && buffer$$1.isEmpty()) {
      cb(END);
    } else if (!buffer$$1.isEmpty()) {
      cb(buffer$$1.take());
    } else {
      takers.push(cb);

      cb.cancel = function () {
        remove(takers, cb);
      };
    }
  }

  function flush(cb) {
    if (process.env.NODE_ENV !== 'production') {
      checkForbiddenStates();
      check(cb, func, "channel.flush' callback must be a function");
    }

    if (closed && buffer$$1.isEmpty()) {
      cb(END);
      return;
    }

    cb(buffer$$1.flush());
  }

  function close() {
    if (process.env.NODE_ENV !== 'production') {
      checkForbiddenStates();
    }

    if (closed) {
      return;
    }

    closed = true;
    var arr = takers;
    takers = [];

    for (var i = 0, len = arr.length; i < len; i++) {
      var taker = arr[i];
      taker(END);
    }
  }

  return {
    take: take,
    put: put,
    flush: flush,
    close: close
  };
}
function eventChannel(subscribe, buffer$$1) {
  if (buffer$$1 === void 0) {
    buffer$$1 = none();
  }

  var closed = false;
  var unsubscribe;
  var chan = channel$1(buffer$$1);

  var close = function close() {
    if (closed) {
      return;
    }

    closed = true;

    if (func(unsubscribe)) {
      unsubscribe();
    }

    chan.close();
  };

  unsubscribe = subscribe(function (input) {
    if (isEnd(input)) {
      close();
      return;
    }

    chan.put(input);
  });

  if (process.env.NODE_ENV !== 'production') {
    check(unsubscribe, func, 'in eventChannel: subscribe should return a function to unsubscribe');
  }

  unsubscribe = once(unsubscribe);

  if (closed) {
    unsubscribe();
  }

  return {
    take: chan.take,
    flush: chan.flush,
    close: close
  };
}
function multicastChannel() {
  var _ref;

  var closed = false;
  var currentTakers = [];
  var nextTakers = currentTakers;

  function checkForbiddenStates() {
    if (closed && nextTakers.length) {
      throw internalErr(CLOSED_CHANNEL_WITH_TAKERS);
    }
  }

  var ensureCanMutateNextTakers = function ensureCanMutateNextTakers() {
    if (nextTakers !== currentTakers) {
      return;
    }

    nextTakers = currentTakers.slice();
  };

  var close = function close() {
    if (process.env.NODE_ENV !== 'production') {
      checkForbiddenStates();
    }

    closed = true;
    var takers = currentTakers = nextTakers;
    nextTakers = [];
    takers.forEach(function (taker) {
      taker(END);
    });
  };

  return _ref = {}, _ref[MULTICAST] = true, _ref.put = function put(input) {
    if (process.env.NODE_ENV !== 'production') {
      checkForbiddenStates();
      check(input, notUndef, UNDEFINED_INPUT_ERROR);
    }

    if (closed) {
      return;
    }

    if (isEnd(input)) {
      close();
      return;
    }

    var takers = currentTakers = nextTakers;

    for (var i = 0, len = takers.length; i < len; i++) {
      var taker = takers[i];

      if (taker[MATCH](input)) {
        taker.cancel();
        taker(input);
      }
    }
  }, _ref.take = function take(cb, matcher$$1) {
    if (matcher$$1 === void 0) {
      matcher$$1 = wildcard;
    }

    if (process.env.NODE_ENV !== 'production') {
      checkForbiddenStates();
    }

    if (closed) {
      cb(END);
      return;
    }

    cb[MATCH] = matcher$$1;
    ensureCanMutateNextTakers();
    nextTakers.push(cb);
    cb.cancel = once(function () {
      ensureCanMutateNextTakers();
      remove(nextTakers, cb);
    });
  }, _ref.close = close, _ref;
}
function stdChannel() {
  var chan = multicastChannel();
  var put = chan.put;

  chan.put = function (input) {
    if (input[SAGA_ACTION]) {
      put(input);
      return;
    }

    asap(function () {
      put(input);
    });
  };

  return chan;
}

var RUNNING = 0;
var CANCELLED$1 = 1;
var ABORTED = 2;
var DONE = 3;

function resolvePromise(promise$$1, cb) {
  var cancelPromise = promise$$1[CANCEL];

  if (func(cancelPromise)) {
    cb.cancel = cancelPromise;
  }

  promise$$1.then(cb, function (error) {
    cb(error, true);
  });
}

var current = 0;
var nextEffectId = (function () {
  return ++current;
});

var _effectRunnerMap;

function getIteratorMetaInfo(iterator$$1, fn) {
  if (iterator$$1.isSagaIterator) {
    return {
      name: iterator$$1.meta.name
    };
  }

  return getMetaInfo(fn);
}

function createTaskIterator(_ref) {
  var context = _ref.context,
      fn = _ref.fn,
      args = _ref.args;

  // catch synchronous failures; see #152 and #441
  try {
    var result = fn.apply(context, args); // i.e. a generator function returns an iterator

    if (iterator(result)) {
      return result;
    }

    var next = function next(value) {
      if (value === void 0) {
        value = result;
      }

      return {
        value: value,
        done: !promise(value)
      };
    };

    return makeIterator(next);
  } catch (err) {
    // do not bubble up synchronous failures for detached forks
    // instead create a failed task. See #152 and #441
    return makeIterator(function () {
      throw err;
    });
  }
}

function runPutEffect(env, _ref2, cb) {
  var channel$$1 = _ref2.channel,
      action = _ref2.action,
      resolve = _ref2.resolve;

  /**
   Schedule the put in case another saga is holding a lock.
   The put will be executed atomically. ie nested puts will execute after
   this put has terminated.
   **/
  asap(function () {
    var result;

    try {
      result = (channel$$1 ? channel$$1.put : env.dispatch)(action);
    } catch (error) {
      cb(error, true);
      return;
    }

    if (resolve && promise(result)) {
      resolvePromise(result, cb);
    } else {
      cb(result);
    }
  }); // Put effects are non cancellables
}

function runTakeEffect(env, _ref3, cb) {
  var _ref3$channel = _ref3.channel,
      channel$$1 = _ref3$channel === void 0 ? env.channel : _ref3$channel,
      pattern$$1 = _ref3.pattern,
      maybe = _ref3.maybe;

  var takeCb = function takeCb(input) {
    if (input instanceof Error) {
      cb(input, true);
      return;
    }

    if (isEnd(input) && !maybe) {
      cb(TERMINATE);
      return;
    }

    cb(input);
  };

  try {
    channel$$1.take(takeCb, notUndef(pattern$$1) ? matcher(pattern$$1) : null);
  } catch (err) {
    cb(err, true);
    return;
  }

  cb.cancel = takeCb.cancel;
}

function runCallEffect(env, _ref4, cb, _ref5) {
  var context = _ref4.context,
      fn = _ref4.fn,
      args = _ref4.args;
  var task$$1 = _ref5.task;

  // catch synchronous failures; see #152
  try {
    var result = fn.apply(context, args);

    if (promise(result)) {
      resolvePromise(result, cb);
      return;
    }

    if (iterator(result)) {
      // resolve iterator
      proc(env, result, task$$1.context, current, getMetaInfo(fn),
      /* isRoot */
      false, cb);
      return;
    }

    cb(result);
  } catch (error) {
    cb(error, true);
  }
}

function runCPSEffect(env, _ref6, cb) {
  var context = _ref6.context,
      fn = _ref6.fn,
      args = _ref6.args;

  // CPS (ie node style functions) can define their own cancellation logic
  // by setting cancel field on the cb
  // catch synchronous failures; see #152
  try {
    var cpsCb = function cpsCb(err, res) {
      if (undef(err)) {
        cb(res);
      } else {
        cb(err, true);
      }
    };

    fn.apply(context, args.concat(cpsCb));

    if (cpsCb.cancel) {
      cb.cancel = cpsCb.cancel;
    }
  } catch (error) {
    cb(error, true);
  }
}

function runForkEffect(env, _ref7, cb, _ref8) {
  var context = _ref7.context,
      fn = _ref7.fn,
      args = _ref7.args,
      detached = _ref7.detached;
  var parent = _ref8.task;
  var taskIterator = createTaskIterator({
    context: context,
    fn: fn,
    args: args
  });
  var meta = getIteratorMetaInfo(taskIterator, fn);
  immediately(function () {
    var child = proc(env, taskIterator, parent.context, current, meta, detached, noop);

    if (detached) {
      cb(child);
    } else {
      if (child.isRunning()) {
        parent.queue.addTask(child);
        cb(child);
      } else if (child.isAborted()) {
        parent.queue.abort(child.error());
      } else {
        cb(child);
      }
    }
  }); // Fork effects are non cancellables
}

function runJoinEffect(env, taskOrTasks, cb, _ref9) {
  var task$$1 = _ref9.task;

  var joinSingleTask = function joinSingleTask(taskToJoin, cb) {
    if (taskToJoin.isRunning()) {
      var joiner = {
        task: task$$1,
        cb: cb
      };

      cb.cancel = function () {
        remove(taskToJoin.joiners, joiner);
      };

      taskToJoin.joiners.push(joiner);
    } else {
      if (taskToJoin.isAborted()) {
        cb(taskToJoin.error(), true);
      } else {
        cb(taskToJoin.result());
      }
    }
  };

  if (array(taskOrTasks)) {
    if (taskOrTasks.length === 0) {
      cb([]);
      return;
    }

    var childCallbacks = createAllStyleChildCallbacks(taskOrTasks, cb);
    taskOrTasks.forEach(function (t, i) {
      joinSingleTask(t, childCallbacks[i]);
    });
  } else {
    joinSingleTask(taskOrTasks, cb);
  }
}

function cancelSingleTask(taskToCancel) {
  if (taskToCancel.isRunning()) {
    taskToCancel.cancel();
  }
}

function runCancelEffect(env, taskOrTasks, cb, _ref10) {
  var task$$1 = _ref10.task;

  if (taskOrTasks === SELF_CANCELLATION) {
    cancelSingleTask(task$$1);
  } else if (array(taskOrTasks)) {
    taskOrTasks.forEach(cancelSingleTask);
  } else {
    cancelSingleTask(taskOrTasks);
  }

  cb(); // cancel effects are non cancellables
}

function runAllEffect(env, effects, cb, _ref11) {
  var digestEffect = _ref11.digestEffect;
  var effectId = current;
  var keys = Object.keys(effects);

  if (keys.length === 0) {
    cb(array(effects) ? [] : {});
    return;
  }

  var childCallbacks = createAllStyleChildCallbacks(effects, cb);
  keys.forEach(function (key) {
    digestEffect(effects[key], effectId, childCallbacks[key], key);
  });
}

function runRaceEffect(env, effects, cb, _ref12) {
  var digestEffect = _ref12.digestEffect;
  var effectId = current;
  var keys = Object.keys(effects);
  var response = array(effects) ? createEmptyArray(keys.length) : {};
  var childCbs = {};
  var completed = false;
  keys.forEach(function (key) {
    var chCbAtKey = function chCbAtKey(res, isErr) {
      if (completed) {
        return;
      }

      if (isErr || shouldComplete(res)) {
        // Race Auto cancellation
        cb.cancel();
        cb(res, isErr);
      } else {
        cb.cancel();
        completed = true;
        response[key] = res;
        cb(response);
      }
    };

    chCbAtKey.cancel = noop;
    childCbs[key] = chCbAtKey;
  });

  cb.cancel = function () {
    // prevents unnecessary cancellation
    if (!completed) {
      completed = true;
      keys.forEach(function (key) {
        return childCbs[key].cancel();
      });
    }
  };

  keys.forEach(function (key) {
    if (completed) {
      return;
    }

    digestEffect(effects[key], effectId, childCbs[key], key);
  });
}

function runSelectEffect(env, _ref13, cb) {
  var selector = _ref13.selector,
      args = _ref13.args;

  try {
    var state = selector.apply(void 0, [env.getState()].concat(args));
    cb(state);
  } catch (error) {
    cb(error, true);
  }
}

function runChannelEffect(env, _ref14, cb) {
  var pattern$$1 = _ref14.pattern,
      buffer$$1 = _ref14.buffer;
  var chan = channel$1(buffer$$1);
  var match = matcher(pattern$$1);

  var taker = function taker(action) {
    if (!isEnd(action)) {
      env.channel.take(taker, match);
    }

    chan.put(action);
  };

  var close = chan.close;

  chan.close = function () {
    taker.cancel();
    close();
  };

  env.channel.take(taker, match);
  cb(chan);
}

function runCancelledEffect(env, data, cb, _ref15) {
  var task$$1 = _ref15.task;
  cb(task$$1.isCancelled());
}

function runFlushEffect(env, channel$$1, cb) {
  channel$$1.flush(cb);
}

function runGetContextEffect(env, prop, cb, _ref16) {
  var task$$1 = _ref16.task;
  cb(task$$1.context[prop]);
}

function runSetContextEffect(env, props, cb, _ref17) {
  var task$$1 = _ref17.task;
  assignWithSymbols(task$$1.context, props);
  cb();
}

var effectRunnerMap = (_effectRunnerMap = {}, _effectRunnerMap[TAKE] = runTakeEffect, _effectRunnerMap[PUT] = runPutEffect, _effectRunnerMap[ALL] = runAllEffect, _effectRunnerMap[RACE] = runRaceEffect, _effectRunnerMap[CALL] = runCallEffect, _effectRunnerMap[CPS] = runCPSEffect, _effectRunnerMap[FORK] = runForkEffect, _effectRunnerMap[JOIN] = runJoinEffect, _effectRunnerMap[CANCEL$1] = runCancelEffect, _effectRunnerMap[SELECT] = runSelectEffect, _effectRunnerMap[ACTION_CHANNEL] = runChannelEffect, _effectRunnerMap[CANCELLED] = runCancelledEffect, _effectRunnerMap[FLUSH] = runFlushEffect, _effectRunnerMap[GET_CONTEXT] = runGetContextEffect, _effectRunnerMap[SET_CONTEXT] = runSetContextEffect, _effectRunnerMap);

/**
 Used to track a parent task and its forks
 In the fork model, forked tasks are attached by default to their parent
 We model this using the concept of Parent task && main Task
 main task is the main flow of the current Generator, the parent tasks is the
 aggregation of the main tasks + all its forked tasks.
 Thus the whole model represents an execution tree with multiple branches (vs the
 linear execution tree in sequential (non parallel) programming)

 A parent tasks has the following semantics
 - It completes if all its forks either complete or all cancelled
 - If it's cancelled, all forks are cancelled as well
 - It aborts if any uncaught error bubbles up from forks
 - If it completes, the return value is the one returned by the main task
 **/

function forkQueue(mainTask, onAbort, cont) {
  var tasks = [];
  var result;
  var completed = false;
  addTask(mainTask);

  var getTasks = function getTasks() {
    return tasks;
  };

  function abort(err) {
    onAbort();
    cancelAll();
    cont(err, true);
  }

  function addTask(task$$1) {
    tasks.push(task$$1);

    task$$1.cont = function (res, isErr) {
      if (completed) {
        return;
      }

      remove(tasks, task$$1);
      task$$1.cont = noop;

      if (isErr) {
        abort(res);
      } else {
        if (task$$1 === mainTask) {
          result = res;
        }

        if (!tasks.length) {
          completed = true;
          cont(result);
        }
      }
    };
  }

  function cancelAll() {
    if (completed) {
      return;
    }

    completed = true;
    tasks.forEach(function (t) {
      t.cont = noop;
      t.cancel();
    });
    tasks = [];
  }

  return {
    addTask: addTask,
    cancelAll: cancelAll,
    abort: abort,
    getTasks: getTasks
  };
}

// there can be only a single saga error created at any given moment

function formatLocation(fileName, lineNumber) {
  return fileName + "?" + lineNumber;
}

function effectLocationAsString(effect) {
  var location = getLocation(effect);

  if (location) {
    var code = location.code,
        fileName = location.fileName,
        lineNumber = location.lineNumber;
    var source = code + "  " + formatLocation(fileName, lineNumber);
    return source;
  }

  return '';
}

function sagaLocationAsString(sagaMeta) {
  var name = sagaMeta.name,
      location = sagaMeta.location;

  if (location) {
    return name + "  " + formatLocation(location.fileName, location.lineNumber);
  }

  return name;
}

function cancelledTasksAsString(sagaStack) {
  var cancelledTasks = flatMap(function (i) {
    return i.cancelledTasks;
  }, sagaStack);

  if (!cancelledTasks.length) {
    return '';
  }

  return ['Tasks cancelled due to error:'].concat(cancelledTasks).join('\n');
}

var crashedEffect = null;
var sagaStack = [];
var addSagaFrame = function addSagaFrame(frame) {
  frame.crashedEffect = crashedEffect;
  sagaStack.push(frame);
};
var clear = function clear() {
  crashedEffect = null;
  sagaStack.length = 0;
}; // this sets crashed effect for the soon-to-be-reported saga frame
// this slightly streatches the singleton nature of this module into wrong direction
// as it's even less obvious what's the data flow here, but it is what it is for now

var setCrashedEffect = function setCrashedEffect(effect) {
  crashedEffect = effect;
};
/**
  @returns {string}

  @example
  The above error occurred in task errorInPutSaga {pathToFile}
  when executing effect put({type: 'REDUCER_ACTION_ERROR_IN_PUT'}) {pathToFile}
      created by fetchSaga {pathToFile}
      created by rootSaga {pathToFile}
*/

var toString = function toString() {
  var firstSaga = sagaStack[0],
      otherSagas = sagaStack.slice(1);
  var crashedEffectLocation = firstSaga.crashedEffect ? effectLocationAsString(firstSaga.crashedEffect) : null;
  var errorMessage = "The above error occurred in task " + sagaLocationAsString(firstSaga.meta) + (crashedEffectLocation ? " \n when executing effect " + crashedEffectLocation : '');
  return [errorMessage].concat(otherSagas.map(function (s) {
    return "    created by " + sagaLocationAsString(s.meta);
  }), [cancelledTasksAsString(sagaStack)]).join('\n');
};

function newTask(env, mainTask, parentContext, parentEffectId, meta, isRoot, cont) {
  var _task;

  var status = RUNNING;
  var taskResult;
  var taskError;
  var deferredEnd = null;
  var cancelledDueToErrorTasks = [];
  var context = Object.create(parentContext);
  var queue = forkQueue(mainTask, function onAbort() {
    cancelledDueToErrorTasks.push.apply(cancelledDueToErrorTasks, queue.getTasks().map(function (t) {
      return t.meta.name;
    }));
  }, end);
  /**
   This may be called by a parent generator to trigger/propagate cancellation
   cancel all pending tasks (including the main task), then end the current task.
    Cancellation propagates down to the whole execution tree held by this Parent task
   It's also propagated to all joiners of this task and their execution tree/joiners
    Cancellation is noop for terminated/Cancelled tasks tasks
   **/

  function cancel() {
    if (status === RUNNING) {
      // Setting status to CANCELLED does not necessarily mean that the task/iterators are stopped
      // effects in the iterator's finally block will still be executed
      status = CANCELLED$1;
      queue.cancelAll(); // Ending with a TASK_CANCEL will propagate the Cancellation to all joiners

      end(TASK_CANCEL, false);
    }
  }

  function end(result, isErr) {
    if (!isErr) {
      // The status here may be RUNNING or CANCELLED
      // If the status is CANCELLED, then we do not need to change it here
      if (result === TASK_CANCEL) {
        status = CANCELLED$1;
      } else if (status !== CANCELLED$1) {
        status = DONE;
      }

      taskResult = result;
      deferredEnd && deferredEnd.resolve(result);
    } else {
      status = ABORTED;
      addSagaFrame({
        meta: meta,
        cancelledTasks: cancelledDueToErrorTasks
      });

      if (task$$1.isRoot) {
        var sagaStack = toString(); // we've dumped the saga stack to string and are passing it to user's code
        // we know that it won't be needed anymore and we need to clear it

        clear();
        env.onError(result, {
          sagaStack: sagaStack
        });
      }

      taskError = result;
      deferredEnd && deferredEnd.reject(result);
    }

    task$$1.cont(result, isErr);
    task$$1.joiners.forEach(function (joiner) {
      joiner.cb(result, isErr);
    });
    task$$1.joiners = null;
  }

  function setContext(props) {
    if (process.env.NODE_ENV !== 'production') {
      check(props, object, createSetContextWarning('task', props));
    }

    assignWithSymbols(context, props);
  }

  function toPromise() {
    if (deferredEnd) {
      return deferredEnd.promise;
    }

    deferredEnd = deferred();

    if (status === ABORTED) {
      deferredEnd.reject(taskError);
    } else if (status !== RUNNING) {
      deferredEnd.resolve(taskResult);
    }

    return deferredEnd.promise;
  }

  var task$$1 = (_task = {}, _task[TASK] = true, _task.id = parentEffectId, _task.meta = meta, _task.isRoot = isRoot, _task.context = context, _task.joiners = [], _task.queue = queue, _task.cancel = cancel, _task.cont = cont, _task.end = end, _task.setContext = setContext, _task.toPromise = toPromise, _task.isRunning = function isRunning() {
    return status === RUNNING;
  }, _task.isCancelled = function isCancelled() {
    return status === CANCELLED$1 || status === RUNNING && mainTask.status === CANCELLED$1;
  }, _task.isAborted = function isAborted() {
    return status === ABORTED;
  }, _task.result = function result() {
    return taskResult;
  }, _task.error = function error() {
    return taskError;
  }, _task);
  return task$$1;
}

function proc(env, iterator$$1, parentContext, parentEffectId, meta, isRoot, cont) {
  if (process.env.NODE_ENV !== 'production' && iterator$$1[asyncIteratorSymbol]) {
    throw new Error("redux-saga doesn't support async generators, please use only regular ones");
  }

  var finalRunEffect = env.finalizeRunEffect(runEffect);
  /**
    Tracks the current effect cancellation
    Each time the generator progresses. calling runEffect will set a new value
    on it. It allows propagating cancellation to child effects
  **/

  next.cancel = noop;
  /** Creates a main task to track the main flow */

  var mainTask = {
    meta: meta,
    cancel: cancelMain,
    status: RUNNING
    /**
     Creates a new task descriptor for this generator.
     A task is the aggregation of it's mainTask and all it's forked tasks.
     **/

  };
  var task$$1 = newTask(env, mainTask, parentContext, parentEffectId, meta, isRoot, cont);
  var executingContext = {
    task: task$$1,
    digestEffect: digestEffect
    /**
      cancellation of the main task. We'll simply resume the Generator with a TASK_CANCEL
    **/

  };

  function cancelMain() {
    if (mainTask.status === RUNNING) {
      mainTask.status = CANCELLED$1;
      next(TASK_CANCEL);
    }
  }
  /**
    attaches cancellation logic to this task's continuation
    this will permit cancellation to propagate down the call chain
  **/


  cont.cancel = task$$1.cancel; // kicks up the generator

  next(); // then return the task descriptor to the caller

  return task$$1;
  /**
   * This is the generator driver
   * It's a recursive async/continuation function which calls itself
   * until the generator terminates or throws
   * @param {internal commands(TASK_CANCEL | TERMINATE) | any} arg - value, generator will be resumed with.
   * @param {boolean} isErr - the flag shows if effect finished with an error
   *
   * receives either (command | effect result, false) or (any thrown thing, true)
   */

  function next(arg, isErr) {
    try {
      var result;

      if (isErr) {
        result = iterator$$1.throw(arg); // user handled the error, we can clear bookkept values

        clear();
      } else if (shouldCancel(arg)) {
        /**
          getting TASK_CANCEL automatically cancels the main task
          We can get this value here
           - By cancelling the parent task manually
          - By joining a Cancelled task
        **/
        mainTask.status = CANCELLED$1;
        /**
          Cancels the current effect; this will propagate the cancellation down to any called tasks
        **/

        next.cancel();
        /**
          If this Generator has a `return` method then invokes it
          This will jump to the finally block
        **/

        result = func(iterator$$1.return) ? iterator$$1.return(TASK_CANCEL) : {
          done: true,
          value: TASK_CANCEL
        };
      } else if (shouldTerminate(arg)) {
        // We get TERMINATE flag, i.e. by taking from a channel that ended using `take` (and not `takem` used to trap End of channels)
        result = func(iterator$$1.return) ? iterator$$1.return() : {
          done: true
        };
      } else {
        result = iterator$$1.next(arg);
      }

      if (!result.done) {
        digestEffect(result.value, parentEffectId, next);
      } else {
        /**
          This Generator has ended, terminate the main task and notify the fork queue
        **/
        if (mainTask.status !== CANCELLED$1) {
          mainTask.status = DONE;
        }

        mainTask.cont(result.value);
      }
    } catch (error) {
      if (mainTask.status === CANCELLED$1) {
        throw error;
      }

      mainTask.status = ABORTED;
      mainTask.cont(error, true);
    }
  }

  function runEffect(effect, effectId, currCb) {
    /**
      each effect runner must attach its own logic of cancellation to the provided callback
      it allows this generator to propagate cancellation downward.
       ATTENTION! effect runners must setup the cancel logic by setting cb.cancel = [cancelMethod]
      And the setup must occur before calling the callback
       This is a sort of inversion of control: called async functions are responsible
      of completing the flow by calling the provided continuation; while caller functions
      are responsible for aborting the current flow by calling the attached cancel function
       Library users can attach their own cancellation logic to promises by defining a
      promise[CANCEL] method in their returned promises
      ATTENTION! calling cancel must have no effect on an already completed or cancelled effect
    **/
    if (promise(effect)) {
      resolvePromise(effect, currCb);
    } else if (iterator(effect)) {
      // resolve iterator
      proc(env, effect, task$$1.context, effectId, meta,
      /* isRoot */
      false, currCb);
    } else if (effect && effect[IO]) {
      var effectRunner = effectRunnerMap[effect.type];
      effectRunner(env, effect.payload, currCb, executingContext);
    } else {
      // anything else returned as is
      currCb(effect);
    }
  }

  function digestEffect(effect, parentEffectId, cb, label) {
    if (label === void 0) {
      label = '';
    }

    var effectId = nextEffectId();
    env.sagaMonitor && env.sagaMonitor.effectTriggered({
      effectId: effectId,
      parentEffectId: parentEffectId,
      label: label,
      effect: effect
    });
    /**
      completion callback and cancel callback are mutually exclusive
      We can't cancel an already completed effect
      And We can't complete an already cancelled effectId
    **/

    var effectSettled; // Completion callback passed to the appropriate effect runner

    function currCb(res, isErr) {
      if (effectSettled) {
        return;
      }

      effectSettled = true;
      cb.cancel = noop; // defensive measure

      if (env.sagaMonitor) {
        if (isErr) {
          env.sagaMonitor.effectRejected(effectId, res);
        } else {
          env.sagaMonitor.effectResolved(effectId, res);
        }
      }

      if (isErr) {
        setCrashedEffect(effect);
      }

      cb(res, isErr);
    } // tracks down the current cancel


    currCb.cancel = noop; // setup cancellation logic on the parent cb

    cb.cancel = function () {
      // prevents cancelling an already completed effect
      if (effectSettled) {
        return;
      }

      effectSettled = true;
      currCb.cancel(); // propagates cancel downward

      currCb.cancel = noop; // defensive measure

      env.sagaMonitor && env.sagaMonitor.effectCancelled(effectId);
    };

    finalRunEffect(effect, effectId, currCb);
  }
}

var RUN_SAGA_SIGNATURE = 'runSaga(options, saga, ...args)';
var NON_GENERATOR_ERR = RUN_SAGA_SIGNATURE + ": saga argument must be a Generator function!";
function runSaga(_ref, saga) {
  var _ref$channel = _ref.channel,
      channel$$1 = _ref$channel === void 0 ? stdChannel() : _ref$channel,
      dispatch = _ref.dispatch,
      getState = _ref.getState,
      _ref$context = _ref.context,
      context = _ref$context === void 0 ? {} : _ref$context,
      sagaMonitor = _ref.sagaMonitor,
      effectMiddlewares = _ref.effectMiddlewares,
      _ref$onError = _ref.onError,
      onError = _ref$onError === void 0 ? logError : _ref$onError;

  for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  if (process.env.NODE_ENV !== 'production') {
    check(saga, func, NON_GENERATOR_ERR);
  }

  var iterator$$1 = saga.apply(void 0, args);

  if (process.env.NODE_ENV !== 'production') {
    check(iterator$$1, iterator, NON_GENERATOR_ERR);
  }

  var effectId = nextEffectId();

  if (sagaMonitor) {
    // monitors are expected to have a certain interface, let's fill-in any missing ones
    sagaMonitor.rootSagaStarted = sagaMonitor.rootSagaStarted || noop;
    sagaMonitor.effectTriggered = sagaMonitor.effectTriggered || noop;
    sagaMonitor.effectResolved = sagaMonitor.effectResolved || noop;
    sagaMonitor.effectRejected = sagaMonitor.effectRejected || noop;
    sagaMonitor.effectCancelled = sagaMonitor.effectCancelled || noop;
    sagaMonitor.actionDispatched = sagaMonitor.actionDispatched || noop;
    sagaMonitor.rootSagaStarted({
      effectId: effectId,
      saga: saga,
      args: args
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    if (notUndef(dispatch)) {
      check(dispatch, func, 'dispatch must be a function');
    }

    if (notUndef(getState)) {
      check(getState, func, 'getState must be a function');
    }

    if (notUndef(effectMiddlewares)) {
      var MIDDLEWARE_TYPE_ERROR = 'effectMiddlewares must be an array of functions';
      check(effectMiddlewares, array, MIDDLEWARE_TYPE_ERROR);
      effectMiddlewares.forEach(function (effectMiddleware) {
        return check(effectMiddleware, func, MIDDLEWARE_TYPE_ERROR);
      });
    }

    check(onError, func, 'onError passed to the redux-saga is not a function!');
  }

  var finalizeRunEffect;

  if (effectMiddlewares) {
    var middleware = compose.apply(void 0, effectMiddlewares);

    finalizeRunEffect = function finalizeRunEffect(runEffect) {
      return function (effect, effectId, currCb) {
        var plainRunEffect = function plainRunEffect(eff) {
          return runEffect(eff, effectId, currCb);
        };

        return middleware(plainRunEffect)(effect);
      };
    };
  } else {
    finalizeRunEffect = identity;
  }

  var env = {
    channel: channel$$1,
    dispatch: wrapSagaDispatch(dispatch),
    getState: getState,
    sagaMonitor: sagaMonitor,
    onError: onError,
    finalizeRunEffect: finalizeRunEffect
  };
  return immediately(function () {
    var task$$1 = proc(env, iterator$$1, context, effectId, getMetaInfo(saga),
    /* isRoot */
    true, noop);

    if (sagaMonitor) {
      sagaMonitor.effectResolved(effectId, task$$1);
    }

    return task$$1;
  });
}

function sagaMiddlewareFactory(_ref) {
  if (_ref === void 0) {
    _ref = {};
  }

  var _ref2 = _ref,
      _ref2$context = _ref2.context,
      context = _ref2$context === void 0 ? {} : _ref2$context,
      _ref2$channel = _ref2.channel,
      channel$$1 = _ref2$channel === void 0 ? stdChannel() : _ref2$channel,
      sagaMonitor = _ref2.sagaMonitor,
      options = _objectWithoutPropertiesLoose(_ref2, ["context", "channel", "sagaMonitor"]);

  var boundRunSaga;

  if (process.env.NODE_ENV !== 'production') {
    check(channel$$1, channel, 'options.channel passed to the Saga middleware is not a channel');
  }

  function sagaMiddleware(_ref3) {
    var getState = _ref3.getState,
        dispatch = _ref3.dispatch;
    boundRunSaga = runSaga.bind(null, _extends({}, options, {
      context: context,
      channel: channel$$1,
      dispatch: dispatch,
      getState: getState,
      sagaMonitor: sagaMonitor
    }));
    return function (next) {
      return function (action) {
        if (sagaMonitor && sagaMonitor.actionDispatched) {
          sagaMonitor.actionDispatched(action);
        }

        var result = next(action); // hit reducers

        channel$$1.put(action);
        return result;
      };
    };
  }

  sagaMiddleware.run = function () {
    if (process.env.NODE_ENV !== 'production' && !boundRunSaga) {
      throw new Error('Before running a Saga, you must mount the Saga middleware on the Store using applyMiddleware');
    }

    return boundRunSaga.apply(void 0, arguments);
  };

  sagaMiddleware.setContext = function (props) {
    if (process.env.NODE_ENV !== 'production') {
      check(props, object, createSetContextWarning('sagaMiddleware', props));
    }

    assignWithSymbols(context, props);
  };

  return sagaMiddleware;
}

export default sagaMiddlewareFactory;
export { runSaga, END, isEnd, eventChannel, channel$1 as channel, multicastChannel, stdChannel };

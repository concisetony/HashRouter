/**
 * Provides the Router Class based on hashchange,
 * which also works on IE6.
 *
 * @module hashrouter 
 * @author Liu Xiaolong (ConciseTony@gmail.com)
 * @version 1.1
 *
 * @requires jQuery 1.*
 */
(function($){

  var proto, $win = $(window),
      OBJECT_STRING = '[object Object]',
      EXCEPTION_INVALID_PARAM = 'invalid param given @method {{methodName}}!';

  function isObject(arg) {
    return Object.prototype.toString.call(arg) === OBJECT_STRING;
  }

  function validRouteRule(reg) {
    return ((typeof reg === 'string') || (reg instanceof RegExp));
  }

  /**
   * HashRouter is a Class designed to handle browser side page
   * navigation based on location.hash (just like Gmail). HashRouter
   * can work well on IE6.
   *
   * @class HashRouter
   * @constructor
   */
  function HashRouter() {
    this.initialize.apply(this, arguments);
  }

  /**
   * alias of HashRouter.prototype.
   */
  proto = HashRouter.prototype;

  /**
   * 标识当前instance是否已经启动监视hashchange。
   *
   * @property started
   * @type Boolean
   * @default false
   */
  proto.started = false;

  /**
   * initialize method of HashRouter Class.
   *
   * @method initialize
   * @param {Object} [options] initialize options.
   *   @param {Boolean} [options.autoStart=true] indicating
   *   @param {Function} [options.notFound] called when hashchange
   *   and the new hash does not match any route rule.
   *   whether to start monitoring hashchange event automatically.
   *   @param {Array} [options.routers] routers setting.
   *   Each item should contains:
   *    reg {String|RegExp} for match rule.
   *    handler {Function} for handling matches.
   *    [before] {Function}, which will be called with
   *    match params before calling handler.
   *    [after] {Function}, which will be called with
   *    match params after calling handler.
   */
  proto.initialize = function(options) {
    var onChange;
    options = options || {};
    options.autoStart = (undefined === options.autoStart) ? true :
        options.autoStart;
    this.options = options;
    this.routers = options.routers || [];
    this.notFound = options.notFound || null;
    // 不支持hashchange的浏览器特殊处理，且每个页面周期只处理一次
    if (!('onhashchange' in window) && !HashRouter._intervalId) {
      HashRouter._curHash = location.hash;
      HashRouter._intervalId = setInterval(function(){
        if (HashRouter._curHash !== location.hash) {
          HashRouter._curHash = location.hash;
          $win.trigger('hashchange');
        }
      }, 1000);
    }

    onChange = this.route = $.proxy(this.route, this);
    this.onChange = function(){
      onChange();
    };

    if (options.autoStart) {
      $win.on('hashchange', this.onChange);
      this.started = true;
      this.route();
    }
  };

  /**
   * Add a route at running time.
   *
   * @method addRoute
   * @param mix*  多种入参方式:
   *    1. addRoute(reg, handler)
   *    2. addRoute(reg, options)
   *    3. addRoute(options)
   *    其中, options可以包含:
   *      options.handler {Function}
   *      options.before {Function}
   *      options.after {Function}
   *      options.reg {String|RegExp} (第三种入参情况)
   */
  proto.addRoute = function() {
    var route;
    if (0 === arguments.length) {
      return;
    }
    if (1 === arguments.length && isObject(arguments[0])) {
      route = arguments[0];
      if (!validRouteRule(route.reg) || (typeof route.handler !== 'function')) {
        throw(EXCEPTION_INVALID_PARAM.replace('{{methodName}}', 'addRoute'));
        return;
      }
    } else if (2 === arguments.length) {
      if (!validRouteRule(arguments[0]) || ((typeof arguments[1] !== 'function')
          && (!isObject(arguments[1]) || (isObject(arguments[1])
          && (typeof arguments[1].handler !== 'function'))))) {
        throw(EXCEPTION_INVALID_PARAM.replace('{{methodName}}', 'addRoute'));
        return;
      }
      route = { reg: arguments[0] };
      if (typeof arguments[1] === 'function') {
        route.handler = arguments[1];
      } else {
        $.extend(route, arguments[1]);
      }
    }
    route.context = route.context || window;

    this.routers.push(route);
    // 第一次添加需要独立执行一次route匹配
    if (this.started) {
      this.route(route);
    }
  };

  /**
   * 删除某条路由规则
   *
   * @method removeRoute
   * @param {String|RegExp} [reg] 要删除的路由的规则，如果不提供，
   *    则所有规则都会被删除。
   */
  proto.removeRoute = function(reg) {
    var done = false;
    if (reg) {
      $.each(this.routers, function(index, router){
        if (done) {
          return;
        }
        if (reg.toString() === router['reg'].toString()) {
          this.routers.splice(index, 1);
          done = true;
        }
      });
    } else {
      this.routers = [];
    }
  };

  /**
   * 进行一次路由匹配
   *
   * @method route
   * @param {Object} [single] 如果传入此参数，则代表要对传入的
   *    路由规则进行匹配(无论这个规则是否已经被add到此instance
   *    中)，如果不传入，则代表对所有规则做一次匹配。single是一
   *    个route对象直接量。
   */
  proto.route = function(single) {
    var found = false, hash = location.hash.replace(/^#\/?/, ''),
        match;

    match = function(index, route) {
      if (found) {
        return;
      }

      var args = [], result, i;

      if (route.reg instanceof RegExp) {
        result = hash.match(route.reg);
        if (result && result.length) {
          found = true;
          if (result.length > 1) {
            args = Array.prototype.splice.call(result, 1);
          }
        }
      } else {
        found = (hash === route.reg);
      }

      if (found) {
        if (typeof route.before === 'function') {
          route.before.apply(route.context, args);
        }
        route.handler.apply(route.context, args);
        if (typeof route.after === 'function') {
          route.after.apply(route.context, args);
        }
      }
    };

    if (single) {
      match(0, single);
    } else {
      $.each(this.routers, match);
    }

    if (!found && typeof this.notFound === 'funciton') {
      this.notFound();
    }
  };

  /**
   * 停止监控hashchange
   *
   * @method stop
   */
  proto.stop = function() {
    if (!this.started) {
      return;
    }
    $win.off('hashchange', this.onChange);
    this.started = false;
  };

  /**
   * 开始/恢复 监控hashchange
   *
   * @method start
   */
  proto.start = function() {
    if (this.started) {
      return;
    }
    $win.on('hashchange', this.onChange);
    this.started = true;
    this.route();
  };

  /**
   * 析构
   *
   * @method dispose
   */
  proto.dispose = function() {
    this.stop();
    this.routers = null;
    // 防止二次调用
    this.dispose = this.destroy = function(){};
  };

  /**
   * 析构alias
   *
   * @method destroy
   */
  proto.destroy = proto.dispose;


  /**
   * Parse "get" params of location.hash, like xxx/#/music?id=123&autoplay=1
   *
   * @method HashRouter.GetParam
   * @static
   * @param {String} [key] 如果提供，则只return这个key对应的value(不
   *    存在就返回null); 如果不提供，则返回一个对象直接量，里面是所有
   *    的hash get参数，key做hash key，value做value。
   * @return {String|Object} 对应是否传入参数，return将是某一个key的
   *    value，或者包含所有hash get参数的对象直接量
   */
  HashRouter.GetParam = function(key) {
    var paramString = location.hash.match(/\?.+$/),
        params, result, i, reg;
    if (!paramString) {
      if (key) {
        return null;
      } else {
        return {};
      }
    }
    paramString = paramString[0].slice(1);
    // if key param is given, simply match the key param
    if (key) {
      reg = new RegExp((key + '=(.+?)(?:&|$)'), 'i');
      params = paramString.match(reg);
      if (params && params.length >= 2) {
        return params[1];
      }
      return null;
    } else {
    // else, match all params
      params = paramString.split('&');
      result = {};
      for (i = 0; i < params.length; i++) {
        param = params[i].split('=');
        result[param[0]] = param[1] || '';
      }
      return result;
    }
  };

  window.HashRouter = HashRouter;

})(jQuery);

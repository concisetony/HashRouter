/**
 * Router Class based on hashchange
 *    also works on IE6
 *
 *  @Author: liuxiaolong1@wanda.cn
 *  @Version: 1.0
 */
(function($){

  var proto, $win = $(window);

  function HashRouter() {
    this.initialize.apply(this, arguments);
  }

  proto = HashRouter.prototype;
  proto.initialize = function(options) {
    options = options || {};
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

    $win.on('hashchange', $.proxy(this.route, this));
    this.route();
  };

  proto.addRoute = function(reg, handler, context) {
    context = context || window;
    this.routers.append({
      reg: reg,
      handler: handler,
      context: context
    });
  };

  proto.removeRoute = function(reg) {
    var done = false;
    if (reg) {
      $.each(this.routers, function(index, router){
        if (done) {
          return;
        }
        if (reg === router['reg']) {
          this.routers.splice(index, 1);
          done = true;
        }
      });
    } else {
      this.routers = [];
    }
  };

  proto.route = function(){
    var found = false, hash = location.hash.replace(/^#\/?/, '');
      
    $.each(this.routers, function(index, route){
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
    });

    if (!found && typeof this.notFound === 'funciton') {
      this.notFound();
    }
  };

  window.HashRouter = HashRouter;

})(jQuery);

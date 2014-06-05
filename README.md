HashRouter Class
==========

Javascript router class based on window.onhashchange. Support Ie6.


##Exports:

```
  window.HashRouter {Class}
  window.HashRouter.GetParam {Function}
```

##Usage Example

###Usage Example 1:

```
  hashrouter = new HashRouter({
    routers: [
      {
        reg: 'foo',
        handler: function() {
          // called when hash change to xx/#/foo (or xx/#foo)
        }
      },
      {
        reg: /people\/(\w+)/i,
        handler: function(peopleId) {
          // ...
        },
        before: function(peopleId) {
          // before handler exec
        },
        after: function(peopleId) {
          // after handler exec
        }
      }
    ]
  });
```


###Usage Example 2:

```
  hashrouter = new HashRouter();
  hashrouter.addRoute({
    reg: 'foo',
    handler: function() {
      // ...
    }
  });
  hashrouter.addRoute(/people\/(\w+)/i, function(peopleId){
    // handler here...
  });
  hashrouter.addRoute(/people\/(\w+)/i, {
    handler: function(peopleId) {
      // handler here...
    },
    before: function(peopleId) {
    },
    after: function(peopleId) {
    }
  );
```


###Usage Example 3:

```
  hashrouter = new HashRouter({
    autoStart: false
  });

  hashrouter.addRoute({
    reg: 'foo',
    handler: function() {
      // ...
    }
  });

  hashrouter.start();
  // hashrouter.stop();
  // hashrouter.dispose();
  //   or hashrouter.destroy();
```



# DIY自己的DOM操作库—minizepto.js
不是为了造轮子，而是记录笔者一步一步学习zepto.js源码的过程与收获，以及鼓励初中级前端开发者DIY一个自己的简单的DOM操作库。宗旨就是学习源码中涉及到的很多的js知识及一些平常被我们忽略的原生API的使用，还有就是体验一下简单插件的写法，而不是觉得第三方库是那么遥远的存在。

## 整体结构

* 暴露全局变量`Zepto`和`$`

  ```javascript
  // minizepto.js
  var Zepto;
  window.Zepto = Zepto;
  window.$ === undefined && (window.$ = Zepto); // 当全局对象上没有挂载$时才把Zepto赋值给window.$
  ```
* 我们一般情况下是这样使用的—`$('div')`，所以Zepto应该是一个函数

  ```javascript
  // 把Zepto内部的实现封装在一个立即执行函数里面，结构更加清晰
  var Zepto = (function() {
    // 这里的$就是一个局部变量而已，用什么符号都可以
    var $ = function(selector, context) {};
    return $;
  })();
  window.Zepto = Zepto;
  window.$ === undefined && (window.$ = Zepto);
  ```
* 函数本身也是对象，所以Zepto上可以挂载很多方法（underscore.js就是这样的实现）

  ```javascript
  var Zepto = (function() {
    var $ = function(selector, context) {};
    $.isWindow = function(obj) { return obj != null && obj == obj.window;};
    return $;
  })();
  ```
* `$('div')`是个对象，由构造函数生成

  ```javascript
  var Zepto = (function() {
    var $ = function(selector, context) {
      return new zepto.init(selector, context);
    };
    var zepto = {
      init: function(selector, context) {}
    };
    return $;
  })();
  ```
* 由于$的入口功能较多，所以这里的构造函数做了进一步的委托

  ```javascript
  var Zepto = (function() {
    var $ = function(selector, context) {
      return zepto.init(selector, context);
    };
    var zepto = {
      init: function(selector, context) {
        // do sth
        return new Z(dom, selector);
      }
    };
    function Z(dom, selector) {}
    return $;
  })();
  ```
* `$('div')`返回的是Z的实例，所以`each`、`css`等方法是放在`Z.prototype`上的

  ```javascript
  var Zepto = (function() {
    var $ = function(selector, context) {
      return zepto.init(selector, context);
    };
    var zepto = {
      init: function(selector, context) {
        // do sth
        return new Z(dom, selector);
      }
    };

    function Z(dom, selector) {}
    Z.prototype = {
      each: function() {},
      css: function() {}
    };
    return $;
  })();
  ```
* 习惯上是把这些实例方法放到`$.fn`对象上，平时扩展插件也是在`$.fn`上做的

  ```javascript
  var Zepto = (function() {
    var $ = function(selector, context) {
      return zepto.init(selector, context);
    };
    var zepto = {
      init: function(selector, context) {
        // do sth
        return new Z(dom, selector);
      }
    };

    function Z(dom, selector) {}
    $.fn = {
      each: function() {},
      css: function() {}
    };
    Z.prototype = $.fn;
    return $;
  })();
  ```
* 完整的一个结构大致如下：

  ```javascript
  var Zepto = (function() {
    // 构造实例对象
    var $ = function(selector, context) {
      return zepto.init(selector, context);
    };
    var zepto = {
      init: function(selector, context) {
        // do sth
        return new Z(dom, selector);
      }
    };
    function Z(dom, selector) {}

    // 挂载方法
    $.isWindow = function(obj) { return obj != null && obj == obj.window;};

    // 挂载原型方法
    $.fn = {
      each: function() {},
      css: function() {}
    };
    Z.prototype = $.fn;

    return $;
  })();
  window.Zepto = Zepto;
  window.$ === undefined && (window.$ = Zepto);
  ```
## 构造函数
## each方法

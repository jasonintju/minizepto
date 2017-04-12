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

## Zepto对象
`$(selector)`就是由Z函数构造出来的实例对象，具有length属性，是一个类数组对象：

```javascript
function Z(dom, selector) {
    var i, len = dom ? dom.length : 0;
    for (i = 0; i < len; i++) this[i] = dom[i]
    this.length = len;
    this.selector = selector || '';
}

var ZeptoObj = new Z(dom, selector);
// ZeptoObj的格式如下:
{
  0: div1,
  1: div2,
  2: div3,
  length: 3,
  selector: **
}

// 很神奇的一个地方：当一个对象有length和splice两个属性时，在Chrome控制台中是以数组的形式打印出来的，AMAZING!
// $.fn中恰好有splice这个方法，所以我们经常看到$(selector)的结果在console里面是个“数组”
```

## 构造函数
`$(selector)`中的参数selector会有不同的形式，简单分为以下几种：

* 为空：返回一个length等于0的Zepto对象
* 字符串：常规的选择器，使用`document.querySelectorAll(selector)`来获取对应的DOM元素
* 函数：DOM加载完成之后执行此函数
* Zepto对象：不做任何处理，直接返回此Zepto对象
* 数组：把此数组中的null和undefined去掉，然后转化成一个Zepto对象
* 对象：把此对象包装成Zepto对象
* 其他：更高级的用法不包含在此，其他一律使用`document.querySelectorAll(selector)`来选择生成结果

```javascript
zepto = {
    init: function(selector) {
        var dom;
        if (!selector) {
            return new Z()
        } else if (typeof selector == 'string') {
            selector = selector.trim()
            dom = this.qsa(document, selector)
        } else if (isFunction(selector)) {
            return $(document).ready(selector)
        } else if (this.isZ(selector)) {
            return selector
        } else if (isArray(selector)) {
            dom = compact(selector)
        } else if (isObject(selector)) {
            dom = [selector], selector = null
        } else {
            dom = this.qsa(document, selector)
        }

        return new Z(dom, selector);
    },
    isZ: function(obj) {
        return obj instanceof Z
    },
    qsa: function(element, selector) {
        return slice.call(element.querySelectorAll(selector))
    }
};

```

---
自此，我们明白了代码的组织结构及关键的zepto.init函数和Z函数，整个dom库的骨架已经成型，接下来就是一点一点地添加API，逐步完善minizepto.js。

我会按照代码版本tag来逐步添加API，每个tag有哪些新增及修改内容都会记录在CHANGELOG.md中，有兴趣的同学可以一块学习，共同进步。

项目地址：[https://github.com/jasonintju/minizepto](https://github.com/jasonintju/minizepto)

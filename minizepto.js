var Zepto = (function() {
    var zepto = {},
        $,
        emptyArray = [],
        filter = emptyArray.filter,
        slice = emptyArray.slice,
        class2type = {},
        toString = class2type.toString,
        isArray = Array.isArray || function(obj) {
            return type(obj) == 'array'
        };

    "Boolean Number String Function Array Date RegExp Object Error".split(" ").forEach(function(name, i) {
        class2type["[object " + name + "]"] = name.toLowerCase()
    })

    function type(obj) {
        return obj == null ? String(obj) : class2type[toString.call(obj)] || 'object'
    }

    function isFunction(obj) {
        return typeof obj == 'function'
    }

    function isWindow(obj) {
        return obj != null && obj == obj.window
    }

    function isDocument(obj) {
        return obj != null && obj.nodeType == obj.DOCUMENT_NODE
    }

    function isObject(obj) {
        return type(obj) == 'object'
    }
    // 判断对象是否是“纯粹”的对象，这个对象是通过 对象常量（"{}"） 或者 new Object 创建的，如果是，则返回true
    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
    }

    // 什么是类数组？（请参考《JavaScript权威指南》161页）
    // 有length属性，并能按下标访问的对象。
    // 数组本身是，arguments是，NodeList是，字符串也是。
    // 但是window对象有length属性（表示当前窗口中frames的数量），函数也有length属性（表示函数形参的个数），一般不认为他们是类数组。
    function likeArray(obj) {
        var length = !!obj && 'length' in obj && obj.length,
            _type = type(obj);
        return 'function' != _type && !isWindow && (
            'array' == _type || length === 0 ||
            (typeof length == 'number' && length > 0 && (length - 1) in obj)
        )
    }
    // 去除数组中的null和undefined
    function compact(array) {
        return filter.call(array, function(item) {
            return item != null
        })
    }



    $ = function(selector) {
        return zepto.init(selector);
    };
    zepto = {
        init: function(selector) {
            var dom;
            if (!selector) {
                return this.Z()
            } else if (typeof selector == 'string') {
                selector = selector.trim()
                dom = zepto.qsa(document, selector)
            } else if (isFunction(selector)) {
                return $(document).ready(selector)
            } else if (this.isZ(selector)) {
                return selector
            } else if (isArray(selector)) {
                dom = compact(selector)
            } else if (isObject(selector)) {
                dom = [selector], selector = null
            } else {
                dom = zepto.qsa(document, selector)
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

    function Z(dom, selector) {
        var i, len = dom ? dom.length : 0;
        for (i = 0; i < len; i++) this[i] = dom[i]
        this.length = len;
        this.selector = selector || '';
    }

    /* ------- 工具方法 ------- */

    /* ------- 挂载方法 ------- */
    $.type = type
    // each方法中判断===false的解释参见 http://www.qdfuns.com/notes/17398/f59f4a80152bc36b2f22c5f5f40a11dd.html
    $.each = function(elements, callback) {
        var i, key
        if (likeArray(elements)) {
            for (i = 0; i < elements.length; i++) {
                if (callback.call(elements[i], elements[i], i) === false) return elements
            }
        } else {
            for (key in elements) {
                if (callback.call(elements[key], elements[key], key) === false) return elements
            }
        }
        return elements
    }

    // 挂载原型方法
    $.fn = {
        forEach: emptyArray.forEach,
        reduce: emptyArray.reduce,
        push: emptyArray.push,
        sort: emptyArray.sort,
        splice: emptyArray.splice, // 类数组有length、splice这两个属性，会在Chrome控制台上以数组的形式输出，AMAZING!!!
        indexOf: emptyArray.indexOf,

        ready: function(callback) {
            document.addEventListener('DOMContentLoaded', callback, false)
            return this
        },
        get: function(index) {
            return index === undefined ? slice.call(this) : this[index >= 0 ? index : index + this.length]
        },
        toArray: function() {
            return this.get()
        },
        size: function() {
            return this.length
        },
        each: function(callback) {
            emptyArray.every.call(this, function(element, index) {
                return callback.call(element, element, index) !== false
            })
            return this
        },
        remove: function() {
            return this.each(function() {
                if (this.parentNode != null) {
                    this.parentNode.removeChild(this)
                }
            })
        }
    };
    Z.prototype = $.fn;

    return $;
})();

window.Zepto = Zepto;
window.$ === undefined && (window.$ = Zepto);

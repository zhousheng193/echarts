define(function(require) {
    'use strict';

    var zrUtil = require('zrender/core/util');
    var Model = require('../model/Model');

    function createArrayIterWithDepth(maxDepth, properties, cb, context, iterType) {
        // Simple optimization to avoid read the undefined value in properties array
        var nestedProperties = properties.length > 0;
        return function eachAxis(array, depth) {
            if (depth === maxDepth) {
                return zrUtil[iterType](array, cb, context);
            }
            else {
                if (array) {
                    var property = properties[i];
                    for (var i = 0; i < array.length; i++) {
                        var item = array[i];
                        // Access property of each item
                        if (nestedProperties && property && item) {
                            item = item[property];
                        }
                        array[i] = eachAxis(item, depth);
                    }
                }
            }
        }
    }

    var Entry = Model.extend({

        layout: null,

        init: function (option) {
            
            this.name = option.name || '';

            this.$option = option;

            this._value = option.value === null ? option : option.value

            this.rawIndex = 0;
        },


        /**
         * Get x of single data item.
         * @return {number}
         */
        getX: function () {
            // Use idx as x if data is 1d
            // Usually when xAxis is category axis
            return this.dimension === 1 ? this.rawIndex : this._value[0];
        },

        setX: function (x) {
            if (this.dimension > 1) {
                this._value[0] = x;
            }
        },

        /**
         * Get y of single data item.
         * @return {number}
         */
        getY: function () {
            if (this.dimension > 1) {
                return this._value[1];
            }
            else {
                // Value is a single number if data is 1d
                return this._value;
            }
        },

        setY: function (y) {
            if (this.dimension > 1) {
                this._value[1] = y;
            }
            else {
                this._value = y;
            }
        },

        getZ: function () {
            if (this.dimension > 2) {
                return this._value[2];
            }
        },

        setZ: function (z) {
            if (this.dimension > 2) {
                this._value[2] = z;
            }
        },

        getValue: function () {
            return this._value[this.dimension];
        },

        setValue: function (value) {
            this._value[this.dimensino] = value
        }
    });

    function List() {

        this.elements = this.elements || [];

        // Depth and properties is useful in nested Array.
        // For example in eventRiver, data structure is a nested 2d array as following
        // [{evolution: []}, {evolution: []}]
        // In this situation. depth should be 2 and properties should be ['evolution']
        this.depth = 1;

        this.properties = [];
    }

    List.prototype = {

        constructor: List,

        type: 'list',

        each: function (cb, context) {
            context = context || this;
            if (this.depth > 1) {
                createArrayIterWithDepth(
                    this.depth, this.properties, cb, context, 'each'
                )(this.elements, 0);
            }
            else {
                zrUtil.each(this.elements, cb, context);
            }
        },

        /**
         * In-place filter
         */
        filterInPlace: function (cb, context) {
            context = context || this;
            if (this.depth > 1) {
                createArrayIterWithDepth(
                    this.depth, this.properties, cb, context, 'filter'
                )(this.elements, 0);
            }
            else {
                this.elements = zrUtil.filter(this.elements, cb, context);
            }
        },

        /**
         * In-place map
         */
        mapInPlace: function (cb, context) {
            context = context || this;
            if (this.depth > 1) {
                createArrayIterWithDepth(
                    this.depth, this.properties, cb, context, 'map'
                )(this.elements, 0);
            }
            else {
                this.elements = zrUtil.map(this.elements, cb, context);
            }
        },

        getItemByName: function (name) {
            // var elements = this.elements;
            // for (var i = 0; i < elements.length; i++) {
            //     if (elements[i].name === name) {
            //         return elements[i];
            //     }
            // }
            // TODO
        },

        clone: function () {
            // Clone
        }
    };

    zrUtil.each(['X', 'Y', 'Z', 'Value'], function (name) {
        zrUtil.each(['each', 'map', 'filter'], function (iterType) {
            List.prototype[iterType + name] = function (cb, context) {
                this[iterType](function (item, idx) {
                    return cb && cb.call(context || this, item['get' + name](idx));
                }, context);
            };
        });
    });

    List.fromArray = function (data, dimension) {
        var list = new List();
        // Normalize data
        list.elements = zrUtil.map(data, function (dataItem) {
            var entry = new Entry(dataItem);
            entry.dimension = dimension;
        });
        return list;
    };

    List.Entry = Entry;

    return List;
});
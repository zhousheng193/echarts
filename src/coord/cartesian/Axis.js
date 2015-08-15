define(function (require) {

    var linearMap = require('../util/number').linearMap;
    var zrUtil = require('zrender/core/util');

    /**
     * @name module:echarts/coord/CartesianAxis
     * @constructor
     */
    var Axis = function (dim, scale, coordExtent) {

        /**
         * Axis dimension. Such as 'x', 'y', 'z'
         * @type {string}
         */
        this.dim = dim;

        /**
         * Axis scale
         * @type {module:echarts/coord/scale/*}
         */
        this.scale = scale;

        this._coordExtent = coordExtent;
    };

    Axis.prototype = {

        constructor: Axis,

        /**
         * Reverse axis direction
         */
        reverse: function () {
            this._coordExtent = this._coordExtent.reverse();
        },

        /**
         * Get coord extent
         * @return {Array.<number>}
         */
        getCoordExtent: function () {
            return this._coordExtent;
        },

        /**
         * Set coord extent
         * @param {number} min
         * @param {number} max
         */
        setCoordExtent: function (min, max) {
            var extent = this._coordExtent;
            extent[0] = min;
            extent[1] = max;
        },

        /**
         * Map a data to coord. Data is the rank if it has a ordinal scale
         * @param {number} data
         * @return {number}
         */
        dataToCoord: function (data) {
            data = this.scale.normalize(data);

            return linearMap(data, [0, 1], this._coordExtent);
        },

        /**
         * Map a coord to data. Data is the rank if it has a ordinal scale
         * @param {number} coord
         * @return {number}
         */
        coordToData: function (coord) {
            var t = linearMap(coord, this._coordExtent, [0, 1]);

            return this.scale.scale(t);
        },
        /**
         * @return {ticks}
         */
        getTicksCoords: function () {
            var ticks = this.scale.getTicks();
            return zrUtil.map(ticks, function (data) {
                return this.dataToCoord(data);
            }, this);
        },

        /**
         * Get coords of bands.
         * If axis has ticks [1, 2, 3, 4]. Bands on the axis are
         * |---1---|---2---|---3---|---4---|. And band coords is an array of coords
         * where `|` is. It is useful when axis has an ordinal scale.
         *
         * @param {boolean} [margin=false]
         * If margin is true. Coord extent is start at the position of first tick and end
         * at the position of last tick.
         * @return {Array.<number>}
         */
        getBandsCoords: function (margin) {
            var coordExtent = this._coordExtent;
            var extent = this.scale.getExtent();
            var coords = [];
            var len = extent[1] - extent[0] + 1;
            var startCoord = coordExtent[0];
            var endCoord = coordExtent[1];
            var size = endCoord - startCoord;

            if (margin) {
                var marginSize = size / (len * 2 - 2);
                startCoord -= marginSize;
                size += marginSize * 2;
            }
            for (var i = 0; i <= len; i++) {
                coords.push(size * i / len + startCoord);
            }
            return coords;
        },

        /**
         * Get width of band
         * @param  {boolean} margin
         * @return {number}
         */
        getBandWidth: function (margin) {
            var coordExtent = this._coordExtent;
            var extent = this.scale.getExtent();
            var len = extent[1] - extent[0] + 1;

            var size = coordExtent[1] - coordExtent[0];
            if (margin) {
                size += size / (len - 1);
            }
            return Math.abs(size) / len;
        }
    };

    return Axis;
});
/**
 * @file defines echarts Heatmap Chart
 * @author Ovilia (me@zhangwenli.com)
 * Inspired by https://github.com/mourner/simpleheat
 *
 * @module
 */
define(function (require) {

    var BRUSH_SIZE = 20;
    var GRADIENT_LEVELS = 256;

    /**
     * Heatmap Chart
     *
     * @class
     */
    function Heatmap() {
        var canvas = document.createElement('canvas');
        this.canvas = canvas;

        this.blurSize = 30;
        this.opacity = 1;

        this._gradientPixels = {};
    }

    Heatmap.prototype = {
        /**
         * Renders Heatmap and returns the rendered canvas
         * @param {Array} data array of data, each has x, y, value
         * @param {number} width canvas width
         * @param {number} height canvas height
         */
        update: function(data, width, height, normalize, colorFunc, isInRange) {
            var brush = this._getBrush();
            var gradientInRange = this._getGradient(data, colorFunc, 'inRange');
            var gradientOutOfRange = this._getGradient(data, colorFunc, 'outOfRange');
            var r = BRUSH_SIZE + this.blurSize;

            var canvas = this.canvas;
            var ctx = canvas.getContext('2d');
            var len = data.length;
            canvas.width = width;
            canvas.height = height;
            for (var i = 0; i < len; ++i) {
                var p = data[i];
                var x = p[0];
                var y = p[1];
                var value = p[2];

                // calculate alpha using value
                var alpha = normalize(value);

                // draw with the circle brush with alpha
                ctx.globalAlpha = alpha;
                ctx.drawImage(brush, x - r, y - r);
            }

            // colorize the canvas using alpha value and set with gradient
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var pixels = imageData.data;
            var len = pixels.length / 4;
            while(len--) {
                var id = len * 4 + 3;
                var alpha = pixels[id] / 256;
                var offset = Math.floor(alpha * (GRADIENT_LEVELS - 1));
                var gradient = isInRange(alpha) ? gradientInRange : gradientOutOfRange;
                pixels[id - 3] = gradient[offset * 4];
                pixels[id - 2] = gradient[offset * 4 + 1];
                pixels[id - 1] = gradient[offset * 4 + 2];
                pixels[id] *= this.opacity * gradient[offset * 4 + 3];
            }
            ctx.putImageData(imageData, 0, 0);

            return canvas;
        },

        /**
         * get canvas of a black circle brush used for canvas to draw later
         * @private
         * @returns {Object} circle brush canvas
         */
        _getBrush: function() {
            var brushCanvas = this._brushCanvas || (this._brushCanvas = document.createElement('canvas'));
            // set brush size
            var r = BRUSH_SIZE + this.blurSize;
            var d = r * 2;
            brushCanvas.width = d;
            brushCanvas.height = d;

            var ctx = brushCanvas.getContext('2d');
            ctx.clearRect(0, 0, d, d);

            // in order to render shadow without the distinct circle,
            // draw the distinct circle in an invisible place,
            // and use shadowOffset to draw shadow in the center of the canvas
            ctx.shadowOffsetX = d;
            ctx.shadowBlur = this.blurSize;
            // draw the shadow in black, and use alpha and shadow blur to generate
            // color in color map
            ctx.shadowColor = '#000';

            // draw circle in the left to the canvas
            ctx.beginPath();
            ctx.arc(-r, r, BRUSH_SIZE, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
            return brushCanvas;
        },

        /**
         * get gradient color map
         * @private
         */
        _getGradient: function (data, colorFunc, state) {
            var gradientPixels = this._gradientPixels;
            var pixelsSingleState = gradientPixels[state] || (gradientPixels[state] = new Uint8ClampedArray(256 * 4));
            var color = [];
            var off = 0;
            for (var i = 0; i < 256; i++) {
                colorFunc[state](i / 255, true, color);
                pixelsSingleState[off++] = color[0];
                pixelsSingleState[off++] = color[1];
                pixelsSingleState[off++] = color[2];
                pixelsSingleState[off++] = color[3];
            }
            return pixelsSingleState;
        }
    };

    return Heatmap;
});
import { Texture, VideoTexture } from 'three';

import { Hoisting, Side } from '../constants';
import getAngleOfSide from '../utils/getAngleOfSide';
import { isNumeric, isObject } from '../utils/TypeUtils';
import Flag from '../subjects/Flag';
import VideoFlag from '../subjects/VideoFlag';

// Maximum size of flag
const maxSize = 500;

const defaults = {
    width:                      'auto',
    height:                     'auto',
    hoisting:                   Hoisting.DEXTER,
    orientation:                Side.TOP,
    resolution:                 256 // px per meter
};

// Calculate width and/or height from image if either is set to 'auto'
function computeSizeFromElement(element, options) {
    const elementWidth = element.width || element.videoWidth;
    const elementHeight = element.height || element.videoHeight;

    if (options.width === 'auto' && options.height === 'auto') {
        const crossWidth = Flag.defaults.height;

        if (elementWidth < elementHeight) {
            // Vertical
            return {
                width:  crossWidth,
                height: crossWidth * elementHeight / elementWidth
            };
        } else {
            // Horizontal or square
            return {
                width:  crossWidth * elementWidth / elementHeight,
                height: crossWidth
            };
        }
    } else if (options.width === 'auto' && isNumeric(options.height)) {
        return {
            width:  options.height * elementWidth / elementHeight,
            height: options.height
        };
    } else if (isNumeric(options.width) && options.height === 'auto') {
        return {
            width:  options.width,
            height: options.width * elementHeight / elementWidth
        };
    } else {
        return {
            width:  options.width,
            height: options.height
        };
    }
}

// Compute a numeric width and height from options
function computeSize(element, options) {
    const { width, height } = element
        ? computeSizeFromElement(element, options)
        : options;

    if (isNumeric(width) && isNumeric(height)) {
        // Downscale images that exceed maxSize
        const scale = Math.min(1, maxSize / Math.max(width, height));

        return {
            width: width * scale,
            height: height * scale
        };
    } else {
        return {
            width:  Flag.defaults.width,
            height: Flag.defaults.height
        };
    }
}

// Check if flag has been rotated into a vertical position
function isVertical(options) {
    return (
        options.orientation === Side.LEFT ||
        options.orientation === Side.RIGHT
    );
}

// Compute values needed to apply texture onto mesh
function computeTextureArgs(options) {
    const result = {};

    result.reflect = options.hoisting === Hoisting.SINISTER;
    result.rotate = getAngleOfSide(options.orientation);

    return result;
}

// Generate transformed texture from image using HTML canvas
function scaleImage(image, options) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const srcWidth = image.width;
    const srcHeight = image.height;

    // Downscale textures that exceed max resolution
    const scale = Math.min(1, options.height * options.resolution / srcHeight);

    const destWidth = Math.round(srcWidth * scale);
    const destHeight = Math.round(srcHeight * scale);

    canvas.width = destWidth;
    canvas.height = destHeight;

    ctx.drawImage(image, 0, 0, destWidth, destHeight);

    return canvas;
}

// Generate transformed texture from image
function createTextureFromElement(element, options, transform) {
    const texture = element instanceof HTMLVideoElement
        ? new VideoTexture(element)
        : new Texture(scaleImage(element, options));

    texture.matrixAutoUpdate = false;

    if (isObject(transform)) {
        const matrix = texture.matrix;

        matrix.scale(1, 1);

        // Reflect
        if (transform.reflect) {
            matrix.translate(-1, 0).scale(-1, 1);
        }

        // Rotate around center
        if (isNumeric(transform.rotate)) {
            matrix
                .translate(-0.5, -0.5)
                .rotate(-transform.rotate)
                .translate(0.5, 0.5);
        }
    }

    return texture;
}

// Compute values needed to create new flag
function computeFlagArgs(element, options) {
    const result = Object.assign({}, options);

    if (isVertical(options)) {
        result.width  = options.height;
        result.height = options.width;
    }

    if (element) {
        result.texture = createTextureFromElement(
            element,
            options,
            computeTextureArgs(options)
        );
    }

    return result;
}

/**
 * @function buildRectangularFlagFromMedia
 *
 * @description Helper for generating flags from rectangular designs
 * that can be rotated and flipped.
 *
 * @param {HTMLImageElement|HTMLVideoElement} element
 * @param {Object} [options]
 */
export default function buildRectangularFlagFromMedia(element, options) {
    const settings = Object.assign({}, defaults, options);

    Object.assign(settings, computeSize(element, settings));

    // Init models and create meshes once images(s) have loaded
    const args = computeFlagArgs(element, settings);
    const flag = element instanceof HTMLVideoElement
        ? new VideoFlag(args)
        : new Flag(args);

    return flag;
}
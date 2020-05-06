// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"EgBh":[function(require,module,exports) {
var binaryFeatures = {};
binaryFeatures.useBlobBuilder = (function () {
  try {
    new Blob([]);
    return false;
  } catch (e) {
    return true;
  }
})();

binaryFeatures.useArrayBufferView = !binaryFeatures.useBlobBuilder && (function () {
  try {
    return (new Blob([new Uint8Array([])])).size === 0;
  } catch (e) {
    return true;
  }
})();

module.exports.binaryFeatures = binaryFeatures;
var BlobBuilder = module.exports.BlobBuilder;
if (typeof window !== 'undefined') {
  BlobBuilder = module.exports.BlobBuilder = window.WebKitBlobBuilder ||
    window.MozBlobBuilder || window.MSBlobBuilder || window.BlobBuilder;
}

function BufferBuilder () {
  this._pieces = [];
  this._parts = [];
}

BufferBuilder.prototype.append = function (data) {
  if (typeof data === 'number') {
    this._pieces.push(data);
  } else {
    this.flush();
    this._parts.push(data);
  }
};

BufferBuilder.prototype.flush = function () {
  if (this._pieces.length > 0) {
    var buf = new Uint8Array(this._pieces);
    if (!binaryFeatures.useArrayBufferView) {
      buf = buf.buffer;
    }
    this._parts.push(buf);
    this._pieces = [];
  }
};

BufferBuilder.prototype.getBuffer = function () {
  this.flush();
  if (binaryFeatures.useBlobBuilder) {
    var builder = new BlobBuilder();
    for (var i = 0, ii = this._parts.length; i < ii; i++) {
      builder.append(this._parts[i]);
    }
    return builder.getBlob();
  } else {
    return new Blob(this._parts);
  }
};

module.exports.BufferBuilder = BufferBuilder;

},{}],"kdPp":[function(require,module,exports) {
var BufferBuilder = require('./bufferbuilder').BufferBuilder;
var binaryFeatures = require('./bufferbuilder').binaryFeatures;

var BinaryPack = {
  unpack: function (data) {
    var unpacker = new Unpacker(data);
    return unpacker.unpack();
  },
  pack: function (data) {
    var packer = new Packer();
    packer.pack(data);
    var buffer = packer.getBuffer();
    return buffer;
  }
};

module.exports = BinaryPack;

function Unpacker (data) {
  // Data is ArrayBuffer
  this.index = 0;
  this.dataBuffer = data;
  this.dataView = new Uint8Array(this.dataBuffer);
  this.length = this.dataBuffer.byteLength;
}

Unpacker.prototype.unpack = function () {
  var type = this.unpack_uint8();
  if (type < 0x80) {
    return type;
  } else if ((type ^ 0xe0) < 0x20) {
    return (type ^ 0xe0) - 0x20;
  }

  var size;
  if ((size = type ^ 0xa0) <= 0x0f) {
    return this.unpack_raw(size);
  } else if ((size = type ^ 0xb0) <= 0x0f) {
    return this.unpack_string(size);
  } else if ((size = type ^ 0x90) <= 0x0f) {
    return this.unpack_array(size);
  } else if ((size = type ^ 0x80) <= 0x0f) {
    return this.unpack_map(size);
  }

  switch (type) {
    case 0xc0:
      return null;
    case 0xc1:
      return undefined;
    case 0xc2:
      return false;
    case 0xc3:
      return true;
    case 0xca:
      return this.unpack_float();
    case 0xcb:
      return this.unpack_double();
    case 0xcc:
      return this.unpack_uint8();
    case 0xcd:
      return this.unpack_uint16();
    case 0xce:
      return this.unpack_uint32();
    case 0xcf:
      return this.unpack_uint64();
    case 0xd0:
      return this.unpack_int8();
    case 0xd1:
      return this.unpack_int16();
    case 0xd2:
      return this.unpack_int32();
    case 0xd3:
      return this.unpack_int64();
    case 0xd4:
      return undefined;
    case 0xd5:
      return undefined;
    case 0xd6:
      return undefined;
    case 0xd7:
      return undefined;
    case 0xd8:
      size = this.unpack_uint16();
      return this.unpack_string(size);
    case 0xd9:
      size = this.unpack_uint32();
      return this.unpack_string(size);
    case 0xda:
      size = this.unpack_uint16();
      return this.unpack_raw(size);
    case 0xdb:
      size = this.unpack_uint32();
      return this.unpack_raw(size);
    case 0xdc:
      size = this.unpack_uint16();
      return this.unpack_array(size);
    case 0xdd:
      size = this.unpack_uint32();
      return this.unpack_array(size);
    case 0xde:
      size = this.unpack_uint16();
      return this.unpack_map(size);
    case 0xdf:
      size = this.unpack_uint32();
      return this.unpack_map(size);
  }
};

Unpacker.prototype.unpack_uint8 = function () {
  var byte = this.dataView[this.index] & 0xff;
  this.index++;
  return byte;
};

Unpacker.prototype.unpack_uint16 = function () {
  var bytes = this.read(2);
  var uint16 =
    ((bytes[0] & 0xff) * 256) + (bytes[1] & 0xff);
  this.index += 2;
  return uint16;
};

Unpacker.prototype.unpack_uint32 = function () {
  var bytes = this.read(4);
  var uint32 =
    ((bytes[0] * 256 +
      bytes[1]) * 256 +
      bytes[2]) * 256 +
    bytes[3];
  this.index += 4;
  return uint32;
};

Unpacker.prototype.unpack_uint64 = function () {
  var bytes = this.read(8);
  var uint64 =
    ((((((bytes[0] * 256 +
      bytes[1]) * 256 +
      bytes[2]) * 256 +
      bytes[3]) * 256 +
      bytes[4]) * 256 +
      bytes[5]) * 256 +
      bytes[6]) * 256 +
    bytes[7];
  this.index += 8;
  return uint64;
};

Unpacker.prototype.unpack_int8 = function () {
  var uint8 = this.unpack_uint8();
  return (uint8 < 0x80) ? uint8 : uint8 - (1 << 8);
};

Unpacker.prototype.unpack_int16 = function () {
  var uint16 = this.unpack_uint16();
  return (uint16 < 0x8000) ? uint16 : uint16 - (1 << 16);
};

Unpacker.prototype.unpack_int32 = function () {
  var uint32 = this.unpack_uint32();
  return (uint32 < Math.pow(2, 31)) ? uint32
    : uint32 - Math.pow(2, 32);
};

Unpacker.prototype.unpack_int64 = function () {
  var uint64 = this.unpack_uint64();
  return (uint64 < Math.pow(2, 63)) ? uint64
    : uint64 - Math.pow(2, 64);
};

Unpacker.prototype.unpack_raw = function (size) {
  if (this.length < this.index + size) {
    throw new Error('BinaryPackFailure: index is out of range' +
      ' ' + this.index + ' ' + size + ' ' + this.length);
  }
  var buf = this.dataBuffer.slice(this.index, this.index + size);
  this.index += size;

  // buf = util.bufferToString(buf);

  return buf;
};

Unpacker.prototype.unpack_string = function (size) {
  var bytes = this.read(size);
  var i = 0;
  var str = '';
  var c;
  var code;

  while (i < size) {
    c = bytes[i];
    if (c < 128) {
      str += String.fromCharCode(c);
      i++;
    } else if ((c ^ 0xc0) < 32) {
      code = ((c ^ 0xc0) << 6) | (bytes[i + 1] & 63);
      str += String.fromCharCode(code);
      i += 2;
    } else {
      code = ((c & 15) << 12) | ((bytes[i + 1] & 63) << 6) |
        (bytes[i + 2] & 63);
      str += String.fromCharCode(code);
      i += 3;
    }
  }

  this.index += size;
  return str;
};

Unpacker.prototype.unpack_array = function (size) {
  var objects = new Array(size);
  for (var i = 0; i < size; i++) {
    objects[i] = this.unpack();
  }
  return objects;
};

Unpacker.prototype.unpack_map = function (size) {
  var map = {};
  for (var i = 0; i < size; i++) {
    var key = this.unpack();
    var value = this.unpack();
    map[key] = value;
  }
  return map;
};

Unpacker.prototype.unpack_float = function () {
  var uint32 = this.unpack_uint32();
  var sign = uint32 >> 31;
  var exp = ((uint32 >> 23) & 0xff) - 127;
  var fraction = (uint32 & 0x7fffff) | 0x800000;
  return (sign === 0 ? 1 : -1) *
    fraction * Math.pow(2, exp - 23);
};

Unpacker.prototype.unpack_double = function () {
  var h32 = this.unpack_uint32();
  var l32 = this.unpack_uint32();
  var sign = h32 >> 31;
  var exp = ((h32 >> 20) & 0x7ff) - 1023;
  var hfrac = (h32 & 0xfffff) | 0x100000;
  var frac = hfrac * Math.pow(2, exp - 20) +
    l32 * Math.pow(2, exp - 52);
  return (sign === 0 ? 1 : -1) * frac;
};

Unpacker.prototype.read = function (length) {
  var j = this.index;
  if (j + length <= this.length) {
    return this.dataView.subarray(j, j + length);
  } else {
    throw new Error('BinaryPackFailure: read index out of range');
  }
};

function Packer () {
  this.bufferBuilder = new BufferBuilder();
}

Packer.prototype.getBuffer = function () {
  return this.bufferBuilder.getBuffer();
};

Packer.prototype.pack = function (value) {
  var type = typeof (value);
  if (type === 'string') {
    this.pack_string(value);
  } else if (type === 'number') {
    if (Math.floor(value) === value) {
      this.pack_integer(value);
    } else {
      this.pack_double(value);
    }
  } else if (type === 'boolean') {
    if (value === true) {
      this.bufferBuilder.append(0xc3);
    } else if (value === false) {
      this.bufferBuilder.append(0xc2);
    }
  } else if (type === 'undefined') {
    this.bufferBuilder.append(0xc0);
  } else if (type === 'object') {
    if (value === null) {
      this.bufferBuilder.append(0xc0);
    } else {
      var constructor = value.constructor;
      if (constructor == Array) {
        this.pack_array(value);
      } else if (constructor == Blob || constructor == File || value instanceof Blob || value instanceof File) {
        this.pack_bin(value);
      } else if (constructor == ArrayBuffer) {
        if (binaryFeatures.useArrayBufferView) {
          this.pack_bin(new Uint8Array(value));
        } else {
          this.pack_bin(value);
        }
      } else if ('BYTES_PER_ELEMENT' in value) {
        if (binaryFeatures.useArrayBufferView) {
          this.pack_bin(new Uint8Array(value.buffer));
        } else {
          this.pack_bin(value.buffer);
        }
      } else if ((constructor == Object) || (constructor.toString().startsWith('class'))) {
        this.pack_object(value);
      } else if (constructor == Date) {
        this.pack_string(value.toString());
      } else if (typeof value.toBinaryPack === 'function') {
        this.bufferBuilder.append(value.toBinaryPack());
      } else {
        throw new Error('Type "' + constructor.toString() + '" not yet supported');
      }
    }
  } else {
    throw new Error('Type "' + type + '" not yet supported');
  }
  this.bufferBuilder.flush();
};

Packer.prototype.pack_bin = function (blob) {
  var length = blob.length || blob.byteLength || blob.size;
  if (length <= 0x0f) {
    this.pack_uint8(0xa0 + length);
  } else if (length <= 0xffff) {
    this.bufferBuilder.append(0xda);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff) {
    this.bufferBuilder.append(0xdb);
    this.pack_uint32(length);
  } else {
    throw new Error('Invalid length');
  }
  this.bufferBuilder.append(blob);
};

Packer.prototype.pack_string = function (str) {
  var length = utf8Length(str);

  if (length <= 0x0f) {
    this.pack_uint8(0xb0 + length);
  } else if (length <= 0xffff) {
    this.bufferBuilder.append(0xd8);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff) {
    this.bufferBuilder.append(0xd9);
    this.pack_uint32(length);
  } else {
    throw new Error('Invalid length');
  }
  this.bufferBuilder.append(str);
};

Packer.prototype.pack_array = function (ary) {
  var length = ary.length;
  if (length <= 0x0f) {
    this.pack_uint8(0x90 + length);
  } else if (length <= 0xffff) {
    this.bufferBuilder.append(0xdc);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff) {
    this.bufferBuilder.append(0xdd);
    this.pack_uint32(length);
  } else {
    throw new Error('Invalid length');
  }
  for (var i = 0; i < length; i++) {
    this.pack(ary[i]);
  }
};

Packer.prototype.pack_integer = function (num) {
  if (num >= -0x20 && num <= 0x7f) {
    this.bufferBuilder.append(num & 0xff);
  } else if (num >= 0x00 && num <= 0xff) {
    this.bufferBuilder.append(0xcc);
    this.pack_uint8(num);
  } else if (num >= -0x80 && num <= 0x7f) {
    this.bufferBuilder.append(0xd0);
    this.pack_int8(num);
  } else if (num >= 0x0000 && num <= 0xffff) {
    this.bufferBuilder.append(0xcd);
    this.pack_uint16(num);
  } else if (num >= -0x8000 && num <= 0x7fff) {
    this.bufferBuilder.append(0xd1);
    this.pack_int16(num);
  } else if (num >= 0x00000000 && num <= 0xffffffff) {
    this.bufferBuilder.append(0xce);
    this.pack_uint32(num);
  } else if (num >= -0x80000000 && num <= 0x7fffffff) {
    this.bufferBuilder.append(0xd2);
    this.pack_int32(num);
  } else if (num >= -0x8000000000000000 && num <= 0x7FFFFFFFFFFFFFFF) {
    this.bufferBuilder.append(0xd3);
    this.pack_int64(num);
  } else if (num >= 0x0000000000000000 && num <= 0xFFFFFFFFFFFFFFFF) {
    this.bufferBuilder.append(0xcf);
    this.pack_uint64(num);
  } else {
    throw new Error('Invalid integer');
  }
};

Packer.prototype.pack_double = function (num) {
  var sign = 0;
  if (num < 0) {
    sign = 1;
    num = -num;
  }
  var exp = Math.floor(Math.log(num) / Math.LN2);
  var frac0 = num / Math.pow(2, exp) - 1;
  var frac1 = Math.floor(frac0 * Math.pow(2, 52));
  var b32 = Math.pow(2, 32);
  var h32 = (sign << 31) | ((exp + 1023) << 20) |
    (frac1 / b32) & 0x0fffff;
  var l32 = frac1 % b32;
  this.bufferBuilder.append(0xcb);
  this.pack_int32(h32);
  this.pack_int32(l32);
};

Packer.prototype.pack_object = function (obj) {
  var keys = Object.keys(obj);
  var length = keys.length;
  if (length <= 0x0f) {
    this.pack_uint8(0x80 + length);
  } else if (length <= 0xffff) {
    this.bufferBuilder.append(0xde);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff) {
    this.bufferBuilder.append(0xdf);
    this.pack_uint32(length);
  } else {
    throw new Error('Invalid length');
  }
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      this.pack(prop);
      this.pack(obj[prop]);
    }
  }
};

Packer.prototype.pack_uint8 = function (num) {
  this.bufferBuilder.append(num);
};

Packer.prototype.pack_uint16 = function (num) {
  this.bufferBuilder.append(num >> 8);
  this.bufferBuilder.append(num & 0xff);
};

Packer.prototype.pack_uint32 = function (num) {
  var n = num & 0xffffffff;
  this.bufferBuilder.append((n & 0xff000000) >>> 24);
  this.bufferBuilder.append((n & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((n & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((n & 0x000000ff));
};

Packer.prototype.pack_uint64 = function (num) {
  var high = num / Math.pow(2, 32);
  var low = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low & 0xff000000) >>> 24);
  this.bufferBuilder.append((low & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((low & 0x000000ff));
};

Packer.prototype.pack_int8 = function (num) {
  this.bufferBuilder.append(num & 0xff);
};

Packer.prototype.pack_int16 = function (num) {
  this.bufferBuilder.append((num & 0xff00) >> 8);
  this.bufferBuilder.append(num & 0xff);
};

Packer.prototype.pack_int32 = function (num) {
  this.bufferBuilder.append((num >>> 24) & 0xff);
  this.bufferBuilder.append((num & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((num & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((num & 0x000000ff));
};

Packer.prototype.pack_int64 = function (num) {
  var high = Math.floor(num / Math.pow(2, 32));
  var low = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low & 0xff000000) >>> 24);
  this.bufferBuilder.append((low & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((low & 0x000000ff));
};

function _utf8Replace (m) {
  var code = m.charCodeAt(0);

  if (code <= 0x7ff) return '00';
  if (code <= 0xffff) return '000';
  if (code <= 0x1fffff) return '0000';
  if (code <= 0x3ffffff) return '00000';
  return '000000';
}

function utf8Length (str) {
  if (str.length > 600) {
    // Blob method faster for large strings
    return (new Blob([str])).size;
  } else {
    return str.replace(/[^\u0000-\u007F]/g, _utf8Replace).length;
  }
}

},{"./bufferbuilder":"EgBh"}],"I31f":[function(require,module,exports) {
"use strict"; // import { webRTCAdapter } from './adapter';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Supports = new (
/** @class */
function () {
  function class_1() {
    this.isIOS = ['iPad', 'iPhone', 'iPod'].includes(navigator.platform);
    this.supportedBrowsers = ['firefox', 'chrome', 'safari'];
    this.minFirefoxVersion = 59;
    this.minChromeVersion = 72;
    this.minSafariVersion = 605;
  }

  class_1.prototype.isWebRTCSupported = function () {
    return typeof RTCPeerConnection !== 'undefined';
  };

  ;

  class_1.prototype.isBrowserSupported = function () {
    return true; //
    // const browser = this.getBrowser();
    // const version = this.getVersion();
    //
    // const validBrowser = this.supportedBrowsers.includes(browser);
    //
    // if (!validBrowser) return false;
    //
    // if (browser === 'chrome') return version >= this.minChromeVersion;
    // if (browser === 'firefox') return version >= this.minFirefoxVersion;
    // if (browser === 'safari') return !this.isIOS && version >= this.minSafariVersion;

    return false;
  };

  class_1.prototype.getBrowser = function () {
    return 'chrome'; // return webRTCAdapter.browserDetails.browser;
  };

  class_1.prototype.getVersion = function () {
    return 80; // return webRTCAdapter.browserDetails.version || 0;
  };

  class_1.prototype.isUnifiedPlanSupported = function () {// return true;
    // const browser = this.getBrowser();
    // const version = webRTCAdapter.browserDetails.version || 0;
    //
    // if (browser === 'chrome' && version < 72) return false;
    // if (browser === 'firefox' && version >= 59) return true;
    // if (!window.RTCRtpTransceiver || !('currentDirection' in RTCRtpTransceiver.prototype)) return false;
    //
    // let tempPc: RTCPeerConnection;
    // let supported = false;
    //
    // try {
    //   tempPc = new RTCPeerConnection();
    //   tempPc.addTransceiver('audio');
    //   supported = true;
    // } catch (e) { }
    // finally {
    //   if (tempPc) {
    //     tempPc.close();
    //   }
    // }
    //
    // return supported;
  };

  class_1.prototype.toString = function () {
    return "Supports: \n    browser:" + this.getBrowser() + " \n    version:" + this.getVersion() + " \n    isIOS:" + this.isIOS + " \n    isWebRTCSupported:" + this.isWebRTCSupported() + " \n    isBrowserSupported:" + this.isBrowserSupported() + " \n    isUnifiedPlanSupported:" + this.isUnifiedPlanSupported();
  };

  return class_1;
}())();
},{}],"BHXf":[function(require,module,exports) {
"use strict";

var __importStar = this && this.__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) {
    if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
  }
  result["default"] = mod;
  return result;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var BinaryPack = __importStar(require("peerjs-js-binarypack"));

var supports_1 = require("./supports");

var DEFAULT_CONFIG = {
  iceServers: [{
    urls: "stun:stun.l.google.com:19302"
  }, {
    urls: "turn:0.peerjs.com:3478",
    username: "peerjs",
    credential: "peerjsp"
  }],
  sdpSemantics: "unified-plan"
};
exports.util = new (
/** @class */
function () {
  function class_1() {
    this.CLOUD_HOST = "0.peerjs.com";
    this.CLOUD_PORT = 443; // Browsers that need chunking:

    this.chunkedBrowsers = {
      Chrome: 1,
      chrome: 1
    };
    this.chunkedMTU = 16300; // The original 60000 bytes setting does not work when sending data from Firefox to Chrome, which is "cut off" after 16384 bytes and delivered individually.
    // Returns browser-agnostic default config

    this.defaultConfig = DEFAULT_CONFIG;
    this.browser = supports_1.Supports.getBrowser();
    this.browserVersion = supports_1.Supports.getVersion(); // Lists which features are supported

    this.supports = function () {
      var supported = {
        browser: supports_1.Supports.isBrowserSupported(),
        webRTC: supports_1.Supports.isWebRTCSupported(),
        audioVideo: false,
        data: false,
        binaryBlob: false,
        reliable: false
      };
      if (!supported.webRTC) return supported;
      var pc;

      try {
        pc = new RTCPeerConnection(DEFAULT_CONFIG);
        supported.audioVideo = true;
        var dc = void 0;

        try {
          dc = pc.createDataChannel("_PEERJSTEST", {
            ordered: true
          });
          supported.data = true;
          supported.reliable = !!dc.ordered; // Binary test

          try {
            dc.binaryType = "blob";
            supported.binaryBlob = !supports_1.Supports.isIOS;
          } catch (e) {}
        } catch (e) {} finally {
          if (dc) {
            dc.close();
          }
        }
      } catch (e) {} finally {
        if (pc) {
          pc.close();
        }
      }

      return supported;
    }();

    this.pack = BinaryPack.pack;
    this.unpack = BinaryPack.unpack; // Binary stuff

    this._dataCount = 1;
  }

  class_1.prototype.noop = function () {}; // Ensure alphanumeric ids


  class_1.prototype.validateId = function (id) {
    // Allow empty ids
    return !id || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(id);
  };

  class_1.prototype.chunk = function (blob) {
    var chunks = [];
    var size = blob.size;
    var total = Math.ceil(size / exports.util.chunkedMTU);
    var index = 0;
    var start = 0;

    while (start < size) {
      var end = Math.min(size, start + exports.util.chunkedMTU);
      var b = blob.slice(start, end);
      var chunk = {
        __peerData: this._dataCount,
        n: index,
        data: b,
        total: total
      };
      chunks.push(chunk);
      start = end;
      index++;
    }

    this._dataCount++;
    return chunks;
  };

  class_1.prototype.blobToArrayBuffer = function (blob, cb) {
    var fr = new FileReader();

    fr.onload = function (evt) {
      if (evt.target) {
        cb(evt.target.result);
      }
    };

    fr.readAsArrayBuffer(blob);
    return fr;
  };

  class_1.prototype.binaryStringToArrayBuffer = function (binary) {
    var byteArray = new Uint8Array(binary.length);

    for (var i = 0; i < binary.length; i++) {
      byteArray[i] = binary.charCodeAt(i) & 0xff;
    }

    return byteArray.buffer;
  };

  class_1.prototype.randomToken = function () {
    return Math.random().toString(36).substr(2);
  };

  class_1.prototype.isSecure = function () {
    return location.protocol === "https:";
  };

  return class_1;
}())();
},{"peerjs-js-binarypack":"kdPp","./supports":"I31f"}],"JJlS":[function(require,module,exports) {
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],"WOs9":[function(require,module,exports) {
"use strict";

var __read = this && this.__read || function (o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o),
      r,
      ar = [],
      e;

  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) {
      ar.push(r.value);
    }
  } catch (error) {
    e = {
      error: error
    };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }

  return ar;
};

var __spread = this && this.__spread || function () {
  for (var ar = [], i = 0; i < arguments.length; i++) {
    ar = ar.concat(__read(arguments[i]));
  }

  return ar;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});
var LOG_PREFIX = 'PeerJS: ';
/*
Prints log messages depending on the debug level passed in. Defaults to 0.
0  Prints no logs.
1  Prints only errors.
2  Prints errors and warnings.
3  Prints all logs.
*/

var LogLevel;

(function (LogLevel) {
  LogLevel[LogLevel["Disabled"] = 0] = "Disabled";
  LogLevel[LogLevel["Errors"] = 1] = "Errors";
  LogLevel[LogLevel["Warnings"] = 2] = "Warnings";
  LogLevel[LogLevel["All"] = 3] = "All";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));

var Logger =
/** @class */
function () {
  function Logger() {
    this._logLevel = LogLevel.Disabled;
  }

  Object.defineProperty(Logger.prototype, "logLevel", {
    get: function get() {
      return this._logLevel;
    },
    set: function set(logLevel) {
      this._logLevel = logLevel;
    },
    enumerable: true,
    configurable: true
  });

  Logger.prototype.log = function () {
    var args = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }

    if (this._logLevel >= LogLevel.All) {
      this._print.apply(this, __spread([LogLevel.All], args));
    }
  };

  Logger.prototype.warn = function () {
    var args = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }

    if (this._logLevel >= LogLevel.Warnings) {
      this._print.apply(this, __spread([LogLevel.Warnings], args));
    }
  };

  Logger.prototype.error = function () {
    var args = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }

    if (this._logLevel >= LogLevel.Errors) {
      this._print.apply(this, __spread([LogLevel.Errors], args));
    }
  };

  Logger.prototype.setLogFunction = function (fn) {
    this._print = fn;
  };

  Logger.prototype._print = function (logLevel) {
    var rest = [];

    for (var _i = 1; _i < arguments.length; _i++) {
      rest[_i - 1] = arguments[_i];
    }

    var copy = __spread([LOG_PREFIX], rest);

    for (var i in copy) {
      if (copy[i] instanceof Error) {
        copy[i] = "(" + copy[i].name + ") " + copy[i].message;
      }
    }

    if (logLevel >= LogLevel.All) {
      console.log.apply(console, __spread(copy));
    } else if (logLevel >= LogLevel.Warnings) {
      console.warn.apply(console, __spread(["WARNING"], copy));
    } else if (logLevel >= LogLevel.Errors) {
      console.error.apply(console, __spread(["ERROR"], copy));
    }
  };

  return Logger;
}();

exports.default = new Logger();
},{}],"ZRYf":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var ConnectionEventType;

(function (ConnectionEventType) {
  ConnectionEventType["Open"] = "open";
  ConnectionEventType["Stream"] = "stream";
  ConnectionEventType["Data"] = "data";
  ConnectionEventType["Close"] = "close";
  ConnectionEventType["Error"] = "error";
  ConnectionEventType["IceStateChanged"] = "iceStateChanged";
})(ConnectionEventType = exports.ConnectionEventType || (exports.ConnectionEventType = {}));

var ConnectionType;

(function (ConnectionType) {
  ConnectionType["Data"] = "data";
  ConnectionType["Media"] = "media";
})(ConnectionType = exports.ConnectionType || (exports.ConnectionType = {}));

var PeerEventType;

(function (PeerEventType) {
  PeerEventType["Open"] = "open";
  PeerEventType["Close"] = "close";
  PeerEventType["Connection"] = "connection";
  PeerEventType["Call"] = "call";
  PeerEventType["Disconnected"] = "disconnected";
  PeerEventType["Error"] = "error";
})(PeerEventType = exports.PeerEventType || (exports.PeerEventType = {}));

var PeerErrorType;

(function (PeerErrorType) {
  PeerErrorType["BrowserIncompatible"] = "browser-incompatible";
  PeerErrorType["Disconnected"] = "disconnected";
  PeerErrorType["InvalidID"] = "invalid-id";
  PeerErrorType["InvalidKey"] = "invalid-key";
  PeerErrorType["Network"] = "network";
  PeerErrorType["PeerUnavailable"] = "peer-unavailable";
  PeerErrorType["SslUnavailable"] = "ssl-unavailable";
  PeerErrorType["ServerError"] = "server-error";
  PeerErrorType["SocketError"] = "socket-error";
  PeerErrorType["SocketClosed"] = "socket-closed";
  PeerErrorType["UnavailableID"] = "unavailable-id";
  PeerErrorType["WebRTC"] = "webrtc";
})(PeerErrorType = exports.PeerErrorType || (exports.PeerErrorType = {}));

var SerializationType;

(function (SerializationType) {
  SerializationType["Binary"] = "binary";
  SerializationType["BinaryUTF8"] = "binary-utf8";
  SerializationType["JSON"] = "json";
})(SerializationType = exports.SerializationType || (exports.SerializationType = {}));

var SocketEventType;

(function (SocketEventType) {
  SocketEventType["Message"] = "message";
  SocketEventType["Disconnected"] = "disconnected";
  SocketEventType["Error"] = "error";
  SocketEventType["Close"] = "close";
})(SocketEventType = exports.SocketEventType || (exports.SocketEventType = {}));

var ServerMessageType;

(function (ServerMessageType) {
  ServerMessageType["Heartbeat"] = "HEARTBEAT";
  ServerMessageType["Candidate"] = "CANDIDATE";
  ServerMessageType["Offer"] = "OFFER";
  ServerMessageType["Answer"] = "ANSWER";
  ServerMessageType["Open"] = "OPEN";
  ServerMessageType["Error"] = "ERROR";
  ServerMessageType["IdTaken"] = "ID-TAKEN";
  ServerMessageType["InvalidKey"] = "INVALID-KEY";
  ServerMessageType["Leave"] = "LEAVE";
  ServerMessageType["Expire"] = "EXPIRE";
  ServerMessageType["Logic"] = "LOGIC";
})(ServerMessageType = exports.ServerMessageType || (exports.ServerMessageType = {}));
},{}],"wJlv":[function(require,module,exports) {
"use strict";

var __extends = this && this.__extends || function () {
  var _extendStatics = function extendStatics(d, b) {
    _extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) {
        if (b.hasOwnProperty(p)) d[p] = b[p];
      }
    };

    return _extendStatics(d, b);
  };

  return function (d, b) {
    _extendStatics(d, b);

    function __() {
      this.constructor = d;
    }

    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();

var __read = this && this.__read || function (o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o),
      r,
      ar = [],
      e;

  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) {
      ar.push(r.value);
    }
  } catch (error) {
    e = {
      error: error
    };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }

  return ar;
};

var __spread = this && this.__spread || function () {
  for (var ar = [], i = 0; i < arguments.length; i++) {
    ar = ar.concat(__read(arguments[i]));
  }

  return ar;
};

var __values = this && this.__values || function (o) {
  var s = typeof Symbol === "function" && Symbol.iterator,
      m = s && o[s],
      i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function next() {
      if (o && i >= o.length) o = void 0;
      return {
        value: o && o[i++],
        done: !o
      };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var eventemitter3_1 = require("eventemitter3");

var logger_1 = __importDefault(require("./logger"));

var enums_1 = require("./enums");
/**
 * An abstraction on top of WebSockets to provide fastest
 * possible connection for peers.
 */


var Socket =
/** @class */
function (_super) {
  __extends(Socket, _super);

  function Socket(secure, host, port, path, key, pingInterval) {
    if (pingInterval === void 0) {
      pingInterval = 5000;
    }

    var _this = _super.call(this) || this;

    _this.pingInterval = pingInterval;
    _this._disconnected = true;
    _this._messagesQueue = [];
    var wsProtocol = secure ? "wss://" : "ws://";
    _this._baseUrl = wsProtocol + host + ":" + port + path + "peerjs?key=" + key;
    return _this;
  }

  Socket.prototype.start = function (id, token) {
    var _this = this;

    this._id = id;
    var wsUrl = this._baseUrl + "&id=" + id + "&token=" + token;

    if (!!this._socket || !this._disconnected) {
      return;
    }

    this._socket = new WebSocket(wsUrl);
    this._disconnected = false;

    this._socket.onmessage = function (event) {
      var data;

      try {
        data = JSON.parse(event.data);
        logger_1.default.log("Server message received:", data);
      } catch (e) {
        logger_1.default.log("Invalid server message", event.data);
        return;
      }

      _this.emit(enums_1.SocketEventType.Message, data);
    };

    this._socket.onclose = function (event) {
      if (_this._disconnected) {
        return;
      }

      logger_1.default.log("Socket closed.", event);

      _this._cleanup();

      _this._disconnected = true;

      _this.emit(enums_1.SocketEventType.Disconnected);
    }; // Take care of the queue of connections if necessary and make sure Peer knows
    // socket is open.


    this._socket.onopen = function () {
      if (_this._disconnected) {
        return;
      }

      _this._sendQueuedMessages();

      logger_1.default.log("Socket open");

      _this._scheduleHeartbeat();
    };
  };

  Socket.prototype._scheduleHeartbeat = function () {
    var _this = this;

    this._wsPingTimer = setTimeout(function () {
      _this._sendHeartbeat();
    }, this.pingInterval);
  };

  Socket.prototype._sendHeartbeat = function () {
    if (!this._wsOpen()) {
      logger_1.default.log("Cannot send heartbeat, because socket closed");
      return;
    }

    var message = JSON.stringify({
      type: enums_1.ServerMessageType.Heartbeat
    });

    this._socket.send(message);

    this._scheduleHeartbeat();
  };
  /** Is the websocket currently open? */


  Socket.prototype._wsOpen = function () {
    return !!this._socket && this._socket.readyState === 1;
  };
  /** Send queued messages. */


  Socket.prototype._sendQueuedMessages = function () {
    var e_1, _a; //Create copy of queue and clear it,
    //because send method push the message back to queue if smth will go wrong


    var copiedQueue = __spread(this._messagesQueue);

    this._messagesQueue = [];

    try {
      for (var copiedQueue_1 = __values(copiedQueue), copiedQueue_1_1 = copiedQueue_1.next(); !copiedQueue_1_1.done; copiedQueue_1_1 = copiedQueue_1.next()) {
        var message = copiedQueue_1_1.value;
        this.send(message);
      }
    } catch (e_1_1) {
      e_1 = {
        error: e_1_1
      };
    } finally {
      try {
        if (copiedQueue_1_1 && !copiedQueue_1_1.done && (_a = copiedQueue_1.return)) _a.call(copiedQueue_1);
      } finally {
        if (e_1) throw e_1.error;
      }
    }
  };
  /** Exposed send for DC & Peer. */


  Socket.prototype.send = function (data) {
    if (this._disconnected) {
      return;
    } // If we didn't get an ID yet, we can't yet send anything so we should queue
    // up these messages.


    if (!this._id) {
      this._messagesQueue.push(data);

      return;
    }

    if (!data.type) {
      this.emit(enums_1.SocketEventType.Error, "Invalid message");
      return;
    }

    if (!this._wsOpen()) {
      return;
    }

    var message = JSON.stringify(data);

    this._socket.send(message);
  };

  Socket.prototype.close = function () {
    if (this._disconnected) {
      return;
    }

    this._cleanup();

    this._disconnected = true;
  };

  Socket.prototype._cleanup = function () {
    if (!!this._socket) {
      this._socket.onopen = this._socket.onmessage = this._socket.onclose = null;

      this._socket.close();

      this._socket = undefined;
    }

    clearTimeout(this._wsPingTimer);
  };

  return Socket;
}(eventemitter3_1.EventEmitter);

exports.Socket = Socket;
},{"eventemitter3":"JJlS","./logger":"WOs9","./enums":"ZRYf"}],"HCdX":[function(require,module,exports) {
"use strict";

var __assign = this && this.__assign || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];

      for (var p in s) {
        if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
    }

    return t;
  };

  return __assign.apply(this, arguments);
};

var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
    label: 0,
    sent: function sent() {
      if (t[0] & 1) throw t[1];
      return t[1];
    },
    trys: [],
    ops: []
  },
      f,
      y,
      t,
      g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;

  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }

  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");

    while (_) {
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];

        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;

          case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;

          case 7:
            op = _.ops.pop();

            _.trys.pop();

            continue;

          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }

            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }

            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }

            if (t && _.label < t[2]) {
              _.label = t[2];

              _.ops.push(op);

              break;
            }

            if (t[2]) _.ops.pop();

            _.trys.pop();

            continue;
        }

        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    }

    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var util_1 = require("./util");

var logger_1 = __importDefault(require("./logger"));

var enums_1 = require("./enums");
/**
 * Manages all negotiations between Peers.
 */


var Negotiator =
/** @class */
function () {
  function Negotiator(connection) {
    this.connection = connection;
  }
  /** Returns a PeerConnection object set up correctly (for data, media). */


  Negotiator.prototype.startConnection = function (options) {
    var peerConnection = this._startPeerConnection(); // Set the connection's PC.


    this.connection.peerConnection = peerConnection;

    if (this.connection.type === enums_1.ConnectionType.Media && options._stream) {
      this._addTracksToConnection(options._stream, peerConnection);
    } // What do we need to do now?


    if (options.originator) {
      if (this.connection.type === enums_1.ConnectionType.Data) {
        var dataConnection = this.connection;
        var config = {
          ordered: !!options.reliable
        };
        var dataChannel = peerConnection.createDataChannel(dataConnection.label, config);
        dataConnection.initialize(dataChannel);
      }

      this._makeOffer();
    } else {
      this.handleSDP("OFFER", options.sdp);
    }
  };
  /** Start a PC. */


  Negotiator.prototype._startPeerConnection = function () {
    logger_1.default.log("Creating RTCPeerConnection.");
    var peerConnection = new RTCPeerConnection(this.connection.provider.options.config);

    this._setupListeners(peerConnection);

    return peerConnection;
  };
  /** Set up various WebRTC listeners. */


  Negotiator.prototype._setupListeners = function (peerConnection) {
    var _this = this;

    var peerId = this.connection.peer;
    var connectionId = this.connection.connectionId;
    var connectionType = this.connection.type;
    var provider = this.connection.provider; // ICE CANDIDATES.

    logger_1.default.log("Listening for ICE candidates.");

    peerConnection.onicecandidate = function (evt) {
      if (!evt.candidate || !evt.candidate.candidate) return;
      logger_1.default.log("Received ICE candidates for " + peerId + ":", evt.candidate);
      provider.socket.send({
        type: enums_1.ServerMessageType.Candidate,
        payload: {
          candidate: evt.candidate,
          type: connectionType,
          connectionId: connectionId
        },
        dst: peerId
      });
    };

    peerConnection.oniceconnectionstatechange = function () {
      switch (peerConnection.iceConnectionState) {
        case "failed":
          logger_1.default.log("iceConnectionState is failed, closing connections to " + peerId);

          _this.connection.emit(enums_1.ConnectionEventType.Error, new Error("Negotiation of connection to " + peerId + " failed."));

          _this.connection.close();

          break;

        case "closed":
          logger_1.default.log("iceConnectionState is closed, closing connections to " + peerId);

          _this.connection.emit(enums_1.ConnectionEventType.Error, new Error("Connection to " + peerId + " closed."));

          _this.connection.close();

          break;

        case "disconnected":
          logger_1.default.log("iceConnectionState is disconnected, closing connections to " + peerId);

          _this.connection.emit(enums_1.ConnectionEventType.Error, new Error("Connection to " + peerId + " disconnected."));

          _this.connection.close();

          break;

        case "completed":
          peerConnection.onicecandidate = util_1.util.noop;
          break;
      }

      _this.connection.emit(enums_1.ConnectionEventType.IceStateChanged, peerConnection.iceConnectionState);
    }; // DATACONNECTION.


    logger_1.default.log("Listening for data channel"); // Fired between offer and answer, so options should already be saved
    // in the options hash.

    peerConnection.ondatachannel = function (evt) {
      logger_1.default.log("Received data channel");
      var dataChannel = evt.channel;
      var connection = provider.getConnection(peerId, connectionId);
      connection.initialize(dataChannel);
    }; // MEDIACONNECTION.


    logger_1.default.log("Listening for remote stream");

    peerConnection.ontrack = function (evt) {
      logger_1.default.log("Received remote stream");
      var stream = evt.streams[0];
      var connection = provider.getConnection(peerId, connectionId);

      if (connection.type === enums_1.ConnectionType.Media) {
        var mediaConnection = connection;

        _this._addStreamToMediaConnection(stream, mediaConnection);
      }
    };
  };

  Negotiator.prototype.cleanup = function () {
    logger_1.default.log("Cleaning up PeerConnection to " + this.connection.peer);
    var peerConnection = this.connection.peerConnection;

    if (!peerConnection) {
      return;
    }

    this.connection.peerConnection = null; //unsubscribe from all PeerConnection's events

    peerConnection.onicecandidate = peerConnection.oniceconnectionstatechange = peerConnection.ondatachannel = peerConnection.ontrack = function () {};

    var peerConnectionNotClosed = peerConnection.signalingState !== "closed";
    var dataChannelNotClosed = false;

    if (this.connection.type === enums_1.ConnectionType.Data) {
      var dataConnection = this.connection;
      var dataChannel = dataConnection.dataChannel;

      if (dataChannel) {
        dataChannelNotClosed = !!dataChannel.readyState && dataChannel.readyState !== "closed";
      }
    }

    if (peerConnectionNotClosed || dataChannelNotClosed) {
      peerConnection.close();
    }
  };

  Negotiator.prototype._makeOffer = function () {
    return __awaiter(this, void 0, Promise, function () {
      var peerConnection, provider, offer, payload, dataConnection, err_2, err_1_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            peerConnection = this.connection.peerConnection;
            provider = this.connection.provider;
            _a.label = 1;

          case 1:
            _a.trys.push([1, 7,, 8]);

            return [4
            /*yield*/
            , peerConnection.createOffer(this.connection.options.constraints)];

          case 2:
            offer = _a.sent();
            logger_1.default.log("Created offer.");

            if (this.connection.options.sdpTransform && typeof this.connection.options.sdpTransform === 'function') {
              offer.sdp = this.connection.options.sdpTransform(offer.sdp) || offer.sdp;
            }

            _a.label = 3;

          case 3:
            _a.trys.push([3, 5,, 6]);

            return [4
            /*yield*/
            , peerConnection.setLocalDescription(offer)];

          case 4:
            _a.sent();

            logger_1.default.log("Set localDescription:", offer, "for:" + this.connection.peer);
            payload = {
              sdp: offer,
              type: this.connection.type,
              connectionId: this.connection.connectionId,
              metadata: this.connection.metadata,
              browser: util_1.util.browser
            };

            if (this.connection.type === enums_1.ConnectionType.Data) {
              dataConnection = this.connection;
              payload = __assign(__assign({}, payload), {
                label: dataConnection.label,
                reliable: dataConnection.reliable,
                serialization: dataConnection.serialization
              });
            }

            provider.socket.send({
              type: enums_1.ServerMessageType.Offer,
              payload: payload,
              dst: this.connection.peer
            });
            return [3
            /*break*/
            , 6];

          case 5:
            err_2 = _a.sent(); // TODO: investigate why _makeOffer is being called from the answer

            if (err_2 != "OperationError: Failed to set local offer sdp: Called in wrong state: kHaveRemoteOffer") {
              provider.emitError(enums_1.PeerErrorType.WebRTC, err_2);
              logger_1.default.log("Failed to setLocalDescription, ", err_2);
            }

            return [3
            /*break*/
            , 6];

          case 6:
            return [3
            /*break*/
            , 8];

          case 7:
            err_1_1 = _a.sent();
            provider.emitError(enums_1.PeerErrorType.WebRTC, err_1_1);
            logger_1.default.log("Failed to createOffer, ", err_1_1);
            return [3
            /*break*/
            , 8];

          case 8:
            return [2
            /*return*/
            ];
        }
      });
    });
  };

  Negotiator.prototype._makeAnswer = function () {
    return __awaiter(this, void 0, Promise, function () {
      var peerConnection, provider, answer, err_3, err_1_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            peerConnection = this.connection.peerConnection;
            provider = this.connection.provider;
            _a.label = 1;

          case 1:
            _a.trys.push([1, 7,, 8]);

            return [4
            /*yield*/
            , peerConnection.createAnswer()];

          case 2:
            answer = _a.sent();
            logger_1.default.log("Created answer.");

            if (this.connection.options.sdpTransform && typeof this.connection.options.sdpTransform === 'function') {
              answer.sdp = this.connection.options.sdpTransform(answer.sdp) || answer.sdp;
            }

            _a.label = 3;

          case 3:
            _a.trys.push([3, 5,, 6]);

            return [4
            /*yield*/
            , peerConnection.setLocalDescription(answer)];

          case 4:
            _a.sent();

            logger_1.default.log("Set localDescription:", answer, "for:" + this.connection.peer);
            provider.socket.send({
              type: enums_1.ServerMessageType.Answer,
              payload: {
                sdp: answer,
                type: this.connection.type,
                connectionId: this.connection.connectionId,
                browser: util_1.util.browser
              },
              dst: this.connection.peer
            });
            return [3
            /*break*/
            , 6];

          case 5:
            err_3 = _a.sent();
            provider.emitError(enums_1.PeerErrorType.WebRTC, err_3);
            logger_1.default.log("Failed to setLocalDescription, ", err_3);
            return [3
            /*break*/
            , 6];

          case 6:
            return [3
            /*break*/
            , 8];

          case 7:
            err_1_2 = _a.sent();
            provider.emitError(enums_1.PeerErrorType.WebRTC, err_1_2);
            logger_1.default.log("Failed to create answer, ", err_1_2);
            return [3
            /*break*/
            , 8];

          case 8:
            return [2
            /*return*/
            ];
        }
      });
    });
  };
  /** Handle an SDP. */


  Negotiator.prototype.handleSDP = function (type, sdp) {
    return __awaiter(this, void 0, Promise, function () {
      var peerConnection, provider, self, err_4;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            sdp = new RTCSessionDescription(sdp);
            peerConnection = this.connection.peerConnection;
            provider = this.connection.provider;
            logger_1.default.log("Setting remote description", sdp);
            self = this;
            _a.label = 1;

          case 1:
            _a.trys.push([1, 5,, 6]);

            return [4
            /*yield*/
            , peerConnection.setRemoteDescription(sdp)];

          case 2:
            _a.sent();

            logger_1.default.log("Set remoteDescription:" + type + " for:" + this.connection.peer);
            if (!(type === "OFFER")) return [3
            /*break*/
            , 4];
            return [4
            /*yield*/
            , self._makeAnswer()];

          case 3:
            _a.sent();

            _a.label = 4;

          case 4:
            return [3
            /*break*/
            , 6];

          case 5:
            err_4 = _a.sent();
            provider.emitError(enums_1.PeerErrorType.WebRTC, err_4);
            logger_1.default.log("Failed to setRemoteDescription, ", err_4);
            return [3
            /*break*/
            , 6];

          case 6:
            return [2
            /*return*/
            ];
        }
      });
    });
  };
  /** Handle a candidate. */


  Negotiator.prototype.handleCandidate = function (ice) {
    return __awaiter(this, void 0, Promise, function () {
      var candidate, sdpMLineIndex, sdpMid, peerConnection, provider, err_5;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            logger_1.default.log("handleCandidate:", ice);
            candidate = ice.candidate;
            sdpMLineIndex = ice.sdpMLineIndex;
            sdpMid = ice.sdpMid;
            peerConnection = this.connection.peerConnection;
            provider = this.connection.provider;
            _a.label = 1;

          case 1:
            _a.trys.push([1, 3,, 4]);

            return [4
            /*yield*/
            , peerConnection.addIceCandidate(new RTCIceCandidate({
              sdpMid: sdpMid,
              sdpMLineIndex: sdpMLineIndex,
              candidate: candidate
            }))];

          case 2:
            _a.sent();

            logger_1.default.log("Added ICE candidate for:" + this.connection.peer);
            return [3
            /*break*/
            , 4];

          case 3:
            err_5 = _a.sent();
            provider.emitError(enums_1.PeerErrorType.WebRTC, err_5);
            logger_1.default.log("Failed to handleCandidate, ", err_5);
            return [3
            /*break*/
            , 4];

          case 4:
            return [2
            /*return*/
            ];
        }
      });
    });
  };

  Negotiator.prototype._addTracksToConnection = function (stream, peerConnection) {
    logger_1.default.log("add tracks from stream " + stream.id + " to peer connection");

    if (!peerConnection.addTrack) {
      return logger_1.default.error("Your browser does't support RTCPeerConnection#addTrack. Ignored.");
    }

    stream.getTracks().forEach(function (track) {
      peerConnection.addTrack(track, stream);
    });
  };

  Negotiator.prototype._addStreamToMediaConnection = function (stream, mediaConnection) {
    logger_1.default.log("add stream " + stream.id + " to media connection " + mediaConnection.connectionId);
    mediaConnection.addStream(stream);
  };

  return Negotiator;
}();

exports.Negotiator = Negotiator;
},{"./util":"BHXf","./logger":"WOs9","./enums":"ZRYf"}],"tQFK":[function(require,module,exports) {
"use strict";

var __extends = this && this.__extends || function () {
  var _extendStatics = function extendStatics(d, b) {
    _extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) {
        if (b.hasOwnProperty(p)) d[p] = b[p];
      }
    };

    return _extendStatics(d, b);
  };

  return function (d, b) {
    _extendStatics(d, b);

    function __() {
      this.constructor = d;
    }

    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var eventemitter3_1 = require("eventemitter3");

var BaseConnection =
/** @class */
function (_super) {
  __extends(BaseConnection, _super);

  function BaseConnection(peer, provider, options) {
    var _this = _super.call(this) || this;

    _this.peer = peer;
    _this.provider = provider;
    _this.options = options;
    _this._open = false;
    _this.metadata = options.metadata;
    return _this;
  }

  Object.defineProperty(BaseConnection.prototype, "open", {
    get: function get() {
      return this._open;
    },
    enumerable: true,
    configurable: true
  });
  return BaseConnection;
}(eventemitter3_1.EventEmitter);

exports.BaseConnection = BaseConnection;
},{"eventemitter3":"JJlS"}],"dbHP":[function(require,module,exports) {
"use strict";

var __extends = this && this.__extends || function () {
  var _extendStatics = function extendStatics(d, b) {
    _extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) {
        if (b.hasOwnProperty(p)) d[p] = b[p];
      }
    };

    return _extendStatics(d, b);
  };

  return function (d, b) {
    _extendStatics(d, b);

    function __() {
      this.constructor = d;
    }

    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();

var __assign = this && this.__assign || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];

      for (var p in s) {
        if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
    }

    return t;
  };

  return __assign.apply(this, arguments);
};

var __values = this && this.__values || function (o) {
  var s = typeof Symbol === "function" && Symbol.iterator,
      m = s && o[s],
      i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function next() {
      if (o && i >= o.length) o = void 0;
      return {
        value: o && o[i++],
        done: !o
      };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var util_1 = require("./util");

var logger_1 = __importDefault(require("./logger"));

var negotiator_1 = require("./negotiator");

var enums_1 = require("./enums");

var baseconnection_1 = require("./baseconnection");
/**
 * Wraps the streaming interface between two Peers.
 */


var MediaConnection =
/** @class */
function (_super) {
  __extends(MediaConnection, _super);

  function MediaConnection(peerId, provider, options) {
    var _this = _super.call(this, peerId, provider, options) || this;

    _this._localStream = _this.options._stream;
    _this.connectionId = _this.options.connectionId || MediaConnection.ID_PREFIX + util_1.util.randomToken();
    _this._negotiator = new negotiator_1.Negotiator(_this);

    if (_this._localStream) {
      _this._negotiator.startConnection({
        _stream: _this._localStream,
        originator: true
      });
    }

    return _this;
  }

  Object.defineProperty(MediaConnection.prototype, "type", {
    get: function get() {
      return enums_1.ConnectionType.Media;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(MediaConnection.prototype, "localStream", {
    get: function get() {
      return this._localStream;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(MediaConnection.prototype, "remoteStream", {
    get: function get() {
      return this._remoteStream;
    },
    enumerable: true,
    configurable: true
  });

  MediaConnection.prototype.addStream = function (remoteStream) {
    logger_1.default.log("Receiving stream", remoteStream);
    this._remoteStream = remoteStream;

    _super.prototype.emit.call(this, enums_1.ConnectionEventType.Stream, remoteStream); // Should we call this `open`?

  };

  MediaConnection.prototype.handleMessage = function (message) {
    var type = message.type;
    var payload = message.payload;

    switch (message.type) {
      case enums_1.ServerMessageType.Answer:
        // Forward to negotiator
        this._negotiator.handleSDP(type, payload.sdp);

        this._open = true;
        break;

      case enums_1.ServerMessageType.Candidate:
        this._negotiator.handleCandidate(payload.candidate);

        break;

      default:
        logger_1.default.warn("Unrecognized message type:" + type + " from peer:" + this.peer);
        break;
    }
  };

  MediaConnection.prototype.answer = function (stream, options) {
    var e_1, _a;

    if (options === void 0) {
      options = {};
    }

    if (this._localStream) {
      logger_1.default.warn("Local stream already exists on this MediaConnection. Are you answering a call twice?");
      return;
    }

    this._localStream = stream;

    if (options && options.sdpTransform) {
      this.options.sdpTransform = options.sdpTransform;
    }

    this._negotiator.startConnection(__assign(__assign({}, this.options._payload), {
      _stream: stream
    })); // Retrieve lost messages stored because PeerConnection not set up.


    var messages = this.provider._getMessages(this.connectionId);

    try {
      for (var messages_1 = __values(messages), messages_1_1 = messages_1.next(); !messages_1_1.done; messages_1_1 = messages_1.next()) {
        var message = messages_1_1.value;
        this.handleMessage(message);
      }
    } catch (e_1_1) {
      e_1 = {
        error: e_1_1
      };
    } finally {
      try {
        if (messages_1_1 && !messages_1_1.done && (_a = messages_1.return)) _a.call(messages_1);
      } finally {
        if (e_1) throw e_1.error;
      }
    }

    this._open = true;
  };
  /**
   * Exposed functionality for users.
   */

  /** Allows user to close connection. */


  MediaConnection.prototype.close = function () {
    if (this._negotiator) {
      this._negotiator.cleanup();

      this._negotiator = null;
    }

    this._localStream = null;
    this._remoteStream = null;

    if (this.provider) {
      this.provider._removeConnection(this);

      this.provider = null;
    }

    if (this.options && this.options._stream) {
      this.options._stream = null;
    }

    if (!this.open) {
      return;
    }

    this._open = false;

    _super.prototype.emit.call(this, enums_1.ConnectionEventType.Close);
  };

  MediaConnection.ID_PREFIX = "mc_";
  return MediaConnection;
}(baseconnection_1.BaseConnection);

exports.MediaConnection = MediaConnection;
},{"./util":"BHXf","./logger":"WOs9","./negotiator":"HCdX","./enums":"ZRYf","./baseconnection":"tQFK"}],"GGp6":[function(require,module,exports) {
"use strict";

var __extends = this && this.__extends || function () {
  var _extendStatics = function extendStatics(d, b) {
    _extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) {
        if (b.hasOwnProperty(p)) d[p] = b[p];
      }
    };

    return _extendStatics(d, b);
  };

  return function (d, b) {
    _extendStatics(d, b);

    function __() {
      this.constructor = d;
    }

    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var eventemitter3_1 = require("eventemitter3");

var logger_1 = __importDefault(require("./logger"));

var EncodingQueue =
/** @class */
function (_super) {
  __extends(EncodingQueue, _super);

  function EncodingQueue() {
    var _this = _super.call(this) || this;

    _this.fileReader = new FileReader();
    _this._queue = [];
    _this._processing = false;

    _this.fileReader.onload = function (evt) {
      _this._processing = false;

      if (evt.target) {
        _this.emit('done', evt.target.result);
      }

      _this.doNextTask();
    };

    _this.fileReader.onerror = function (evt) {
      logger_1.default.error("EncodingQueue error:", evt);
      _this._processing = false;

      _this.destroy();

      _this.emit('error', evt);
    };

    return _this;
  }

  Object.defineProperty(EncodingQueue.prototype, "queue", {
    get: function get() {
      return this._queue;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(EncodingQueue.prototype, "size", {
    get: function get() {
      return this.queue.length;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(EncodingQueue.prototype, "processing", {
    get: function get() {
      return this._processing;
    },
    enumerable: true,
    configurable: true
  });

  EncodingQueue.prototype.enque = function (blob) {
    this.queue.push(blob);
    if (this.processing) return;
    this.doNextTask();
  };

  EncodingQueue.prototype.destroy = function () {
    this.fileReader.abort();
    this._queue = [];
  };

  EncodingQueue.prototype.doNextTask = function () {
    if (this.size === 0) return;
    if (this.processing) return;
    this._processing = true;
    this.fileReader.readAsArrayBuffer(this.queue.shift());
  };

  return EncodingQueue;
}(eventemitter3_1.EventEmitter);

exports.EncodingQueue = EncodingQueue;
},{"eventemitter3":"JJlS","./logger":"WOs9"}],"GBTQ":[function(require,module,exports) {
"use strict";

var __extends = this && this.__extends || function () {
  var _extendStatics = function extendStatics(d, b) {
    _extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) {
        if (b.hasOwnProperty(p)) d[p] = b[p];
      }
    };

    return _extendStatics(d, b);
  };

  return function (d, b) {
    _extendStatics(d, b);

    function __() {
      this.constructor = d;
    }

    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();

var __values = this && this.__values || function (o) {
  var s = typeof Symbol === "function" && Symbol.iterator,
      m = s && o[s],
      i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function next() {
      if (o && i >= o.length) o = void 0;
      return {
        value: o && o[i++],
        done: !o
      };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var util_1 = require("./util");

var logger_1 = __importDefault(require("./logger"));

var negotiator_1 = require("./negotiator");

var enums_1 = require("./enums");

var baseconnection_1 = require("./baseconnection");

var encodingQueue_1 = require("./encodingQueue");
/**
 * Wraps a DataChannel between two Peers.
 */


var DataConnection =
/** @class */
function (_super) {
  __extends(DataConnection, _super);

  function DataConnection(peerId, provider, options) {
    var _this = _super.call(this, peerId, provider, options) || this;

    _this.stringify = JSON.stringify;
    _this.parse = JSON.parse;
    _this._buffer = [];
    _this._bufferSize = 0;
    _this._buffering = false;
    _this._chunkedData = {};
    _this._encodingQueue = new encodingQueue_1.EncodingQueue();
    _this.connectionId = _this.options.connectionId || DataConnection.ID_PREFIX + util_1.util.randomToken();
    _this.label = _this.options.label || _this.connectionId;
    _this.serialization = _this.options.serialization || enums_1.SerializationType.Binary;
    _this.reliable = !!_this.options.reliable;

    _this._encodingQueue.on('done', function (ab) {
      _this._bufferedSend(ab);
    });

    _this._encodingQueue.on('error', function () {
      logger_1.default.error("DC#" + _this.connectionId + ": Error occured in encoding from blob to arraybuffer, close DC");

      _this.close();
    });

    _this._negotiator = new negotiator_1.Negotiator(_this);

    _this._negotiator.startConnection(_this.options._payload || {
      originator: true
    });

    return _this;
  }

  Object.defineProperty(DataConnection.prototype, "type", {
    get: function get() {
      return enums_1.ConnectionType.Data;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(DataConnection.prototype, "dataChannel", {
    get: function get() {
      return this._dc;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(DataConnection.prototype, "bufferSize", {
    get: function get() {
      return this._bufferSize;
    },
    enumerable: true,
    configurable: true
  });
  /** Called by the Negotiator when the DataChannel is ready. */

  DataConnection.prototype.initialize = function (dc) {
    this._dc = dc;

    this._configureDataChannel();
  };

  DataConnection.prototype._configureDataChannel = function () {
    var _this = this;

    if (!util_1.util.supports.binaryBlob || util_1.util.supports.reliable) {
      this.dataChannel.binaryType = "arraybuffer";
    }

    this.dataChannel.onopen = function () {
      logger_1.default.log("DC#" + _this.connectionId + " dc connection success");
      _this._open = true;

      _this.emit(enums_1.ConnectionEventType.Open);
    };

    this.dataChannel.onmessage = function (e) {
      logger_1.default.log("DC#" + _this.connectionId + " dc onmessage:", e.data);

      _this._handleDataMessage(e);
    };

    this.dataChannel.onclose = function () {
      logger_1.default.log("DC#" + _this.connectionId + " dc closed for:", _this.peer);

      _this.close();
    };
  }; // Handles a DataChannel message.


  DataConnection.prototype._handleDataMessage = function (_a) {
    var _this = this;

    var data = _a.data;
    var datatype = data.constructor;
    var isBinarySerialization = this.serialization === enums_1.SerializationType.Binary || this.serialization === enums_1.SerializationType.BinaryUTF8;
    var deserializedData = data;

    if (isBinarySerialization) {
      if (datatype === Blob) {
        // Datatype should never be blob
        util_1.util.blobToArrayBuffer(data, function (ab) {
          var unpackedData = util_1.util.unpack(ab);

          _this.emit(enums_1.ConnectionEventType.Data, unpackedData);
        });
        return;
      } else if (datatype === ArrayBuffer) {
        deserializedData = util_1.util.unpack(data);
      } else if (datatype === String) {
        // String fallback for binary data for browsers that don't support binary yet
        var ab = util_1.util.binaryStringToArrayBuffer(data);
        deserializedData = util_1.util.unpack(ab);
      }
    } else if (this.serialization === enums_1.SerializationType.JSON) {
      deserializedData = this.parse(data);
    } // Check if we've chunked--if so, piece things back together.
    // We're guaranteed that this isn't 0.


    if (deserializedData.__peerData) {
      this._handleChunk(deserializedData);

      return;
    }

    _super.prototype.emit.call(this, enums_1.ConnectionEventType.Data, deserializedData);
  };

  DataConnection.prototype._handleChunk = function (data) {
    var id = data.__peerData;
    var chunkInfo = this._chunkedData[id] || {
      data: [],
      count: 0,
      total: data.total
    };
    chunkInfo.data[data.n] = data.data;
    chunkInfo.count++;
    this._chunkedData[id] = chunkInfo;

    if (chunkInfo.total === chunkInfo.count) {
      // Clean up before making the recursive call to `_handleDataMessage`.
      delete this._chunkedData[id]; // We've received all the chunks--time to construct the complete data.

      var data_1 = new Blob(chunkInfo.data);

      this._handleDataMessage({
        data: data_1
      });
    }
  };
  /**
   * Exposed functionality for users.
   */

  /** Allows user to close connection. */


  DataConnection.prototype.close = function () {
    this._buffer = [];
    this._bufferSize = 0;
    this._chunkedData = {};

    if (this._negotiator) {
      this._negotiator.cleanup();

      this._negotiator = null;
    }

    if (this.provider) {
      this.provider._removeConnection(this);

      this.provider = null;
    }

    if (this.dataChannel) {
      this.dataChannel.onopen = null;
      this.dataChannel.onmessage = null;
      this.dataChannel.onclose = null;
      this._dc = null;
    }

    if (this._encodingQueue) {
      this._encodingQueue.destroy();

      this._encodingQueue.removeAllListeners();

      this._encodingQueue = null;
    }

    if (!this.open) {
      return;
    }

    this._open = false;

    _super.prototype.emit.call(this, enums_1.ConnectionEventType.Close);
  };
  /** Allows user to send data. */


  DataConnection.prototype.send = function (data, chunked) {
    if (!this.open) {
      _super.prototype.emit.call(this, enums_1.ConnectionEventType.Error, new Error("Connection is not open. You should listen for the `open` event before sending messages."));

      return;
    }

    if (this.serialization === enums_1.SerializationType.JSON) {
      this._bufferedSend(this.stringify(data));
    } else if (this.serialization === enums_1.SerializationType.Binary || this.serialization === enums_1.SerializationType.BinaryUTF8) {
      var blob = util_1.util.pack(data);

      if (!chunked && blob.size > util_1.util.chunkedMTU) {
        this._sendChunks(blob);

        return;
      }

      if (!util_1.util.supports.binaryBlob) {
        // We only do this if we really need to (e.g. blobs are not supported),
        // because this conversion is costly.
        this._encodingQueue.enque(blob);
      } else {
        this._bufferedSend(blob);
      }
    } else {
      this._bufferedSend(data);
    }
  };

  DataConnection.prototype._bufferedSend = function (msg) {
    if (this._buffering || !this._trySend(msg)) {
      this._buffer.push(msg);

      this._bufferSize = this._buffer.length;
    }
  }; // Returns true if the send succeeds.


  DataConnection.prototype._trySend = function (msg) {
    var _this = this;

    if (!this.open) {
      return false;
    }

    if (this.dataChannel.bufferedAmount > DataConnection.MAX_BUFFERED_AMOUNT) {
      this._buffering = true;
      setTimeout(function () {
        _this._buffering = false;

        _this._tryBuffer();
      }, 50);
      return false;
    }

    try {
      this.dataChannel.send(msg);
    } catch (e) {
      logger_1.default.error("DC#:" + this.connectionId + " Error when sending:", e);
      this._buffering = true;
      this.close();
      return false;
    }

    return true;
  }; // Try to send the first message in the buffer.


  DataConnection.prototype._tryBuffer = function () {
    if (!this.open) {
      return;
    }

    if (this._buffer.length === 0) {
      return;
    }

    var msg = this._buffer[0];

    if (this._trySend(msg)) {
      this._buffer.shift();

      this._bufferSize = this._buffer.length;

      this._tryBuffer();
    }
  };

  DataConnection.prototype._sendChunks = function (blob) {
    var e_1, _a;

    var blobs = util_1.util.chunk(blob);
    logger_1.default.log("DC#" + this.connectionId + " Try to send " + blobs.length + " chunks...");

    try {
      for (var blobs_1 = __values(blobs), blobs_1_1 = blobs_1.next(); !blobs_1_1.done; blobs_1_1 = blobs_1.next()) {
        var blob_1 = blobs_1_1.value;
        this.send(blob_1, true);
      }
    } catch (e_1_1) {
      e_1 = {
        error: e_1_1
      };
    } finally {
      try {
        if (blobs_1_1 && !blobs_1_1.done && (_a = blobs_1.return)) _a.call(blobs_1);
      } finally {
        if (e_1) throw e_1.error;
      }
    }
  };

  DataConnection.prototype.handleMessage = function (message) {
    var payload = message.payload;

    switch (message.type) {
      case enums_1.ServerMessageType.Answer:
        this._negotiator.handleSDP(message.type, payload.sdp);

        break;

      case enums_1.ServerMessageType.Candidate:
        this._negotiator.handleCandidate(payload.candidate);

        break;

      default:
        logger_1.default.warn("Unrecognized message type:", message.type, "from peer:", this.peer);
        break;
    }
  };

  DataConnection.ID_PREFIX = "dc_";
  DataConnection.MAX_BUFFERED_AMOUNT = 8 * 1024 * 1024;
  return DataConnection;
}(baseconnection_1.BaseConnection);

exports.DataConnection = DataConnection;
},{"./util":"BHXf","./logger":"WOs9","./negotiator":"HCdX","./enums":"ZRYf","./baseconnection":"tQFK","./encodingQueue":"GGp6"}],"in7L":[function(require,module,exports) {
"use strict";

var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
    label: 0,
    sent: function sent() {
      if (t[0] & 1) throw t[1];
      return t[1];
    },
    trys: [],
    ops: []
  },
      f,
      y,
      t,
      g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;

  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }

  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");

    while (_) {
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];

        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;

          case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;

          case 7:
            op = _.ops.pop();

            _.trys.pop();

            continue;

          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }

            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }

            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }

            if (t && _.label < t[2]) {
              _.label = t[2];

              _.ops.push(op);

              break;
            }

            if (t[2]) _.ops.pop();

            _.trys.pop();

            continue;
        }

        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    }

    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var util_1 = require("./util");

var logger_1 = __importDefault(require("./logger"));

var API =
/** @class */
function () {
  function API(_options) {
    this._options = _options;
  }

  API.prototype._buildUrl = function (method) {
    var protocol = this._options.secure ? "https://" : "http://";
    var url = protocol + this._options.host + ":" + this._options.port + this._options.path + this._options.key + "/" + method;
    var queryString = "?ts=" + new Date().getTime() + "" + Math.random();
    url += queryString;
    return url;
  };
  /** Get a unique ID from the server via XHR and initialize with it. */


  API.prototype.retrieveId = function () {
    return __awaiter(this, void 0, Promise, function () {
      var url, response, error_1, pathError;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            url = this._buildUrl("id");
            _a.label = 1;

          case 1:
            _a.trys.push([1, 3,, 4]);

            return [4
            /*yield*/
            , fetch(url)];

          case 2:
            response = _a.sent();

            if (response.status !== 200) {
              throw new Error("Error. Status:" + response.status);
            }

            return [2
            /*return*/
            , response.text()];

          case 3:
            error_1 = _a.sent();
            logger_1.default.error("Error retrieving ID", error_1);
            pathError = "";

            if (this._options.path === "/" && this._options.host !== util_1.util.CLOUD_HOST) {
              pathError = " If you passed in a `path` to your self-hosted PeerServer, " + "you'll also need to pass in that same path when creating a new " + "Peer.";
            }

            throw new Error("Could not get an ID from the server." + pathError);

          case 4:
            return [2
            /*return*/
            ];
        }
      });
    });
  };
  /** @deprecated */


  API.prototype.listAllPeers = function () {
    return __awaiter(this, void 0, Promise, function () {
      var url, response, helpfulError, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            url = this._buildUrl("peers");
            _a.label = 1;

          case 1:
            _a.trys.push([1, 3,, 4]);

            return [4
            /*yield*/
            , fetch(url)];

          case 2:
            response = _a.sent();

            if (response.status !== 200) {
              if (response.status === 401) {
                helpfulError = "";

                if (this._options.host === util_1.util.CLOUD_HOST) {
                  helpfulError = "It looks like you're using the cloud server. You can email " + "team@peerjs.com to enable peer listing for your API key.";
                } else {
                  helpfulError = "You need to enable `allow_discovery` on your self-hosted " + "PeerServer to use this feature.";
                }

                throw new Error("It doesn't look like you have permission to list peers IDs. " + helpfulError);
              }

              throw new Error("Error. Status:" + response.status);
            }

            return [2
            /*return*/
            , response.json()];

          case 3:
            error_2 = _a.sent();
            logger_1.default.error("Error retrieving list peers", error_2);
            throw new Error("Could not get list peers from the server." + error_2);

          case 4:
            return [2
            /*return*/
            ];
        }
      });
    });
  };

  return API;
}();

exports.API = API;
},{"./util":"BHXf","./logger":"WOs9"}],"Hxpd":[function(require,module,exports) {
"use strict";

var __extends = this && this.__extends || function () {
  var _extendStatics = function extendStatics(d, b) {
    _extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) {
        if (b.hasOwnProperty(p)) d[p] = b[p];
      }
    };

    return _extendStatics(d, b);
  };

  return function (d, b) {
    _extendStatics(d, b);

    function __() {
      this.constructor = d;
    }

    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();

var __assign = this && this.__assign || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];

      for (var p in s) {
        if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
    }

    return t;
  };

  return __assign.apply(this, arguments);
};

var __values = this && this.__values || function (o) {
  var s = typeof Symbol === "function" && Symbol.iterator,
      m = s && o[s],
      i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function next() {
      if (o && i >= o.length) o = void 0;
      return {
        value: o && o[i++],
        done: !o
      };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};

var __read = this && this.__read || function (o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o),
      r,
      ar = [],
      e;

  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) {
      ar.push(r.value);
    }
  } catch (error) {
    e = {
      error: error
    };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }

  return ar;
};

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var eventemitter3_1 = require("eventemitter3");

var util_1 = require("./util");

var logger_1 = __importDefault(require("./logger"));

var socket_1 = require("./socket");

var mediaconnection_1 = require("./mediaconnection");

var dataconnection_1 = require("./dataconnection");

var enums_1 = require("./enums");

var api_1 = require("./api");

var PeerOptions =
/** @class */
function () {
  function PeerOptions() {}

  return PeerOptions;
}();
/**
 * A peer who can initiate connections with other peers.
 */


var Peer =
/** @class */
function (_super) {
  __extends(Peer, _super);

  function Peer(id, options) {
    var _this = _super.call(this) || this;

    _this._id = null;
    _this._lastServerId = null; // States.

    _this._destroyed = false; // Connections have been killed

    _this._disconnected = false; // Connection to PeerServer killed but P2P connections still active

    _this._open = false; // Sockets and such are not yet open.

    _this._connections = new Map(); // All connections for this peer.

    _this._lostMessages = new Map(); // src => [list of messages]

    var userId; // Deal with overloading

    if (id && id.constructor == Object) {
      options = id;
    } else if (id) {
      userId = id.toString();
    } // Configurize options


    options = __assign({
      debug: 0,
      host: util_1.util.CLOUD_HOST,
      port: util_1.util.CLOUD_PORT,
      path: "/",
      key: Peer.DEFAULT_KEY,
      token: util_1.util.randomToken(),
      config: util_1.util.defaultConfig
    }, options);
    _this._options = options; // Detect relative URL host.

    if (_this._options.host === "/") {
      _this._options.host = window.location.hostname;
    } // Set path correctly.


    if (_this._options.path) {
      if (_this._options.path[0] !== "/") {
        _this._options.path = "/" + _this._options.path;
      }

      if (_this._options.path[_this._options.path.length - 1] !== "/") {
        _this._options.path += "/";
      }
    } // Set whether we use SSL to same as current host


    if (_this._options.secure === undefined && _this._options.host !== util_1.util.CLOUD_HOST) {
      _this._options.secure = util_1.util.isSecure();
    } else if (_this._options.host == util_1.util.CLOUD_HOST) {
      _this._options.secure = true;
    } // Set a custom log function if present


    if (_this._options.logFunction) {
      logger_1.default.setLogFunction(_this._options.logFunction);
    }

    logger_1.default.logLevel = _this._options.debug || 0;
    _this._api = new api_1.API(options);
    _this._socket = _this._createServerConnection(); // Sanity checks
    // Ensure WebRTC supported

    if (!util_1.util.supports.audioVideo && !util_1.util.supports.data) {
      _this._delayedAbort(enums_1.PeerErrorType.BrowserIncompatible, "The current browser does not support WebRTC");

      return _this;
    } // Ensure alphanumeric id


    if (!!userId && !util_1.util.validateId(userId)) {
      _this._delayedAbort(enums_1.PeerErrorType.InvalidID, "ID \"" + userId + "\" is invalid");

      return _this;
    }

    if (userId) {
      _this._initialize(userId);
    } else {
      _this._api.retrieveId().then(function (id) {
        return _this._initialize(id);
      }).catch(function (error) {
        return _this._abort(enums_1.PeerErrorType.ServerError, error);
      });
    }

    return _this;
  }

  Object.defineProperty(Peer.prototype, "id", {
    get: function get() {
      return this._id;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Peer.prototype, "options", {
    get: function get() {
      return this._options;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Peer.prototype, "open", {
    get: function get() {
      return this._open;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Peer.prototype, "socket", {
    get: function get() {
      return this._socket;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Peer.prototype, "connections", {
    /**
     * @deprecated
     * Return type will change from Object to Map<string,[]>
     */
    get: function get() {
      var e_1, _a;

      var plainConnections = Object.create(null);

      try {
        for (var _b = __values(this._connections), _c = _b.next(); !_c.done; _c = _b.next()) {
          var _d = __read(_c.value, 2),
              k = _d[0],
              v = _d[1];

          plainConnections[k] = v;
        }
      } catch (e_1_1) {
        e_1 = {
          error: e_1_1
        };
      } finally {
        try {
          if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        } finally {
          if (e_1) throw e_1.error;
        }
      }

      return plainConnections;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Peer.prototype, "destroyed", {
    get: function get() {
      return this._destroyed;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Peer.prototype, "disconnected", {
    get: function get() {
      return this._disconnected;
    },
    enumerable: true,
    configurable: true
  });

  Peer.prototype._createServerConnection = function () {
    var _this = this;

    var socket = new socket_1.Socket(this._options.secure, this._options.host, this._options.port, this._options.path, this._options.key, this._options.pingInterval);
    socket.on(enums_1.SocketEventType.Message, function (data) {
      _this._handleMessage(data);
    });
    socket.on(enums_1.SocketEventType.Error, function (error) {
      _this._abort(enums_1.PeerErrorType.SocketError, error);
    });
    socket.on(enums_1.SocketEventType.Disconnected, function () {
      if (_this.disconnected) {
        return;
      }

      _this.emitError(enums_1.PeerErrorType.Network, "Lost connection to server.");

      _this.disconnect();
    });
    socket.on(enums_1.SocketEventType.Close, function () {
      if (_this.disconnected) {
        return;
      }

      _this._abort(enums_1.PeerErrorType.SocketClosed, "Underlying socket is already closed.");
    });
    return socket;
  };
  /** Initialize a connection with the server. */


  Peer.prototype._initialize = function (id) {
    this._id = id;
    this.socket.start(id, this._options.token);
  };
  /** Handles messages from the server. */


  Peer.prototype._handleMessage = function (message) {
    var e_2, _a;

    var type = message.type;
    var payload = message.payload;
    var peerId = message.src;

    switch (type) {
      case enums_1.ServerMessageType.Open:
        // The connection to the server is open.
        this._lastServerId = this.id;
        this._open = true;
        this.emit(enums_1.PeerEventType.Open, this.id);
        break;

      case enums_1.ServerMessageType.Error:
        // Server error.
        this._abort(enums_1.PeerErrorType.ServerError, payload.msg);

        break;

      case enums_1.ServerMessageType.IdTaken:
        // The selected ID is taken.
        this._abort(enums_1.PeerErrorType.UnavailableID, "ID \"" + this.id + "\" is taken");

        break;

      case enums_1.ServerMessageType.InvalidKey:
        // The given API key cannot be found.
        this._abort(enums_1.PeerErrorType.InvalidKey, "API KEY \"" + this._options.key + "\" is invalid");

        break;

      case enums_1.ServerMessageType.Leave:
        // Another peer has closed its connection to this peer.
        logger_1.default.log("Received leave message from " + peerId);

        this._cleanupPeer(peerId);

        this._connections.delete(peerId);

        break;

      case enums_1.ServerMessageType.Expire:
        // The offer sent to a peer has expired without response.
        this.emitError(enums_1.PeerErrorType.PeerUnavailable, "Could not connect to peer " + peerId);
        break;

      case enums_1.ServerMessageType.Offer:
        {
          // we should consider switching this to CALL/CONNECT, but this is the least breaking option.
          var connectionId = payload.connectionId;
          var connection = this.getConnection(peerId, connectionId);

          if (connection) {
            connection.close();
            logger_1.default.warn("Offer received for existing Connection ID:" + connectionId);
          } // Create a new connection.


          if (payload.type === enums_1.ConnectionType.Media) {
            connection = new mediaconnection_1.MediaConnection(peerId, this, {
              connectionId: connectionId,
              _payload: payload,
              metadata: payload.metadata
            });

            this._addConnection(peerId, connection);

            this.emit(enums_1.PeerEventType.Call, connection);
          } else if (payload.type === enums_1.ConnectionType.Data) {
            connection = new dataconnection_1.DataConnection(peerId, this, {
              connectionId: connectionId,
              _payload: payload,
              metadata: payload.metadata,
              label: payload.label,
              serialization: payload.serialization,
              reliable: payload.reliable
            });

            this._addConnection(peerId, connection);

            this.emit(enums_1.PeerEventType.Connection, connection);
          } else {
            logger_1.default.warn("Received malformed connection type:" + payload.type);
            return;
          } // Find messages.


          var messages = this._getMessages(connectionId);

          try {
            for (var messages_1 = __values(messages), messages_1_1 = messages_1.next(); !messages_1_1.done; messages_1_1 = messages_1.next()) {
              var message_1 = messages_1_1.value;
              connection.handleMessage(message_1);
            }
          } catch (e_2_1) {
            e_2 = {
              error: e_2_1
            };
          } finally {
            try {
              if (messages_1_1 && !messages_1_1.done && (_a = messages_1.return)) _a.call(messages_1);
            } finally {
              if (e_2) throw e_2.error;
            }
          }

          break;
        }

      case enums_1.ServerMessageType.Logic:
        this.emit("logic", payload);
        break;

      default:
        {
          if (!payload) {
            logger_1.default.warn("You received a malformed message from " + peerId + " of type " + type);
            return;
          }

          var connectionId = payload.connectionId;
          var connection = this.getConnection(peerId, connectionId);

          if (connection && connection.peerConnection) {
            // Pass it on.
            connection.handleMessage(message);
          } else if (connectionId) {
            // Store for possible later use
            this._storeMessage(connectionId, message);
          } else {
            logger_1.default.warn("You received an unrecognized message:", message);
          }

          break;
        }
    }
  };
  /** Stores messages without a set up connection, to be claimed later. */


  Peer.prototype._storeMessage = function (connectionId, message) {
    if (!this._lostMessages.has(connectionId)) {
      this._lostMessages.set(connectionId, []);
    }

    this._lostMessages.get(connectionId).push(message);
  };
  /** Retrieve messages from lost message store */
  //TODO Change it to private


  Peer.prototype._getMessages = function (connectionId) {
    var messages = this._lostMessages.get(connectionId);

    if (messages) {
      this._lostMessages.delete(connectionId);

      return messages;
    }

    return [];
  };
  /**
   * Returns a DataConnection to the specified peer. See documentation for a
   * complete list of options.
   */


  Peer.prototype.connect = function (peer, options) {
    if (options === void 0) {
      options = {};
    }

    if (this.disconnected) {
      logger_1.default.warn("You cannot connect to a new Peer because you called " + ".disconnect() on this Peer and ended your connection with the " + "server. You can create a new Peer to reconnect, or call reconnect " + "on this peer if you believe its ID to still be available.");
      this.emitError(enums_1.PeerErrorType.Disconnected, "Cannot connect to new Peer after disconnecting from server.");
      return;
    }

    var dataConnection = new dataconnection_1.DataConnection(peer, this, options);

    this._addConnection(peer, dataConnection);

    return dataConnection;
  };
  /**
   * Returns a MediaConnection to the specified peer. See documentation for a
   * complete list of options.
   */


  Peer.prototype.call = function (peer, stream, options) {
    if (options === void 0) {
      options = {};
    }

    if (this.disconnected) {
      logger_1.default.warn("You cannot connect to a new Peer because you called " + ".disconnect() on this Peer and ended your connection with the " + "server. You can create a new Peer to reconnect.");
      this.emitError(enums_1.PeerErrorType.Disconnected, "Cannot connect to new Peer after disconnecting from server.");
      return;
    }

    if (!stream) {
      logger_1.default.error("To call a peer, you must provide a stream from your browser's `getUserMedia`.");
      return;
    }

    options._stream = stream;
    var mediaConnection = new mediaconnection_1.MediaConnection(peer, this, options);

    this._addConnection(peer, mediaConnection);

    return mediaConnection;
  };
  /** Add a data/media connection to this peer. */


  Peer.prototype._addConnection = function (peerId, connection) {
    logger_1.default.log("add connection " + connection.type + ":" + connection.connectionId + " to peerId:" + peerId);

    if (!this._connections.has(peerId)) {
      this._connections.set(peerId, []);
    }

    this._connections.get(peerId).push(connection);
  }; //TODO should be private


  Peer.prototype._removeConnection = function (connection) {
    var connections = this._connections.get(connection.peer);

    if (connections) {
      var index = connections.indexOf(connection);

      if (index !== -1) {
        connections.splice(index, 1);
      }
    } //remove from lost messages


    this._lostMessages.delete(connection.connectionId);
  };
  /** Retrieve a data/media connection for this peer. */


  Peer.prototype.getConnection = function (peerId, connectionId) {
    var e_3, _a;

    var connections = this._connections.get(peerId);

    if (!connections) {
      return null;
    }

    try {
      for (var connections_1 = __values(connections), connections_1_1 = connections_1.next(); !connections_1_1.done; connections_1_1 = connections_1.next()) {
        var connection = connections_1_1.value;

        if (connection.connectionId === connectionId) {
          return connection;
        }
      }
    } catch (e_3_1) {
      e_3 = {
        error: e_3_1
      };
    } finally {
      try {
        if (connections_1_1 && !connections_1_1.done && (_a = connections_1.return)) _a.call(connections_1);
      } finally {
        if (e_3) throw e_3.error;
      }
    }

    return null;
  };

  Peer.prototype._delayedAbort = function (type, message) {
    var _this = this;

    setTimeout(function () {
      _this._abort(type, message);
    }, 0);
  };
  /**
   * Emits an error message and destroys the Peer.
   * The Peer is not destroyed if it's in a disconnected state, in which case
   * it retains its disconnected state and its existing connections.
   */


  Peer.prototype._abort = function (type, message) {
    logger_1.default.error("Aborting!");
    this.emitError(type, message);

    if (!this._lastServerId) {
      this.destroy();
    } else {
      this.disconnect();
    }
  };
  /** Emits a typed error message. */


  Peer.prototype.emitError = function (type, err) {
    logger_1.default.error("Error:", err);
    var error;

    if (typeof err === "string") {
      error = new Error(err);
    } else {
      error = err;
    }

    error.type = type;
    this.emit(enums_1.PeerEventType.Error, error);
  };
  /**
   * Destroys the Peer: closes all active connections as well as the connection
   *  to the server.
   * Warning: The peer can no longer create or accept connections after being
   *  destroyed.
   */


  Peer.prototype.destroy = function () {
    if (this.destroyed) {
      return;
    }

    logger_1.default.log("Destroy peer with ID:" + this.id);
    this.disconnect();

    this._cleanup();

    this._destroyed = true;
    this.emit(enums_1.PeerEventType.Close);
  };
  /** Disconnects every connection on this peer. */


  Peer.prototype._cleanup = function () {
    var e_4, _a;

    try {
      for (var _b = __values(this._connections.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
        var peerId = _c.value;

        this._cleanupPeer(peerId);

        this._connections.delete(peerId);
      }
    } catch (e_4_1) {
      e_4 = {
        error: e_4_1
      };
    } finally {
      try {
        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
      } finally {
        if (e_4) throw e_4.error;
      }
    }

    this.socket.removeAllListeners();
  };
  /** Closes all connections to this peer. */


  Peer.prototype._cleanupPeer = function (peerId) {
    var e_5, _a;

    var connections = this._connections.get(peerId);

    if (!connections) return;

    try {
      for (var connections_2 = __values(connections), connections_2_1 = connections_2.next(); !connections_2_1.done; connections_2_1 = connections_2.next()) {
        var connection = connections_2_1.value;
        connection.close();
      }
    } catch (e_5_1) {
      e_5 = {
        error: e_5_1
      };
    } finally {
      try {
        if (connections_2_1 && !connections_2_1.done && (_a = connections_2.return)) _a.call(connections_2);
      } finally {
        if (e_5) throw e_5.error;
      }
    }
  };
  /**
   * Disconnects the Peer's connection to the PeerServer. Does not close any
   *  active connections.
   * Warning: The peer can no longer create or accept connections after being
   *  disconnected. It also cannot reconnect to the server.
   */


  Peer.prototype.disconnect = function () {
    if (this.disconnected) {
      return;
    }

    var currentId = this.id;
    logger_1.default.log("Disconnect peer with ID:" + currentId);
    this._disconnected = true;
    this._open = false;
    this.socket.close();
    this._lastServerId = currentId;
    this._id = null;
    this.emit(enums_1.PeerEventType.Disconnected, currentId);
  };
  /** Attempts to reconnect with the same ID. */


  Peer.prototype.reconnect = function () {
    if (this.disconnected && !this.destroyed) {
      logger_1.default.log("Attempting reconnection to server with ID " + this._lastServerId);
      this._disconnected = false;

      this._initialize(this._lastServerId);
    } else if (this.destroyed) {
      throw new Error("This peer cannot reconnect to the server. It has already been destroyed.");
    } else if (!this.disconnected && !this.open) {
      // Do nothing. We're still connecting the first time.
      logger_1.default.error("In a hurry? We're still trying to make the initial connection!");
    } else {
      throw new Error("Peer " + this.id + " cannot reconnect because it is not disconnected from the server!");
    }
  };
  /**
   * Get a list of available peer IDs. If you're running your own server, you'll
   * want to set allow_discovery: true in the PeerServer options. If you're using
   * the cloud server, email team@peerjs.com to get the functionality enabled for
   * your key.
   */


  Peer.prototype.listAllPeers = function (cb) {
    var _this = this;

    if (cb === void 0) {
      cb = function cb(_) {};
    }

    this._api.listAllPeers().then(function (peers) {
      return cb(peers);
    }).catch(function (error) {
      return _this._abort(enums_1.PeerErrorType.ServerError, error);
    });
  };

  Peer.DEFAULT_KEY = "peerjs";
  return Peer;
}(eventemitter3_1.EventEmitter);

exports.Peer = Peer;
},{"eventemitter3":"JJlS","./util":"BHXf","./logger":"WOs9","./socket":"wJlv","./mediaconnection":"dbHP","./dataconnection":"GBTQ","./enums":"ZRYf","./api":"in7L"}],"iTK6":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var util_1 = require("./util");

var peer_1 = require("./peer");

exports.peerjs = {
  Peer: peer_1.Peer,
  util: util_1.util
};
exports.default = peer_1.Peer;
window.peerjs = exports.peerjs;
/** @deprecated Should use peerjs namespace */

window.Peer = peer_1.Peer;
},{"./util":"BHXf","./peer":"Hxpd"}]},{},["iTK6"], null)
//# sourceMappingURL=/peerjs.js.map
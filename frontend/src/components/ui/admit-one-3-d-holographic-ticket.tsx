// @ts-nocheck
"use client";

import * as React from "react";
import { useEffect, useRef, forwardRef, useState } from "react";

var vertexShaderSource = `#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_imageAspectRatio;
uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;
uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

out vec2 v_objectUV;
out vec2 v_objectBoxSize;
out vec2 v_responsiveUV;
out vec2 v_responsiveBoxGivenSize;
out vec2 v_patternUV;
out vec2 v_patternBoxSize;
out vec2 v_imageUV;

vec3 getBoxSize(float boxRatio, vec2 givenBoxSize) {
  vec2 box = vec2(0.);
  box.x = boxRatio * min(givenBoxSize.x / boxRatio, givenBoxSize.y);
  float noFitBoxWidth = box.x;
  if (u_fit == 1.) {
    box.x = boxRatio * min(u_resolution.x / boxRatio, u_resolution.y);
  } else if (u_fit == 2.) {
    box.x = boxRatio * max(u_resolution.x / boxRatio, u_resolution.y);
  }
  box.y = box.x / boxRatio;
  return vec3(box, noFitBoxWidth);
}

void main() {
  gl_Position = a_position;

  vec2 uv = gl_Position.xy * .5;
  vec2 boxOrigin = vec2(.5 - u_originX, u_originY - .5);
  vec2 givenBoxSize = vec2(u_worldWidth, u_worldHeight);
  givenBoxSize = max(givenBoxSize, vec2(1.)) * u_pixelRatio;
  float r = u_rotation * 3.14159265358979323846 / 180.;
  mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));
  vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);

  float fixedRatio = 1.;
  vec2 fixedRatioBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );

  v_objectBoxSize = getBoxSize(fixedRatio, fixedRatioBoxGivenSize).xy;
  vec2 objectWorldScale = u_resolution.xy / v_objectBoxSize;

  v_objectUV = uv;
  v_objectUV *= objectWorldScale;
  v_objectUV += boxOrigin * (objectWorldScale - 1.);
  v_objectUV += graphicOffset;
  v_objectUV /= u_scale;
  v_objectUV = graphicRotation * v_objectUV;

  v_responsiveBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  float responsiveRatio = v_responsiveBoxGivenSize.x / v_responsiveBoxGivenSize.y;
  vec2 responsiveBoxSize = getBoxSize(responsiveRatio, v_responsiveBoxGivenSize).xy;
  vec2 responsiveBoxScale = u_resolution.xy / responsiveBoxSize;

  v_responsiveUV = uv;
  v_responsiveUV *= responsiveBoxScale;
  v_responsiveUV += boxOrigin * (responsiveBoxScale - 1.);
  v_responsiveUV += graphicOffset;
  v_responsiveUV /= u_scale;
  v_responsiveUV.x *= responsiveRatio;
  v_responsiveUV = graphicRotation * v_responsiveUV;
  v_responsiveUV.x /= responsiveRatio;

  float patternBoxRatio = givenBoxSize.x / givenBoxSize.y;
  vec2 patternBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  patternBoxRatio = patternBoxGivenSize.x / patternBoxGivenSize.y;

  vec3 boxSizeData = getBoxSize(patternBoxRatio, patternBoxGivenSize);
  v_patternBoxSize = boxSizeData.xy;
  float patternBoxNoFitBoxWidth = boxSizeData.z;
  vec2 patternBoxScale = u_resolution.xy / v_patternBoxSize;

  v_patternUV = uv;
  v_patternUV += graphicOffset / patternBoxScale;
  v_patternUV += boxOrigin;
  v_patternUV -= boxOrigin / patternBoxScale;
  v_patternUV *= u_resolution.xy;
  v_patternUV /= u_pixelRatio;
  if (u_fit > 0.) {
    v_patternUV *= (patternBoxNoFitBoxWidth / v_patternBoxSize.x);
  }
  v_patternUV /= u_scale;
  v_patternUV = graphicRotation * v_patternUV;
  v_patternUV += boxOrigin / patternBoxScale;
  v_patternUV -= boxOrigin;
  v_patternUV *= .01;

  vec2 imageBoxSize;
  if (u_fit == 1.) {
    imageBoxSize.x = min(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else if (u_fit == 2.) {
    imageBoxSize.x = max(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else {
    imageBoxSize.x = min(10.0, 10.0 / u_imageAspectRatio * u_imageAspectRatio);
  }
  imageBoxSize.y = imageBoxSize.x / u_imageAspectRatio;
  vec2 imageBoxScale = u_resolution.xy / imageBoxSize;

  v_imageUV = uv;
  v_imageUV *= imageBoxScale;
  v_imageUV += boxOrigin * (imageBoxScale - 1.);
  v_imageUV += graphicOffset;
  v_imageUV /= u_scale;
  v_imageUV.x *= u_imageAspectRatio;
  v_imageUV = graphicRotation * v_imageUV;
  v_imageUV.x /= u_imageAspectRatio;

  v_imageUV += .5;
  v_imageUV.y = 1. - v_imageUV.y;
}`;

var DEFAULT_MAX_PIXEL_COUNT = 1920 * 1080 * 4;
var ShaderMount = class {
  parentElement: any;
  canvasElement: any;
  gl: any;
  program = null;
  uniformLocations = {};
  fragmentShader;
  rafId = null;
  lastRenderTime = 0;
  currentFrame = 0;
  speed = 0;
  currentSpeed = 0;
  providedUniforms;
  mipmaps = [];
  hasBeenDisposed = false;
  resolutionChanged = true;
  textures = new Map();
  minPixelRatio;
  maxPixelCount;
  isSafari = isSafari();
  uniformCache = {};
  textureUnitMap = new Map();
  
  constructor(parentElement, fragmentShader, uniforms, webGlContextAttributes, speed = 0, frame = 0, minPixelRatio = 2, maxPixelCount = DEFAULT_MAX_PIXEL_COUNT, mipmaps = []) {
    if (parentElement instanceof HTMLElement) {
      this.parentElement = parentElement;
    } else {
      throw new Error("Paper Shaders: parent element must be an HTMLElement");
    }
    if (!document.querySelector("style[data-paper-shader]")) {
      const styleElement = document.createElement("style");
      styleElement.innerHTML = defaultStyle;
      styleElement.setAttribute("data-paper-shader", "");
      document.head.prepend(styleElement);
    }
    const canvasElement = document.createElement("canvas");
    this.canvasElement = canvasElement;
    this.parentElement.prepend(canvasElement);
    this.fragmentShader = fragmentShader;
    this.providedUniforms = uniforms;
    this.mipmaps = mipmaps;
    this.currentFrame = frame;
    this.minPixelRatio = minPixelRatio;
    this.maxPixelCount = maxPixelCount;
    const gl = canvasElement.getContext("webgl2", webGlContextAttributes);
    if (!gl) {
      throw new Error("Paper Shaders: WebGL is not supported in this browser");
    }
    this.gl = gl;
    this.initProgram();
    this.setupPositionAttribute();
    this.setupUniforms();
    this.setUniformValues(this.providedUniforms);
    this.setupResizeObserver();
    window.visualViewport?.addEventListener("resize", this.handleVisualViewportChange);
    this.setSpeed(speed);
    this.parentElement.setAttribute("data-paper-shader", "");
    (this.parentElement as any).paperShaderMount = this;
    document.addEventListener("visibilitychange", this.handleDocumentVisibilityChange);
  }
  
  initProgram = () => {
    const program = createProgram(this.gl, vertexShaderSource, this.fragmentShader);
    if (!program) return;
    this.program = program;
  };
  
  setupPositionAttribute = () => {
    const positionAttributeLocation = this.gl.getAttribLocation(this.program, "a_position");
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(positionAttributeLocation);
    this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
  };
  
  setupUniforms = () => {
    const uniformLocations: any = {
      u_time: this.gl.getUniformLocation(this.program, "u_time"),
      u_pixelRatio: this.gl.getUniformLocation(this.program, "u_pixelRatio"),
      u_resolution: this.gl.getUniformLocation(this.program, "u_resolution")
    };
    Object.entries(this.providedUniforms).forEach(([key, value]) => {
      uniformLocations[key] = this.gl.getUniformLocation(this.program, key);
      if (value instanceof HTMLImageElement) {
        const aspectRatioUniformName = `${key}AspectRatio`;
        uniformLocations[aspectRatioUniformName] = this.gl.getUniformLocation(this.program, aspectRatioUniformName);
      }
    });
    this.uniformLocations = uniformLocations;
  };
  
  renderScale = 1;
  parentWidth = 0;
  parentHeight = 0;
  parentDevicePixelWidth = 0;
  parentDevicePixelHeight = 0;
  devicePixelsSupported = false;
  resizeObserver: any = null;
  
  setupResizeObserver = () => {
    this.resizeObserver = new ResizeObserver(([entry]: any) => {
      if (entry?.borderBoxSize[0]) {
        const physicalPixelSize = entry.devicePixelContentBoxSize?.[0];
        if (physicalPixelSize !== undefined) {
          this.devicePixelsSupported = true;
          this.parentDevicePixelWidth = physicalPixelSize.inlineSize;
          this.parentDevicePixelHeight = physicalPixelSize.blockSize;
        }
        this.parentWidth = entry.borderBoxSize[0].inlineSize;
        this.parentHeight = entry.borderBoxSize[0].blockSize;
      }
      this.handleResize();
    });
    this.resizeObserver.observe(this.parentElement);
  };
  
  handleVisualViewportChange = () => {
    this.resizeObserver?.disconnect();
    this.setupResizeObserver();
  };
  
  handleResize = () => {
    let targetPixelWidth = 0;
    let targetPixelHeight = 0;
    const dpr = Math.max(1, window.devicePixelRatio);
    const pinchZoom = window.visualViewport?.scale ?? 1;
    if (this.devicePixelsSupported) {
      const scaleToMeetMinPixelRatio = Math.max(1, this.minPixelRatio / dpr);
      targetPixelWidth = this.parentDevicePixelWidth * scaleToMeetMinPixelRatio * pinchZoom;
      targetPixelHeight = this.parentDevicePixelHeight * scaleToMeetMinPixelRatio * pinchZoom;
    } else {
      let targetRenderScale = Math.max(dpr, this.minPixelRatio) * pinchZoom;
      if (this.isSafari) {
        const zoomLevel = bestGuessBrowserZoom();
        targetRenderScale *= Math.max(1, zoomLevel);
      }
      targetPixelWidth = Math.round(this.parentWidth) * targetRenderScale;
      targetPixelHeight = Math.round(this.parentHeight) * targetRenderScale;
    }
    const maxPixelCountHeadroom = Math.sqrt(this.maxPixelCount) / Math.sqrt(targetPixelWidth * targetPixelHeight);
    const scaleToMeetMaxPixelCount = Math.min(1, maxPixelCountHeadroom);
    const newWidth = Math.round(targetPixelWidth * scaleToMeetMaxPixelCount);
    const newHeight = Math.round(targetPixelHeight * scaleToMeetMaxPixelCount);
    const newRenderScale = newWidth / Math.round(this.parentWidth);
    if (this.canvasElement.width !== newWidth || this.canvasElement.height !== newHeight || this.renderScale !== newRenderScale) {
      this.renderScale = newRenderScale;
      this.canvasElement.width = newWidth;
      this.canvasElement.height = newHeight;
      this.resolutionChanged = true;
      this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
      this.render(performance.now());
    }
  };
  
  render = (currentTime: any) => {
    if (this.hasBeenDisposed) return;
    if (this.program === null) {
      return;
    }
    const dt = currentTime - this.lastRenderTime;
    this.lastRenderTime = currentTime;
    if (this.currentSpeed !== 0) {
      this.currentFrame += dt * this.currentSpeed;
    }
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);
    this.gl.uniform1f(this.uniformLocations.u_time, this.currentFrame * 1e-3);
    if (this.resolutionChanged) {
      this.gl.uniform2f(this.uniformLocations.u_resolution, this.gl.canvas.width, this.gl.canvas.height);
      this.gl.uniform1f(this.uniformLocations.u_pixelRatio, this.renderScale);
      this.resolutionChanged = false;
    }
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    if (this.currentSpeed !== 0) {
      this.requestRender();
    } else {
      this.rafId = null;
    }
  };
  
  requestRender = () => {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(this.render);
  };
  
  setTextureUniform = (uniformName: any, image: any) => {
    if (!image.complete || image.naturalWidth === 0) {
      return;
    }
    const existingTexture = this.textures.get(uniformName);
    if (existingTexture) {
      this.gl.deleteTexture(existingTexture);
    }
    if (!this.textureUnitMap.has(uniformName)) {
      this.textureUnitMap.set(uniformName, this.textureUnitMap.size);
    }
    const textureUnit = this.textureUnitMap.get(uniformName);
    this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
    if (this.mipmaps.includes(uniformName)) {
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
    }
    this.textures.set(uniformName, texture);
    const location = this.uniformLocations[uniformName];
    if (location) {
      this.gl.uniform1i(location, textureUnit);
      const aspectRatioUniformName = `${uniformName}AspectRatio`;
      const aspectRatioLocation = this.uniformLocations[aspectRatioUniformName];
      if (aspectRatioLocation) {
        const aspectRatio = image.naturalWidth / image.naturalHeight;
        this.gl.uniform1f(aspectRatioLocation, aspectRatio);
      }
    }
  };
  
  areUniformValuesEqual = (a: any, b: any): any => {
    if (a === b) return true;
    if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
      return a.every((val, i) => this.areUniformValuesEqual(val, b[i]));
    }
    return false;
  };
  
  setUniformValues = (updatedUniforms: any) => {
    this.gl.useProgram(this.program);
    Object.entries(updatedUniforms).forEach(([key, value]) => {
      let cacheValue = value;
      if (value instanceof HTMLImageElement) {
        cacheValue = `${value.src.slice(0, 200)}|${value.naturalWidth}x${value.naturalHeight}`;
      }
      if (this.areUniformValuesEqual(this.uniformCache[key], cacheValue)) return;
      this.uniformCache[key] = cacheValue;
      const location = this.uniformLocations[key];
      if (!location) {
        return;
      }
      if (value instanceof HTMLImageElement) {
        this.setTextureUniform(key, value);
      } else if (Array.isArray(value)) {
        let flatArray: any = null;
        let valueLength = null;
        if (value[0] !== undefined && Array.isArray(value[0])) {
          const firstChildLength = (value[0] as any).length;
          if (value.every((arr: any) => arr.length === firstChildLength)) {
            flatArray = value.flat();
            valueLength = firstChildLength;
          } else {
            return;
          }
        } else {
          flatArray = value;
          valueLength = flatArray.length;
        }
        switch (valueLength) {
          case 2:
            this.gl.uniform2fv(location, flatArray);
            break;
          case 3:
            this.gl.uniform3fv(location, flatArray);
            break;
          case 4:
            this.gl.uniform4fv(location, flatArray);
            break;
          case 9:
            this.gl.uniformMatrix3fv(location, false, flatArray);
            break;
          case 16:
            this.gl.uniformMatrix4fv(location, false, flatArray);
            break;
        }
      } else if (typeof value === "number") {
        this.gl.uniform1f(location, value);
      } else if (typeof value === "boolean") {
        this.gl.uniform1i(location, value ? 1 : 0);
      }
    });
  };
  
  getCurrentFrame = () => {
    return this.currentFrame;
  };
  
  setFrame = (newFrame: any) => {
    this.currentFrame = newFrame;
    this.lastRenderTime = performance.now();
    this.render(performance.now());
  };
  
  setSpeed = (newSpeed = 1) => {
    this.speed = newSpeed;
    this.setCurrentSpeed(document.hidden ? 0 : newSpeed);
  };
  
  setCurrentSpeed = (newSpeed: any) => {
    this.currentSpeed = newSpeed;
    if (this.rafId === null && newSpeed !== 0) {
      this.lastRenderTime = performance.now();
      this.rafId = requestAnimationFrame(this.render);
    }
    if (this.rafId !== null && newSpeed === 0) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };
  
  setMaxPixelCount = (newMaxPixelCount = DEFAULT_MAX_PIXEL_COUNT) => {
    this.maxPixelCount = newMaxPixelCount;
    this.handleResize();
  };
  
  setMinPixelRatio = (newMinPixelRatio = 2) => {
    this.minPixelRatio = newMinPixelRatio;
    this.handleResize();
  };
  
  setUniforms = (newUniforms: any) => {
    this.setUniformValues(newUniforms);
    this.providedUniforms = { ...this.providedUniforms, ...newUniforms };
    this.render(performance.now());
  };
  
  handleDocumentVisibilityChange = () => {
    this.setCurrentSpeed(document.hidden ? 0 : this.speed);
  };
  
  dispose = () => {
    this.hasBeenDisposed = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.gl && this.program) {
      this.textures.forEach((texture) => {
        this.gl.deleteTexture(texture);
      });
      this.textures.clear();
      this.gl.deleteProgram(this.program);
      this.program = null;
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this.gl.getError();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.visualViewport?.removeEventListener("resize", this.handleVisualViewportChange);
    document.removeEventListener("visibilitychange", this.handleDocumentVisibilityChange);
    this.uniformLocations = {};
    this.canvasElement.remove();
    delete (this.parentElement as any).paperShaderMount;
  };
};

function createShader(gl: any, type: any, source: any) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: any, vertexShaderSource2: any, fragmentShaderSource: any) {
  const format = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT);
  const precision = format ? format.precision : null;
  if (precision && precision < 23) {
    vertexShaderSource2 = vertexShaderSource2.replace(/precision\s+(lowp|mediump)\s+float;/g, "precision highp float;");
    fragmentShaderSource = fragmentShaderSource.replace(/precision\s+(lowp|mediump)\s+float/g, "precision highp float").replace(/\b(uniform|varying|attribute)\s+(lowp|mediump)\s+(\w+)/g, "$1 highp $3");
  }
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource2);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertexShader || !fragmentShader) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }
  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

var defaultStyle = `@layer paper-shaders {
  :where([data-paper-shader]) {
    isolation: isolate;
    position: relative;

    & canvas {
      contain: strict;
      display: block;
      position: absolute;
      inset: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      corner-shape: inherit;
    }
  }
}`;

function isSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("safari") && !ua.includes("chrome") && !ua.includes("android");
}

function bestGuessBrowserZoom() {
  if (typeof window === 'undefined') return 1;
  const viewportScale = window.visualViewport?.scale ?? 1;
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  const innerWidth = viewportScale * viewportWidth + scrollbarWidth;
  const ratio = window.outerWidth / innerWidth;
  const zoomPercentageRounded = Math.round(100 * ratio);
  if (zoomPercentageRounded % 5 === 0) {
    return zoomPercentageRounded / 100;
  }
  if (zoomPercentageRounded === 33) {
    return 1 / 3;
  }
  if (zoomPercentageRounded === 67) {
    return 2 / 3;
  }
  if (zoomPercentageRounded === 133) {
    return 4 / 3;
  }
  return ratio;
}

var defaultObjectSizing = {
  fit: "contain",
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  originX: 0.5,
  originY: 0.5,
  worldWidth: 0,
  worldHeight: 0
};
var defaultPatternSizing = {
  fit: "none",
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  originX: 0.5,
  originY: 0.5,
  worldWidth: 0,
  worldHeight: 0
};
var ShaderFitOptions: any = {
  none: 0,
  contain: 1,
  cover: 2
};

var declarePI = `
#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846
`;
var proceduralHash11 = `
  float hash11(float p) {
    p = fract(p * 0.3183099) + 0.1;
    p *= p + 19.19;
    return fract(p * p);
  }
`;
var proceduralHash21 = `
  float hash21(vec2 p) {
    p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }
`;
var simplexNoise = `
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

var ditheringFragmentShader = `#version 300 es
precision mediump float;

uniform float u_time;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;
uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

uniform float u_pxSize;
uniform vec4 u_colorBack;
uniform vec4 u_colorFront;
uniform float u_shape;
uniform float u_type;

out vec4 fragColor;

${simplexNoise}
${declarePI}
${proceduralHash11}
${proceduralHash21}

float getSimplexNoise(vec2 uv, float t) {
  float noise = .5 * snoise(uv - vec2(0., .3 * t));
  noise += .5 * snoise(2. * uv + vec2(0., .32 * t));

  return noise;
}

const int bayer2x2[4] = int[4](0, 2, 3, 1);
const int bayer4x4[16] = int[16](
0, 8, 2, 10,
12, 4, 14, 6,
3, 11, 1, 9,
15, 7, 13, 5
);

const int bayer8x8[64] = int[64](
0, 32, 8, 40, 2, 34, 10, 42,
48, 16, 56, 24, 50, 18, 58, 26,
12, 44, 4, 36, 14, 46, 6, 38,
60, 28, 52, 20, 62, 30, 54, 22,
3, 35, 11, 43, 1, 33, 9, 41,
51, 19, 59, 27, 49, 17, 57, 25,
15, 47, 7, 39, 13, 45, 5, 37,
63, 31, 55, 23, 61, 29, 53, 21
);

float getBayerValue(vec2 uv, int size) {
  ivec2 pos = ivec2(fract(uv / float(size)) * float(size));
  int index = pos.y * size + pos.x;

  if (size == 2) {
    return float(bayer2x2[index]) / 4.0;
  } else if (size == 4) {
    return float(bayer4x4[index]) / 16.0;
  } else if (size == 8) {
    return float(bayer8x8[index]) / 64.0;
  }
  return 0.0;
}


void main() {
  float t = .5 * u_time;

  float pxSize = u_pxSize * u_pixelRatio;
  vec2 pxSizeUV = gl_FragCoord.xy - .5 * u_resolution;
  pxSizeUV /= pxSize;
  vec2 canvasPixelizedUV = (floor(pxSizeUV) + .5) * pxSize;
  vec2 normalizedUV = canvasPixelizedUV / u_resolution;

  vec2 ditheringNoiseUV = canvasPixelizedUV;
  vec2 shapeUV = normalizedUV;

  vec2 boxOrigin = vec2(.5 - u_originX, u_originY - .5);
  vec2 givenBoxSize = vec2(u_worldWidth, u_worldHeight);
  givenBoxSize = max(givenBoxSize, vec2(1.)) * u_pixelRatio;
  float r = u_rotation * PI / 180.;
  mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));
  vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);

  float patternBoxRatio = givenBoxSize.x / givenBoxSize.y;
  vec2 boxSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  
  if (u_shape > 3.5) {
    vec2 objectBoxSize = vec2(0.);
    objectBoxSize.x = min(boxSize.x, boxSize.y);
    if (u_fit == 1.) {
      objectBoxSize.x = min(u_resolution.x, u_resolution.y);
    } else if (u_fit == 2.) {
      objectBoxSize.x = max(u_resolution.x, u_resolution.y);
    }
    objectBoxSize.y = objectBoxSize.x;
    vec2 objectWorldScale = u_resolution.xy / objectBoxSize;

    shapeUV *= objectWorldScale;
    shapeUV += boxOrigin * (objectWorldScale - 1.);
    shapeUV += vec2(-u_offsetX, u_offsetY);
    shapeUV /= u_scale;
    shapeUV = graphicRotation * shapeUV;
  } else {
    vec2 patternBoxSize = vec2(0.);
    patternBoxSize.x = patternBoxRatio * min(boxSize.x / patternBoxRatio, boxSize.y);
    float patternWorldNoFitBoxWidth = patternBoxSize.x;
    if (u_fit == 1.) {
      patternBoxSize.x = patternBoxRatio * min(u_resolution.x / patternBoxRatio, u_resolution.y);
    } else if (u_fit == 2.) {
      patternBoxSize.x = patternBoxRatio * max(u_resolution.x / patternBoxRatio, u_resolution.y);
    }
    patternBoxSize.y = patternBoxSize.x / patternBoxRatio;
    vec2 patternWorldScale = u_resolution.xy / patternBoxSize;

    shapeUV += vec2(-u_offsetX, u_offsetY) / patternWorldScale;
    shapeUV += boxOrigin;
    shapeUV -= boxOrigin / patternWorldScale;
    shapeUV *= u_resolution.xy;
    shapeUV /= u_pixelRatio;
    if (u_fit > 0.) {
      shapeUV *= (patternWorldNoFitBoxWidth / patternBoxSize.x);
    }
    shapeUV /= u_scale;
    shapeUV = graphicRotation * shapeUV;
    shapeUV += boxOrigin / patternWorldScale;
    shapeUV -= boxOrigin;
    shapeUV += .5;
  }

  float shape = 0.;
  if (u_shape < 1.5) {
    shapeUV *= .001;
    shape = 0.5 + 0.5 * getSimplexNoise(shapeUV, t);
    shape = smoothstep(0.3, 0.9, shape);
  } else if (u_shape < 2.5) {
    shapeUV *= .003;
    for (float i = 1.0; i < 6.0; i++) {
      shapeUV.x += 0.6 / i * cos(i * 2.5 * shapeUV.y + t);
      shapeUV.y += 0.6 / i * cos(i * 1.5 * shapeUV.x + t);
    }
    shape = .15 / max(0.001, abs(sin(t - shapeUV.y - shapeUV.x)));
    shape = smoothstep(0.02, 1., shape);
  } else if (u_shape < 3.5) {
    shapeUV *= .05;
    float stripeIdx = floor(2. * shapeUV.x / TWO_PI);
    float rand = hash11(stripeIdx * 10.);
    rand = sign(rand - .5) * pow(.1 + abs(rand), .4);
    shape = sin(shapeUV.x) * cos(shapeUV.y - 5. * rand * t);
    shape = pow(abs(shape), 6.);
  } else if (u_shape < 4.5) {
    shapeUV *= 4.;
    float wave = cos(.5 * shapeUV.x - 2. * t) * sin(1.5 * shapeUV.x + t) * (.75 + .25 * cos(3. * t));
    shape = 1. - smoothstep(-1., 1., shapeUV.y + wave);
  } else if (u_shape < 5.5) {
    float dist = length(shapeUV);
    float waves = sin(pow(dist, 1.7) * 7. - 3. * t) * .5 + .5;
    shape = waves;
  } else if (u_shape < 6.5) {
    float l = length(shapeUV);
    float angle = 6. * atan(shapeUV.y, shapeUV.x) + 4. * t;
    float twist = 1.2;
    float offset = 1. / pow(max(l, 1e-6), twist) + angle / TWO_PI;
    float mid = smoothstep(0., 1., pow(l, twist));
    shape = mix(0., fract(offset), mid);
  } else {
    shapeUV *= 2.;
    float d = 1. - pow(length(shapeUV), 2.);
    vec3 pos = vec3(shapeUV, sqrt(max(0., d)));
    vec3 lightPos = normalize(vec3(cos(1.5 * t), .8, sin(1.25 * t)));
    shape = .5 + .5 * dot(lightPos, pos);
    shape *= step(0., d);
  }

  int type = int(floor(u_type));
  float dithering = 0.0;

  switch (type) {
    case 1: {
      dithering = step(hash21(ditheringNoiseUV), shape);
    } break;
    case 2:
    dithering = getBayerValue(pxSizeUV, 2);
    break;
    case 3:
    dithering = getBayerValue(pxSizeUV, 4);
    break;
    default :
    dithering = getBayerValue(pxSizeUV, 8);
    break;
  }

  dithering -= .5;
  float res = step(.5, shape + dithering);

  vec3 fgColor = u_colorFront.rgb * u_colorFront.a;
  float fgOpacity = u_colorFront.a;
  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  float bgOpacity = u_colorBack.a;

  vec3 color = fgColor * res;
  float opacity = fgOpacity * res;

  color += bgColor * (1. - opacity);
  opacity += bgOpacity * (1. - opacity);

  fragColor = vec4(color, opacity);
}
`;

var DitheringShapes: any = {
  simplex: 1,
  warp: 2,
  dots: 3,
  wave: 4,
  ripple: 5,
  swirl: 6,
  sphere: 7
};
var DitheringTypes: any = {
  "random": 1,
  "2x2": 2,
  "4x4": 3,
  "8x8": 4
};

var imageDitheringFragmentShader = `#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;

uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

uniform vec4 u_colorFront;
uniform vec4 u_colorBack;
uniform vec4 u_colorHighlight;

uniform sampler2D u_image;
uniform float u_imageAspectRatio;

uniform float u_type;
uniform float u_pxSize;
uniform bool u_originalColors;
uniform bool u_inverted;
uniform float u_colorSteps;

out vec4 fragColor;


${proceduralHash21}
${declarePI}

float getUvFrame(vec2 uv, vec2 pad) {
  float aa = 0.0001;

  float left   = smoothstep(-pad.x, -pad.x + aa, uv.x);
  float right  = smoothstep(1.0 + pad.x, 1.0 + pad.x - aa, uv.x);
  float bottom = smoothstep(-pad.y, -pad.y + aa, uv.y);
  float top    = smoothstep(1.0 + pad.y, 1.0 + pad.y - aa, uv.y);

  return left * right * bottom * top;
}

vec2 getImageUV(vec2 uv) {
  vec2 boxOrigin = vec2(.5 - u_originX, u_originY - .5);
  float r = u_rotation * PI / 180.;
  mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));
  vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);

  vec2 imageBoxSize;
  if (u_fit == 1.) { // contain
    imageBoxSize.x = min(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else if (u_fit == 2.) { // cover
    imageBoxSize.x = max(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else {
    imageBoxSize.x = min(10.0, 10.0 / u_imageAspectRatio * u_imageAspectRatio);
  }
  imageBoxSize.y = imageBoxSize.x / u_imageAspectRatio;
  vec2 imageBoxScale = u_resolution.xy / imageBoxSize;

  vec2 imageUV = uv;
  imageUV *= imageBoxScale;
  imageUV += boxOrigin * (imageBoxScale - 1.);
  imageUV += graphicOffset;
  imageUV /= u_scale;
  imageUV.x *= u_imageAspectRatio;
  imageUV = graphicRotation * imageUV;
  imageUV.x /= u_imageAspectRatio;

  imageUV += .5;
  imageUV.y = 1. - imageUV.y;

  return imageUV;
}

const int bayer2x2[4] = int[4](0, 2, 3, 1);
const int bayer4x4[16] = int[16](
0, 8, 2, 10,
12, 4, 14, 6,
3, 11, 1, 9,
15, 7, 13, 5
);

const int bayer8x8[64] = int[64](
0, 32, 8, 40, 2, 34, 10, 42,
48, 16, 56, 24, 50, 18, 58, 26,
12, 44, 4, 36, 14, 46, 6, 38,
60, 28, 52, 20, 62, 30, 54, 22,
3, 35, 11, 43, 1, 33, 9, 41,
51, 19, 59, 27, 49, 17, 57, 25,
15, 47, 7, 39, 13, 45, 5, 37,
63, 31, 55, 23, 61, 29, 53, 21
);

float getBayerValue(vec2 uv, int size) {
  ivec2 pos = ivec2(fract(uv / float(size)) * float(size));
  int index = pos.y * size + pos.x;

  if (size == 2) {
    return float(bayer2x2[index]) / 4.0;
  } else if (size == 4) {
    return float(bayer4x4[index]) / 16.0;
  } else if (size == 8) {
    return float(bayer8x8[index]) / 64.0;
  }
  return 0.0;
}


void main() {

  float pxSize = u_pxSize * u_pixelRatio;
  vec2 pxSizeUV = gl_FragCoord.xy - .5 * u_resolution;
  pxSizeUV /= pxSize;
  vec2 canvasPixelizedUV = (floor(pxSizeUV) + .5) * pxSize;
  vec2 normalizedUV = canvasPixelizedUV / u_resolution;

  vec2 imageUV = getImageUV(normalizedUV);
  vec2 ditheringNoiseUV = canvasPixelizedUV;
  vec4 image = texture(u_image, imageUV);
  float frame = getUvFrame(imageUV, pxSize / u_resolution);

  int type = int(floor(u_type));
  float dithering = 0.0;

  float lum = dot(vec3(.2126, .7152, .0722), image.rgb);
  lum = u_inverted ? (1. - lum) : lum;

  switch (type) {
    case 1: {
      dithering = step(hash21(ditheringNoiseUV), lum);
    } break;
    case 2:
    dithering = getBayerValue(pxSizeUV, 2);
    break;
    case 3:
    dithering = getBayerValue(pxSizeUV, 4);
    break;
    default :
    dithering = getBayerValue(pxSizeUV, 8);
    break;
  }

  float colorSteps = max(floor(u_colorSteps), 1.);
  vec3 color = vec3(0.0);
  float opacity = 1.;

  dithering -= .5;
  float brightness = clamp(lum + dithering / colorSteps, 0.0, 1.0);
  brightness = mix(0.0, brightness, frame);
  brightness = mix(0.0, brightness, image.a);
  float quantLum = floor(brightness * colorSteps + 0.5) / colorSteps;
  quantLum = mix(0.0, quantLum, frame);

  if (u_originalColors == true) {
    vec3 normColor = image.rgb / max(lum, 0.001);
    color = normColor * quantLum;

    float quantAlpha = floor(image.a * colorSteps + 0.5) / colorSteps;
    opacity = mix(quantLum, 1., quantAlpha);
  } else {
    vec3 fgColor = u_colorFront.rgb * u_colorFront.a;
    float fgOpacity = u_colorFront.a;
    vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
    float bgOpacity = u_colorBack.a;
    vec3 hlColor = u_colorHighlight.rgb * u_colorHighlight.a;
    float hlOpacity = u_colorHighlight.a;

    fgColor = mix(fgColor, hlColor, step(1.02 - .02 * u_colorSteps, brightness));
    fgOpacity = mix(fgOpacity, hlOpacity, step(1.02 - .02 * u_colorSteps, brightness));

    color = fgColor * quantLum;
    opacity = fgOpacity * quantLum;
    color += bgColor * (1.0 - opacity);
    opacity += bgOpacity * (1.0 - opacity);
  }

  fragColor = vec4(color, opacity);
}
`;

function getShaderColorFromString(colorString: any): [number, number, number, number] {
  if (Array.isArray(colorString)) {
    if (colorString.length === 4) return colorString as [number, number, number, number];
    if (colorString.length === 3) return [...colorString, 1] as [number, number, number, number];
    return fallbackColor;
  }
  if (typeof colorString !== "string") {
    return fallbackColor;
  }
  let r, g, b, a = 1;
  if (colorString.startsWith("#")) {
    [r, g, b, a] = hexToRgba(colorString);
  } else if (colorString.startsWith("rgb")) {
    [r, g, b, a] = parseRgba(colorString);
  } else if (colorString.startsWith("hsl")) {
    [r, g, b, a] = hslaToRgba(parseHsla(colorString));
  } else {
    console.error("Unsupported color format", colorString);
    return fallbackColor;
  }
  return [clamp(r, 0, 1), clamp(g, 0, 1), clamp(b, 0, 1), clamp(a, 0, 1)];
}
function hexToRgba(hex: any) {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex.split("").map((char: any) => char + char).join("");
  }
  if (hex.length === 6) {
    hex = hex + "ff";
  }
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const a = parseInt(hex.slice(6, 8), 16) / 255;
  return [r, g, b, a];
}
function parseRgba(rgba: any) {
  const match = rgba.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+))?\s*\)$/i);
  if (!match) return [0, 0, 0, 1];
  return [
    parseInt(match[1] ?? "0") / 255,
    parseInt(match[2] ?? "0") / 255,
    parseInt(match[3] ?? "0") / 255,
    match[4] === undefined ? 1 : parseFloat(match[4])
  ];
}
function parseHsla(hsla: any) {
  const match = hsla.match(/^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([0-9.]+))?\s*\)$/i);
  if (!match) return [0, 0, 0, 1];
  return [
    parseInt(match[1] ?? "0"),
    parseInt(match[2] ?? "0"),
    parseInt(match[3] ?? "0"),
    match[4] === undefined ? 1 : parseFloat(match[4])
  ];
}
function hslaToRgba(hsla: any) {
  const [h, s, l, a] = hsla;
  const hDecimal = h / 360;
  const sDecimal = s / 100;
  const lDecimal = l / 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = lDecimal;
  } else {
    const hue2rgb = (p2: any, q2: any, t: any) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
      if (t < 1 / 2) return q2;
      if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
      return p2;
    };
    const q = lDecimal < 0.5 ? lDecimal * (1 + sDecimal) : lDecimal + sDecimal - lDecimal * sDecimal;
    const p = 2 * lDecimal - q;
    r = hue2rgb(p, q, hDecimal + 1 / 3);
    g = hue2rgb(p, q, hDecimal);
    b = hue2rgb(p, q, hDecimal - 1 / 3);
  }
  return [r, g, b, a];
}
var clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
var fallbackColor: [number, number, number, number] = [0, 0, 0, 1];

function getEmptyPixel() {
  if (typeof window === "undefined") {
    console.warn("Paper Shaders: can’t create an image on the server");
    return undefined;
  }
  const img = new Image();
  img.src = emptyPixel;
  return img;
}
var emptyPixel = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

function useMergeRefs(refs: any) {
  const cleanupRef = React.useRef<any>(undefined);
  const refEffect = React.useCallback((instance: any) => {
    const cleanups = refs.map((ref: any) => {
      if (ref == null) {
        return;
      }
      if (typeof ref === "function") {
        const refCallback = ref;
        const refCleanup = refCallback(instance);
        return typeof refCleanup === "function" ? refCleanup : () => {
          refCallback(null);
        };
      }
      ref.current = instance;
      return () => {
        ref.current = null;
      };
    });
    return () => {
      cleanups.forEach((refCleanup: any) => refCleanup?.());
    };
  }, refs);
  return React.useMemo(() => {
    if (refs.every((ref: any) => ref == null)) {
      return null;
    }
    return (value: any) => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = undefined;
      }
      if (value != null) {
        cleanupRef.current = refEffect(value);
      }
    };
  }, refs);
}

function setMinImageSize(img: any) {
  if (img.naturalWidth < 1024 && img.naturalHeight < 1024) {
    if (img.naturalWidth < 1 || img.naturalHeight < 1) {
      return;
    }
    const aspect = img.naturalWidth / img.naturalHeight;
    img.width = Math.round(aspect > 1 ? 1024 * aspect : 1024);
    img.height = Math.round(aspect > 1 ? 1024 : 1024 / aspect);
  }
}

async function processUniforms(uniformsProp: any) {
  const processedUniforms: any = {};
  const imageLoadPromises: any[] = [];
  const isValidUrl = (url: string) => {
    try {
      if (url.startsWith("/")) return true;
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  const isExternalUrl = (url: string) => {
    try {
      if (url.startsWith("/")) return false;
      const urlObject = new URL(url, window.location.origin);
      return urlObject.origin !== window.location.origin;
    } catch {
      return false;
    }
  };
  Object.entries(uniformsProp).forEach(([key, value]) => {
    if (typeof value === "string") {
      if (!value) {
        processedUniforms[key] = getEmptyPixel();
        return;
      }
      if (!isValidUrl(value)) {
        console.warn(`Uniform "${key}" has invalid URL "${value}". Skipping image loading.`);
        return;
      }
      const imagePromise = new Promise<void>((resolve, reject) => {
        const img = new Image();
        if (isExternalUrl(value)) {
          img.crossOrigin = "anonymous";
        }
        img.onload = () => {
          setMinImageSize(img);
          processedUniforms[key] = img;
          resolve();
        };
        img.onerror = () => {
          console.error(`Could not set uniforms. Failed to load image at ${value}`);
          reject();
        };
        img.src = value;
      });
      imageLoadPromises.push(imagePromise);
    } else if (value instanceof HTMLImageElement) {
      setMinImageSize(value);
      processedUniforms[key] = value;
    } else {
      processedUniforms[key] = value;
    }
  });
  await Promise.all(imageLoadPromises);
  return processedUniforms;
}

var ShaderMount2 = forwardRef(
  function ShaderMountImpl({
    fragmentShader,
    uniforms: uniformsProp,
    webGlContextAttributes,
    speed = 0,
    frame = 0,
    width,
    height,
    minPixelRatio,
    maxPixelCount,
    mipmaps,
    style,
    ...divProps
  }: any, forwardedRef) {
    const [isInitialized, setIsInitialized] = useState(false);
    const divRef = useRef(null);
    const shaderMountRef = useRef<any>(null);
    const webGlContextAttributesRef = useRef(webGlContextAttributes);
    useEffect(() => {
      const initShader = async () => {
        const uniforms = await processUniforms(uniformsProp);
        if (divRef.current && !shaderMountRef.current) {
          shaderMountRef.current = new ShaderMount(
            divRef.current,
            fragmentShader,
            uniforms,
            webGlContextAttributesRef.current,
            speed,
            frame,
            minPixelRatio,
            maxPixelCount,
            mipmaps
          );
          setIsInitialized(true);
        }
      };
      initShader();
      return () => {
        shaderMountRef.current?.dispose();
        shaderMountRef.current = null;
      };
    }, [fragmentShader]);
    useEffect(() => {
      let isStale = false;
      const updateUniforms = async () => {
        const uniforms = await processUniforms(uniformsProp);
        if (!isStale) {
          shaderMountRef.current?.setUniforms(uniforms);
        }
      };
      updateUniforms();
      return () => {
        isStale = true;
      };
    }, [uniformsProp, isInitialized]);
    useEffect(() => {
      shaderMountRef.current?.setSpeed(speed);
    }, [speed, isInitialized]);
    useEffect(() => {
      shaderMountRef.current?.setMaxPixelCount(maxPixelCount);
    }, [maxPixelCount, isInitialized]);
    useEffect(() => {
      shaderMountRef.current?.setMinPixelRatio(minPixelRatio);
    }, [minPixelRatio, isInitialized]);
    useEffect(() => {
      shaderMountRef.current?.setFrame(frame);
    }, [frame, isInitialized]);
    const mergedRef = useMergeRefs([divRef, forwardedRef]);
    return (
      <div
        ref={mergedRef}
        style={width !== undefined || height !== undefined ? {
          width: typeof width === "string" && isNaN(+width) === false ? +width : width,
          height: typeof height === "string" && isNaN(+height) === false ? +height : height,
          ...style
        } : style}
        {...divProps}
      />
    );
  }
);
ShaderMount2.displayName = "ShaderMount";

function colorPropsAreEqual(prevProps: any, nextProps: any) {
  for (const key in prevProps) {
    if (key === "colors") {
      const prevIsArray = Array.isArray(prevProps.colors);
      const nextIsArray = Array.isArray(nextProps.colors);
      if (!prevIsArray || !nextIsArray) {
        if (Object.is(prevProps.colors, nextProps.colors) === false) {
          return false;
        }
        continue;
      }
      if (prevProps.colors?.length !== nextProps.colors?.length) {
        return false;
      }
      if (!prevProps.colors?.every((color: any, index: any) => color === nextProps.colors?.[index])) {
        return false;
      }
      continue;
    }
    if (Object.is(prevProps[key], nextProps[key]) === false) {
      return false;
    }
  }
  return true;
}

var defaultPreset = {
  name: "Default",
  params: {
    ...defaultPatternSizing,
    speed: 1,
    frame: 0,
    scale: 0.6,
    colorBack: "#000000",
    colorFront: "#00b2ff",
    shape: "sphere",
    type: "4x4",
    size: 2
  }
};

var Dithering = React.memo(function DitheringImpl({
  speed = defaultPreset.params.speed,
  frame = defaultPreset.params.frame,
  colorBack = defaultPreset.params.colorBack,
  colorFront = defaultPreset.params.colorFront,
  shape = defaultPreset.params.shape,
  type = defaultPreset.params.type,
  pxSize,
  size = pxSize === undefined ? defaultPreset.params.size : pxSize,
  fit = defaultPreset.params.fit,
  scale = defaultPreset.params.scale,
  rotation = defaultPreset.params.rotation,
  originX = defaultPreset.params.originX,
  originY = defaultPreset.params.originY,
  offsetX = defaultPreset.params.offsetX,
  offsetY = defaultPreset.params.offsetY,
  worldWidth = defaultPreset.params.worldWidth,
  worldHeight = defaultPreset.params.worldHeight,
  ...props
}: any) {
  const uniforms = {
    u_colorBack: getShaderColorFromString(colorBack),
    u_colorFront: getShaderColorFromString(colorFront),
    u_shape: DitheringShapes[shape],
    u_type: DitheringTypes[type],
    u_pxSize: size,
    u_fit: ShaderFitOptions[fit],
    u_scale: scale,
    u_rotation: rotation,
    u_offsetX: offsetX,
    u_offsetY: offsetY,
    u_originX: originX,
    u_originY: originY,
    u_worldWidth: worldWidth,
    u_worldHeight: worldHeight
  };
  return <ShaderMount2 {...props} speed={speed} frame={frame} fragmentShader={ditheringFragmentShader} uniforms={uniforms} />;
});

var defaultPreset2 = {
  name: "Default",
  params: {
    ...defaultObjectSizing,
    fit: "cover",
    speed: 0,
    frame: 0,
    colorFront: "#94ffaf",
    colorBack: "#000c38",
    colorHighlight: "#eaff94",
    type: "8x8",
    size: 2,
    colorSteps: 2,
    originalColors: false,
    inverted: false
  }
};

var ImageDithering = React.memo(function ImageDitheringImpl({
  speed = defaultPreset2.params.speed,
  frame = defaultPreset2.params.frame,
  colorFront = defaultPreset2.params.colorFront,
  colorBack = defaultPreset2.params.colorBack,
  colorHighlight = defaultPreset2.params.colorHighlight,
  image = "",
  type = defaultPreset2.params.type,
  colorSteps = defaultPreset2.params.colorSteps,
  originalColors = defaultPreset2.params.originalColors,
  inverted = defaultPreset2.params.inverted,
  pxSize,
  size = pxSize === undefined ? defaultPreset2.params.size : pxSize,
  fit = defaultPreset2.params.fit,
  scale = defaultPreset2.params.scale,
  rotation = defaultPreset2.params.rotation,
  originX = defaultPreset2.params.originX,
  originY = defaultPreset2.params.originY,
  offsetX = defaultPreset2.params.offsetX,
  offsetY = defaultPreset2.params.offsetY,
  worldWidth = defaultPreset2.params.worldWidth,
  worldHeight = defaultPreset2.params.worldHeight,
  ...props
}: any) {
  const uniforms = {
    u_image: image,
    u_colorFront: getShaderColorFromString(colorFront),
    u_colorBack: getShaderColorFromString(colorBack),
    u_colorHighlight: getShaderColorFromString(colorHighlight),
    u_type: DitheringTypes[type],
    u_pxSize: size,
    u_colorSteps: colorSteps,
    u_originalColors: originalColors,
    u_inverted: inverted,
    u_fit: ShaderFitOptions[fit],
    u_rotation: rotation,
    u_scale: scale,
    u_offsetX: offsetX,
    u_offsetY: offsetY,
    u_originX: originX,
    u_originY: originY,
    u_worldWidth: worldWidth,
    u_worldHeight: worldHeight
  };
  return (
    <ShaderMount2
      {...props}
      speed={speed}
      frame={frame}
      fragmentShader={imageDitheringFragmentShader}
      uniforms={uniforms}
    />
  );
}, colorPropsAreEqual);

var REF = 741;
var TICKET_GEOMETRY = {
  aspect: 741 / 425,
  cornerRadius: 25 / REF,
  notchRadius: 21 / REF,
  perforation: 562 / REF
};
var TICKET_LAYOUT = {
  padding: 57 / REF,
  labelTop: 58 / REF,
  labelSize: 15 / REF,
  labelLead: 22 / REF,
  labelTracking: 0.016,
  nameTop: 185 / REF,
  nameSize: 64.79 / REF,
  nameLead: 65 / REF,
  nameTracking: -0.01,
  footerTop: 356 / REF,
  footerSize: 12.5 / REF,
  footerTracking: 0.016,
  stubSize: 67.61 / REF,
  stubTracking: 0,
  stubOpacity: 0.88,
  watermarkSize: 144 / REF,
  watermarkOpacity: 0,
  watermarkColor: "#30155c",
  inkColor: "#f8f8f8"
};
var TICKET_TEXTURE = {
  engine: "generative",
  colorBack: "#0a0515",
  colorFront: "#5b21b6",
  colorHighlight: "#7c3aed",
  shape: "warp",
  type: "random",
  size: 0.5,
  colorSteps: 4,
  originalColors: false,
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  speed: 0.4
};
var TICKET_GRADIENT = {
  centreX: 0.62,
  centreY: 0.3,
  radius: 0.58,
  midStop: 0.45,
  colorLight: "#ffc691",
  colorMid: "#ef671c",
  colorDark: "#ab3300"
};
var TICKET_STYLE = {
  texture: TICKET_TEXTURE,
  gradient: TICKET_GRADIENT
};
var SHAPES = [
  "simplex",
  "warp",
  "dots",
  "wave",
  "ripple",
  "swirl",
  "sphere"
];
var TYPES = ["random", "2x2", "4x4", "8x8"];

function ticketClipPath(width: any, height: any, geometry = TICKET_GEOMETRY) {
  const r = geometry.cornerRadius * width;
  const n = geometry.notchRadius * width;
  const p = geometry.perforation * width;
  return [
    `M ${r} 0`,
    `L ${p - n} 0`,
    `A ${n} ${n} 0 0 0 ${p + n} 0`,
    `L ${width - r} 0`,
    `A ${r} ${r} 0 0 0 ${width} ${r}`,
    `L ${width} ${height - r}`,
    `A ${r} ${r} 0 0 0 ${width - r} ${height}`,
    `L ${p + n} ${height}`,
    `A ${n} ${n} 0 0 0 ${p - n} ${height}`,
    `L ${r} ${height}`,
    `A ${r} ${r} 0 0 0 0 ${height - r}`,
    `L 0 ${r}`,
    `A ${r} ${r} 0 0 0 ${r} 0`,
    "Z"
  ].join(" ");
}

function splitName(name: any, max = 3) {
  const clean = name.trim().replace(/\s+/g, " ").toUpperCase();
  if (!clean) return [];
  const lines: string[] = [];
  for (const word of clean.split(" ")) {
    if (lines.length < max) lines.push(word);
    else lines[lines.length - 1] = `${lines[lines.length - 1]} ${word}`;
  }
  return lines;
}

function fitScale(lines: any, opts: any) {
  if (lines.length === 0) return 1;
  const { availableWidth, availableHeight, fontSize, lineHeight, tracking } = opts;
  if (fontSize <= 0 || availableWidth <= 0) return 1;
  const longest = Math.max(...lines.map((l: any) => l.length));
  const charWidth = (0.6 + tracking) * fontSize;
  const block = lines.length * lineHeight;
  return Math.max(
    0.05,
    Math.min(
      1,
      charWidth > 0 ? availableWidth / (longest * charWidth) : 1,
      block > 0 && availableHeight > 0 ? availableHeight / block : 1
    )
  );
}

var MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined') return () => {};
      const mq = window.matchMedia(MOTION_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => typeof window !== 'undefined' ? window.matchMedia(MOTION_QUERY).matches : false,
    () => false
  );
}

function useDrift(speed: any) {
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const reduced = usePrefersReducedMotion();
  const active = speed > 0 && !reduced;
  React.useEffect(() => {
    if (!active) return;
    let raf = 0;
    let start = 0;
    const tick = (now: any) => {
      if (!start) start = now;
      const t = (now - start) / 1000 * speed;
      setOffset({ x: 0.06 * Math.sin(0.37 * t), y: 0.045 * Math.cos(0.23 * t) });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, speed]);
  return active ? offset : { x: 0, y: 0 };
}

function gradientDataUrl(g: any, aspect: any) {
  if (typeof document === "undefined") return "";
  const w = 512;
  const h = Math.max(1, Math.round(w / aspect));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = g.colorDark;
  ctx.fillRect(0, 0, w, h);
  const radial = ctx.createRadialGradient(
    w * g.centreX,
    h * g.centreY,
    0,
    w * g.centreX,
    h * g.centreY,
    Math.max(1, w * g.radius)
  );
  radial.addColorStop(0, g.colorLight);
  radial.addColorStop(Math.min(0.99, Math.max(0.01, g.midStop)), g.colorMid);
  radial.addColorStop(1, g.colorDark);
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, w, h);
  return canvas.toDataURL("image/png");
}

function TicketCard({
  name,
  presenter,
  event,
  venue,
  dates,
  stubText,
  watermark,
  width = REF,
  geometry = TICKET_GEOMETRY,
  layout = TICKET_LAYOUT,
  texture = TICKET_TEXTURE,
  gradient = TICKET_GRADIENT,
  className
}: any) {
  const height = width / geometry.aspect;
  const perfX = geometry.perforation * width;
  const reduced = usePrefersReducedMotion();
  const drift = useDrift(texture.engine === "image" ? texture.speed : 0);
  const lines = splitName(name);
  const scale = fitScale(lines, {
    availableWidth: perfX - layout.padding * width - 0.03 * width,
    availableHeight: layout.footerTop * width - layout.nameTop * width - 0.02 * width,
    fontSize: layout.nameSize * width,
    lineHeight: layout.nameLead * width,
    tracking: layout.nameTracking
  });
  const sourceImage = React.useMemo(
    () => texture.image ? texture.image : (texture.engine === "image" ? gradientDataUrl(gradient, geometry.aspect) : ""),
    [texture.engine, texture.image, gradient, geometry.aspect]
  );
  const shaderStyle: any = {
    position: "absolute",
    inset: 0,
    width,
    height
  };
  return (
    <div
      className={`relative select-none ${className ?? ""}`}
      style={{ width, height, clipPath: `path('${ticketClipPath(width, height, geometry)}')` }}
    >
        <div className="absolute inset-0" style={{ background: texture.colorBack }} />
        {texture.engine === "image" && sourceImage ? (
          <ImageDithering
            image={sourceImage}
            colorBack={texture.colorBack}
            colorFront={texture.colorFront}
            colorHighlight={texture.colorHighlight}
            type={texture.type}
            size={texture.size}
            colorSteps={texture.colorSteps}
            originalColors={texture.originalColors}
            scale={texture.scale}
            rotation={texture.rotation}
            offsetX={texture.offsetX + drift.x}
            offsetY={texture.offsetY + drift.y}
            fit="cover"
            style={shaderStyle}
          />
        ) : (
          <Dithering
            colorBack={texture.colorBack}
            colorFront={texture.colorFront}
            shape={texture.shape}
            type={texture.type}
            size={texture.size}
            scale={texture.scale}
            rotation={texture.rotation}
            offsetX={texture.offsetX}
            offsetY={texture.offsetY}
            speed={reduced ? 0 : texture.speed}
            style={shaderStyle}
          />
        )}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: perfX,
            width: Math.max(1, 0.0022 * width),
            backgroundImage: `repeating-linear-gradient(to bottom, ${layout.inkColor}55 0 ${0.012 * width}px, transparent ${0.012 * width}px ${0.024 * width}px)`
          }}
        />
        <div
          className="pointer-events-none absolute grid place-items-center font-bold tabular-nums"
          style={{
            left: perfX,
            top: 0,
            width: width - perfX,
            height,
            color: layout.watermarkColor,
            opacity: layout.watermarkOpacity
          }}
        >
            <span
              style={{
                writingMode: "vertical-rl",
                fontSize: layout.watermarkSize * width,
                lineHeight: 1,
                letterSpacing: "-0.04em"
              }}
            >
              {watermark}
            </span>
        </div>
        <div className="absolute inset-0" style={{ color: layout.inkColor }}>
          <div
            className="absolute whitespace-nowrap uppercase font-mono tracking-[0.2em] opacity-60"
            style={{
              left: layout.padding * width,
              top: layout.labelTop * width,
              fontSize: layout.labelSize * width * 1.0,
              letterSpacing: `${layout.labelTracking}em`
            }}
          >
              {presenter} // {event}
          </div>
          <div
            className="absolute font-black font-sans tracking-tighter uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
            style={{
              left: layout.padding * width,
              top: layout.nameTop * width,
              fontSize: layout.nameSize * width * scale,
              lineHeight: `${layout.nameLead * width * scale}px`,
              letterSpacing: `${layout.nameTracking}em`
            }}
          >
            {lines.map((line: any, i: any) => <div key={i}>{line}</div>)}
          </div>
          <div
            className="absolute whitespace-nowrap uppercase font-mono font-semibold tracking-widest opacity-80"
            style={{
              left: layout.padding * width,
              top: layout.footerTop * width,
              fontSize: layout.footerSize * width * 1.2,
              letterSpacing: `${layout.footerTracking}em`
            }}
          >
              {venue}
{" \u00B7 "}
              {dates}
          </div>
          <div
            className="absolute grid place-items-center font-black font-mono whitespace-nowrap uppercase drop-shadow-md"
            style={{
              left: perfX,
              top: 0,
              width: width - perfX,
              height,
              fontSize: layout.stubSize * width,
              letterSpacing: `${layout.stubTracking}em`,
              opacity: layout.stubOpacity
            }}
          >
            <span style={{ writingMode: "vertical-rl" }}>{stubText}</span>
          </div>
        </div>
    </div>
  );
}

function TiltCard({
  children,
  clipPath,
  maxTilt = 9,
  scale = 1.02,
  glare = 0.16,
  className
}: any) {
  const cardRef = React.useRef<any>(null);
  const glareRef = React.useRef<any>(null);
  const [hovering, setHovering] = React.useState(false);
  const onMove = React.useCallback(
    (e: any) => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - rect.left) / rect.width - 0.5;
      const dy = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(1200px) rotateX(${-(dy * 2) * maxTilt}deg) rotateY(${dx * 2 * maxTilt}deg) scale(${scale})`;
      if (glareRef.current) {
        glareRef.current.style.background = `radial-gradient(38% 55% at ${(dx + 0.5) * 100}% ${(dy + 0.5) * 100}%, rgba(255,255,255,${glare}) 0%, rgba(255,255,255,0) 70%)`;
      }
    },
    [maxTilt, scale, glare]
  );
  const onLeave = React.useCallback(() => {
    setHovering(false);
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)";
    }
    if (glareRef.current) glareRef.current.style.background = "transparent";
  }, []);
  return (
    <div
      ref={cardRef}
      onPointerEnter={() => setHovering(true)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`relative w-fit will-change-transform ${className ?? ""}`}
      style={{
        transition: hovering ? "none" : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)",
        transformStyle: "preserve-3d"
      }}
    >
        {children}
        {glare > 0 && (
          <div
            ref={glareRef}
            aria-hidden={true}
            className="pointer-events-none absolute inset-0"
            style={{
              clipPath,
              transition: hovering ? "none" : "background 420ms ease-out"
            }}
          />
        )}
    </div>
  );
}

export default function AdmitOneTicket({ tilt, ...props }: any) {
  const width = props.width ?? REF;
  const geometry = props.geometry ?? TICKET_GEOMETRY;
  if (tilt === false) return <TicketCard {...props} />;
  return (
    <TiltCard
      clipPath={`path('${ticketClipPath(width, width / geometry.aspect, geometry)}')`}
      {...tilt}
    >
      <TicketCard {...props} />
    </TiltCard>
  );
}

/**
 * SkylineHolographicTicket Component
 * Direct implementation of the official Skyline Student Association 3D Holographic Foil Pass.
 * Features:
 * - Ultra-high-contrast iridescent holographic foil body
 * - Neon cobalt blue & cyan ambient ground illumination
 * - 3D cursor perspective tilt & specular prismatic glare tracking
 * - Dynamic Attendee, Event, Barcode, and Door Entry credentials
 */
export function SkylineHolographicTicket({
  ticketId = "TKT-8841-TECH",
  eventName = "INNOVATION & TECH SUMMIT 2026",
  attendeeName = "ADITHYA",
  venue = "MAIN AUDITORIUM",
  date = "OCTOBER 18, 2026",
  time = "10:00 AM",
  stubText = "VIP ADMIT",
  barcodeNumber = "912215",
  tier = "member",
  status = "valid",
  width,
  interactive = true,
  className = "",
  onClick,
  glow = true
}: {
  ticketId?: string;
  eventName?: string;
  attendeeName?: string;
  venue?: string;
  date?: string;
  time?: string;
  stubText?: string;
  barcodeNumber?: string;
  tier?: "member" | "guest";
  status?: "valid" | "checked_in" | "used";
  width?: number | string;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
  glow?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - rect.left) / rect.width - 0.5;
    const dy = (e.clientY - rect.top) / rect.height - 0.5;
    
    // Smooth 3D tilt with clamped angles
    el.style.transform = `perspective(1200px) rotateX(${-(dy * 16)}deg) rotateY(${dx * 18}deg) scale3d(1.025, 1.025, 1.025)`;
    
    // Specular prismatic rainbow glare tracking cursor
    if (glareRef.current) {
      const px = (dx + 0.5) * 100;
      const py = (dy + 0.5) * 100;
      glareRef.current.style.background = `radial-gradient(circle 240px at ${px}% ${py}%, rgba(255, 255, 255, 0.45) 0%, rgba(0, 240, 255, 0.28) 30%, rgba(168, 85, 247, 0.22) 55%, transparent 80%)`;
      glareRef.current.style.opacity = "1";
    }
  };

  const handlePointerLeave = () => {
    setHovering(false);
    const el = cardRef.current;
    if (el) {
      el.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = "0";
    }
  };

  return (
    <div
      className={`relative inline-block w-full max-w-[580px] group select-none ${className}`}
      style={{ width: width ? (typeof width === "number" ? `${width}px` : width) : "100%" }}
      onClick={onClick}
    >
      {/* Ambient Neon Ground Illumination Reflection (matches uploaded ticket image) */}
      {glow && (
        <>
          <div className="absolute -inset-x-6 -bottom-8 h-24 bg-gradient-to-t from-[#0047AB]/50 via-cyan-400/30 to-transparent blur-2xl pointer-events-none rounded-full transform -rotate-1 opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -inset-3 bg-gradient-to-r from-[#0047AB]/35 via-cyan-500/25 to-purple-600/35 blur-xl pointer-events-none rounded-3xl opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
        </>
      )}

      {/* 3D Tilted Card Body */}
      <div
        ref={cardRef}
        onPointerEnter={() => setHovering(true)}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer shadow-[0_20px_50px_rgba(0,30,80,0.65)] border border-cyan-400/50 bg-[#050B14]"
        style={{
          transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transition: hovering ? "none" : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
          transformStyle: "preserve-3d"
        }}
      >
        {/* Base High-Resolution Holographic Ticket Image Asset */}
        <img
          src="/tickets/skyline-holographic-pass.jpg"
          alt="Skyline Student Association Holographic Foil Pass"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
        />

        {/* Prismatic Specular Glare Layer (Follows cursor) */}
        <div
          ref={glareRef}
          aria-hidden={true}
          className="absolute inset-0 pointer-events-none mix-blend-color-dodge transition-opacity duration-300 z-10 opacity-0"
        />

        {/* Edge Sheen & Holographic Reflection Overlay */}
        <div
          aria-hidden={true}
          className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-cyan-400/10 to-purple-500/15 mix-blend-overlay z-10"
        />

        {/* Live Dynamic Credential Overlays */}
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-5 pointer-events-none">
          {/* Top Bar: Live Ticket Status & Tier */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase">
            <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-200 backdrop-blur-md shadow-xs">
              ✦ {ticketId}
            </span>
            <span className={`px-2 py-0.5 rounded-full backdrop-blur-md border ${
              status === "valid"
                ? "bg-emerald-950/80 border-emerald-400/50 text-emerald-300"
                : "bg-slate-900/80 border-slate-600 text-slate-300"
            }`}>
              {status === "valid" ? "● READY FOR ENTRY" : "CHECKED IN"}
            </span>
          </div>

          {/* Center Zone: Dynamic Attendee & Event Tag */}
          <div className="flex flex-col items-center justify-center text-center px-4 my-auto transform -translate-y-1">
            <div className="inline-block px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-cyan-300/30 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-cyan-100 shadow-md">
              {eventName}
            </div>
          </div>

          {/* Bottom Metadata Bar */}
          <div className="flex items-end justify-between text-white/90 text-[9px] sm:text-[11px] font-mono backdrop-blur-[2px]">
            <div className="flex flex-col">
              <span className="text-cyan-300 font-bold uppercase tracking-wider text-[10px] sm:text-xs">
                {attendeeName}
              </span>
              <span className="text-slate-300 text-[8px] sm:text-[10px]">
                {date} · {venue}
              </span>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="font-extrabold text-cyan-200 tracking-widest text-[10px] sm:text-xs">
                {stubText}
              </span>
              <span className="text-slate-400 font-mono text-[8px] sm:text-[10px]">
                CODE: {barcodeNumber}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

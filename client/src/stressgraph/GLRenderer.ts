import type { GLSeedData } from "./SeedField";

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision mediump float;
#define MAX_SEEDS 200

uniform vec2 u_resolution;
uniform int u_seedCount;
uniform vec2 u_seeds[MAX_SEEDS];
uniform float u_hues[MAX_SEEDS];
uniform float u_stress[MAX_SEEDS];

vec3 hsl2rgb(float h, float s, float l) {
  float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
  float p = 2.0 * l - q;
  float tr = h + 1.0/3.0; if (tr > 1.0) tr -= 1.0;
  float tg = h;
  float tb = h - 1.0/3.0; if (tb < 0.0) tb += 1.0;
  float r = tr < 1.0/6.0 ? p+(q-p)*6.0*tr : tr < 0.5 ? q : tr < 2.0/3.0 ? p+(q-p)*(2.0/3.0-tr)*6.0 : p;
  float g = tg < 1.0/6.0 ? p+(q-p)*6.0*tg : tg < 0.5 ? q : tg < 2.0/3.0 ? p+(q-p)*(2.0/3.0-tg)*6.0 : p;
  float b = tb < 1.0/6.0 ? p+(q-p)*6.0*tb : tb < 0.5 ? q : tb < 2.0/3.0 ? p+(q-p)*(2.0/3.0-tb)*6.0 : p;
  return vec3(r, g, b);
}

void main() {
  vec2 uv = gl_FragCoord.xy;
  float minDist1 = 1.0e10;
  float minDist2 = 1.0e10;
  int closest = 0;

  for (int i = 0; i < MAX_SEEDS; i++) {
    if (i >= u_seedCount) break;
    float d = distance(uv, u_seeds[i]);
    if (d < minDist1) {
      minDist2 = minDist1;
      minDist1 = d;
      closest = i;
    } else if (d < minDist2) {
      minDist2 = d;
    }
  }

  float edgeDist = minDist2 - minDist1;
  float edgeFactor = smoothstep(0.0, 4.0, edgeDist);
  float stress = u_stress[closest];

  float h = mod((u_hues[closest] + stress * 60.0) / 360.0, 1.0);
  float s = 0.70 + stress * 0.20;
  float l = 0.55 - stress * 0.10;
  vec3 cellColor = hsl2rgb(h, s, l);

  float edgeWhiteness = (1.0 - edgeFactor) * (0.3 + stress * 0.5);
  vec3 finalColor = mix(cellColor, vec3(1.0), edgeWhiteness);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export class GLRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private posBuffer: WebGLBuffer;
  private a_position: number;
  private u_resolution: WebGLUniformLocation;
  private u_seedCount: WebGLUniformLocation;
  private u_seeds: WebGLUniformLocation;
  private u_hues: WebGLUniformLocation;
  private u_stress: WebGLUniformLocation;
  private seedsUpload = new Float32Array(2 * 200);
  private huesUpload = new Float32Array(200);
  private stressUpload = new Float32Array(200);

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) throw new Error("[GLRenderer] WebGL unavailable");

    this.gl = gl;

    const vs = this._compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = this._compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    this.program = this._linkProgram(vs, fs);

    this.posBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]),
      gl.STATIC_DRAW,
    );

    gl.useProgram(this.program);

    this.a_position = gl.getAttribLocation(this.program, "a_position");
    this.u_resolution = gl.getUniformLocation(this.program, "u_resolution")!;
    this.u_seedCount = gl.getUniformLocation(this.program, "u_seedCount")!;
    this.u_seeds = gl.getUniformLocation(this.program, "u_seeds")!;
    this.u_hues = gl.getUniformLocation(this.program, "u_hues")!;
    this.u_stress = gl.getUniformLocation(this.program, "u_stress")!;

    gl.uniform2f(this.u_resolution, canvas.width, canvas.height);
  }

  render(data: GLSeedData): void {
    const gl = this.gl;
    const n = data.count;

    this.seedsUpload.set(data.positions.subarray(0, n * 2));
    this.huesUpload.set(data.hues.subarray(0, n));
    this.stressUpload.set(data.stresses.subarray(0, n));

    gl.useProgram(this.program);
    gl.uniform1i(this.u_seedCount, n);
    gl.uniform2fv(this.u_seeds, this.seedsUpload);
    gl.uniform1fv(this.u_hues, this.huesUpload);
    gl.uniform1fv(this.u_stress, this.stressUpload);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.enableVertexAttribArray(this.a_position);
    gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  resize(width: number, height: number): void {
    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.u_resolution, width, height);
  }

  destroy(): void {
    this.gl.deleteProgram(this.program);
    this.gl.deleteBuffer(this.posBuffer);
  }

  private _compileShader(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
      throw new Error("[GLRenderer] Shader: " + gl.getShaderInfoLog(sh));
    return sh;
  }

  private _linkProgram(vs: WebGLShader, fs: WebGLShader): WebGLProgram {
    const gl = this.gl;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      throw new Error("[GLRenderer] Link: " + gl.getProgramInfoLog(prog));
    return prog;
  }
}

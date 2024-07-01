export type Coord = { x: number; y: number }

export type Part = {
  θ: number
  magnitude: number
  parent: Part | null
  x?: number
  y?: number
}

export const part = (p: Part) => p

export const convert = (θ: number) => ((360 - θ) % 360) * (Math.PI / 180)

export function compute_end({ x, y }: Coord, θ: number, offset: number): Coord {
  return {
    x: x + offset * Math.cos(convert(θ)),
    y: y + offset * Math.sin(convert(θ)),
  }
}

export const make = (n: number) => ({
  of: <T>(v: T) => Array.from({ length: n }, () => v),
})

export const fill_frames = (Δ: number, f: number) => make(f).of(Δ / f)

export function clone(canvas: HTMLCanvasElement) {
  const layer = document.createElement('canvas')

  layer.width = canvas.width
  layer.height = canvas.height

  return [layer, layer.getContext('2d')!] as [
    HTMLCanvasElement,
    CanvasRenderingContext2D
  ]
}

export const log = (...args: any) => console.log(...args)

import step from './step.wav'
let sound = new Audio(step)
import './style.css'
import { clone, part, fill_frames, compute_end } from './utils.ts'
import type { Coord, Part } from './utils.ts'

const main = document.createElement('canvas')
main.width = 500
main.height = 500

const scene = main.getContext('2d')!
const blank = scene.createImageData(main.width, main.height)

document.querySelector<HTMLDivElement>('#app')!.append(main)

const [ht, ht_ctx] = clone(main)
const [left, left_ctx] = clone(main)
const [right, right_ctx] = clone(main)

const layers = [main, left, ht, right]

function cycle<T>(list: Array<T>) {
  function* _(list: Array<T>) {
    while (true) {
      for (const item of list) {
        yield item
      }
    }
  }
  const $ = _(list)
  return () => $.next().value as T
}

const waist /* FIXED POINT */ = part({
  parent: null,
  x: 200,
  y: 250,
  θ: 0,
  magnitude: 0,
})

const base = 35

const torso = part({
  parent: waist,
  magnitude: 2.5 * base,
  θ: 67.5,
})

const head = part({
  parent: torso,
  magnitude: base,
  θ: torso.θ, // tie to torso
})

const upper_arms = 1.3 * base
const arm_right_upper = part({
  parent: torso,
  magnitude: upper_arms,
  θ: 225,
})
const arm_left_upper = part({
  parent: torso,
  magnitude: upper_arms,
  θ: 315,
})

const lower_arms = 1.15 * upper_arms
const arm_right_lower = part({
  parent: arm_right_upper,
  magnitude: lower_arms,
  θ: 300,
})
const arm_left_lower = part({
  parent: arm_left_upper,
  magnitude: lower_arms,
  θ: 30,
})

const upper_legs = 1.8 * base
const leg_right_upper = part({
  parent: waist,
  magnitude: upper_legs,
  θ: 315,
})
const leg_left_upper = part({
  parent: waist,
  magnitude: upper_legs,
  θ: 270,
})

const lower_legs = 0.9 * upper_legs
const leg_right_lower = part({
  parent: leg_right_upper,
  magnitude: lower_legs,
  θ: 270,
})
const leg_left_lower = part({
  parent: leg_left_upper,
  magnitude: lower_legs,
  θ: 270,
})

const feet = 0.6 * base
const foot_right = part({
  parent: leg_right_lower,
  magnitude: feet,
  θ: 0,
})
const foot_left = part({
  parent: leg_left_lower,
  magnitude: feet,
  θ: 0,
})

const arc =
  2 * Math.PI -
  Math.atan2(
    position(foot_right).y - waist.y!,
    position(foot_right).x - waist.x!
  )

const { x: ox, y: oy } = position(foot_right)
const { x: xl, y: yl } = position(foot_left)
const stair = {
  θ: -arc + 2 * Math.PI,
  y: oy,
  x: ox,
}
const dx = (xl - ox) / 90
const dy = (yl - oy) / 90

function paint_stairs() {
  redraw_layer(scene, (ctx) => {
    ctx.beginPath()
    let DX = -dx * 90,
      DY = dy * 90
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(stair.x - DX * i - 8, stair.y + 3 + DY * i, 70, 8)
      ctx.fillRect(stair.x - DX * -i - 8, stair.y + 3 + DY * -i, 70, 8)
    }
    ctx.closePath()
  })
}

function paint_head_torso() {
  redraw_layer(ht_ctx, (ctx) => {
    head: {
      let { x, y } = compute_end(
        compute_end(position(torso), torso.θ, torso.magnitude),
        torso.θ,
        head.magnitude / 2
      )
      ctx.beginPath()
      ctx.lineWidth = 5
      ctx.arc(x, y, head.magnitude / 2, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.closePath()

      ctx.beginPath()
      ctx.lineWidth = 2
      ctx.arc(x + 7, y - 2, 2, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.closePath()
    }

    torso: {
      draw_appendage(torso, ctx)
    }
  })
}

function paint_right() {
  redraw_layer(right_ctx, (ctx) => {
    ;[
      arm_right_upper,
      arm_right_lower,
      leg_right_upper,
      leg_right_lower,
      foot_right,
    ].forEach((p) => draw_appendage(p, ctx))
  })
}

function paint_left() {
  redraw_layer(left_ctx, (ctx) => {
    ;[
      arm_left_upper,
      arm_left_lower,
      leg_left_upper,
      leg_left_lower,
      foot_left,
    ].forEach((p) => draw_appendage(p, ctx))
  })
}

function draw_appendage(part: Part, ctx: CanvasRenderingContext2D) {
  const { x, y } = position(part)
  const { x: x1, y: y1 } = compute_end({ x, y }, part.θ, part.magnitude)

  ctx.beginPath()
  ctx.lineWidth = 6
  // ctx.strokeStyle =
  // '#' +
  // Math.floor(Math.random() * 0xffffff)
  //   .toString(16)
  //   .padStart(6, '0')
  ctx.moveTo(x, y)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  ctx.closePath()
}

function paint() {
  paint_right()
  paint_head_torso()
  paint_left()
  paint_stairs()
}

paint()

// Δθ
const stair_frames = cycle([...fill_frames(1, 90), ...fill_frames(0, 180)])

const torso_frames = cycle([
  ...fill_frames(22.5, 90 * 2),
  ...fill_frames(-22.5, 45 * 2),
])

const swing_ua_forwards = [...fill_frames(90, 135 * 2)]
const swing_ua_backwards = swing_ua_forwards
  .slice()
  .reverse()
  .map((d) => -d)

const ula_frames = cycle([...swing_ua_backwards, ...swing_ua_forwards])
const ura_frames = cycle([...swing_ua_forwards, ...swing_ua_backwards])

const swing_lower_forwards = [...fill_frames(60, 135 * 2)]
const swing_lower_backwards = swing_lower_forwards
  .slice()
  .reverse()
  .map((d) => -d)
const lla_frames = cycle([...swing_lower_backwards, ...swing_lower_forwards])
const lra_frames = cycle([...swing_lower_forwards, ...swing_lower_backwards])

const ull = [
  ...fill_frames(0, 90),
  ...fill_frames(45, 90),
  ...fill_frames(0, 90),
  ...fill_frames(-45, 90),
  ...fill_frames(0, 180),
]

const ulr = [
  ...fill_frames(-45, 90),
  ...fill_frames(0, 270),
  ...fill_frames(45, 90),
  ...fill_frames(0, 90),
]

const ull_frames = cycle(ull)
const ulr_frames = cycle(ulr)

const lll = [
  ...fill_frames(-45, 90),
  ...fill_frames(0, 90),
  ...fill_frames(45, 90),
  ...fill_frames(0, 270),
]

const llr = [
  ...fill_frames(0, 270),
  ...fill_frames(-45, 90),
  ...fill_frames(0, 90),
  ...fill_frames(45, 90),
]

const lll_frames = cycle(lll)
const llr_frames = cycle(llr)

const fl = [
  ...fill_frames(-45, 90),
  ...fill_frames(15, 90),
  ...fill_frames(30, 90),
  ...fill_frames(0, 270),
]

const fr = [
  ...fill_frames(0, 270),
  ...fill_frames(-45, 90),
  ...fill_frames(15, 90),
  ...fill_frames(30, 90),
]

const fl_frames = cycle(fl)
const fr_frames = cycle(fr)

let is_holding = false
document.addEventListener('keydown', (e) => {
  if (e.key == 'ArrowRight') is_holding = true
})
document.addEventListener('keyup', (e) => {
  if (e.key == 'ArrowRight') is_holding = false
})

let count = 0

setInterval(() => {
  if (is_holding) {
    count++
    
    if (stair_frames()) {
      stair.x += dx
      stair.y += dy
    }
    if (count % 540 == 0) {
      sound.play()
      stair.x = ox
      stair.y = oy
      count = 0
    }

    torso.θ += torso_frames()

    arm_left_upper.θ += ula_frames()
    arm_right_upper.θ += ura_frames()

    arm_left_lower.θ += lla_frames()
    arm_right_lower.θ += lra_frames()

    leg_left_upper.θ += ull_frames()
    leg_right_upper.θ += ulr_frames()

    leg_left_lower.θ += lll_frames()
    leg_right_lower.θ += llr_frames()

    foot_left.θ += fl_frames()
    foot_right.θ += fr_frames()

    paint()
  }
}, 2)

function position(part: Part): { x: number; y: number } {
  function query(p: Part): Coord {
    if (p.parent == null) return { x: p.x!, y: p.y! }

    const { x: sx, y: sy } = query(p.parent)

    return compute_end({ x: sx, y: sy }, p.θ, p.magnitude)
  }

  return query(part.parent!)
}

function redraw_layer(
  ctx: CanvasRenderingContext2D,
  cb: (ctx: CanvasRenderingContext2D) => void
) {
  ctx.clearRect(0, 0, main.width, main.height)
  ctx.putImageData(blank, main.width, main.height)
  cb(ctx)
  compose()
}

function compose() {
  // scene.clearRect(0, 0, main.width, main.height)
  layers.forEach((layer) => scene.drawImage(layer, 0, 0))
}

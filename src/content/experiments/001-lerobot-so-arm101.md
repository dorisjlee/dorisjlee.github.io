---
title: "SO-ARM101: The Real Story of Getting Started (and Almost Giving Up)"
date: 2026-07-26
featured: true
description: |
  I thought setting up a robot arm and LeRobot would take a weekend. It took about a month —
  and almost none of that time was actually about robotics.
tags:
  - LeRobot
  - SO-ARM101
  - beginner
  - lessons-learned
---

I'm brand new to robotics, and I wanted to write down what getting started with the
SO-ARM101 and LeRobot actually looked like — not the polished version, the real one.

I assumed this would be a weekend project: unbox the arm, follow the quickstart, and be
teleoperating by Sunday night. It took about a month to get something basic working, and
almost none of that time was spent on robotics itself.

## The desk isn't just a desk anymore

The first thing nobody tells you is that your desk is now part of the robot. I clamped an
overhead webcam to a shelf and zip-tied a second one to the wrist, and only after a few
recording sessions did I realize the arm's reach and the camera framing were fighting each
other. I rearranged my desk three separate times before the whole workspace actually fit in
frame for both cameras.

Lighting was the sneakier problem. I didn't think about it at all until I compared a morning
recording session to an evening one — the camera feed looked like a completely different
room. If I'd fixed the lighting before writing a single line of code, I would have saved
myself a lot of confused debugging later.

## Choosing an OS turned into its own project

I tried to get everything running on Windows first, assuming CUDA and PyTorch would just
work. They didn't. After burning over a week on driver mismatches, I ended up wiping the
machine and dual-booting Ubuntu just to get a sane GPU setup. Once I was on Linux, getting
the NVIDIA driver, CUDA toolkit, and PyTorch build to all agree on a version took another
few days of trial and error.

## Cameras have opinions about USB ports

Even after the OS and GPU were sorted, the two webcams kept swapping device indices
whenever I unplugged and replugged something. I recorded an entire session with the wrong
camera without noticing until I reviewed the footage later. Now I label which physical USB
port each camera goes into and never move them.

## What finally worked

About a month after unboxing, I had a genuinely basic pipeline working: stable cameras, a
GPU that PyTorch could actually see, and a short batch of demonstrations recorded end to
end with the SO-ARM101. Nothing trained yet that I'd call good — but the infrastructure
finally stopped fighting me, which felt like a real milestone.

## What I'd tell someone starting today

- Budget a full month for "getting started," not a weekend. Almost none of it is robotics —
  it's OS, drivers, and cameras.
- Fix your lighting and desk layout before you touch any code. It's much cheaper to solve early.
- Pick Linux from day one if the tooling wants Linux. Don't try to force Windows to cooperate.
- Physically label which USB port each camera uses.
- The gap between "the tutorial works" and "it works on my desk" is where all the real
  learning happens.

If you're starting out too — expect the environment to eat most of your time. The robotics
part comes after.

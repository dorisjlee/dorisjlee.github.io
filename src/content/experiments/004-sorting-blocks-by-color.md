---
title: "Sorting Blocks by Color: From One Tray to Two"
date: 2026-09-07
featured: true
description: |
  My single-color pick-and-place policy generalized to new shapes and colors, but broke the
  moment I changed the tray's color. So I built a real sorting task: two trays, two colors,
  and a policy that has to actually look at the block before deciding where it goes.
tags:
  - LeRobot
  - SO-ARM101
  - ACT
  - imitation-learning
  - color-sorting
---

<iframe src="https://www.youtube-nocookie.com/embed/kappIozO9ys?autoplay=1&mute=1&loop=1&playlist=kappIozO9ys&controls=1" style="width: 100%; max-width: 400px; aspect-ratio: 9 / 16; display: block; margin: 0 auto 1.5rem;" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen title="Color-sorting task demo"></iframe>

In my [last post](/diary/002-pick-and-place-act), I trained ACT on a single yellow block and a single yellow tray, then poked at what the policy actually generalized to. The results were a mixed bag:

| What I changed | Did it work? |
|---|---|
| Shape of the block | ✅ Yes |
| Color of the block | ✅ Yes |
| Color of the tray | ❌ No |

The block's shape and color could change and the policy still grabbed it fine, it had learned something like "grab the block-shaped thing," not "grab the yellow thing." But the moment I changed the *tray's* color, it fell apart. The policy had learned to place into a fixed target, not to reason about where a block of a given color actually belonged. 

## The Task: Two Trays, Two Colors

So the natural next step was to make color actually matter: a task the policy can't solve without looking at the block. Two trays, two colors, and the block has to end up in the tray that matches its color:

<video src="/videos/block-sort-animation.mp4" autoplay muted loop playsinline style="width: 100%; max-width: 500px; display: block; margin: 0 auto 1.5rem;"></video>

This is a meaningfully different problem from the last post. Pick-and-place with one target is a motor-control task: the policy just needs to reproduce a trajectory. Sorting with two targets is a motor-control task *plus* a decision: look at the block, determine its color, and choose the correct trajectory accordingly.

## Collecting the Dataset

I collected 80 episodes, split roughly evenly between the two colors: about 40 green and 40 yellow, so the policy would see both classes equally often rather than learning a bias toward whichever color happened to be overrepresented. I varied the order color-to-color, sometimes alternating between green and yellow episode to episode, sometimes running a streak of the same color for a few episodes in a row, so the policy couldn't pick up on any pattern in the *ordering* itself and learn something spurious like "the color alternates" instead of actually looking at the block.

You can browse the full dataset here:

<iframe src="https://lerobot-visualize-dataset.hf.space/?path=%2Fdorisjlee%2Fplace-rectangle-colored-box%2Fepisode_0" width="100%" height="900" frameborder="0" loading="lazy" title="Full dataset: place-rectangle-colored-box"></iframe>

## Training ACT

Same ACT setup as [the last post](/diary/002-pick-and-place-act), with a few architecture changes for the added complexity of the task:

```bash
lerobot-train \
  --dataset.repo_id=dorisjlee/place-rectangle-colored-box \
  --policy.type=act \
  --policy.device=cuda \
  --policy.repo_id=dorisjlee/sort_blocks_by_color_act_v1 \
  --output_dir=outputs/train/sort_blocks_by_color_act_v1 \
  --job_name=sort_blocks_by_color_act_v1 \
  --policy.chunk_size=50 \
  --policy.n_action_steps=50 \
  --policy.dim_model=256 \
  --policy.dim_feedforward=1024 \
  --policy.n_heads=4 \
  --policy.n_encoder_layers=3 \
  --policy.n_decoder_layers=1 \
  --policy.latent_dim=32 \
  --policy.n_obs_steps=1 \
  --steps=30000 \
  --batch_size=4 \
  --wandb.enable=true
```

The result: [sort_blocks_by_color_act_v1](https://huggingface.co/dorisjlee/sort_blocks_by_color_act_v1).

## Rolling It Out

```bash
lerobot-rollout \
  --robot.type=so101_follower \
  --robot.port=COM5 \
  --robot.id=my_awesome_follower_arm \
  --robot.cameras="{
    front: {type: opencv, index_or_path: 0, width: 640, height: 480, fps: 30},
    overhead: {type: opencv, index_or_path: 2, width: 1920, height: 1080, fps: 30}
  }" \
  --policy.path=dorisjlee/sort_blocks_by_color_act_v1 \
  --strategy.type=base \
  --display_data=true
```

This kind of worked at the beginning, but not reliably. The arm's reaches were consistently slightly off, in a way that looked less like "the policy is confused about color" and more like "the policy and the physical world disagree about where things are."

After a few weeks, it was completely off. Not just occasionally missing, but consistently reaching for the wrong spot regardless of where the block actually was. That sent me down a whole separate debugging path, which turned into its own post: [Debugging a Regression: Recalibrating the Workspace by Replaying Training Trajectories](/diary/003-recalibrating-workspace-replay). In short, my workspace geometry had drifted out of alignment with what the training data expected, and I had to recalibrate the base, trays, and cameras back into place.

After recalibration, this worked! The policy reliably looked at the block, identified its color, and placed it in the matching tray: the first real evidence that ACT on this setup can make a decision that alters the action trajectory using visual feedback.

<video src="/videos/color-sorting-rollout.mp4" autoplay muted loop playsinline controls style="width: 100%; max-width: 600px; display: block; margin: 0 auto 1.5rem;"></video>


---
title: "Debugging a Regression: Recalibrating the Workspace by Replaying Training Trajectories"
date: 2026-08-29
featured: true
description: |
  My color-sorting ACT policy suddenly started missing the block, reaching to the same spot
  every time regardless of where the block actually was. Here's how I used the raw recorded
  training trajectories — replayed directly on the physical arm — to figure out it was a
  workspace calibration problem, not a model problem.
tags:
  - LeRobot
  - SO-ARM101
  - ACT
  - debugging
  - calibration
---

In my [last post](/diary/002-pick-and-place-act), I trained ACT to reliably pick up a single yellow block and place it in a tray. The natural next step was to extend that to sorting: multiple colored blocks, multiple matching trays, same fixed workspace. I trained [sort_blocks_by_color_act_v1](https://huggingface.co/dorisjlee/sort_blocks_by_color_act_v1) on 81 episodes from [place-rectangle-colored-box](https://huggingface.co/datasets/dorisjlee/place-rectangle-colored-box), and it worked. Then, at some point, it stopped working — and not in an obvious way.

## The Symptom

Running the policy live with `lerobot-rollout`, the arm would reach for the block, but consistently miss slightly to the left. Moving the block to a different position didn't move the target — the arm kept reaching for roughly the same physical spot. Changing the block's color didn't change anything either. That looks a lot like a policy that memorized one trajectory and stopped paying attention to the scene.

Except it wasn't quite that. When I removed the block from the workspace entirely, the arm went to a rest position instead of executing the same motion — so it *was* still responding to what the camera saw. Something more specific was off.

<!-- TODO: replace with actual clip of the policy consistently missing the block to the left -->
<img src="/videos/leftward-miss.gif" alt="ACT policy reaching consistently to the left of the block, missing the grasp" />

## Isolating the Variable: Replay the Actual Training Data

Rather than keep guessing between "the model is bad," "the cameras are misconfigured," or "the physical setup shifted," I wanted a test that could only implicate one of those. The idea: take the raw recorded actions from an actual training episode — no policy, no camera input, no inference — and play them back directly on the physical arm.

```text
recorded training actions (from the dataset)
        ↓
physical SO-101
        ↓
does it reach the correct block?
```

If replaying an actual demonstration also misses, the model is innocent — it's something about the physical setup relative to when that data was recorded. If replay lands correctly, the problem is in ACT inference itself.

LeRobot 0.5.2 doesn't ship a CLI for this, so I wrote a small script. The core of it pulls `action` directly from the dataset, bypassing anything that would trigger video decoding (which had its own unrelated `torchcodec` DLL issue on this machine):

```python
from lerobot.datasets.lerobot_dataset import LeRobotDataset

DATASET_REPO_ID = "dorisjlee/place-rectangle-colored-box"
MOTOR_ORDER = ["shoulder_pan", "shoulder_lift", "elbow_flex", "wrist_flex", "wrist_roll", "gripper"]

dataset = LeRobotDataset(DATASET_REPO_ID)

# select_columns avoids decoding video frames — we only need actions
cols = dataset.select_columns(["episode_index", "observation.state", "action"])
indices = [i for i, e in enumerate(cols["episode_index"]) if int(e) == episode]

for idx in indices:
    frame = cols[idx]
    action_vec = [float(v) for v in frame["action"]]
    action = {f"{m}.pos": v for m, v in zip(MOTOR_ORDER, action_vec)}
    robot.send_action(action)
    time.sleep(dt)
```

The first run confirmed it: **the raw recorded trajectory also missed, off to the left.** Same direction, same rough magnitude as the broken policy. That ruled out ACT/inference as the cause entirely — the recorded actions themselves no longer land on the correct physical target. This had to be a change in the physical geometry: the robot base, the trays, or my calibration had shifted relative to where they were during data collection.

## Watching Live vs. Original Side-by-Side, in Rerun

Confirming *that* there was a mismatch was step one. Actually recalibrating the workspace meant repeatedly moving the base/trays back and re-checking, which is painful to do by eyeballing a single camera feed against a mental image of the training video. So I extended the replay script to open a live [Rerun](https://rerun.io/) viewer showing the live camera feed next to the original training clip for the same episode, side by side, for both the overhead and front cameras:

```python
rr.init("replay_episode_comparison", spawn=True)
rr.send_blueprint(
    rrb.Blueprint(
        rrb.Grid(
            rrb.Spatial2DView(origin="live/overhead", name="Live overhead (now)"),
            rrb.Spatial2DView(origin="original/overhead", name=f"Original overhead (ep {episode})"),
            rrb.Spatial2DView(origin="live/front", name="Live front (now)"),
            rrb.Spatial2DView(origin="original/front", name=f"Original front (ep {episode})"),
            grid_columns=2,
        )
    )
)
```

The original clips are decoded straight out of the dataset's mp4 files with OpenCV (`cv2.VideoCapture`, forcing the FFMPEG backend rather than the Windows default, which had its own threading quirks reading from a background thread) — sidestepping the same `torchcodec` issue as before:

```python
def open_original_video_reader(dataset, episode, video_key):
    video_path = dataset.root / dataset.meta.get_video_file_path(episode, video_key)
    ep_meta = dataset.meta.episodes[episode]
    start_frame = round(ep_meta[f"videos/{video_key}/from_timestamp"] * dataset.meta.fps)

    cap = cv2.VideoCapture(str(video_path), cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    return cap, start_frame
```

Before pressing play, the script shows the *first frame* of the original clip as a static reference next to a continuously updating live feed — so I could physically nudge the trays and camera while watching both panels at once, until the live scene visually matched the training frame:

```python
# Static reference frame — logged once, does NOT advance during calibration
original_first_frame[cam_key] = rr.Image(cv2.cvtColor(orig_bgr, cv2.COLOR_BGR2RGB))

def _preview_loop():
    while not stop_preview.is_set():
        rr.set_time("frame", sequence=pn)
        for cam_key in camera_keys:
            live_img = robot.cameras[cam_key].read_latest()
            rr.log(f"live/{cam_key}", rr.Image(live_img))
            rr.log(f"original/{cam_key}", original_first_frame[cam_key])  # stays frozen
```

Only after pressing ENTER does the "original" panel start actually playing forward, in lockstep with the recorded actions being sent to the arm — so during replay itself, you watch the live arm's motion against the original demonstration's motion, frame for frame, on both cameras simultaneously.

<!-- TODO: replace with actual clip of the Rerun side-by-side viewer, showing the block being adjusted to align with the original trajectory -->
<iframe src="https://www.youtube-nocookie.com/embed/PLACEHOLDER" style="width: 100%; max-width: 700px; aspect-ratio: 16 / 9; display: block; margin: 0 auto 1.5rem;" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen title="Calibrating the workspace using the live vs. original Rerun comparison"></iframe>

This is what the corrected setup looks like:

<img src="/images/sort-block-workspace-setup.jpg" alt="Recalibrated sort-block workspace with base, trays, and camera repositioned to match the training data" />

## The Fix Was Trial and Error, Not a Formula

There's no clean closed-form way to compute "the robot base moved 3cm left, rotate 2 degrees" from two camera images. What actually worked was iterative: nudge the base or a tray a little, replay episode 0, watch whether the live feed's arm-to-block alignment matched the frozen original frame more or less closely than before, and repeat. The side-by-side Rerun view made this fast — I could see immediately whether an adjustment helped or made it worse, instead of running a full rollout and reasoning backward from where the gripper ended up.

After a few rounds of this, replaying the same episode landed the gripper correctly on the block again — confirming the geometry was actually fixed and not just "closer."

## What This Diagnostic Framework Gets You

The general pattern is worth keeping around for any imitation-learning setup with a fixed workspace:

| Test | Rules out |
|---|---|
| Pure rollout, no recording | Dataset-writing/encoding pipeline as the cause |
| Remove the block entirely | Policy blindly executing a fixed trajectory regardless of input |
| Replay raw training actions, no policy, no cameras | ACT inference/model itself |
| Replay lands correctly after physical adjustment | Confirms the fix, without needing to re-run the policy at all |

The replay test is the important one here — it's a way to ask "is this a physical setup problem or a model problem?" without needing to trust your own read on a live policy rollout, which is noisy and easy to over-interpret. If I'd skipped straight to retraining or tweaking inference hyperparameters, I'd have burned a lot of time without ever touching the actual cause.

Next up: now that the workspace is back in a known-good state, I'm re-evaluating whether `sort_blocks_by_color_act_v1` is actually well-converged, or whether the harder multi-color task needs more training or more data per color to match the reliability of the single-color model. More on that soon.

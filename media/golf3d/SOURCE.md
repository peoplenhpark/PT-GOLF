# Golf motion provenance

- Source: [CMU Graphics Lab Motion Capture Database, subject 64, trial 01](https://mocap.cs.cmu.edu/search.php?subjectnumber=64).
- Original point data: [64_01.c3d](https://mocap.cs.cmu.edu/subjects/64/64_01.c3d), 120 Hz.
- Source SHA-256: `bfa60767b82a07a4494a988a0d35621187963c269e4a019d29fd1133cc065648`.
- Bundled clip: source frames 141–421 inclusive, 281 frames, 2.333 seconds. Stage selections reference this continuous timeline.
- Credit: Motion data from the CMU Graphics Lab Motion Capture Database, funded by NSF EIA-0196217.
- [Usage terms](https://mocap.cs.cmu.edu/): CMU permits the data's inclusion in products, including commercial products, but prohibits selling the motion data itself. This app uses the clip as an integrated illustration, with source attribution. No endorsement by CMU is implied.

## Processing

`tools/build_golf_mocap.py` reads this particular C3D file with NumPy. A proper coordinate rotation changes the source Z-up coordinates into Y-up coordinates with the target toward +X. It applies a five-sample noise filter and trims the idle lead-in and late settling motion. It retains measured body, head, foot and club marker trajectories. No YouTube video or user motion recording was used to generate this clip.

`motion.js` is generated data. Regenerate it with `python tools/build_golf_mocap.py /path/to/64_01.c3d`. The converter validates the source format and records its hash.

`poses.js` interpolates adjacent recorded samples with a cubic curve. Stage buttons do not change the trajectory or introduce pauses. To suppress apparent limb stretching from skin marker motion, elbows and knees use fixed lengths and the captured bend planes while wrist and foot endpoints retain their recorded paths. Hands are connected to the tracked club shaft. Head and shoe directions also come from markers.

The same captured swing is uniformly scaled for the four note views; club head geometry and tee display vary. These are **common swing illustrations**, not four separately measured club techniques or a reconstruction of the user's swing. They must not be presented as individualized coaching or motion analysis. Existing note and lesson content remains authoritative for personal corrections.

The renderer keeps the same camera framing while playing, pausing, scrubbing and selecting stages. Users can deliberately rotate and zoom. Playback offers the recorded tempo and slower views; it ends at the finish instead of blending backward into address.

## Validation

Run `tests/golf-3d.cjs` against a locally served checkout. It checks fixed limb lengths, hand/shaft attachment, continuity and nonzero velocities across stage boundaries, consistent camera framing, all four note mappings, mobile controls and offline loading. Screenshots and playback still require visual review; passing coordinate tests alone does not establish a natural-looking or technically ideal swing.

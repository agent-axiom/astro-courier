# Astro Courier 100-Iteration Gameplay Roadmap

This backlog is a practical roadmap for future small, testable iterations. Each item should ship as a focused slice with playtest notes, a short verification path, and no unnecessary UI text.

## Onboarding And Clarity

1. Add a one-tap optional practice replay that demonstrates pickup and dock without blocking play.
2. Add a first-fail micro prompt that names only the failed action and one next attempt.
3. Add a mobile-first launch calibration step for touch steering sensitivity.
4. Add route arrows that fade after the player completes the first pickup.
5. Add a concise “why I failed” icon strip to replace any remaining long failure copy.
6. Add contextual first-missile cue that appears only once.
7. Add a first-refuel cue on longhaul missions.
8. Add a first-EMP cue when a missile is near and EMP is ready.
9. Add preflight route difficulty dots with icon-only tooltips.
10. Add an optional replay ghost of a clean first-light delivery.

## Mission Variety

11. Add multi-drop routes with two small cargo pickups.
12. Add rescue missions with a moving extraction window.
13. Add stealth scanner arcs with visible safe gaps.
14. Add rival courier races on familiar routes.
15. Add convoy escort routes with one protected drone.
16. Add timed portal routes with shifting exits.
17. Add salvage missions that require slow docking near debris.
18. Add comet-tail missions with a speed bonus lane.
19. Add smuggler missions with a heat meter.
20. Add split-path missions with safe and risky variants.

## Combat Depth

21. Add enemy armor classes with visual break states.
22. Add shield regeneration only for elite enemies.
23. Add missile warning rings with clear intercept timing.
24. Add flak shots that are good against missiles but weak against armor.
25. Add beam enemies that telegraph before firing.
26. Add mine-laying drones for area denial.
27. Add shield-bubble guardians that protect nearby ships.
28. Add carrier enemies that spawn one weak drone at intervals.
29. Add bounty objectives for optional enemy takedowns.
30. Add combat score multipliers for clean missile interceptions.

## Ship Progression

31. Add three upgrade branches: courier, fighter, and pilot.
32. Add reversible loadout presets instead of permanent traps.
33. Add cosmetic hull variants unlocked by medals.
34. Add engine trail colors tied to loadout identity.
35. Add cargo magnet range upgrade with clear visual ring.
36. Add missile capacity upgrade with lower reload forgiveness.
37. Add EMP radius upgrade with longer cooldown.
38. Add hull plating that slows boost recharge.
39. Add fuel tank upgrade that increases ship mass slightly.
40. Add a compact hangar comparison strip for loadout tradeoffs.

## Physics And Navigation

41. Add more readable gravity field rings.
42. Add slingshot score for entering and exiting cleanly.
43. Add inertial drift trails that show recent velocity.
44. Add low-fuel coast challenges with fair black-hole countdowns.
45. Add moving gravity wells with slow predictable paths.
46. Add orbital station approaches with rotating dock normals.
47. Add debris fields that push the ship instead of hard-stopping it.
48. Add magnetic storms that bend missiles and cargo pickup range.
49. Add wormhole exits with velocity preservation.
50. Add route preview curves that account for current velocity.

## AI Director

51. Add route-aware enemy spawn pacing in Worker requests.
52. Add player skill estimate to AI Director input.
53. Add bounded “mercy beat” after two rapid crashes.
54. Add bounded “challenge beat” after three clean wins.
55. Add AI-generated enemy formation names for telemetry only.
56. Add model-side selection between ambush, chase, and recovery windows.
57. Add strict per-route AI budgets to control token spend.
58. Add local fallback parity tests for every AI beat.
59. Add replay metadata showing whether AI Director influenced a run.
60. Add safe A/B testing flags for AI pacing variants.

## Social And Ghost Racing

61. Wire leaderboard top entries into preflight as a single ghost target.
62. Submit delivered best runs automatically after cloud opt-in.
63. Add a “race top ghost” toggle per route.
64. Add friends-only board if identity support is added later.
65. Add daily route leaderboard reset labels.
66. Add replay checksum validation for leaderboard submissions.
67. Add ghost trail compression for network submission.
68. Add share card with route, medal, score, and seed.
69. Add local rivalry labels against the player’s own best.
70. Add weekly featured route board.

## Visual Design

71. Redraw player ship with three animated engine states.
72. Redraw enemy silhouettes by role and size.
73. Add cartoon-realistic planet surface bands and lights.
74. Add station silhouettes with readable docking arms.
75. Add black-metal Forge planet animation.
76. Add stronger depth layering to star fields.
77. Add nebula parallax that never hides gameplay objects.
78. Add projectile lighting and tiny impact sparks.
79. Add missile exhaust arcs that communicate homing behavior.
80. Add damage flashes with low opacity and short duration.

## Mobile UX

81. Add touch steering sensitivity slider in pause.
82. Add left/right hand mobile layout toggle.
83. Add larger missile/EMP hit targets on narrow screens.
84. Add mobile-safe preflight height budget tests.
85. Add thumb-zone action dock layout checks.
86. Add haptic toggles for boost, missile, EMP, and dock.
87. Add reduced text mode default on phones.
88. Add one-handed portrait layout verification screenshots.
89. Add landscape mobile layout with side action dock.
90. Add mobile browser address-bar safe area tuning.

## Production And Polish

91. Add Playwright smoke tests for launch, pickup, dock, and restart.
92. Add visual regression screenshots for preflight and result overlays.
93. Add Worker contract tests for old and new clients.
94. Add D1 migration verification in CI.
95. Add performance budget for frame time and bundle size.
96. Add asset loading fallback tests.
97. Add analytics-free local playtest event log export.
98. Add route balance spreadsheet export from content JSON.
99. Add accessibility labels for every icon-only control.
100. Add release checklist for playtest, deploy, rollback, and Cloudflare migration.

# Desktop popups clean content blur pass

This pass removes viewport-level backdrop-filter blur from dashboard and schedule popups.

Changes:
- sidebar and topbar stay sharp;
- popup backdrops are transparent click targets only;
- depth is created by a neutral CSS filter on `.content` only;
- no saturation, green tint, radial glow, or glass color overlay;
- Records page schedule popups use the same mechanism;
- schedule popup card receives `data-schedule-popup="true"` for stable sharpness/elevation targeting.

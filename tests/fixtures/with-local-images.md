# Document With Local Image References

This document mixes local (relative) image paths with one absolute URL. The relative-image warning banner should appear at the top of the rendered output, reporting **3** local images. The one absolute image should not contribute to the count.

## Relative image (sibling file)

![A diagram](./architecture-diagram.png)

## Relative image (subfolder)

![A chart](images/quarterly-chart.png)

## Relative image (parent folder)

![Old logo](../assets/logo-v1.png)

## Absolute image (should NOT trigger warning)

![Anthropic logo](https://www.anthropic.com/favicon.ico)

## Done

After rendering:

- A blue info banner should say "Heads up: this document references **3** local images..."
- The relative images themselves will appear as broken-image icons (expected — browsers block local file loads).
- The absolute image *may* load successfully if you have internet, or appear as a broken icon if offline. Either way, it should not count toward the warning.

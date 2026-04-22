---
node_id: BaselineBrowserMapping
title: baseline-browser-mapping
link: https://github.com/web-platform-dx/baseline-browser-mapping
maintainer: web-platform-dx
---

## What it does

Maps Baseline feature availability to concrete browser version ranges. Given a Baseline status (Newly available or Widely available), it produces the corresponding browserslist query or minimum browser versions needed to target that baseline. Bridges the gap between the high-level Baseline concept and the specific browser version data that build tools consume.

## Who is it for

Frontend developers and toolchain authors who want to configure their build tools, polyfill loaders, or CSS autoprefixing based on Baseline status rather than manually curating browser lists.

## Where to find it

[github.com/web-platform-dx/baseline-browser-mapping](https://github.com/web-platform-dx/baseline-browser-mapping)

## Who is maintaining it

Maintained by the web-platform-dx organisation, the same group behind the web-features repository and the Baseline definition.

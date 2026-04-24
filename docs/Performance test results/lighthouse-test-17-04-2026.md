# Lighthouse testing for Consolidated View (React Version)

17th April 2026

## Overview

All of the screens of the Consolidated View UI (React version) were analysed using Lighthouse using the following set-up:

- Edge browser (v.147.0.3912.60)
- Lighthouse "Desktop" setting used with Accessibility, Performance and Best practices analysis enabled
- Stock Defra laptop used
- Carried out on the fcp-cv-frontend.perf-test.cdp-int.defra.cloud environment

The results below show scores for Performance, Accessibility and Best Practices. The Lighthouse score is a weighted calculation of specific metrics.

## Next steps

There are some improvement areas below but these are likely to be trivial compared to the overall performance improvement from the React-based Consolidated View over the older PowerApps version. However, if time allows for further improvements, the list below shows which pages should be prioritised.

## Results

(Sorted as worst performing to best performing)

1. Business Messages - 86% performance, 100%, 100%

- Legacy Javascript
- Layout shift
- Network dependency tree, avoid chaining critical requests

2. Land Details - 94% performance, 100%, 100%

- Layout shift
- Network dependency tree, avoid chaining critical requests

3. Agreement Details - 99% performance, 100%, 100%

- Legacy Javascript
- Network dependency tree, avoid chaining critical requests

4. Linked Contacts - 99% performance, 100%, 100%

- Network dependency tree, avoid chaining critical requests

6. Payments - 99% performance, 100%, 100%

- Network dependency tree, avoid chaining critical requests

7. CPH - 100%

8. Authenticate - 100%

9. Agreements - 100%

10. Linked Businesses - 100%

11. Applications - 100%

# How We Work

This project uses the lightest process that still keeps it understandable.

## 1. One useful change at a time

Every change should answer a real need. Avoid adding systems "just in case."

## 2. Keep the current app working

Before adding a feature, make sure the current version still opens and existing plant records remain usable.

## 3. Separate decisions from implementation

When a change affects the shape of the app, write the decision down briefly before coding it.

Examples:
- Should "Plants I Want" and "Plants I Have" be separate records or one list with statuses?
- Should photos be stored only on-device or backed up somewhere?
- Should the app support multiple gardens?

Small visual tweaks do not need documentation.

## 4. Prefer boring technology

Start with:
- HTML
- CSS
- JavaScript
- IndexedDB
- PWA service worker

Add frameworks only if the app genuinely becomes hard to maintain without one.

## 5. Preserve user data

Any change to the stored plant format must either:
- remain backward compatible, or
- include a migration.

Never casually rename or delete stored fields.

## 6. Keep a tiny roadmap

Use `ROADMAP.md` for what is next. Do not maintain a giant speculative backlog.

## 7. Use Git

Recommended rhythm:

```text
main = working version
small feature -> test it -> commit
```

Example commit messages:

```text
feat: add plant photo support
fix: preserve image when editing plant
chore: document local backup plan
```

## 8. Definition of done

A feature is done when:
- it works on desktop
- it works at phone width
- existing plant records still load
- offline behavior has not obviously broken
- any data-model change is documented

## 9. Avoid process overhead

No issue tracker, sprint board, ADR numbering system, CI pipeline, backend, or cloud database until one of those solves a real problem we actually have.

## 10. Bilingual interface rule

Show English and Spanish together for short interface labels where it remains readable. Keep scientific names single. Do not duplicate long free-text content unless it is actually useful. Translation/display wording must not require changing stable stored data values.

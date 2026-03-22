## Summary

Adds `common-ground-cards` to the TinyFish Cookbook.

This project was built for the ASU Claude Builder Club Hackathon in the Governance & Collaboration track. It uses TinyFish to:
- generate structured civic discussion cards from student opinions + official campus sources
- generate shared-value group insights across multiple cards

## What This App Does

- turns raw student opinions into structured discussion cards
- stores generated cards in persistent history with SQLite
- lets users reload previous issues from a left-side history panel
- generates group insights with recommended compromise-oriented next steps

## TinyFish Usage

- `POST /v1/automation/run` for issue card generation
- `POST /v1/automation/run` for multi-card group insights

## Checklist

- [x] Added a new root-level project folder
- [x] Included cookbook-style README
- [x] Included TinyFish code snippets
- [x] Included local setup instructions
- [x] Included architecture diagram

## Before Merge

I will update the README with:
- deployed demo link
- demo gif/video link

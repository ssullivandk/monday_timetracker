# Project Briefing

This document provides a comprehensive overview of the project, outlining its objectives, scope, key deliverables, and use cases.

## Objectives

### Core Objective

Build an externally hosted time tracking app that runs inside monday.com as a native tool.

### Time Tracking

- Allow users to track time spent on tasks
- Enable start/pause functionality for running timers
- Support manual time input as an alternative to timers
- Log time entries with task names, durations, and timestamps

### Data & Integration

- Fetch tasks directly from monday.com
- Log completed time entries in an external database
  - Can be used to display time entries within the app or for further processing outside of monday.com
- View logged time entries in a user-friendly format

### Role & Context Features

- Implement a role selection feature (Developer, Designer, Manager, etc.)
  - Users must select a role when logging time entries
  - Roles are used for budgeting and reporting purposes
- Allow users to add comments or notes when logging time entries

## Minimum Viable Product (MVP)

The MVP should include the following features:

- Start/pause/stop timer for tasks
- Select tasks fetched from monday.com
- Assign roles when logging time entries
- Log time entries with timestamps and durations
- Manual time input option
- View a list of logged time entries with task names, durations, timestamps, roles, and comments
- Simple and clean user interface

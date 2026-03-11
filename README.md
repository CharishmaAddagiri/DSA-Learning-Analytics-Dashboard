DSA Learning Analytics Dashboard

A full-stack web application that helps users track their Data Structures and Algorithms (DSA) practice, analyze their performance, and stay consistent with problem solving.

This dashboard provides analytics such as solved problems, difficulty breakdown, activity heatmap, revision reminders, and more.

Features
User Authentication

Sign up and login system

User-specific data storage

Secure session using local storage

Problem Tracker

Add solved DSA problems

Track platform, difficulty, patterns, and time taken

Store notes and code snippets

Analytics Dashboard

Total problems solved

Difficulty distribution (Easy / Medium / Hard)

Skill score calculation

Weekly activity charts

Activity Heatmap

Visualize daily problem solving activity

Similar to GitHub contribution graph

Revision Reminders

Set revision dates for problems

Helps reinforce learning

Favorites

Mark important problems

Quickly revisit key questions

Notes & Snippets

Store explanations and code solutions for each problem

CSV Export

Export tracked problems as a CSV file

Tech Stack
Frontend

HTML

CSS

JavaScript

Chart.js

Backend

Node.js

Express.js

Database

SQLite

Deployment

GitHub (version control)

Render (backend hosting)

GitHub Pages (frontend hosting)

Project Structure
DSA-Learning-Analytics-Dashboard
│
├── index.html        # Main dashboard UI
├── login.html        # Login / Signup page
├── script.js         # Frontend logic
├── style.css         # Styling
├── server.js         # Backend API
├── dsa.db            # SQLite database
└── README.md
How It Works

Users create an account or log in.

Problems solved during practice can be added to the tracker.

The system stores problem data in the SQLite database.

Analytics are generated based on stored data.

Users can track progress, maintain streaks, and review past problems.

Future Improvements

Password encryption using bcrypt

Admin dashboard for user management

Leaderboard for top problem solvers

Integration with LeetCode API

Daily practice goal tracking

Live Link
https://charishmaaddagiri.github.io/DSA-Learning-Analytics-Dashboard/

# Players School Center — Player School Tracker

A simple, organized starter website for a college soccer coach to track every player in one place:

- Who is on track, on the watch list, or at risk
- Missing assignments and work turned in
- What is due in the next 48 hours
- Each player's next deadline, courses, assignments, and coach notes
- A team feed for the daily 5:00 PM Canvas check

## Put this on GitHub Pages

1. Create a new GitHub repository, for example `players-school-center`.
2. Upload these files to the repository:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `sample-data.csv` (optional example)
   - `README.md`
3. In the repo, go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.
6. GitHub will give you a website link after it builds. Open it and bookmark it.

## Important privacy rule

GitHub hosts the *page code*. Do **not** upload real player names, grades, Canvas exports, or school records into the GitHub repo files.

This v1 site saves imported and typed-in player data only in the browser on the computer you are using (`localStorage`). That makes it good for a coach's own laptop. It is not yet a secure multi-coach, multi-device system. If more staff need to log in and see the same live data, the next version needs a real login and a private database — do not use public GitHub Pages files for private student records.

## How player updates get here

This GitHub Pages site is a static page — it has no login, database, or inbox of its own, so players' Muse accounts cannot push directly into it. The connection is the coach's email plus an import file:

1. Each player pastes the shared Muse prompt (v2) into their own Muse account.
2. On the first setup, their Muse sweeps all of Canvas (Dashboard/To Do, Calendar, and every course's Announcements, Syllabus, Assignments, Modules, Discussions, Quizzes, and Grades — because teachers hide work in different places), shows the player an Initial Full Report with every course, teacher, class time if known, upcoming/missed/turned-in work, then emails that full report to the coach after the player approves it. A CSV in the format `name,position,year,course,assignment,due,status` is attached or pasted in the email.
3. The coach imports that first CSV here with the Import button. It creates the player's board record.
4. Every day at 5:00 PM, each player's Muse re-sweeps Canvas, messages the player, and emails the coach only about *new* misses and *new* turn-ins, with a small changed-rows-only CSV.
5. The coach imports the daily CSV. Imports merge — they update that player's assignments without wiping the rest of the team.
6. Work the colors: red first, yellow next, green is good.

A fully automatic live sync (no importing) would need a secure backend with player accounts and a private database. Do not fake that with public files in this GitHub repo — student records do not belong in public repo files.

## Import format

CSV columns:

```csv
name,position,year,course,assignment,due,status
Alex Rivera,CM,So,ENG 101,Essay 2 draft,2026-10-14,upcoming
```

Status values: `upcoming`, `submitted`, `missed`, `late`.

## Good next upgrades

- Connect the daily coach emails to auto-fill this board (needs a secure backend, not just GitHub Pages)
- Add logins for head coach, assistants, and academic staff
- Add eligibility rules for your school/conference
- Add text/email alerts to players who turn red
- Add practice availability: green = full go, yellow = check-in, red = meeting before practice

Starter build v1 — made to be simple first.

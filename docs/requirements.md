# Requirements

## Webpage/Frontend Requirements
- Standard login and signup with email page
- Profile creation (school, major, year, etc.) (school support will be limited to USC for the scope of this project)
- Dashboard showing a list of created course plans, with the option to add or remove plans
- Plan studio with the following features:
  - Calendar view of courses (a weekly view with time blocks)
  - List view of courses
  - Notes/memo area
  - AI-dvisor chat menu
- The user should be able to freely make changes here and have them reflect in the database when the user hits 'Save'.

## Chat Requirements
- Before making any plans, the AI should ask for the plan's semester and courses the user has already taken
- The AI must be able to account for the user's existing information (i.e. major)
- AI must be able to use the USC Classes API to retrieve course information
- AI must have knowledge of the courses currently on the user's plan
- Agent should be able to intelligently modify the plan per the user's wishes (if the user wants a course removed, the AI should do so)
- Using the Classes API, the AI should account for section types (i.e. Labs, Lectures, Discussions), section restrictions (pre-reqs, D-clearance), and course conflicts.
- If D-clearance is required for a proposed course, the AI will simply flag it for the user who can act accordingly. This is because the methods for requesting D-clearance vary by department and even by semester.
- For degree objectives, the AI will be given human-written information on the course requirements.

## Backend Requirements
- Authentication should follow standard, secure practices (BaaS services should cover this)
- Database should store user information (profile, course plans, chat history)
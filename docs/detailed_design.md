# Design Details

## USC Classes API
The USC Classes API is invoked from the base endpoint https://classes.usc.edu/api/. The API requires no authentication tokens for GET requests, including for specific course retrievals and search functionality. The returned data is in JSON format, and includes all the course's relevant information. This includes the timing, departmental clearance requirement, prerequisites, the type of section, instructor(s), and more. However, the API lacks clear documentation.

## Degree Requirement Data
Course requirements will be written in Markdown files. They will be near copies of the major requirements that are publicly available on https://catalogue.usc.edu/. However, additional information will be included that make prerequisites more apparent to the AI-dvisor. An example major plan is included in [example_major.md](example_major.md).

## Schedule Data
The schedule data will be stored in the Google Firestore database, with each course being stored in JSON format in the same format as the USC API returns them in. This JSON data will be accessible to the AI as it helps build the course plan.
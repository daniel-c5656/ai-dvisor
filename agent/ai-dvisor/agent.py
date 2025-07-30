import datetime
from zoneinfo import ZoneInfo
from google.adk.agents import Agent
import requests
import firebase_admin
from firebase_admin import firestore

MODEL = "gemini-2.5-flash"
app = firebase_admin.initialize_app()
db = firestore.client()

def get_course_info(course_code: str, term: str) -> dict:
    """Retrieves the information for a specified course from the USC Classes API.

    Args:
        course_code (str): The code of the course (e.g., "CSCI 104", "WRIT-150", "MATH225").
        term (str): The term code of the course, where the first 4 digits are the year and the last digit is the term (1=Spring, 2=Summer, 3=Fall) (e.g., 20241 for Spring 2024, 20253 for Fall 2025)
    
    Returns:
        dict: A dictionary containing the course information.
              Includes a 'status' key ('success' or 'error').
              If 'success', includes a 'course_info' key with details on the course.
              If 'error', includes an 'error_message' key.

    """


    # Strip spaces and dashes.
    course_normalized = course_code.upper().replace(' ', '').replace('-', '')
    print(f"--- Tool: get_course_info called for course {course_normalized} for term {term}")

    # Make the request to the API.

    res = requests.get(url="https://classes.usc.edu/api/Courses/Course", params={
        "termCode": term,
        "courseCode": course_normalized
    })
    if res.status_code >= 400:
        return {"status": "error", "error_message": "I was unable to get the course you were looking for. Double-check if the course exists or that USC's servers are online."}
    elif res.status_code == 204:
        return {"status": "error", "error_message": "There doesn't seem to be any information on this course. Double-check the course and/or term."}
    else:
        return res.json()

def add_section(course_code: str, section_id: str, term: str) -> dict:
    """Retrieves the information for a specified course from the USC Classes API.

    Args:
        course_code (str): The code of the course (e.g., "CSCI 104", "WRIT-150", "MATH225").
        section_id (str): The section id of the course (e.g., '29937').
        term (str): The term code of the course, where the first 4 digits are the year and the last digit is the term (1=Spring, 2=Summer, 3=Fall) (e.g., 20241 for Spring 2024, 20253 for Fall 2025)

    Returns:
        dict: A dictionary confirming whether the addition was successful.
            Includes a 'status' key ('success' or 'error').

    """


    # Strip spaces and dashes.
    course_normalized = course_code.upper().replace(' ', '').replace('-', '')
    section_id_normalized = section_id.replace(" ", '')
    print(f"--- Tool: add_section called for course {course_normalized} for term {term}: section {section_id_normalized}")

    # Make the request to the API.

    res = requests.get(url="https://classes.usc.edu/api/Courses/Course", params={
        "termCode": term,
        "courseCode": course_normalized
    })

    fail = {"status": "error", "error_message": "I was unable to find the section you were looking for. Double-check if the section or course exists or that USC's servers are online."}

    if res.status_code >= 400 or res.status_code == 204:
        return fail
    
    data = res.json()
    sections: list = data["sections"]
    target_section = None


    for section in sections:
        if section["sisSectionId"] == section_id:
            target_section = section
            break
    
    if target_section == None:
        return fail

    data_to_add = {
        "sectionId": section_id,
        "courseCode": course_code,
        "courseName": data["name"],
        "type": target_section["rnrMode"],
        "days": target_section['schedule'][0]["days"],
        "startTime": target_section['schedule'][0]["startTime"],
        "endTime": target_section['schedule'][0]["endTime"],
        "location": target_section['schedule'][0]["location"],
        "units": data["courseUnits"][0],
        "instructors": target_section["instructors"]
    }

    return data_to_add

root_agent = Agent(
    name="aidvisor_agent",
    model=MODEL,
    description="Provides information services for courses at USC",
    instruction="""You are an academic course advisor for USC.
                   When the user asks for information about a specific course for a specific term,
                   use the 'get_course_info' tool to retrieve information about the course.
                   If successful, use the result to give the user a quick summary of what the course is about,
                   the prerequisites required to take the course, and what sections are available, including their ids.
                   Then, ask the user if they would like to add a section.
                   If the user fails to specify a term, ask them for it before calling the tool and giving a response.
                   If the tool fails, simply inform the user and tell them to ensure their information is correct.
                """,
    tools=[get_course_info]
)

print(add_section("CSCI104", "29910", "20253"))
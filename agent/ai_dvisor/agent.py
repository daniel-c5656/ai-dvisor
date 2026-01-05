from google.adk.agents import Agent
from google import adk
from google.adk.tools.tool_context import ToolContext

import requests

BASE_MODEL = "gemini-2.5-flash"
HELPER_MODEL = "gemini-2.0-flash-lite-001"
BACKEND_URL = "https://ai-dvisor-fastapi-75390045716.us-west1.run.app"

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

# def get_major_info(major: str) -> str:
#     """Retrieves specific information for a particular major from a corresponding Markdown file.

#     Args:
#         major (str): The major to search for (e.g. "Computer Science", "International Relations", "History", "Business Administration")

#     Returns:
#         dict: A dictionary containing the course information, or an error if no such information exists.
#         Includes a 'status' key ('success' or 'error').
#         If 'success', includes a 'major_info' key with major information.
#         If 'error', includes an 'error_message' key.
#     """
#     print(f"--- Tool: get_major_info called for major {major}")
#     topic_to_file = {
#         "computerscience": "computer_science.md"
#     }

#     filename = topic_to_file.get(major.lower().replace(" ", ""))

#     if not filename:
#         return {"status": "error", "error_message": "I do not have any information about the major on file."}
#     try:
#         filename = "aidvisor/majors/" + filename
#         with open(filename, 'r', encoding="utf-8") as f:
#             return {"status": "success", "major_info": f.read()}
#     except FileNotFoundError:
#         return {"status": "error"}

def get_plan_info(tool_context: ToolContext) -> dict:
    """Retrieves the current details of the user's course plan schedule.

    Args:
        tool_context (ToolContext): The tool context object.

    Returns:
        dict: A dictionary containing the plan information.
              Includes a 'status' key ('success' or 'error').
              If 'success', includes a 'plan_info' key with details on the plan.
              If 'error', includes an 'error_message' key.
    """

    user_id = tool_context._invocation_context.session.user_id
    # session_id = tool_context._invocation_context.session.id
    plan_id = tool_context.state.get("plan_id")
    
    res = requests.get(
        f"{BACKEND_URL}/plan",
        params={
            "user_id": user_id,
            "plan_id": plan_id
        })
    
    if res.status_code >= 400:
        return {"status": "error", "error_message": "Failed to get course plan"}
    else:
        return {"status": "success", "plan_info": res.json()}

def add_section(course_code: str, section_id: str, term: str, tool_context: ToolContext) -> dict:
    """Retrieves the information for a specified course from the USC Classes API.

    Args:
        course_code (str): The code of the course (e.g., "CSCI 104", "WRIT-150", "MATH225").
        section_id (str): The section id of the course (e.g., '29937').
        term (str): The term code of the course, where the first 4 digits are the year and the last digit is the term (1=Spring, 2=Summer, 3=Fall) (e.g., 20241 for Spring 2024, 20253 for Fall 2025)
        tool_context (ToolContext): The tool context object.

    Returns:
        dict: A dictionary confirming whether the addition was successful.
            Includes a 'status' key ('success' or 'error').

    """


    # Strip spaces and dashes.
    course_normalized = course_code.upper().replace(' ', '').replace('-', '')
    section_id_normalized = section_id.replace(" ", '')
    print(f"--- Tool: add_section called for course {course_normalized} for term {term}: section {section_id_normalized}")

    # Make the request to the API.

    user_id = tool_context._invocation_context.session.user_id
    # session_id = tool_context._invocation_context.session.id
    plan_id = tool_context.state.get("plan_id")

    res = requests.post(
        url=f"{BACKEND_URL}/plan/add",
        params = {
            "user_id": user_id,
            "term_code": term,
            "course_code": course_normalized,
            "section_id": section_id_normalized,
            "plan_id": plan_id
        }
    )

    if res.status_code == 200:
        return {"status": "success"}
    else:
        return {"status": "error", "error_message": "I was unable to find the section you were looking for. Double-check if the section or course exists or that USC's servers are online."}

    # res = requests.get(url="https://classes.usc.edu/api/Courses/Course", params={
    #     "termCode": term,
    #     "courseCode": course_normalized
    # })

    # fail = {"status": "error", "error_message": "I was unable to find the section you were looking for. Double-check if the section or course exists or that USC's servers are online."}

    # if res.status_code >= 400 or res.status_code == 204:
    #     return fail
    
    # data = res.json()
    # sections: list = data["sections"]
    # target_section = None


    # for section in sections:
    #     if section["sisSectionId"] == section_id:
    #         target_section = section
    #         break
    
    # if target_section == None:
    #     return fail

    # data_to_add = {
    #     "sectionId": section_id,
    #     "courseCode": course_code,
    #     "courseName": data["name"],
    #     "type": target_section["rnrMode"],
    #     "days": target_section['schedule'][0]["days"],
    #     "startTime": target_section['schedule'][0]["startTime"],
    #     "endTime": target_section['schedule'][0]["endTime"],
    #     "location": target_section['schedule'][0]["location"],
    #     "units": data["courseUnits"][0],
    #     "instructors": target_section["instructors"]
    # }

    # # Add this as a document to the user's Firebase, if it hasn't already been updated.

    # return {"status": "success", "data": data_to_add}

def remove_section(section_id: str, tool_context: ToolContext) -> dict:
    """Removes a specified section from the user's course schedule.

    Args:
        section_id (str): The section ID of the section to remove.

    Returns:
        dict: A dictionary containing the outcome of the removal operation.
              Includes a 'status' key ('success' or 'error').
              If 'error', includes an 'error_message' key.
              If 'success', includes a 'section_id' key indicating the section id deleted.
    """

    print(f"--Tool: remove_section called with section_id {section_id}")

    user_id = tool_context._invocation_context.session.user_id
    # session_id = tool_context._invocation_context.session.id
    plan_id = tool_context.state.get("plan_id")

    res = requests.delete(
        url=f"{BACKEND_URL}/plan/delete",
        params = {
            "user_id": user_id,
            "section_id": section_id,
            "plan_id": plan_id
        }
    )

    if res.status_code == 200:
        return {"status": "success"}
    else:
        return {"status": "error", "error_message": "Failed to delete section"}

    # return {"status": "success", "section_id": section_id}



# Scheduling Agent

scheduling_agent = None
try:
    scheduling_agent = Agent(
        model=HELPER_MODEL,
        name="scheduling_agent",
        instruction="""You are the Course Scheduling Agent. Your ONLY tasks are to add and/or remove courses
                       from the user's course plan. Leave all other tasks to "aidvisor_agent".
                       Use the 'add_section' tool to add a section to the user's calendar. If there's a potential conflict, ask the user to confirm.
                       Use the 'remove_section' tool to remove a section from the user's calendar.
                       If the user wants to replace one section with another, remove the old section, then add the new section.
                       If the user gives insufficient information for addition or removal, request it before attempting to make any changes.
                       Do not engage in conversation normally. Only alert the user of the changes you made to their schedule (i.e. courses added and/or dropped).
                    """,
        description="Handles the addition or removal of course sections from the user's schedule using the 'add_section' and 'remove_section' tools.",
        tools=[add_section, remove_section]
    )
except Exception as e:
    print("Failed to create Scheduling Agent.")

root_agent = Agent(
    name="aidvisor_agent",
    model=BASE_MODEL,
    description="The main help agent. It provides information services for courses at USC and the user's own schedule, and delegates anything related to schedule changes to other dedicated agents.",
    instruction="""You are an academic course advisor for USC.
                   When the user asks for information about a specific course for a specific term,
                   use the 'get_course_info' tool to retrieve information about the course.
                   If successful, use the result to give the user a quick summary of what the course is about,
                   the prerequisites required to take the course, and what sections are available, including their ids.
                   Then, ask the user if they would like to add a section.
                   If the user fails to specify a term, ask them for it before calling the tool and giving a response.
                   If the tool fails, simply inform the user and tell them to ensure their information is correct.
                   If you need at any point need the user's current plan to make recommendations, use the 'get_plan_info' tool to retrieve the latest plan. 
                """,
    tools=[get_course_info, get_plan_info],
    sub_agents=[scheduling_agent]
)

from google.adk.agents import Agent
from google import adk
from google.adk.tools import google_search, agent_tool
from google.adk.tools.tool_context import ToolContext
from google.genai.types import GenerateContentConfig, SafetySetting, HarmCategory, HarmBlockThreshold
from bs4 import BeautifulSoup

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
def course_search(query: str, term: str) -> dict:
    """Retrieves information for the first 10 courses matching a given search query.

    Args:
        query (str): The course search query. This could be part of a course code, course name, or course description.  
        term (str): The term code of the course, where the first 4 digits are the year and the last digit is the term (1=Spring, 2=Summer, 3=Fall) (e.g., 20241 for Spring 2024, 20253 for Fall 2025)

    Returns:
        dict: A dictionary containing the course information for the first 10 courses returned by the query.
              Includes a 'status' key ('success' or 'error').
              If 'success', includes a 'course_info' key with details on the courses.
              If 'error', includes an 'error_message' key.
    """

    res = requests.get(url="https://classes.usc.edu/api/Search/Basic", params={
        "termCode": term,
        "searchTerm": query
    })

    if res.status_code >= 400:
        return {"status": "error", "error_message": "I was unable to find anything for what you were looking for. Double-check your query or that USC's servers are online."}
    else:
        data = res.json()

        if len(data['courses']) == 0:
            return {"status": "error", "error_message": "Your query returned no results."}
        else:
            data['courses'] = data['courses'][:10]
            return {"status": "success", "course_info": data}

def get_major_info(tool_context: ToolContext) -> dict:
    """Retrieves specific information for the user's major from the USC Catalogue.

    Args:
        tool_context (ToolContext): The tool context object.

    Returns:
        dict: A dictionary containing the course information, or an error if no such information exists.
        Includes a 'status' key ('success' or 'error').
        If 'success', includes a 'major_info' key with major information.
        If 'error', includes an 'error_message' key.
    """

    major = tool_context.state.get("major")

    print(f"--- Tool: get_major_info called for major {major}")

    if major not in MAJOR_CODES:
        return {"status": "error", "error_message": "I do not have any information about your major on file."}

    major_res = requests.get("https://catalogue.usc.edu/preview_program.php", params={
        "poid": str(MAJOR_CODES[major])
    })

    if major_res.status_code >= 400:
        return {"status": "error", "error_message": "I do not have any information about your major on file."}

    soup = BeautifulSoup(major_res.content, 'html.parser')

    text = soup.get_text()

    text = text.replace("\n", '')

    start = text.find("Tweet this Page (opens a new window)") + len("Tweet this Page (opens a new window)")
    end = text.rfind("Back to Top")

    text = text[start:end]

    if len(text) > 0:
        return {"status": "success", "major_info": text}
    else:
        return {"status": "error"}

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

def remove_section(section_id: str, tool_context: ToolContext) -> dict:
    """Removes a specified section from the user's course schedule.

    Args:
        section_id (str): The section ID of the section to remove.
        tool_context (ToolContext): The tool context object.

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

professor_agent = None
try:
    professor_agent = Agent(
        model=BASE_MODEL,
        name="professor_agent",
        instruction="""You are the Professor Agent. Your task is to search the web
                       for reviews and opinions on professors from sources such as Rate My Professor and Reddit.
                       Use the google_search tool for this, making sure to specify that the professor in question
                       works at the University of Southern California to avoid any confusion with other professors with the same name.
                       In your response, include the rating of the professor on Rate My Professor if you can find it,
                       as well as any important information a student should know such as teaching style and workload.
                    """,
        description="Retrieves and summarizes information on professors using the google_search tool.",
        tools=[google_search],
        generate_content_config=GenerateContentConfig(safety_settings=[
            SafetySetting(
                category=HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            ),
            SafetySetting(
                category=HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            )
        ])
        
    )
except Exception as e:
    print("Failed to create Professor Agent.")

root_agent = Agent(
    name="aidvisor_agent",
    model=BASE_MODEL,
    description="The main help agent. It provides information services for courses at USC and the user's own schedule, and is able to delegate specialized tasks to other dedicated agents.",
    instruction="""You are an academic course advisor for USC who is able to help build academic schedules, get course information, and get information about professors.
                   1. When the generally asks for available courses, use the 'course_search" tool to find all courses that match a relevant query. You may need to ask them for which school term they are interested in.
                   2. When the user asks for information about a specific course for a specific term,
                   use the 'get_course_info' tool to retrieve information about the course.
                   If successful, use the result to give the user a quick summary of what the course is about,
                   the prerequisites required to take the course, and what sections are available, including their ids.
                   After presenting the results of a course lookup, ask the user if they would like to add a section.
                   3. If the user asks for course recommendations on their plan or major, use the get_plan_info and/or get_major_info tools
                   respectively to retrieve the relevant information.
                   4. Ask the user to clarify anything you may need to make the best recommendation possible.
                   5. If any of the tools fail, simply ask the user to provide any missing information and/or corrections.
                   6. If the user needs to modify their schedule, delegate tasks to the Scheduling Agent.
                   7. If the user asks about what a professor is like, use the Professor Agent tool.
                """,
    tools=[get_course_info, course_search, get_plan_info, get_major_info, agent_tool.AgentTool(professor_agent)],
    sub_agents=[scheduling_agent]
)

MAJOR_CODES = {
    'ACCOFIN-BS': 30709,
    'ACCOUN-BS': 29561,
    'ACTSTS-BFA': 30677,
    'AEAA-BA': 29600,
    'AEAA-BA1': 29601,
    'AECL-BA': 29602,
    'AEROENG-BS': 29943,
    'AMEPOCU-BA': 30379,
    'AMERETH-BA': 29599,
    'ANIDIA-BFA': 30577,
    'ANTHRO-BA': 29607,
    'ANTVIAN-BA': 29608,
    'APPCOMA-BA': 29762,
    'APPCOMA-BS': 29763,
    'ARCHBAR': 29495,
    'ARCHHER-BA': 31541,
    'ARCHIT-BS': 29465,
    'ARCINTE-BS': 30678,
    'ART-BA': 29480,
    'ARTHIS-BA': 29618,
    'ARTIINT-BS': 31550,
    'ARTINBU-BS': 30703,
    'ASTRENG-BS': 29953,
    'ASTRON-BA': 29797,
    'ASTRON-BS': 29794,
    'ATBI-BS': 29494,
    'BABA-BS': 30601,
    'BACA-BS': 29500,
    'BAEI-BS': 30605,
    'BAIR-BS': 29501,
    'BALI-BS': 30604,
    'BAREF-BS': 29502,
    'BARM-BS': 30603,
    'BAWP-BS': 29503,
    'BEEE-BS': 29959,
    'BEHECPS-BA': 30687,
    'BEMCE-BS': 30527,
    'BEME-BS': 29960,
    'BIOCHE-BS': 29629,
    'BIOLSCI-BA': 29625,
    'BIOLSCI-BS': 29626,
    'BIOMENG-BS': 29957,
    'BIOPHY-BS': 29798,
    'BIOPSCI-BA': 30627,
    'BIOPSCI-BS': 30614,
    'BIOSCBI-BS': 30658,
    'BSEEE-BS': 30692,
    'BSMB-BS': 30657,
    'BSMCDB-BS': 30659,
    'BUSADCO-BS': 30600,
    'BUSADFI-BS': 30602,
    'BUSADMA-BS': 30599,
    'BUSCIAR-BS': 30688,
    'BUSIADM-BS': 29499,
    'BUSIINN-BS': 30765,
    'CAFTP-BA': 29570,
    'CAFTP-BFA': 29571,
    'CEBPE-BS': 30720,
    'CEBS-BS': 30342,
    'CECEM-BS': 30534,
    'CECS-BS': 29991,
    'CEEE-BS': 30343,
    'CEES-BS': 30722,
    'CEME-BS': 30721,
    'CENTEUR-BA': 29832,
    'CEPSE-BS': 30719,
    'CESE-BS': 30344,
    'CEWRE-BS': 30536,
    'CHECHBI-BS': 29645,
    'CHECHNA-BS': 29644,
    'CHEMENG-BS': 29966,
    'CHEMIS-BA': 29646,
    'CHEMIS-BS': 29642,
    'CHEMRES-BS': 29643,
    'CHORMUS-BA': 30151,
    'CHORMUS-BM': 30516,
    'CINEMED-BA': 30312,
    'CIVIENG-BS': 30341,
    'CLASSI-BA': 29652,
    'CLLA-BA': 30336,
    'COGNSCI-BA': 29817,
    'COMMUN-BA': 29855,
    'COMPLIN-BS': 30386,
    'COMPLIT-BA': 29656,
    'COMPNEU-BS': 29779,
    'COMPOS-BM': 30137,
    'COMPSCI-BS': 29994,
    'COMSCGA-BS': 30609,
    'CSBA-BS': 29996,
    'DAMT-BA': 30748,
    'DANCE-BFA': 29883,
    'DATASCI-BA': 30523,
    'DESIGN-BFA': 30430,
    'DRAARAC-BA': 30747,
    'DRAARCO-BA': 30750,
    'DRAARDE-BA': 30749,
    'DRAARDI-BA': 31551,
    'DRAMART-BA': 30746,
    'EALC-BA': 29679,
    'EARTSCI-BA': 29667,
    'EASTASI-BA': 29673,
    'ECODASC-BS': 30612,
    'ECONMAT-BS': 29687,
    'ECONOM-BA': 29684,
    'ELECOEN-BS': 30532,
    'ENGLIS-BA': 29696,
    'ENVIENG-BS': 30345,
    'ENVIRO-BA': 29707,
    'ENVIRO-BS': 29712,
    'ENVSCHE-BA': 29713,
    'ENVSCHE-BS': 29714,
    'FINEAR-BFA': 29479,
    'FRENCH-BA': 29718,
    'GAMEAR-BFA': 30636,
    'GDID-BFA': 30690,
    'GENDSEX-BA': 30531,
    'GEODES-BS': 29847,
    'GEOLSCI-BS': 29666,
    'GLOBAL-BA': 29609,
    'GLOBGEO-BS': 30477,
    'GLOBHEA-BS': 30118,
    'HDAH-BS': 30052,
    'HDAHS-BS': 30051,
    'HEAHUSC-BA': 30385,
    'HEALHUM-BA': 29727,
    'HISTOR-BA': 29728,
    'HPDP-BS': 30117,
    'HSGI-BS': 30548,
    'HUMABIO-BA': 29628,
    'HUMABIO-BS': 29627,
    'HUMDEAG-BS': 30050,
    'HUMTEIN-BS': 31553,
    'INDSYEN-BS': 30022,
    'INTCYOP-BA': 30471,
    'INTERD-BA': 30645,
    'INTEREL-BA': 29738,
    'IRGB-BA': 29739,
    'IRGE-BA': 29740,
    'ITALIA-BA': 29720,
    'JAZZ-BM': 30138,
    'JEWISH-BA': 30337,
    'JOURNA-BA': 30356,
    'LAICMP-BA': 30427,
    'LAWHICU-BA': 29730,
    'LEALC-BA': 29752,
    'LEGAL-BS': 30705,
    'LIFEHEA-BS': 30053,
    'LINCOSC-BA': 30313,
    'LINGPHI-BA': 29751,
    'LINGUI-BA': 29750,
    'MATHECO-BS': 29766,
    'MATHEM-BA': 29760,
    'MATHEM-BS': 29761,
    'MECHENG-BS': 29947,
    'MEDARPR-BA': 29577,
    'MIDDEAS-BA': 29774,
    'MUSIC-BA': 30150,
    'MUSIIND-BM': 30148,
    'MUSIIND-BS': 30149,
    'MUSIPRO-BM': 30139,
    'MUSITH-BFA': 30529,
    'NARRAT-BA': 29698,
    'NEUROS-BA': 29777,
    'NEUROS-BS': 29778,
    'NGOSC-BA': 29837,
    'OCCUTHE-BS': 30074,
    'PERCLGU-BM': 30141,
    'PERFORG-BM': 30143,
    'PERFPIA-BM': 30142,
    'PERPOMU-BM': 30147,
    'PERSTGU-BM': 30140,
    'PERVOAR-BM': 30145,
    'PFOCBSF-BM': 30146,
    'PHADRDE-BA': 30615,
    'PHADRDE-BS': 30425,
    'PHILOS-BA': 29783,
    'PHIPOEC-BA': 30512,
    'PHIPOLA-BA': 29784,
    'PHYCOSC-BS': 29795,
    'PHYSIC-BA': 29796,
    'PHYSIC-BS': 29793,
    'PHYSSCI-BS': 29799,
    'POLIECO-BA': 29685,
    'POLISCI-BA': 29805,
    'PSYCHO-BA': 29814,
    'PUBLPOL-BS': 30306,
    'PUBREAD-BA': 30714,
    'PVVVDBH-BM': 30144,
    'QUANBIO-BS': 30412,
    'REAESDE-BS': 30214,
    'REFD-BS': 30708,
    'RELIGI-BA': 29825,
    'RUSSIA-BA': 29831,
    'SOCIOL-BA': 29836,
    'SOCIWO-BSW': 30770,
    'SOCSCEC-BA': 29686,
    'SOCSCPS-BA': 29815,
    'SOUNDE-BFA': 30740,
    'SPANIS-BA': 29844,
    'STAGMA-BFA': 30741,
    'TECHDI-BFA': 30711,
    'THEADE-BFA': 30710,
    'THEMEN-BFA': 30696,
    'URBAPLA-BS': 30307,
    'VISPEAR-BA': 29914,
    'WRISCT-BFA': 29582,
}

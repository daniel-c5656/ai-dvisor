from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import vertexai
import firebase_admin
from firebase_admin import firestore, credentials
from dotenv import load_dotenv
import os
import requests


load_dotenv()

AGENT_ENGINE_RESOURCE_NAME = os.getenv("AGENT_ENGINE_RESOURCE_NAME")
FIREBASE_ADMIN_FILE = os.getenv("FIREBASE_ADMIN_FILE")

app = FastAPI()

origins = [
    # "http://localhost",
    # "http://localhost:8080",
    # "https://ai-dvisor-466322.firebaseapp.com",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

cred = credentials.Certificate(cert=FIREBASE_ADMIN_FILE)

fb_app = firebase_admin.initialize_app(cred)

db = firestore.client()

client = vertexai.Client(
    project="ai-dvisor-466322",
    location="us-west1",
)

adk_app = client.agent_engines.get(name=AGENT_ENGINE_RESOURCE_NAME)

@app.post("/session/create")
async def create_session(user_id:str, plan_id:str, major:str):
    res = await adk_app.async_create_session(user_id=user_id, state={'plan_id': plan_id, 'major': major})
    doc_ref = db.collection("users").document(user_id).collection("coursePlans").document(plan_id)
    doc_ref.update({"sessionId": res['id'], "modified": firestore.SERVER_TIMESTAMP})
    return res

@app.delete("/session/delete")
async def delete_session(user_id:str, plan_id:str, session_id:str):
    res = await adk_app.async_delete_session(user_id=user_id, session_id=session_id)
    doc_ref = db.collection("users").document(user_id).collection("coursePlans").document(plan_id)
    doc_ref.update({"sessionId": firestore.DELETE_FIELD, "modified": firestore.SERVER_TIMESTAMP})
    return res

@app.get("/session/list")
async def list_sessions(user_id:str):
    res = await adk_app.async_list_sessions(user_id=user_id)
    return res

@app.get("/plan")
def get_plan(user_id:str, plan_id:str):
    doc_ref = db.collection("users").document(user_id).collection("coursePlans").document(plan_id)
    doc = doc_ref.get()

    if doc.exists:
        return doc.to_dict()
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User or plan does not exist!"
        )

@app.post("/plan/add")
def add_to_schedule(user_id:str, term_code:str, course_code:str, section_id:str, plan_id:str):

    res = requests.get(url="https://classes.usc.edu/api/Courses/Course", params={
        "termCode": term_code,
        "courseCode": course_code
    })

    if res.status_code >= 400 or res.status_code == 204:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The given term or course does not exist."
        )
    
    data = res.json()
    sections: list = data["sections"]
    target_section = None


    for section in sections:
        if section["sisSectionId"] == section_id:
            target_section = section
            break
    
    if target_section == None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The given section does not exist."
        )

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

    doc_ref = db.collection("users").document(user_id).collection("coursePlans").document(plan_id)

    doc_ref.update({"courses": firestore.ArrayUnion([data_to_add]), "modified": firestore.SERVER_TIMESTAMP})

    return {}

@app.delete("/plan/delete")
def delete_from_schedule(user_id: str, plan_id: str, section_id:str):
    doc_ref = db.collection("users").document(user_id).collection("coursePlans").document(plan_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User or plan does not exist!"
        )
    
    doc_data = doc.to_dict()

    section_to_remove = None
    for course in doc_data['courses']:
        if course['sectionId'] == section_id:
            section_to_remove = course
    doc_ref.update({"courses": firestore.ArrayRemove([section_to_remove]), "modified": firestore.SERVER_TIMESTAMP})

    return {}
    

@app.get("/ask")
async def prompt_llm(user_id:str, message:str, session_id:str):
    async for event in adk_app.async_stream_query(
        user_id=user_id,
        message=message,
        session_id=session_id
    ):
        if 'text' in event['content']['parts'][0]:
            return event
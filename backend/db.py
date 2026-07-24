from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["ead_chat_app"]

conversations = db["conversations"]
users = db["users"]
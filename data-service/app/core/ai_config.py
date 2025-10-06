import os
from dotenv import load_dotenv
from openai import OpenAI

class AIConfig:
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv('API_KEY')
        if not self.api_key:
            raise RuntimeError("API Key Not found. Please set the API_KEY environment variable.")
        self.client = OpenAI(api_key=self.api_key)

ai_config = AIConfig()

# Job Board AI - AI Service (Flask)

This is a Python-based AI service for resume parsing and job recommendations.

## 🛠 Installation & Setup
```sh
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

🚀 Features
📄 Resume parsing with PyResparser
🔎 Job matching using Sentence Transformers
🤖 AI-powered recommendations


Endpoint	     		Method	Description
/process-cv				POST	Process CV and get a compatibility score based on semnatic analysis of CV and the job description
/recommend-jobs			POST	Get job recommendations from available jobs
/keyword-compatibility  POST	Find relevand keywords in CV and returns a score of compatibility
/analyze-job            POST    Get score, matched_skills, missing_skills and recommendations from AI
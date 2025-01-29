# Job Board AI 📌

A full-stack AI-powered job board application that provides job recommendations based on resume analysis.

## 🚀 Features
- 📂 **Upload and parse resumes** with AI (Flask + NLP)
- 🤖 **Get job recommendations** based on resume match (Node.js + Python)
- 💼 **Apply for jobs, save favorites, and get AI feedback**
- 🔐 **Full authentication system** (JWT)
- 🎨 **Frontend built with Angular**

## 🏗 Project Structure
job-board-ai/
│── job-board-frontend/       # Angular frontend
│── job-board-backend/        # Node.js backend (primary)
│── job-board-backend_no_container/ # Node.js + Flask backend without containers
│   ├── flask/                # Flask AI service
│   ├── node/                 # Node.js API Gateway
│── docker-compose.yml        # Docker services
│── kubernetes/               # Kubernetes configuration
│── .gitignore                # Git ignore rules
│── README.md                 # Main project documentation\
## 🛠 Installation & Setup

### **1️⃣ Clone the repository**
```sh
git clone https://github.com/yourusername/job-board-ai.git
cd job-board-ai

Start the project with Docker (Recommended)
docker-compose up --build

Start manually
cd job-board-backend
npm install
npm start

cd job-board-backend_no_container/flask
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

cd job-board-frontend
npm install
ng serve --host 0.0.0.0 --disable-host-check

npx cypress run   # Run E2E tests

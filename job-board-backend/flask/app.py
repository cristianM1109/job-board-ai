from flask import Flask, request, jsonify
import fitz  # PyMuPDF
import shutil
import os
from sentence_transformers import SentenceTransformer, util
import re
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import openai
import re
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import nltk
nltk.download('stopwords')
nltk.download('punkt')
nltk.download('punkt_tab')

app = Flask(__name__)

# Încarcă modelul Sentence Transformers
transformer_model = SentenceTransformer('all-MiniLM-L6-v2')

openai.api_key = "KEY"


# Funcție pentru generarea recomandărilor folosind OpenAI GPT-3.5
def generate_recommendation_with_gpt3(missing_skills, job_title, job_description):
    """
    Folosește OpenAI GPT-3.5 pentru a genera recomandări clare și bine formate.
    """
    skills_list = ", ".join(missing_skills)
    prompt = (f"Cum poate un candidat să își îmbunătățească CV-ul pentru a fi potrivit pentru un job de {job_title}? "
              f"Descrierea jobului: {job_description}. Aptitudinile lipsă sunt: {skills_list}. "
              f"Furnizează recomandări clare, bine formate și concise, fiecare în format de listă numerotată.")
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Ești un asistent care oferă recomandări pentru îmbunătățirea CV-urilor."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.7
        )
        recommendation = response['choices'][0]['message']['content'].strip()
        recommendation = re.sub(r'\s+', ' ', recommendation)  # Elimină spațiile multiple
        return recommendation
    except Exception as e:
        print(f"Eroare la generarea textului cu GPT-3.5: {e}")
        return "Nu s-a putut genera o recomandare în acest moment."
    
# Funcție pentru extragerea textului din PDF
def extract_text_with_fitz(file_path):
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"Eroare la extragerea textului din PDF: {e}")
        return ""

# Funcție pentru curățarea textului
def preprocess_text(text):
    text = text.lower()
    text = re.sub(r"[^\w\s]", "", text)  # Elimină caractere speciale
    words = word_tokenize(text)
    stop_words = set(stopwords.words("english"))
    return " ".join([word for word in words if word not in stop_words])

@app.route("/process-cv", methods=["POST"])
def process_cv():
    data = request.json
    cv_file_path = data.get("cv_file_path", "")
    jobs = data.get("jobs", [])

    if not cv_file_path or not jobs:
        print("Lipsesc datele necesare: cv_file_path sau jobs.")
        return jsonify({"error": "Calea către CV și lista joburilor sunt necesare."}), 400

    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        full_cv_path = os.path.join(os.pardir, "node", cv_file_path)
 #       full_cv_path = os.path.abspath(os.path.join(os.pardir, "node", cv_file_path))
        temp_folder = os.path.join(script_dir, "temp")
        os.makedirs(temp_folder, exist_ok=True)
        temp_cv_path = os.path.join(temp_folder, "temp_cv.pdf")

        shutil.copyfile(full_cv_path, temp_cv_path)

        cv_text = extract_text_with_fitz(temp_cv_path)
        if not cv_text.strip():
            print("Nu s-a putut extrage text din CV.")
            return jsonify({"error": "Nu s-a putut extrage text din CV."}), 500

        cv_text = preprocess_text(cv_text)
        job_texts = [
            preprocess_text(f"{job['title']} {job['description']} {' '.join(job['keywords'])}")
            for job in jobs
        ]
        job_ids = [job['id'] for job in jobs]

        # Calculează scorurile de similaritate
        embeddings = transformer_model.encode([cv_text] + job_texts, convert_to_tensor=True)
        scores = util.pytorch_cos_sim(embeddings[0], embeddings[1:]).flatten()

        # Calibrare și normalizare
        max_score = scores.max().item() if scores.size(0) > 0 else 1
        min_score = scores.min().item() if scores.size(0) > 0 else 0
        normalized_scores = (scores - min_score) / (max_score - min_score) if max_score > min_score else scores

        results = {job_ids[i]: round(float(normalized_scores[i]), 2) for i in range(len(job_ids))}

        print(f"Rezultate scoruri calibrate: {results}")
        return jsonify({"compatibility_scores": results})

    except Exception as e:
        print(f"Eroare la procesarea CV-ului: {e}")
        return jsonify({"error": "A apărut o problemă la procesarea CV-ului."}), 500

    finally:
        if os.path.exists(temp_cv_path):
            os.remove(temp_cv_path)

def preprocess_text(text):
    
    # Elimină caractere speciale și transformă textul în litere mici
    text = re.sub(r'[^\w\s]', '', text.lower())
    words = word_tokenize(text)
    stop_words = set(stopwords.words("english"))
    return ' '.join([word for word in words if word not in stop_words])
    
# Listă de cuvinte relevante (extensibilă)
RELEVANT_WORDS = set([
    # Limbaje de programare
    "python", "java", "javascript", "typescript", "c++", "c#", "golang", "ruby", 
    "swift", "kotlin", "php", "rust", "perl", "scala", "bash", "shell",

    # Framework-uri și biblioteci
    "react", "angular", "vue", "svelte", "nodejs", "express", "spring", 
    "flask", "django", "fastapi", "bootstrap", "jquery",

    # Platforme și containere
    "docker", "kubernetes", "vagrant", "ansible", "jenkins", "terraform",
    "aws", "azure", "gcp", "cloudflare", "heroku", "netlify",

    # Baze de date și tehnologii de stocare
    "sql", "nosql", "mongodb", "postgresql", "mysql", "sqlite", 
    "cassandra", "couchbase", "redis", "elasticsearch", "hadoop", 
    "spark", "hive", "bigquery", "snowflake", "oracle", "dynamodb",

    # Inteligență artificială și machine learning
    "tensorflow", "pytorch", "scikit-learn", "keras", "nltk", "spacy", 
    "huggingface", "xgboost", "catboost", "opencv", "lightgbm", "pandas", 
    "numpy", "matplotlib", "seaborn", "mlflow", "airflow",

    # DevOps și instrumente de automatizare
    "git", "github", "gitlab", "bitbucket", "jenkins", "travisci", 
    "circleci", "kafka", "rabbitmq", "nginx", "haproxy", "prometheus", 
    "grafana", "logstash", "zookeeper", "consul", "vault",

    # Metodologii și practici
    "agile", "scrum", "kanban", "ci", "cd", "tdd", "bdd", "devops", 
    "microservices", "monolithic", "serverless", "event-driven", 
    "observability", "high-availability", "resilience", "scalability",

    # Sisteme de operare și infrastructură
    "linux", "windows", "macos", "unix", "centos", "ubuntu", "debian",
    "fedora", "redhat", "powershell", "commandline", "networking", 
    "firewall", "dns", "tcp/ip", "ssl", "tls", "vpn",

    # Alte tehnologii și concepte
    "rest", "graphql", "grpc", "websockets", "json", "xml", 
    "api", "oauth", "jwt", "soap", "webhooks", "cms", "wordpress", 
    "drupal", "joomla", "shopify", "magento", "bigcommerce",

    # Testare și QA
    "selenium", "cypress", "junit", "pytest", "mocha", "chai", 
    "jest", "postman", "k6", "artillery", "sonarqube",

    # Altele
    "ci/cd", "infrastructure", "pipelines", "automation", 
    "cloud", "network", "security", "cryptography", "blockchain", 
    "ethereum", "bitcoin", "smartcontracts", "hyperledger"
])

@app.route("/keyword-compatibility", methods=["POST"])
def keyword_compatibility():
    data = request.json
    cv_file_path = data.get("cv_file_path", "")
    jobs = data.get("jobs", [])

    if not cv_file_path or not jobs:
        print("Lipsesc datele necesare: cv_file_path sau jobs.")
        return jsonify({"error": "Calea către CV și detaliile joburilor sunt necesare."}), 400

    try:
        # Preluăm calea completă a fișierului CV
        full_cv_path = os.path.join(os.pardir, "node", cv_file_path)
        if not os.path.exists(full_cv_path):
            print(f"Fișierul nu există la calea: {full_cv_path}")
            return jsonify({"error": "Fișierul CV nu a fost găsit pe server."}), 404

        # Extragem și procesăm textul din CV
        cv_text = extract_text_with_fitz(full_cv_path)
        if not cv_text.strip():
            print("Nu s-a putut extrage text din CV.")
            return jsonify({"error": "Nu s-a putut extrage text din CV."}), 500

        # Procesăm textul CV și extragem doar cuvintele relevante
        cv_words = preprocess_and_filter_relevant_words(cv_text)
        print(f"Cuvinte relevante din CV: {cv_words}")

        # Setăm ponderea per cuvânt
        word_weight = 0.1

        results = {}
        for job in jobs:
            job_id = job['id']

            # Combinăm descrierea și cuvintele-cheie pentru textul jobului
            title_text = job.get("title", "")
            keywords_text = " ".join(job.get("keywords", []))
            description_text = job.get("description", "")
            job_text = f"{title_text} {keywords_text} {description_text}"

            # Procesăm textul jobului și extragem doar cuvintele relevante
            job_words = preprocess_and_filter_relevant_words(job_text)
            print(f"Cuvinte relevante job ({job_id}): {job_words}")

            # Calculăm scorul bazat pe cuvinte comune relevante
            common_keywords = cv_words & job_words
            score = min(len(common_keywords) * word_weight, 1.0)  # Limităm scorul la 1.0

            # Adăugăm detalii în rezultate
            results[job_id] = {
                "score": round(score, 2),
                "common_keywords": list(common_keywords),
            }

        print(f"Rezultate compatibilitate cuvinte relevante: {results}")
        return jsonify({"compatibility_scores": results})
    except Exception as e:
        print(f"Eroare la procesarea compatibilității: {e}")
        return jsonify({"error": "A apărut o problemă la calcularea scorurilor cu cuvinte cheie."}), 500
        
        
@app.route("/recommend-jobs", methods=["POST"])
def recommend_jobs():
    data = request.json
    cv_file_path = data.get("cv_file_path", "")
    jobs = data.get("jobs", [])

    if not cv_file_path or not jobs:
        print("Lipsesc datele necesare: cv_file_path sau jobs.")
        return jsonify({"error": "Calea către CV și lista joburilor sunt necesare."}), 400

    try:
        # Creează o copie a CV-ului într-un director temporar
        script_dir = os.path.dirname(os.path.abspath(__file__))
        full_cv_path = os.path.join(os.pardir, "node", cv_file_path)
        temp_folder = os.path.join(script_dir, "temp")
        os.makedirs(temp_folder, exist_ok=True)
        temp_cv_path = os.path.join(temp_folder, "temp_cv.pdf")
        shutil.copyfile(full_cv_path, temp_cv_path)

        # Extrage textul din CV
        cv_text = extract_text_with_fitz(temp_cv_path)
        if not cv_text.strip():
            print("Nu s-a putut extrage text din CV.")
            return jsonify({"error": "Nu s-a putut extrage text din CV."}), 500

        # Preprocesează textul CV-ului
        cv_text = preprocess_text(cv_text)

        # Preprocesează descrierile joburilor
        job_texts = [
            preprocess_text(f"{job['title']} {job['description']} {' '.join(job['keywords'])}")
            for job in jobs
        ]
        job_ids = [job['id'] for job in jobs]

        # Calculează similaritatea semantică
        embeddings = transformer_model.encode([cv_text] + job_texts, convert_to_tensor=True)
        scores = util.pytorch_cos_sim(embeddings[0], embeddings[1:]).flatten()

        # Calibrare și normalizare
        max_score = scores.max().item() if scores.size(0) > 0 else 1
        min_score = scores.min().item() if scores.size(0) > 0 else 0
        normalized_scores = (scores - min_score) / (max_score - min_score) if max_score > min_score else scores

        # Filtrează joburile recomandate
        recommendation_threshold = 0.4  # Prag de recomandare
        recommendations = [
            {"job_id": job_ids[i], "score": round(float(normalized_scores[i]), 2)}
            for i in range(len(job_ids)) if normalized_scores[i] >= recommendation_threshold
        ]

        print(f"Recomandări generate: {recommendations}")
        return jsonify({"recommendations": recommendations})

    except Exception as e:
        print(f"Eroare la generarea recomandărilor: {e}")
        return jsonify({"error": "A apărut o problemă la generarea recomandărilor."}), 500

    finally:
        if os.path.exists(temp_cv_path):
            os.remove(temp_cv_path)
            

@app.route("/analyze-job", methods=["POST"])
def analyze_job():
    data = request.json
    cv_file_path = data.get("cv_file_path", "")
    job = data.get("job", {})

    if not cv_file_path or not job:
        return jsonify({"error": "Calea către CV și detaliile jobului sunt necesare."}), 400

    try:
        # Creează o copie temporară a CV-ului
        script_dir = os.path.dirname(os.path.abspath(__file__))
        full_cv_path = os.path.join(os.pardir, "node", cv_file_path)
        temp_folder = os.path.join(script_dir, "temp")
        os.makedirs(temp_folder, exist_ok=True)
        temp_cv_path = os.path.join(temp_folder, "temp_cv.pdf")
        shutil.copyfile(full_cv_path, temp_cv_path)

        # Extrage textul din CV
        cv_text = extract_text_with_fitz(temp_cv_path)
        if not cv_text.strip():
            print("Nu s-a putut extrage text din CV.")
            return jsonify({"error": "Nu s-a putut extrage text din CV."}), 500

        # Preprocesează textul CV-ului
        cv_text = cv_text.lower()

        # Preprocesează textul jobului
        job_text = f"{job.get('title', '').lower()} {job.get('description', '').lower()} {' '.join(job.get('keywords', [])).lower()}"

        # Calculează similaritatea semantică
        embeddings = transformer_model.encode([cv_text, job_text], convert_to_tensor=True)
        score = util.pytorch_cos_sim(embeddings[0], embeddings[1]).item()

        # Identifică aptitudinile relevante și lipsă
        cv_words = set(cv_text.split())
        job_words = set(job_text.split())
        matched_skills = list(cv_words & job_words)
        missing_skills = list(job_words - cv_words)

        # Generează recomandări pentru toate aptitudinile lipsă într-un singur apel
        recommendations = generate_recommendation_with_gpt3(missing_skills, job.get('title', ''), job.get('description', ''))

        # Construiește răspunsul
        response = {
            "score": round(score, 2),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "recommendations": recommendations
        }
        return jsonify(response)

    except Exception as e:
        print(f"Eroare la analiza jobului: {e}")
        return jsonify({"error": "A apărut o problemă la analiza jobului."}), 500

    finally:
        if os.path.exists(temp_cv_path):
            os.remove(temp_cv_path)


def preprocess_and_filter_relevant_words(text):
    """
    Preprocesează textul și extrage doar cuvintele care sunt în RELEVANT_WORDS.
    """
    import re
    from nltk.tokenize import word_tokenize
    import nltk
    nltk.data.path.append("C:/Users/crist/nltk_data")
    nltk.download('punkt', quiet=True)

    try:
        # Eliminăm caractere speciale și spații multiple
        text = re.sub(r"[^\w\s]", "", text.lower())
        text = re.sub(r"\s+", " ", text)

        # Tokenizare
        words = word_tokenize(text)

        # Filtrăm doar cuvintele relevante
        relevant_words = {word for word in words if word in RELEVANT_WORDS}
        return relevant_words
    except Exception as e:
        print(f"Eroare în preprocess_and_filter_relevant_words: {e}")
        return set()


# Pornirea serverului Flask
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
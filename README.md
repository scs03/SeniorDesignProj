# 🧠 Essay Grading AI Web App

This project is an AI-powered essay grading platform that enables educators to upload rubrics and receive automated, explainable scores for student essays. It integrates:

- 🐳 Dockerized backend/frontend stack  
- ⚙️ FastAPI (PDF/rubric parsing, Hugging Face scoring)
- 🍓 Django + GraphQL (user, submission & class management)
- 🤖 Hugging Face (FLAN-T5 trait scorer)
- 🔮 OpenAI GPT-4o-mini (secondary grader + justification)

---

## 🛠️ Tech Stack

- **Frontend**: React (Next.js)
- **Backend**: Django + Strawberry GraphQL
- **APIs**: FastAPI for NLP + model interaction
- **Database**: PostgreSQL
- **Queue**: Redis (task queue for async grading)
- **Infra**: Docker + Docker Compose

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

---

### 2. Setup Environment Variables

Create a `.env` file in `/backend/lib/` with the following:

```env
OPENAI_API_KEY=your_openai_key_here
```

Also ensure your `.env` in `/backend/` contains database and secret config:

```env
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

Create a `.env` file in `/seniordesign_project` with the following:

```env
_HF_API_KEY=
OPENAI_API_KEY=s
NEXT_PUBLIC_API_BASE_URL=
```

---

### 3. Start the Project (Docker)

```bash
docker-compose up --build
```

This will spin up:

- PostgreSQL
- Redis
- FastAPI (NLP microservice)
- Django GraphQL API (with auto-grading logic)
- Next.js frontend (submissions dashboard)
- PgAdmin (localhost:8888)

---

### 4. Accessing the App

- 🧑‍🏫 **Frontend**: [http://localhost:3000](http://localhost:3000)  
- 🔧 **FastAPI (text/rubric API)**: [http://localhost:3001/docs](http://localhost:3001/docs)  
- 🗄️ **GraphQL**: [http://localhost:8000/graphql](http://localhost:8000/graphql)  
- 🐘 **PgAdmin**: [http://localhost:8888](http://localhost:8888)  
  (Login with user: `admin@admin.com` | password: `admin`)

---

## ✨ Features

- Upload essay & rubric (PDFs)
- Extract rubric traits dynamically via OpenAI
- Send trait & essay to Hugging Face FLAN-T5 model
- Re-score and explain via GPT-4o-mini
- Combine both model scores for fairness
- Store submissions and scores in PostgreSQL
- Automatically scale score to 100-point system
- Feedback summary sounds like a real teacher!

---

## 🧪 Testing Tips

- To test a poor essay: upload `poor_essay.pdf`
- To test a perfect essay: upload a well-structured 5-paragraph academic essay PDF
- Logs for scoring appear in `web-1` and `fastapi-1` containers

---

## 🧼 Useful Docker Commands

```bash
# Stop all containers
docker-compose down

# Restart just backend
docker-compose restart web fastapi

# Rebuild everything
docker-compose down --volumes
docker-compose up --build
```

---

## 💡 Future Improvements

- Email notifications for completed grading
- PDF annotation feedback
- Rubric designer UI
- Admin dashboard for rubric templates

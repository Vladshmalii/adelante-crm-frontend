FROM python:3.12-slim

WORKDIR /backend
# salonctl ищет здесь alembic.*.ini и migrations/ (cli.py ставится в site-packages)
ENV ADELANTE_BACKEND_DIR=/backend

COPY pyproject.toml ./
COPY app ./app
COPY workers ./workers
COPY ws ./ws
COPY migrations ./migrations
COPY alembic.master.ini alembic.shard.ini cli.py ./

RUN pip install --no-cache-dir .

# Команда переопределяется в docker-compose: api / worker / beat / ws
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

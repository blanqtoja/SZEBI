FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Tutaj dodajemy postgresql-client
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

# Install dependencies first for better layer caching
COPY requirements.txt /code/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY . /code/

# Add entrypoint and make it executable
COPY entrypoint.sh /code/entrypoint.sh
RUN chmod +x /code/entrypoint.sh

EXPOSE 8000

CMD ["/code/entrypoint.sh"]
# SZEBI
The goal of the SZEBI project is to create an intelligent IT system for energy management in commercial and public buildings, designed to optimize energy consumption, minimize operational costs, improve user comfort, and support sustainable development.

# Run Instructions (Docker)

## Requirements
- Docker  
- Docker Compose  
- Git  

## Clone the repository
```bash
git clone https://github.com/XEN00000/SZEBI.git
cd SZEBI
```

## Start the application
```bash
docker compose up --build
```

Application URL:
```
http://localhost:8000
```

## Create an admin user (on separate console terminal)
```bash
docker compose exec web python manage.py createsuperuser
```

Admin panel:
```
http://localhost:8000/admin/
```

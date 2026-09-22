from app.database import SessionLocal
from app.models.user import User
db = SessionLocal()
admin = db.query(User).filter(User.email == 'admin@canchagremio.com').first()
print("Usuario:", admin.email)
print("Hash:", admin.password[:30])
db.close()

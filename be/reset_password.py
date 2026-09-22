from app.database import SessionLocal
from app.models.user import User
import bcrypt
db = SessionLocal()
admin = db.query(User).filter(User.email == "admin@canchagremio.com").first()
admin.password = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode()
db.commit()
print("Contrasena actualizada")
db.close()

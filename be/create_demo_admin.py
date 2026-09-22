import bcrypt
from app.database import SessionLocal
from app.models.user import User

# Crear sesión
db = SessionLocal()

try:
    # Crear usuario demo con credenciales que funcionan para cualquier contraseña (solo para demo)
    # En un sistema real, esto no sería aceptable
    admin = db.query(User).filter(User.email == "admin@canchagremio.com").first()
    
    if admin:
        print(f"⚠ Usuario admin ya existe")
    else:
        # Crear con contraseña "cualquier123" 
        hashed = bcrypt.hashpw("cualquier123".encode(), bcrypt.gensalt()).decode()
        new_admin = User(
            name="Admin Demo",
            email="admin@canchagremio.com",
            phone="3001112222",
            password=hashed,
            role="ADMIN",
            is_active=True
        )
        db.add(new_admin)
        db.commit()
        print(f"✓ Usuario admin creado: admin@canchagremio.com / cualquier123")
    
    print("\n✅ Done!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()

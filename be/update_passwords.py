import bcrypt
from app.database import SessionLocal
from app.models.user import User

# Crear sesión
db = SessionLocal()

try:
    # Actualizar contraseñas de usuarios existentes
    usuarios_actualizar = [
        ("juan@example.com", "password123"),
        ("maria@example.com", "password123"),
        ("admin@example.com", "admin123"),
    ]
    
    for email, nueva_contraseña in usuarios_actualizar:
        user = db.query(User).filter(User.email.ilike(email)).first()
        if user:
            # Hash de la nueva contraseña
            hashed = bcrypt.hashpw(nueva_contraseña.encode(), bcrypt.gensalt()).decode()
            user.password = hashed
            db.commit()
            print(f"✓ Contraseña actualizada: {email}")
        else:
            print(f"⚠ Usuario no encontrado: {email}")
    
    print("\n✅ Contraseñas actualizadas exitosamente")
    print("\nDatos de acceso:")
    print("─" * 50)
    print("Email: juan@example.com | Contraseña: password123")
    print("Email: maria@example.com | Contraseña: password123")
    print("Email: admin@example.com | Contraseña: admin123")
    print("─" * 50)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()

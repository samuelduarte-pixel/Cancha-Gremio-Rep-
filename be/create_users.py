import bcrypt
from app.database import SessionLocal
from app.models.user import User

# Crear sesión
db = SessionLocal()

try:
    # Crear usuarios de prueba
    usuarios = [
        {
            "name": "Juan García",
            "email": "juan@example.com",
            "phone": "3001234567",
            "password": "password123",
            "role": "CLIENT"
        },
        {
            "name": "María López",
            "email": "maria@example.com",
            "phone": "3009876543",
            "password": "password123",
            "role": "CLIENT"
        },
        {
            "name": "Admin User",
            "email": "admin@example.com",
            "phone": "3001112222",
            "password": "admin123",
            "role": "ADMIN"
        }
    ]
    
    for usr in usuarios:
        # Hash de contraseña
        hashed = bcrypt.hashpw(usr["password"].encode(), bcrypt.gensalt()).decode()
        
        # Crear usuario
        new_user = User(
            name=usr["name"],
            email=usr["email"],
            phone=usr["phone"],
            password=hashed,
            role=usr["role"],
            is_active=True
        )
        db.add(new_user)
        print(f"✓ Usuario creado: {usr['email']}")
    
    db.commit()
    print("\n✅ Todos los usuarios han sido creados exitosamente")
    print("\nDatos de acceso:")
    print("─" * 50)
    print("Email: juan@example.com | Contraseña: password123")
    print("Email: maria@example.com | Contraseña: password123")
    print("Email: admin@example.com | Contraseña: admin123")
    print("─" * 50)
    
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()

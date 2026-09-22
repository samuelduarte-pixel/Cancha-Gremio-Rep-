import bcrypt
import jwt
from fastapi import HTTPException

SECRET = "supersecret"

fake_user = {
    "id": 1,
    "email": "admin@canchagremio.com",
    "password": bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()),
    "nombre": "Admin",
    "id_rol": 1,
    "nombre_rol": "admin"
}

def login_user(data):
    email = data.correo
    password = data.contraseña

    if email != fake_user["email"]:
        raise HTTPException(status_code=404, detail="Usuario no existe")
    if not bcrypt.checkpw(password.encode(), fake_user["password"]):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    token = jwt.encode({"id": fake_user["id"]}, SECRET, algorithm="HS256")
    return {
        "token": token,
        "usuario": {
            "id_usuario": fake_user["id"],
            "nombre": fake_user["nombre"],
            "correo": fake_user["email"],
            "id_rol": fake_user["id_rol"],
            "nombre_rol": fake_user["nombre_rol"],
        }
    }

def forgot_password(data):
    token = jwt.encode({"id": fake_user["id"]}, SECRET, algorithm="HS256")
    return {"reset_token": token}

def reset_password(data):
    try:
        jwt.decode(data.token, SECRET, algorithms=["HS256"])
    except:
        raise HTTPException(status_code=400, detail="Token inválido")
    new_password = bcrypt.hashpw(data.contraseña.encode(), bcrypt.gensalt())
    return {"message": "Contraseña actualizada"}
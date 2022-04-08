import cv2
import tensorflow as tf
import keras
import base64
import numpy as np
import matplotlib.pyplot as plt

root_path = "ml_projects\\face_predictor\\models\\"

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
model_gender = keras.models.load_model(root_path + "gender_model")
model_eth = keras.models.load_model(root_path + "ethnicity_model")
model_age = keras.models.load_model(root_path + "age_model")

def test(img):

    face = None
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(img_gray, 1.1, 6)
    for (x, y, w, h) in faces:
        cv2.rectangle(img, (x, y), (x + w, y + h), (255, 0, 0), 2)
        face = img_gray[y:y + h, x:x + w]
        break
    face = cv2.resize(face, dsize=(48, 48))
    data = tf.convert_to_tensor([face])

    gender = model_gender.predict(data)
    eth = model_eth.predict(data)
    age = model_age.predict(data)

    img_str = cv2.imencode('.jpg', img)[1].tobytes()
    img_str = base64.b64encode(img_str).decode("utf-8")

    print(img_str)
    np.set_printoptions(suppress=True)
    eth = np.around(eth[0], 4)
    eth_string = []
    for i in eth:
        eth_string.append(str(i))
    result = {"image": img_str, "gender": str(round(gender[0][0], 2)), "eth": eth_string, "age": str(round(age[0][0]))}
    return result




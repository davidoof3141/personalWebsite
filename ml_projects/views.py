from django.shortcuts import render
from django.http import JsonResponse
from django.core.files.storage import FileSystemStorage
import base64
from ml_projects.face_predictor.predictor import test
import numpy as np
import cv2
from django.views.decorators.csrf import csrf_exempt
fss = FileSystemStorage()


def home(request):
    return render(request, 'face_recognizer.html')

@csrf_exempt
def predict_face(request):
    img_data = str.encode(request.POST.get("image_data")[23:])
    img_data = base64.decodebytes(img_data)

    np_arr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(np_arr, flags=1)
    result = test(img)
    return JsonResponse(result)

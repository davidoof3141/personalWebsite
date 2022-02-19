from django.shortcuts import render
from pathlib import Path
from pikepdf import Pdf
from django.core.files.storage import FileSystemStorage
from django.http import JsonResponse
from django.shortcuts import redirect
import fitz
import uuid
import base64

media_dir = Path(__file__).resolve().parent.parent.parent / 'media'
illegal_chars = ['(', '/', ')', '%', '&', '"', '^', ' ', '_']
fss = FileSystemStorage()
hashMap = {}


# Create your views here.
def home(request):
    return render(request, 'home.html')


def pdf_editor_home(request):
    if request.method == 'POST':
        upload = (request.FILES['file'])
        print(type(upload))
        upload_name = upload.name
        for char in illegal_chars:
            upload_name = upload_name.replace(char, "_")
        file = fss.save(upload_name, upload)
        file_url = fss.url(file)
        return JsonResponse({"url": file_url})
    return render(request, 'pdf_editor.html')


def submit(request):
    newPdf = request.POST.getlist("data[]")
    mode = request.POST.get("mode")
    print("HALLO")
    documents = {}
    merged_pdf = Pdf.new()
    if mode == "files":
        for doc in newPdf:
            doc_info = doc.rsplit("_", 1)
            doc_name = f"{doc_info[0]}.pdf"
            if not fss.exists(doc_name):
                return JsonResponse({"url": "File does not exist anymore"})
            merged_pdf.pages.extend(Pdf.open(fss.open(doc_name)).pages)
    else:
        for doc in newPdf:
            doc_info = doc.rsplit("_", 1)
            doc_name = f"{doc_info[0]}.pdf"
            doc_page = int(doc_info[1]) - 1
            if not fss.exists(doc_name):
                return JsonResponse({"url": "File does not exist anymore"})
            if doc_name not in documents.keys():
                pdf = Pdf.open(fss.open(doc_name))
                documents[doc_name] = pdf
            merged_pdf.pages.append(documents.get(doc_name).pages[doc_page])
    merged_pdf_name = fss.get_available_name('merged.pdf')
    merged_pdf.save(f"{fss.location}/{merged_pdf_name}")
    hash_code = str(uuid.uuid4())
    hashMap[hash_code] = merged_pdf_name
    print(hash_code)
    return JsonResponse({"hash": hash_code})


def view(request, hash_code):
    pdf = hashMap.get(hash_code)
    return render(request, 'view.html', {"pdf": pdf})


def pdf_view_submit(request):
    if request.method == 'POST':
        img_data = str.encode(request.POST.get("image_data")[22:])
        file = request.POST.get("file")
        pageNum = int(request.POST.get("pageNum")) - 1
        coords = request.POST.get("coords").split(",")

        # Create Image
        img = fss.open("example.png", "wb")
        img.write(base64.decodebytes(img_data))
        img.close()
        print(type(img.file))

        # insert image
        print(type(base64.decodebytes(img_data)))
        doc = fitz.open(fss.open(file))
        page = doc[pageNum]
        page_height = page.rect.height
        page_width = page.rect.width
        rect = fitz.Rect(((float(coords[0]) * page_width), (float(coords[1]) * page_height)),
                         ((float(coords[2]) * page_width), (float(coords[3]) * page_height)))

        page.insert_image(rect, filename=f"{fss.location}\\example.png")
        doc_bytes = doc.write()
        img = fss.open(file, "wb")
        img.write(doc_bytes)
        img.close()
    return render(request, 'view.html')

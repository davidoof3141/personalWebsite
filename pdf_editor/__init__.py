from django.core.files.storage import FileSystemStorage

fss = FileSystemStorage()

files = fss.listdir(fss.location)[1]
for file in files:
    fss.delete(file)


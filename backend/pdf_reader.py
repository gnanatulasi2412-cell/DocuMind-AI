
import os
import shutil
import pymupdf
import pytesseract
from PIL import Image
import io


# Configure Tesseract OCR
tesseract_path = shutil.which("tesseract")

if tesseract_path:
    pytesseract.pytesseract.tesseract_cmd = tesseract_path
else:
    pytesseract.pytesseract.tesseract_cmd = (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )


# Extract normal text from PDF
def extract_text_from_pdf(file_path: str):

    document = pymupdf.open(file_path)

    pages = []

    try:
        for page_number, page in enumerate(document, start=1):
            pages.append({
                "page": page_number,
                "text": page.get_text()
            })
    finally:
        document.close()

    return pages


# Extract text from embedded images using OCR
def extract_images_text_from_pdf(file_path: str):

    document = pymupdf.open(file_path)

    extracted_pages = []

    try:
        for page_number, page in enumerate(document, start=1):

            page_text = ""

            images = page.get_images(full=True)

            for image_info in images:

                xref = image_info[0]

                base_image = document.extract_image(xref)

                image_bytes = base_image["image"]

                image = Image.open(io.BytesIO(image_bytes))

                text = pytesseract.image_to_string(image)

                page_text += text + "\n"

            extracted_pages.append({
                "page": page_number,
                "image_text": page_text
            })
    finally:
        document.close()

    return extracted_pages

import {getCookie, renderPage} from '/static/utils/utils.js'

let mode = "files"
const csrftoken = getCookie('csrftoken');

$(function () {

    // upload file
    $('.upload_button_container, .info_window_add').click(function () {
        $('#upload_button').click()
    })
    $('#upload_button').change(uploadFile)

    // change files/page view
    $('#document_page_view_pages').click(function () {
        mode = "pages"
        let html_files = $('#document_page_view_files')
        changeViewMode(this, html_files)
    })

    $('#document_page_view_files').click(function () {
        mode = "files"
        let html_files = $('#document_page_view_pages')
        changeViewMode(this, html_files)
    })

    // make pdf sortable
    new Sortable(document.getElementById('pg'), {});

    // zoom fullscreen container
    $('.canvas_fullscreen_container').click(function () {
        $(this).children()[0].remove()
        $(this).css('display', 'none')
    })

    // submit document
    $('.info_window_submit').click(function () {
        let children = $('.pdf_page_view').children()
        let doc_order = []
        let rotations = []
        for (let i = 0; i < children.length; i++) {
            if (`${mode}_wrapper` == children[i].className.split(" ")[1]) {
                let doc_id = children[i].children[1].children[0].id
                doc_order.push(doc_id.substring(0, doc_id.length - 6))
                let rotation = $("#" + doc_id).attr("data-rotation")
                rotations.push(rotation)
            }
        }
        submitDocument(doc_order, rotations)
    })

});

function changeViewMode(primaryElement, secondaryElement) {
    $(primaryElement).css('color', 'rgb(90, 252, 230)')
    $(primaryElement).css('border', '1px solid #31F4C5')
    secondaryElement.css('color', 'white')
    secondaryElement.css('border', 'none')
    $('.files_wrapper').css('display', 'none')
    $('.pages_wrapper').css('display', 'flex')
    if (mode == "pages") {
        $('.files_wrapper').css('display', 'none')
        $('.pages_wrapper').css('display', 'flex')
    } else {
        $('.files_wrapper').css('display', 'flex')
        $('.pages_wrapper').css('display', 'none')
    }
}

function uploadFile() {
    let data = new FormData();
    let myFile = $('#upload_button').prop('files')[0];
    data.append("file", myFile)
    let fileName = myFile.name.split(".")[0]
    $.ajaxSetup({
        headers: {
            "X-CSRFToken": csrftoken,
        }
    });

    $.ajax({
        type: "POST",
        url: "/pdf_editor/",
        mimeType: "multipart/form-data",
        dataType: 'json',
        cache: false,
        processData: false,
        contentType: false,
        data: data,
        success: function (s) {
            console.log(s.url)
            update_pdf(s.url, fileName)
        },
        error: function (r) {
            console.log(r)
        }
    });
}

function update_pdf(url, fileName) {
    let url_array = url.split("/")
    let doc = url_array[url_array.length - 1].split(".")[0]
    $('.upload_window_container').css("display", "none")
    $('.info_window_container, .document_page_view').css("display", "block")
    const loadingTask = pdfjsLib.getDocument(url);

    loadingTask.promise.then(async (pdf) => {
        await generatePDF(pdf, 1, doc, "files", fileName)
        for (let i = 1; i <= pdf.numPages; i++) {
            await generatePDF(pdf, i, doc, "pages", fileName)
        }
    });
}

async function generatePDF(pdf, i, doc, mode, fileName) {
    await pdf.getPage(i).then(async function (page) {
        //append page class
        let canvas_Id = `${doc}_${i}_${mode}`
        let newDiv = `<div class="canvas_wrapper ${mode}_wrapper ${doc}">
                                    <div class="canvas_icons">
                                    <img class="canvas_icon zoom_icon" src="/static/pdf_editor/resources/zoom.svg" alt="zoom">
                                    <img class="canvas_icon rotate_icon" src="/static/pdf_editor/resources/rotate.svg" alt="rotate">
                                    <img class="canvas_icon trash_icon" src="/static/pdf_editor/resources/trash.svg" alt="trash">
                                    </div>
                                   <div draggable="true" class=\"page\">
                                    <canvas id='${canvas_Id}' class="canvas_page" data-rotation="0"></canvas>
                                   </div>
                                    <span class="canvas_name">
                                    ${fileName}
                                    </span>
                                    </div>`
        $('.pdf_page_view').append(newDiv)
        let canvas = $("#" + canvas_Id)[0]
        await renderPage(pdf, i, canvas, 1)
    });
    iconRdy()
}

// make canvas icons ready
function iconRdy() {

    $('.trash_icon').click(function (e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (mode === "files") {
            let class_name = $(this).parent().parent()[0].className.split(" ")[2]
            $("." + class_name).remove()
        } else {
            $(this).parent().parent().remove()
        }
    })

    $('.rotate_icon').click(function (e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        let oldCanvas = $(this).parent().parent().find($('canvas'))[0]
        let newCanvas = document.createElement('canvas');
        newCanvas.id = oldCanvas.id
        newCanvas.className = oldCanvas.className
        let rotation = (parseInt($(oldCanvas).attr("data-rotation")) + 90) % 360
        $(newCanvas).attr("data-rotation", rotation)
        let context = newCanvas.getContext('2d');
        newCanvas.width = oldCanvas.height;
        newCanvas.height = oldCanvas.width;
        context.translate(newCanvas.width / 2, newCanvas.height / 2);
        context.rotate(90 * Math.PI / 180);
        context.drawImage(oldCanvas, -oldCanvas.width / 2, -oldCanvas.height / 2);
        oldCanvas.remove()
        $(this).parent().parent()[0].children[1].append(newCanvas)

    })

    $('.zoom_icon').click(function (e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        let oldCanvas = $(this).parent().parent().find($('canvas'))[0]
        let newCanvas = document.createElement('canvas');
        let context = newCanvas.getContext('2d');
        newCanvas.width = oldCanvas.width;
        newCanvas.height = oldCanvas.height;
        context.drawImage(oldCanvas, 0, 0);
        $('.canvas_fullscreen_container').append(newCanvas)
        $('.canvas_fullscreen_container').css('display', 'flex')
    })

}

function submitDocument(docs, rotations) {
    $.ajax({
        type: "POST",
        url: "/pdf_editor/submit",
        data: {
            "data": docs,
            "mode": mode,
            "rotation": rotations
        },
        success: function (s) {
            window.location.replace("./" + s.hash)
        },
        error: function (r) {
            console.log(r)
        }
    });
}




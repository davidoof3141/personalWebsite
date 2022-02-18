$(function () {

    let mode = "files";

    //Cookie
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const csrftoken = getCookie('csrftoken');

    //upload file function
    $('.upload_button_container, .info_window_add').click(function () {
        $('#upload_button').click()
    })

    $('#upload_button').change(function () {
        uploadFile()
    })

    $('#document_page_view_pages').click(function () {
        mode = "pages"
        $(this).css('color', 'rgb(90, 252, 230)')
        $(this).css('border', '1px solid #31F4C5')
        let html_files = $('#document_page_view_files')
        html_files.css('color', 'white')
        html_files.css('border', 'none')
        $('.files_wrapper').css('display', 'none')
        $('.pages_wrapper').css('display', 'flex')


    })


    $('#document_page_view_files').click(function () {
        mode = "files"
        $(this).css('color', 'rgb(90, 252, 230)')
        $(this).css('border', '1px solid #31F4C5')
        let html_files = $('#document_page_view_pages')
        html_files.css('color', 'white')
        html_files.css('border', 'none')
        $('.files_wrapper').css('display', 'flex')
        $('.pages_wrapper').css('display', 'none')
    })

    function uploadFile() {
        let data = new FormData();
        let myFile = $('#upload_button').prop('files')[0];
        data.append("file", myFile)

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
                update_pdf(s.url)
            },
            error: function (r) {
                console.log(r)
            }
        });
    }

    //make pdf sortable
    new Sortable(document.getElementById('pg'), {});


    function update_pdf(url) {
        let url_array = url.split("/")
        let doc = url_array[url_array.length - 1].split(".")[0]
        $('.upload_window_container').css("display", "none")
        $('.info_window_container, .document_page_view').css("display", "block")
        const loadingTask = pdfjsLib.getDocument(url);

        loadingTask.promise.then(async (pdf) => {
            await generatePDF(pdf, 1, doc, "files")
            for (let i = 1; i <= pdf.numPages; i++) {
                await generatePDF(pdf, i, doc, "pages")
            }
        });
    }
    $('.canvas_fullscreen_container').click(function (){
        $(this).children()[0].remove()
        $(this).css('display', 'none')
    })

    $('.info_window_submit').click(function () {
        let children = $('.pdf_page_view').children()
        let doc_order = []
        for (let i = 0; i < children.length; i++) {
            console.log(children[i].children[1].children[0].id)
            if (`${mode}_wrapper` == children[i].className.split(" ")[1]) {
                let doc_id = children[i].children[1].children[0].id
                doc_order.push(doc_id.substring(0, doc_id.length - 6))
            }
        }
        console.log(doc_order)

        submitDocument(doc_order)
    })

    function submitDocument(docs) {
        $.ajax({
            type: "POST",
            url: "/pdf_editor/submit",
            data: {
                "data": docs,
                "mode": mode
            },
            success: function (s) {
                console.log(s.hash)
                window.location.replace("./" + s.hash)
            },
            error: function (r) {
                console.log(r)
            }
        });
    }


    async function generatePDF(pdf, i, doc, mode) {
        await pdf.getPage(i).then(function (page) {
            //append page class
            let canvas_Id = `${doc}_${i}_${mode}`
            let newDiv = `<div class="canvas_wrapper ${mode}_wrapper ${doc}">
                                    <div class="canvas_icons">
                                    <img class="canvas_icon zoom_icon" src="/static/pdf_editor/resources/zoom.svg" alt="zoom">
                                    <img class="canvas_icon rotate_icon" src="/static/pdf_editor/resources/rotate.svg" alt="rotate">
                                    <img class="canvas_icon trash_icon" src="/static/pdf_editor/resources/trash.svg" alt="trash">
                                    </div>
                                   <div draggable="true" class=\"page\">
                                    <canvas id='${canvas_Id}' class="canvas_page"></canvas>
                                   </div>
                                    <span class="canvas_name">
                                    ${doc}
                                    </span>
                                    </div>`
            $('.pdf_page_view').append(newDiv)
            let canvas = $("#" + canvas_Id)[0]
            //console.log(canvas)
            let ctx = canvas.getContext('2d');

            const viewport = page.getViewport({scale: 1});
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render PDF page into canvas context
            let renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            let renderTask = page.render(renderContext);
            renderTask.promise.then(function (e) {
                //console.log(e)
            })

        });
        rdy()
    }

    function rdy() {
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
            let context = newCanvas.getContext('2d');
            newCanvas.width = oldCanvas.width;
            newCanvas.height = oldCanvas.height;
            context.rotate(90 * Math.PI /180)
            context.drawImage(oldCanvas, 0, 0);
            $('.canvas_fullscreen_container').append(newCanvas)
            $('.canvas_fullscreen_container').css('display', 'flex')
        })

        $('.zoom_icon').click(function(e){
            e.stopPropagation();
            e.stopImmediatePropagation();
            let oldCanvas = $(this).parent().parent().find($('canvas'))[0]
            let newCanvas = document.createElement('canvas');
            let context = newCanvas.getContext('2d');
            newCanvas.width = oldCanvas.width;
            newCanvas.height = oldCanvas.height;
            context.rotate(90 * Math.PI /180)
            context.drawImage(oldCanvas, oldCanvas.width/2, oldCanvas.height/2);

            $('.canvas_fullscreen_container').append(newCanvas)
            $('.canvas_fullscreen_container').css('display', 'flex')
        })

    }

});




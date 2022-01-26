$(function () {
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

    $('.upload_button_container, .info_window_add').click(function () {
        $('#upload_button').click()
    })

    $('#upload_button').change(function () {
        uploadFile()
    })

    function uploadFile() {
        var data = new FormData();
        var myFile = $('#upload_button').prop('files')[0];
        console.log(myFile)
        data.append("file", myFile)
        //data.append("csrfmiddlewaretoken", csrftoken)

        $.ajaxSetup({
            // make sure to send the header
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

    new Sortable(document.getElementById('pg'), {});

    function update_pdf(url) {
        let url_array = url.split("/")
        let doc = url_array[url_array.length - 1].split(".")[0]
        $('.upload_window_container').css("display", "none")
        $('.info_window_container, .document_page_view').css("display", "block")
        const loadingTask = pdfjsLib.getDocument(url);
        //doc = "doc"
        loadingTask.promise.then(async (pdf) => {
            for (let i = 1; i <= pdf.numPages; i++) {
                await pdf.getPage(i).then(function (page) {
                    //append page class
                    let canvas_Id = `${doc}_${i}`
                    let newDiv = `<div draggable="true" class=\"page\"><canvas id='${canvas_Id}'></canvas></div>`
                    $('.pdf_page_view').append(newDiv)
                    let canvas = $("#" + canvas_Id)[0]
                    console.log(canvas)
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
                        console.log(e)
                    })

                });
            }
        });

    }

    $('.info_window_button').click(function () {
        let children = $('.pdf_page_view').children()
        let doc_order = []
        for (let i = 0; i < children.length; i++) {
            doc_order.push(children[i].firstChild.id)
        }
        submitDocument(doc_order)
    })

    function submitDocument(docs) {
        $.ajax({
            type: "POST",
            url: "/pdf_editor/submit",
            data: {"data": docs},
            success: function (s) {
                console.log(s.hash)
                window.location.replace("./" + s.hash)
            },
            error: function (r) {
                console.log(r)
            }
        });
    }

});


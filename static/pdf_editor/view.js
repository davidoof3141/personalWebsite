import {getCookie, renderPage} from '/static/utils/utils.js'

$(function () {

    let x = 0;
    let y = 0;
    const csrftoken = getCookie('csrftoken');
    const url = JSON.parse(document.getElementById('pdf').textContent);
    let canvas = document.getElementById('signature');
    let lineWidth = 2;
    let lineColor = '#000000';
    load_pdf(url)

    $('.canvas_container').resizable({
        stop: function (e, ui) {
            resize(signature_el.height(), signature_el.width())
        }
    });

    $('.canvas_container').draggable({
        containment: ".pdf_content",
        handle: ".drag_handle",
        stop: function () {
            let offset = $(this).offset();
            x = offset.left;
            y = offset.top;
        }
    });

    let signature_el = $('#signature')
    let ctx = canvas.getContext('2d');
    resize(signature_el.height(), signature_el.width);
    let pos = {x: 0, y: 0};

    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', draw);
    document.addEventListener('mousedown', setPosition);
    document.addEventListener('mouseenter', setPosition);

    function setPosition(e) {
        if (e.target.id == "signature") {
            let rect = e.target.getBoundingClientRect();
            pos.x = e.clientX - rect.left;
            pos.y = e.clientY - rect.top;
        }
    }

    function resize(height, width) {
        ctx.canvas.width = width;
        ctx.canvas.height = height;
    }

    function draw(e) {
        // mouse left button must be pressed
        if (e.buttons !== 1) return;

        ctx.beginPath(); // begin

        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.strokeStyle = lineColor;
        ctx.moveTo(pos.x, pos.y); // from
        setPosition(e);
        ctx.lineTo(pos.x, pos.y); // to
        ctx.stroke(); // draw it!
    }

    function submitSignature(img, page_num, coords, url, csrftoken) {
        $.ajaxSetup({
            headers: {
                "X-CSRFToken": csrftoken,
            }
        });

        let data = new FormData();
        data.append("image_data", img)
        data.append("file", url)
        data.append("pageNum", page_num)
        data.append("coords", coords)

        $.ajax({
            type: "POST",
            url: "/pdf_view/submit",
            mimeType: "multipart/form-data",
            dataType: 'json',
            cache: false,
            processData: false,
            contentType: false,
            data: data,
            success: function (s) {
                console.log(s)
                window.location.reload();
            },
            error: function (r) {
                console.log(r)
            }
        });
    }

    $('.submit_button').click(function (e) {
        let chosen_page = document.elementsFromPoint(x, y)[2]
        if (chosen_page.className == "canvas_page") {
            //get size of page
            let page_height = $("#" + chosen_page.id).height()
            let page_width = $("#" + chosen_page.id).width()

            //get relative position of signature
            let rect = chosen_page.getBoundingClientRect();
            let x1 = (x - rect.left) / page_width
            let y1 = (y - rect.top) / page_height
            let x2 = (x - rect.left + signature_el.width()) / page_width
            let y2 = (y - rect.top + signature_el.height()) / page_height
            let coords = [x1, y1, x2, y2]
            let canvas = document.getElementById("signature");
            let img = canvas.toDataURL();
            let page_num = chosen_page.id.split("_")[1]
            submitSignature(img, page_num, coords, url, csrftoken)
            unToggleSignature()
            clearCanvas()
        }
    })
    let toggled = false;
    $(".signature_icon").click(function () {
        if (toggled) {
            toggled = false;
            $(this).css("background-color", "transparent")
            unToggleSignature()
        } else {
            toggled = true;
            $(this).css("background-color", "white")
            $('.signature_options').css('display', 'block')
            let canvas_container = $('.canvas_container')
            canvas_container.css('display', 'block')
            canvas_container.css('top', '50%')
            canvas_container.css('left', '50%')
            canvas_container.css('height', '100px')
            canvas_container.css('width', '100px')
        }
    })

    $('.delete_button').click(function () {
        unToggleSignature()
        clearCanvas()
    })

    $('.clear_button').click(function () {
        clearCanvas()
    })

    $('.font_size_input').change(function(){
        lineWidth = $(this).val()
    })

    $('.font_color_input').change(function(){
        lineColor = $(this).val()
    })

    function unToggleSignature() {
        $('.signature_icon').css("background-color", "transparent")
        $('.signature_options').css('display', 'none')
        $('.canvas_container').css('display', 'none')
        toggled = false
    }

    function clearCanvas() {
        let canvas = document.getElementById("signature");
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        resize(signature_el.height(), signature_el.width())
    }

})


function load_pdf(url) {
    const loadingTask = pdfjsLib.getDocument(`/media/${url}`);
    loadingTask.promise.then(async (pdf) => {
        for (let i = 1; i <= pdf.numPages; i++) {
            let canvas_Id = `page_${i}`
            let newDiv = `<canvas id='${canvas_Id}' class="canvas_page"></canvas>`
            $('.pdf_content').append(newDiv)
            let canvas = $("#" + canvas_Id)[0]
            await renderPage(pdf, i, canvas, 5)
        }
    });
}




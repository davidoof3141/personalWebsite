$(function () {

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


    const url = JSON.parse(document.getElementById('pdf').textContent);
    load_pdf(url)

    function load_canvas_onLick() {
        $('canvas').click(function (e) {
            //console.log(e.target)
            let rect = e.target.getBoundingClientRect();
            let x = e.clientX - rect.left; //x position within the element.
            let y = e.clientY - rect.top;  //y position within the element.
            console.log(rect.left)
            //console.log("Left? : " + x + " ; Top? : " + y + ".");
        })
    }

    function load_pdf(url) {
        const loadingTask = pdfjsLib.getDocument(`/media/${url}`);
        //doc = "doc"
        loadingTask.promise.then(async (pdf) => {
            for (let i = 1; i <= pdf.numPages; i++) {
                await pdf.getPage(i).then(function (page) {
                    //append page class
                    let canvas_Id = `page_${i}`
                    let newDiv = `<canvas id='${canvas_Id}' class="canvas_page"></canvas>`
                    $('.pdf_content').append(newDiv)
                    let canvas = $("#" + canvas_Id)[0]
                    let ctx = canvas.getContext('2d');

                    const viewport = page.getViewport({scale: 5});
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
            }
            load_canvas_onLick()
        });

        /*if (e.target.id == "test") {

                    let rect = e.target.getBoundingClientRect();
                    //console.log(pos.x)
                    pos.x = e.clientX - rect.left; //x position within the element.
                    pos.y = e.clientY - rect.top;
                }*/
    }


    var canvas = document.getElementById('signature');


// some hotfixes... ( ≖_≖)
    document.body.style.margin = 0;
    let signature_el = $('#signature')
// get canvas 2D context and set him correct size
    console.log()
    var ctx = canvas.getContext('2d');
    resize(signature_el.height(), signature_el.width);
// last known position
    var pos = {x: 0, y: 0};

    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', draw);
    document.addEventListener('mousedown', setPosition);
    document.addEventListener('mouseenter', setPosition);

// new position from mouse event
    function setPosition(e) {
        if (e.target.id == "signature") {

            let rect = e.target.getBoundingClientRect();
            //console.log(pos.x)
            pos.x = e.clientX - rect.left; //x position within the element.
            pos.y = e.clientY - rect.top;
        }
    }

// resize canvas
    function resize(height, width) {
        ctx.canvas.width = width;
        ctx.canvas.height = height;
    }

    function draw(e) {
        // mouse left button must be pressed
        if (e.buttons !== 1) return;

        ctx.beginPath(); // begin

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';

        ctx.moveTo(pos.x, pos.y); // from
        setPosition(e);
        ctx.lineTo(pos.x, pos.y); // to

        ctx.stroke(); // draw it!
    }
    //console.log(canvas.width)
    $('.canvas_container').resizable({stop: function(e,ui) {
      resize(signature_el.height(), signature_el.width())
    }
   });
    let x=0;
    let y=0;
    $('.canvas_container').draggable({
        containment: ".pdf_content",
        handle: ".drag_handle",
    stop: function(){
            let offset = $(this).offset();
            x=offset.left;
            y=offset.top;
            //console.log(x1, y1, x1 + signature_el.width(), y1 + signature_el.height())
    }});


    $('.submit_handle').click(function(e){
        let chosen_page = document.elementsFromPoint(x,y)[1]
        if(chosen_page.className == "canvas_page"){
            //get size of page
            let page_height = $("#" + chosen_page.id).height()
            let page_width = $("#" + chosen_page.id).width()

            //get relative position of signature
            let rect = chosen_page.getBoundingClientRect();
            let x1 = (x - rect.left)/page_width
            let y1 = (y - rect.top)/page_height
            let x2 = (x - rect.left + signature_el.width())/page_width
            let y2 = (y - rect.top + signature_el.height())/page_height
            console.log(x1, y1, x2, y2)
            let coords = [x1, y1, x2, y2]
            let canvas = document.getElementById("signature");
            let img    = canvas.toDataURL();
            let page_num = chosen_page.id.split("_")[1]
            console.log(url)
            submitSignature(img, page_num, coords)
        }

    })

    function submitSignature(img, page_num, coords) {

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
            },
            error: function (r) {
                console.log(r)
            }
        });
    }
})
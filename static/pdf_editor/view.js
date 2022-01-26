$(function () {
    const url = JSON.parse(document.getElementById('pdf').textContent);
    console.log(url)
    load_pdf(url)
    function load_pdf(url) {
        const loadingTask = pdfjsLib.getDocument(`/media/${url}`);
        //doc = "doc"
        loadingTask.promise.then(async (pdf) => {
            for (let i = 1; i <= pdf.numPages; i++) {
                await pdf.getPage(i).then(function (page) {
                    //append page class
                    let canvas_Id = `page_${i}`
                    let newDiv = `<canvas id='${canvas_Id}'></canvas>`
                    $('.pdf_content').append(newDiv)
                    let canvas = $("#" + canvas_Id)[0]
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


})
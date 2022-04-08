import {getCookie} from '/static/utils/utils.js'

$(function () {

    const csrftoken = getCookie('csrftoken');
    Chart.defaults.global.defaultFontColor = "#fff";

    let video = document.getElementById("video");
    let canvas = document.querySelector("#output");
    let dummy_canvas = document.querySelector("#dummy");

    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({video: true})
            .then(function (stream) {
                video.srcObject = stream;
                console.log("camera started")
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    $('#take_selfie_button').click(function () {
        $('.camera').addClass('puff_out_animation')
        takePicture()
        video.srcObject.getTracks().forEach(function (track) {
            track.stop();
        });
        $('.camera').css('display', 'none')
    })

    function displayImage(image_data){
        let image = new Image();
        let image_string = "data:image/jpeg;base64," + image_data
        image.src = image_string
        image.onload = function() {
            canvas.getContext('2d').drawImage(image, 0, 0);
        };
        $('.result_img').css('display', 'block')
    }

    function displayGenderBar(gender_prob){
        gender_prob = parseFloat(gender_prob) * 100
        let male_prob = 0
        let female_prob = 0
        female_prob = gender_prob
        male_prob = 100 - female_prob

        $('.gender_bar').css('display', 'block')
            $('#bar_male').animate({
                width: `${male_prob}%`
            }, 3000, function () {
                // Animation complete.
            });
            $('#bar_female').animate({
                width: `${female_prob}%`
            }, 3000, function () {
                // Animation complete.
            });
    }

    function showResults(result) {
        $('.results').css('display', 'flex')
        displayImage(result.image)

        setTimeout(function () {
            displayGenderBar(result.gender)
            setTimeout(function () {
                displayAge(parseInt(result.age))
                setTimeout(function () {
                    displayChart(result.eth)
                }, 2000);
            }, 3000);
        }, 500);

    }

    async function displayAge(age) {
        $('.result_age').css("display", "block")
        var i = 0;
        do {
            i += 1;
            $('#age').html(i)
            await sleep(50);
        } while (i < age);


    }


    function displayChart(eth) {
        const ctx = document.getElementById('bar_chart').getContext('2d')

        const myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['White', 'Black', 'Asian', 'Indian', 'Other'],
                datasets: [{
                    label: '% of Ethnicity',
                    data: [eth[0], eth[1], eth[2], eth[3], eth[4]],
                    backgroundColor: 'rgb(0, 255, 170)',
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function takePicture() {

        dummy_canvas.getContext('2d').drawImage(video, 0, 0, dummy_canvas.width, dummy_canvas.height);
        let image_data_url = dummy_canvas.toDataURL('image/jpeg');
        // data url of the image
        submitImage(image_data_url)
    }

    function submitImage(img) {
        $.ajaxSetup({
            headers: {
                "X-CSRFToken": csrftoken,
            }
        });

        let data = new FormData();
        data.append("image_data", img)

        $.ajax({
            type: "POST",
            url: "/MLprojects/predict_face/",
            mimeType: "multipart/form-data",
            dataType: 'json',
            cache: false,
            processData: false,
            contentType: false,
            data: data,
            success: function (s) {
                console.log(s)
                showResults(s)
            },
            error: function (r) {
                console.log(r)
            }
        });
    }


})

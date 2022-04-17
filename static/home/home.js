$(function () {
    let video = null
    $(".card").on("mouseover", function (event) {
        video = this.childNodes[1]
        video.muted = true;
        video.play();
    }).on('mouseleave', function (event) {
        if (video.id == "trading_ani") {
            video.currentTime = 5;
        } else {
            video.currentTime = 0;
        }
        video.playbackRate = 1;
        video.pause();
    });
})